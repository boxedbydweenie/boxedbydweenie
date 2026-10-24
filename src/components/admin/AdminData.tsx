import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/api";
import type { AudienceSummary } from "@/lib/marketing";
import type { BadgeKey } from "./nav";

/* ---------- Types ---------- */
export type Level = "ok" | "warn" | "bad" | "off";
export interface Check { id: string; area: "Payments" | "Orders" | "Email" | "Catalogue" | "Platform"; label: string; level: Level; detail: string; to?: string }
export interface ChecklistItem { key: string; label: string; why: string; area: string; auto?: boolean; done: boolean; to?: string; doneBy?: string | null; doneAt?: string | null }

interface OrderRow { id: string; ref: string; status: string; total: number; created_at: string; paid_at: string | null; customer: { name?: string; email?: string } | null }
interface LeadRow { id: string; ref: string; kind: string; name: string; status: string; created_at: string; company: string | null }
interface ProductRow { active: boolean; in_stock: boolean; confirmed: boolean }
interface CampaignRow { id: string; name: string; status: string; pause_reason: string | null; queued_at: string | null; updated_at: string }
interface CronRow { name: string; active: boolean; last_run: string | null; last_status: string | null }
interface Secrets { paystackKey: boolean; paystackLive: boolean; resendKey: boolean; resendWebhookSecret: boolean; notifyEmail: boolean; marketingFrom: boolean; siteUrl: boolean }

export interface AdminSnapshot {
  orders: OrderRow[]; leads: LeadRow[]; products: ProductRow[]; campaigns: CampaignRow[];
  audience: AudienceSummary | null; secrets: Secrets | null; secretsError: boolean; cron: CronRow[] | null;
  sent7: number; bounced7: number; complained7: number; lastEventAt: string | null; sawOpen: boolean; sawClick: boolean;
  manual: Record<string, { done: boolean; by: string | null; at: string | null }>; checklistReady: boolean;
  loadedAt: number;
}

export const PAID = ["paid", "packed", "out_for_delivery", "delivered"];
const HOUR = 3_600_000, DAY = 24 * HOUR;
const ago = (iso: string | null) => (iso ? Date.now() - new Date(iso).getTime() : Infinity);
export const humanAgo = (iso: string | null) => {
  const ms = ago(iso); if (!isFinite(ms)) return "never";
  if (ms < 90_000) return "just now"; if (ms < HOUR) return `${Math.round(ms / 60_000)} min ago`;
  if (ms < DAY) return `${Math.round(ms / HOUR)} h ago`; return `${Math.round(ms / DAY)} d ago`;
};

/** The manual items come from the project hand-off notes. Ticking one saves it for the whole team. */
const MANUAL: Omit<ChecklistItem, "done" | "doneBy" | "doneAt" | "auto">[] = [
  { key: "paystack-webhook", area: "Payments", label: "Set the Paystack webhook URL", why: "So paid orders are confirmed even if the customer closes the tab. URL: https://zstplraslhhkfyiapjdm.supabase.co/functions/v1/paystack-webhook" },
  { key: "test-purchase", area: "Payments", label: "Run a test purchase on the live site", why: "Use Paystack's test card, then check the order, the customer email and the team alert all arrive.", to: "/admin/orders" },
  { key: "dmarc-duplicate", area: "Email", label: "Delete the duplicate plain _dmarc record (GoDaddy)", why: "Two DMARC records make receivers ignore both. Keep the one that includes the Brevo rua address." },
  { key: "spf-hello", area: "Email", label: "Confirm hello@ sending passes SPF at Gmail", why: "Root SPF should be: v=spf1 a mx include:secureserver.net ~all. Send a fresh email to Gmail and check Show original." },
  { key: "snds-jmrp", area: "Email", label: "Register for Microsoft SNDS and JMRP", why: "Lets you see how Outlook and Hotmail treat our mail, and get spam complaints back." },
  { key: "test-contacts", area: "Email", label: "Delete the test contacts (zz-news@ and zz-test@example.com)", why: "Keeps reports and counts clean.", to: "/admin/audience" },
  { key: "postal-address", area: "Email", label: "Confirm the footer postal address and The Plug Shop Limited wording", why: "It appears in every marketing email footer." },
  { key: "privacy-legal", area: "Email", label: "Legal read of the Privacy page's Marketing emails section", why: "Marketing consent and unsubscribe wording should be checked once." },
  { key: "alice-title", area: "Email", label: "Confirm Alice's exact title for the signature (Executive or Manager)", why: "Used in the warm intro and follow-up emails." },
  { key: "domain", area: "Site", label: "Connect boxedbydweenie.com to the Cloudflare Worker", why: "Moves the site off the workers.dev address." },
  { key: "repo-private", area: "Site", label: "Make the GitHub repository private", why: "It is public today and holds the site's source." },
  { key: "hero-video", area: "Site", label: "Receive and add the hero video from the client", why: "Homepage hero." },
  { key: "deadline", area: "Site", label: "Confirm the 20 November ordering deadline with the client", why: "Not used in any email until confirmed." },
];

const emptySnapshot: AdminSnapshot = {
  orders: [], leads: [], products: [], campaigns: [], audience: null, secrets: null, secretsError: false, cron: null,
  sent7: 0, bounced7: 0, complained7: 0, lastEventAt: null, sawOpen: false, sawClick: false, manual: {}, checklistReady: false, loadedAt: 0,
};

/* ---------- Derived numbers ---------- */
export function derive(s: AdminSnapshot) {
  const paid = s.orders.filter((o) => PAID.includes(o.status));
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(dayStart.getFullYear(), dayStart.getMonth(), 1);
  const rev = (rows: OrderRow[]) => rows.reduce((a, o) => a + o.total, 0);
  const days: { label: string; revenue: number; orders: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(dayStart); d.setDate(d.getDate() - i);
    const e = new Date(d); e.setDate(e.getDate() + 1);
    const rows = paid.filter((o) => { const t = new Date(o.paid_at ?? o.created_at); return t >= d && t < e; });
    days.push({ label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), revenue: rev(rows), orders: rows.length });
  }
  const unconfirmed = s.products.filter((p) => !p.confirmed).length;
  return {
    revenueTotal: rev(paid), revenueMonth: rev(paid.filter((o) => new Date(o.paid_at ?? o.created_at) >= monthStart)),
    revenueToday: rev(paid.filter((o) => new Date(o.paid_at ?? o.created_at) >= dayStart)),
    ordersTotal: s.orders.length, toPack: s.orders.filter((o) => o.status === "paid").length,
    inTransit: s.orders.filter((o) => o.status === "packed" || o.status === "out_for_delivery").length,
    stuckPayment: s.orders.filter((o) => o.status === "pending_payment" && ago(o.created_at) > DAY).length,
    failedPayment: s.orders.filter((o) => o.status === "payment_failed" && ago(o.created_at) < 7 * DAY).length,
    newLeads: s.leads.filter((l) => l.status === "new").length,
    quotesOpen: s.leads.filter((l) => l.kind === "quote" && (l.status === "new" || l.status === "contacted")).length,
    live: s.products.filter((p) => p.active).length, soldOut: s.products.filter((p) => p.active && !p.in_stock).length,
    hidden: s.products.filter((p) => !p.active).length, unconfirmed,
    bounceRate7: s.sent7 >= 20 ? s.bounced7 / s.sent7 : null,
    days,
  };
}

/* ---------- Health checks ---------- */
export function buildChecks(s: AdminSnapshot): Check[] {
  const d = derive(s); const c: Check[] = []; const sec = s.secrets;
  const unknown = (id: string, area: Check["area"], label: string): Check => ({ id, area, label, level: "off", detail: "Could not check this just now. Refresh in a moment." });

  // Payments
  if (sec) {
    c.push({ id: "paystack-key", area: "Payments", label: "Paystack connected", level: sec.paystackKey ? "ok" : "bad",
      detail: sec.paystackKey ? (sec.paystackLive ? "Live key in use. Real payments are on." : "Test key in use. Customers are not charged real money yet.") : "No Paystack key added, so checkout says payments are not set up.", to: "/admin/system" });
    if (sec.paystackKey && !sec.paystackLive) c[c.length - 1]!.level = "warn";
  } else c.push(unknown("paystack-key", "Payments", "Paystack connected"));
  const lastPaid = s.orders.filter((o) => o.paid_at).sort((a, b) => +new Date(b.paid_at!) - +new Date(a.paid_at!))[0];
  c.push({ id: "last-paid", area: "Payments", label: "Payment confirmations", level: lastPaid ? "ok" : "off",
    detail: lastPaid ? `Last paid order ${humanAgo(lastPaid.paid_at)} (${lastPaid.ref}).` : "No paid order yet. Run a test purchase to prove the whole path works.", to: "/admin/orders" });

  // Orders
  c.push({ id: "to-pack", area: "Orders", label: "Orders waiting to be packed", level: d.toPack === 0 ? "ok" : d.toPack > 10 ? "warn" : "ok",
    detail: d.toPack === 0 ? "Nothing waiting." : `${d.toPack} paid ${d.toPack === 1 ? "order is" : "orders are"} waiting to be packed.`, to: "/admin/orders" });
  c.push({ id: "stuck", area: "Orders", label: "Unpaid or failed payments", level: d.stuckPayment + d.failedPayment === 0 ? "ok" : "warn",
    detail: d.stuckPayment + d.failedPayment === 0 ? "None in the last week." : `${d.stuckPayment} awaiting payment for over a day and ${d.failedPayment} failed this week. Worth a friendly follow-up.`, to: "/admin/orders" });
  c.push({ id: "leads", area: "Orders", label: "Enquiries waiting for a reply", level: d.newLeads === 0 ? "ok" : d.newLeads > 5 ? "warn" : "ok",
    detail: d.newLeads === 0 ? "Everyone has had a reply." : `${d.newLeads} new ${d.newLeads === 1 ? "enquiry" : "enquiries"} to answer.`, to: "/admin/leads" });

  // Email
  if (sec) {
    c.push({ id: "resend", area: "Email", label: "Email sending (Resend)", level: sec.resendKey ? "ok" : "bad", detail: sec.resendKey ? "Connected." : "Resend key missing. No order emails or campaigns can go out." });
    c.push({ id: "webhook", area: "Email", label: "Delivery reports (Resend webhook)", level: !sec.resendWebhookSecret ? "bad" : ago(s.lastEventAt) > 30 * DAY ? "warn" : "ok",
      detail: !sec.resendWebhookSecret ? "Signing secret missing, so delivered and bounced statuses cannot arrive." : s.lastEventAt ? `Last report received ${humanAgo(s.lastEventAt)}.` : "Secret is set. No report received yet." });
  } else { c.push(unknown("resend", "Email", "Email sending (Resend)")); c.push(unknown("webhook", "Email", "Delivery reports (Resend webhook)")); }
  const tracked = s.sawOpen || s.sawClick;
  c.push({ id: "tracking", area: "Email", label: "Open and click tracking", level: tracked ? "ok" : "warn",
    detail: tracked ? "Opens or clicks are arriving." : "No open or click has ever been recorded. Switch on tracking for mail.boxedbydweenie.com in Resend and tick email.opened and email.clicked on the webhook.", to: "/admin/marketing" });
  c.push({ id: "bounce", area: "Email", label: "Bounce rate, last 7 days", level: d.bounceRate7 == null ? "off" : d.bounceRate7 > 0.1 ? "bad" : d.bounceRate7 > 0.05 ? "warn" : "ok",
    detail: d.bounceRate7 == null ? "Too few emails sent this week to judge." : `${(d.bounceRate7 * 100).toFixed(1)}% of ${s.sent7} emails bounced. Under 2% is healthy; over 5% hurts delivery.`, to: "/admin/email-log" });
  const braked = s.campaigns.filter((x) => x.status === "paused");
  const sending = s.campaigns.filter((x) => x.status === "sending");
  c.push({ id: "campaigns", area: "Email", label: "Campaigns", level: braked.length ? "warn" : "ok",
    detail: braked.length ? `${braked.map((x) => x.name).join(", ")} ${braked.length === 1 ? "is" : "are"} paused${braked[0]?.pause_reason ? `: ${braked[0].pause_reason}` : ""}.` : sending.length ? `${sending.length} sending right now.` : "Nothing running or paused.", to: "/admin/campaigns" });
  const worker = s.cron?.find((j) => j.name === "bbd-campaign-worker");
  if (s.cron) c.push({ id: "worker", area: "Email", label: "Sending worker (runs every minute)", level: !worker || !worker.active ? "bad" : ago(worker.last_run) > 10 * 60_000 ? "bad" : worker.last_status === "failed" ? "warn" : "ok",
    detail: !worker ? "The scheduled job is missing." : !worker.active ? "The scheduled job is switched off." : `Last ran ${humanAgo(worker.last_run)}${worker.last_status === "failed" ? " but reported a failure" : ""}.` });
  else c.push(unknown("worker", "Email", "Sending worker (runs every minute)"));
  const daily = s.cron?.find((j) => j.name === "bbd-daily-emails");
  if (s.cron) c.push({ id: "daily", area: "Email", label: "Daily reminders and gift cards (07:00)", level: !daily || !daily.active ? "bad" : ago(daily.last_run) > 26 * HOUR ? "warn" : "ok",
    detail: !daily ? "The scheduled job is missing." : `Last ran ${humanAgo(daily.last_run)}.` });
  if (s.audience) c.push({ id: "audience", area: "Email", label: "Audience", level: s.audience.complained > 0 ? "warn" : "ok",
    detail: `${s.audience.active.toLocaleString()} can be emailed. ${s.audience.unsubscribed} unsubscribed, ${s.audience.bounced} bounced${s.audience.complained ? `, ${s.audience.complained} marked us as spam` : ""}.`, to: "/admin/audience" });

  // Catalogue
  c.push({ id: "catalogue", area: "Catalogue", label: "Products awaiting confirmation", level: d.unconfirmed === 0 ? "ok" : "warn",
    detail: d.unconfirmed === 0 ? "Every product is confirmed." : `${d.unconfirmed} products are still placeholders for the client to confirm.`, to: "/admin/products" });
  c.push({ id: "stock", area: "Catalogue", label: "Stock", level: d.soldOut === 0 ? "ok" : "warn",
    detail: d.soldOut === 0 ? "Everything on sale is in stock." : `${d.soldOut} on-sale ${d.soldOut === 1 ? "product is" : "products are"} marked sold out.`, to: "/admin/products" });

  // Platform
  c.push({ id: "db", area: "Platform", label: "Database", level: s.loadedAt ? "ok" : "off", detail: s.loadedAt ? "Responding normally." : "Not loaded yet." });
  return c;
}

export function buildChecklist(s: AdminSnapshot): ChecklistItem[] {
  const sec = s.secrets; const d = derive(s); const auto: ChecklistItem[] = [];
  if (sec) {
    auto.push({ key: "a-paystack", area: "Payments", auto: true, done: sec.paystackKey, label: "Add the Paystack secret key", why: "Supabase > Edge Functions > Secrets > PAYSTACK_SECRET_KEY. Test key first.", to: "/admin/system" });
    auto.push({ key: "a-paystack-live", area: "Payments", auto: true, done: sec.paystackLive, label: "Switch to the Paystack live key", why: "Only after the test purchase works end to end." });
    auto.push({ key: "a-resend", area: "Email", auto: true, done: sec.resendKey, label: "Resend API key added", why: "Needed for every email the site sends." });
    auto.push({ key: "a-webhook", area: "Email", auto: true, done: sec.resendWebhookSecret, label: "Resend webhook secret added", why: "Lets delivered, bounced and spam reports flow in." });
  }
  auto.push({ key: "a-tracking", area: "Email", auto: true, done: s.sawOpen || s.sawClick, label: "Open and click tracking switched on", why: "Resend > Domains > mail.boxedbydweenie.com > turn on both, then tick email.opened and email.clicked on the webhook." });
  auto.push({ key: "a-products", area: "Catalogue", auto: true, done: d.unconfirmed === 0, label: "Confirm the placeholder products", why: `${d.unconfirmed} still to confirm with the client.`, to: "/admin/products" });
  const manual = MANUAL.map((m) => ({ ...m, done: !!s.manual[m.key]?.done, doneBy: s.manual[m.key]?.by ?? null, doneAt: s.manual[m.key]?.at ?? null }));
  return [...auto, ...manual];
}

export function overall(checks: Check[]): { level: Level; bad: number; warn: number } {
  const bad = checks.filter((x) => x.level === "bad").length, warn = checks.filter((x) => x.level === "warn").length;
  return { level: bad ? "bad" : warn ? "warn" : "ok", bad, warn };
}

/* ---------- Provider ---------- */
interface Ctx {
  snap: AdminSnapshot; ready: boolean; refreshing: boolean; refresh: () => Promise<void>;
  checks: Check[]; checklist: ChecklistItem[]; status: ReturnType<typeof overall>; numbers: ReturnType<typeof derive>;
  badge: (k: BadgeKey) => number; toggleManual: (key: string, done: boolean) => Promise<void>;
}
const AdminCtx = createContext<Ctx | null>(null);
export function useAdminData() { const c = useContext(AdminCtx); if (!c) throw new Error("useAdminData must be used inside the admin area"); return c; }

export function AdminDataProvider({ email, children }: { email: string; children: ReactNode }) {
  const [snap, setSnap] = useState<AdminSnapshot>(emptySnapshot);
  const [refreshing, setRefreshing] = useState(false);
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (busy.current) return; busy.current = true; setRefreshing(true);
    try {
      const sb = supabase(); const since = new Date(Date.now() - 7 * DAY).toISOString();
      const token = (await sb.auth.getSession()).data.session?.access_token ?? "";
      const [o, l, p, cmp, aud, ev, sent, bnc, cmpl, chk, cron, hl] = await Promise.all([
        sb.from("orders").select("id,ref,status,total,created_at,paid_at,customer").order("created_at", { ascending: false }).limit(1000),
        sb.from("leads").select("id,ref,kind,name,status,created_at,company").order("created_at", { ascending: false }).limit(500),
        sb.from("products").select("active,in_stock,confirmed"),
        sb.from("email_campaigns").select("id,name,status,pause_reason,queued_at,updated_at").order("updated_at", { ascending: false }).limit(100),
        sb.rpc("marketing_audience_summary"),
        sb.from("email_events").select("type,created_at").order("created_at", { ascending: false }).limit(300),
        sb.from("email_sends").select("id", { count: "exact", head: true }).eq("is_test", false).gte("sent_at", since),
        sb.from("email_sends").select("id", { count: "exact", head: true }).eq("is_test", false).gte("bounced_at", since),
        sb.from("email_sends").select("id", { count: "exact", head: true }).eq("is_test", false).gte("complained_at", since),
        sb.from("admin_checklist").select("key,done,done_by,done_at"),
        sb.rpc("admin_cron_status"),
        fetch(`${SUPABASE_URL}/functions/v1/admin-health`, { method: "POST", headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` }, body: "{}" })
          .then(async (r) => (r.ok ? ((await r.json()) as { secrets: Secrets }).secrets : null)).catch(() => null),
      ]);
      const events = (ev.data ?? []) as { type: string; created_at: string }[];
      const manual: AdminSnapshot["manual"] = {};
      for (const r of (chk.data ?? []) as { key: string; done: boolean; done_by: string | null; done_at: string | null }[]) manual[r.key] = { done: r.done, by: r.done_by, at: r.done_at };
      setSnap({
        orders: (o.data ?? []) as OrderRow[], leads: (l.data ?? []) as LeadRow[], products: (p.data ?? []) as ProductRow[],
        campaigns: (cmp.data ?? []) as CampaignRow[], audience: (aud.data as AudienceSummary) ?? null,
        secrets: hl, secretsError: !hl, cron: Array.isArray(cron.data) ? (cron.data as CronRow[]) : null,
        sent7: sent.count ?? 0, bounced7: bnc.count ?? 0, complained7: cmpl.count ?? 0,
        lastEventAt: events[0]?.created_at ?? null, sawOpen: events.some((e) => e.type.endsWith("opened")), sawClick: events.some((e) => e.type.endsWith("clicked")),
        manual, checklistReady: !chk.error, loadedAt: Date.now(),
      });
    } finally { busy.current = false; setRefreshing(false); }
  }, []);

  useEffect(() => { void refresh(); const t = setInterval(() => void refresh(), 120_000); return () => clearInterval(t); }, [refresh]);

  const toggleManual = useCallback(async (key: string, done: boolean) => {
    setSnap((s) => ({ ...s, manual: { ...s.manual, [key]: { done, by: email, at: new Date().toISOString() } } }));
    const { error } = await supabase().from("admin_checklist").upsert({ key, done, done_by: email, done_at: new Date().toISOString() });
    if (error) { setSnap((s) => ({ ...s, manual: { ...s.manual, [key]: { done: !done, by: null, at: null } } })); throw new Error("Could not save the tick."); }
  }, [email]);

  const value = useMemo<Ctx>(() => {
    const checks = buildChecks(snap), numbers = derive(snap);
    const status = overall(checks);
    return {
      snap, ready: snap.loadedAt > 0, refreshing, refresh, checks, checklist: buildChecklist(snap), status, numbers, toggleManual,
      badge: (k) => (k === "toPack" ? numbers.toPack : k === "newLeads" ? numbers.newLeads : status.bad + status.warn),
    };
  }, [snap, refreshing, refresh, toggleManual]);

  return <AdminCtx.Provider value={value}>{children}</AdminCtx.Provider>;
}
