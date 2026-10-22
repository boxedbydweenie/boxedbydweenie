// Email marketing API for the team area. Staff only: send the signed-in user's access token as `Authorization: Bearer ...`.
// Reads happen in the browser through row-level security; every WRITE goes through here (service role).
// POST { action, ... }  actions: sync, import_chunk, contact_suppress, contact_update, campaign_save, campaign_delete, render, test_send,
//                               campaign_send, campaign_pause, campaign_resume, campaign_cancel, requeue
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { FUNCTIONS_URL, REPLY_TO, SITE_URL, TEST_TOKEN, fromHeader, isEmail, listHeaders, mergeTags, renderEmail, sendOne } from "../_shared/marketing.ts";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const ALLOWED = [
  "https://boxedbydweenie.boxedbydweenie.workers.dev", "https://boxedbydweenie.com", "https://www.boxedbydweenie.com",
  ...(Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
];
function cors(origin: string | null) {
  const ok = origin && (ALLOWED.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
  return { "Access-Control-Allow-Origin": ok ? origin! : SITE_URL, "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" };
}
const json = (b: unknown, status: number, h: Record<string, string>) => new Response(JSON.stringify(b), { status, headers: { ...h, "Content-Type": "application/json" } });
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const BASES = ["opted_in", "customer", "contact", "prospect", "unverified"];
const RANK: Record<string, number> = { opted_in: 5, customer: 4, contact: 3, prospect: 2, unverified: 1 };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
class Fail extends Error { constructor(public status: number, m: string) { super(m); } }

function cleanTags(v: unknown): string[] {
  const arr = Array.isArray(v) ? v : typeof v === "string" ? v.split(/[;,]/) : [];
  return [...new Set(arr.map((t) => String(t).toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "").slice(0, 30)).filter(Boolean))].slice(0, 12);
}
function cleanAudience(a: Record<string, unknown> | undefined) {
  const bases = (Array.isArray(a?.bases) ? a!.bases as unknown[] : []).map(String).filter((b) => BASES.includes(b));
  return { bases: bases.length ? bases : ["opted_in", "customer", "contact", "prospect"], tags: cleanTags(a?.tags), exclude_tags: cleanTags(a?.exclude_tags) };
}
// deno-lint-ignore no-explicit-any
const kick = () => { const p = fetch(`${FUNCTIONS_URL}/campaign-worker`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => {}); try { (globalThis as any).EdgeRuntime?.waitUntil(p); } catch { /* ignore */ } };

async function admin(req: Request): Promise<string> {
  const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) throw new Fail(401, "Please sign in again.");
  const { data, error } = await db.auth.getUser(jwt);
  if (error || !data.user) throw new Fail(401, "Please sign in again.");
  const { data: row } = await db.from("admin_users").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (!row) throw new Fail(403, "You do not have team access.");
  return data.user.email ?? "team";
}

Deno.serve(async (req) => {
  const h = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, h);
  try {
    const who = await admin(req);
    const b = await req.json();
    const action = str(b.action, 40);

    if (action === "sync") { const { data, error } = await db.rpc("marketing_sync"); if (error) throw error; return json({ changed: data }, 200, h); }

    if (action === "import_chunk") {
      const importId = str(b.import_id, 40), basis = str(b.basis, 20), filename = str(b.filename, 160) || "upload.csv";
      if (!UUID.test(importId)) throw new Fail(400, "Missing import id.");
      if (!BASES.includes(basis)) throw new Fail(400, "Choose where these contacts came from.");
      const rows = Array.isArray(b.rows) ? b.rows.slice(0, 1000) as Record<string, unknown>[] : [];
      const impTags = cleanTags(b.tags);
      await db.from("marketing_imports").upsert({ id: importId, filename, basis, tags: impTags, created_by: who }, { onConflict: "id", ignoreDuplicates: true });
      let invalid = 0, suppressed = 0, added = 0, updated = 0;
      const byEmail = new Map<string, { email: string; first_name: string | null; last_name: string | null; company: string | null; tags: string[] }>();
      for (const r of rows) {
        const email = str(r.email, 200).toLowerCase();
        if (!isEmail(email) || email.length > 190) { invalid++; continue; }
        const cur = byEmail.get(email);
        const tags = [...new Set([...(cur?.tags ?? []), ...cleanTags(r.tags)])];
        byEmail.set(email, { email, first_name: cur?.first_name ?? (str(r.first_name, 80) || null), last_name: cur?.last_name ?? (str(r.last_name, 80) || null), company: cur?.company ?? (str(r.company, 120) || null), tags });
      }
      const emails = [...byEmail.keys()];
      const { data: existing, error: e1 } = await db.from("marketing_contacts").select("email,tags,basis,status,first_name,last_name,company,consent_source,consent_at").in("email", emails);
      if (e1) throw e1;
      const ex = new Map((existing ?? []).map((c) => [c.email as string, c]));
      const now = new Date().toISOString(), src = `upload:${filename}`;
      const fresh: Record<string, unknown>[] = [], merged: Record<string, unknown>[] = [];
      for (const r of byEmail.values()) {
        const c = ex.get(r.email);
        const tags = [...new Set([...(c?.tags ?? []), ...impTags, ...r.tags])].slice(0, 20);
        if (!c) { fresh.push({ email: r.email, first_name: r.first_name, last_name: r.last_name, company: r.company, tags, basis, consent_source: src, consent_at: now, import_id: importId }); continue; }
        if (c.status !== "active") { suppressed++; continue; } // never bring back someone who unsubscribed, bounced or complained
        const up = RANK[basis] > RANK[c.basis as string];
        merged.push({ email: r.email, first_name: c.first_name ?? r.first_name, last_name: c.last_name ?? r.last_name, company: c.company ?? r.company, tags,
          basis: up ? basis : c.basis, consent_source: up ? src : c.consent_source, consent_at: up ? now : c.consent_at, updated_at: now });
      }
      if (fresh.length) { const { error } = await db.from("marketing_contacts").upsert(fresh, { onConflict: "email", ignoreDuplicates: true }); if (error) throw error; added = fresh.length; }
      if (merged.length) { const { error } = await db.from("marketing_contacts").upsert(merged, { onConflict: "email" }); if (error) throw error; updated = merged.length; }
      const { data: imp } = await db.from("marketing_imports").select("total_rows,added,updated,invalid,suppressed").eq("id", importId).single();
      if (imp) await db.from("marketing_imports").update({ total_rows: imp.total_rows + rows.length, added: imp.added + added, updated: imp.updated + updated, invalid: imp.invalid + invalid, suppressed: imp.suppressed + suppressed }).eq("id", importId);
      return json({ added, updated, invalid, suppressed }, 200, h);
    }

    if (action === "contact_suppress") {
      const id = str(b.id, 40); if (!UUID.test(id)) throw new Fail(400, "Unknown contact.");
      const patch: Record<string, unknown> = { status: "unsubscribed", status_at: new Date().toISOString(), unsub_reason: b.erase ? "Erasure request (kept as suppression)" : "Removed by team", updated_at: new Date().toISOString() };
      if (b.erase) Object.assign(patch, { first_name: null, last_name: null, company: null, tags: [] });
      const { error } = await db.from("marketing_contacts").update(patch).eq("id", id).in("status", ["active", "unsubscribed"]);
      if (error) throw error; return json({ ok: true }, 200, h);
    }

    if (action === "contact_update") {
      const id = str(b.id, 40); if (!UUID.test(id)) throw new Fail(400, "Unknown contact.");
      const { data: cur } = await db.from("marketing_contacts").select("id,email,status").eq("id", id).maybeSingle();
      if (!cur) throw new Fail(404, "Contact not found.");
      const now = new Date().toISOString();
      const patch: Record<string, unknown> = { first_name: str(b.first_name, 80) || null, last_name: str(b.last_name, 80) || null, company: str(b.company, 120) || null, updated_at: now };
      const email = str(b.email, 200).toLowerCase();
      if (email && email !== cur.email) {
        // Changing the address of someone who opted out, bounced or complained would let them be emailed again, so it is blocked.
        if (cur.status !== "active") throw new Fail(409, "This contact has opted out or bounced, so the email address is locked. Their name and company can still be edited.");
        if (!isEmail(email) || email.length > 190) throw new Fail(400, "That does not look like a valid email address.");
        const { data: clash } = await db.from("marketing_contacts").select("id").eq("email", email).maybeSingle();
        if (clash) throw new Fail(409, "Another contact already uses that email address.");
        patch.email = email;
      }
      const { data, error } = await db.from("marketing_contacts").update(patch).eq("id", id).select("*").single();
      if (error) throw error; return json({ contact: data }, 200, h);
    }

    if (action === "campaign_save") {
      const name = str(b.name, 120), subject = str(b.subject, 200), preheader = str(b.preheader, 200), fromName = str(b.from_name, 60) || "Boxed by Dweenie";
      const html = typeof b.html === "string" ? b.html.replace(/<script[\s\S]*?<\/script>/gi, "") : "";
      if (!name) throw new Fail(400, "Give the campaign a name.");
      if (html.length > 400_000) throw new Fail(400, "That HTML file is too large (limit about 400 KB).");
      const audience = cleanAudience(b.audience);
      if (str(b.id, 40)) {
        const { data: cur } = await db.from("email_campaigns").select("*").eq("id", b.id).single();
        if (!cur) throw new Fail(404, "Campaign not found.");
        if (cur.status !== "draft") throw new Fail(409, "Only drafts can be edited. This campaign has already been sent or queued.");
        const changed = cur.subject !== subject || cur.html !== html || cur.preheader !== preheader || cur.from_name !== fromName;
        const { data, error } = await db.from("email_campaigns").update({ name, subject, preheader, from_name: fromName, html, audience, tested_at: changed ? null : cur.tested_at, updated_at: new Date().toISOString() }).eq("id", b.id).select("*").single();
        if (error) throw error; return json({ campaign: data }, 200, h);
      }
      const { data, error } = await db.from("email_campaigns").insert({ name, subject, preheader, from_name: fromName, html, audience, created_by: who }).select("*").single();
      if (error) throw error; return json({ campaign: data }, 200, h);
    }

    if (action === "campaign_delete") {
      const { error } = await db.from("email_campaigns").delete().eq("id", str(b.id, 40)).eq("status", "draft");
      if (error) throw error; return json({ ok: true }, 200, h);
    }

    if (action === "render") {
      const out = renderEmail({ html: String(b.html ?? ""), preheader: str(b.preheader, 200) }, { email: "ada@example.com", first_name: "Ada", unsub_token: TEST_TOKEN });
      return json(out, 200, h);
    }

    if (action === "test_send") {
      const id = str(b.campaign_id, 40);
      const { data: c } = await db.from("email_campaigns").select("*").eq("id", id).single();
      if (!c) throw new Fail(404, "Save the campaign first.");
      if (!c.subject || !c.html) throw new Fail(400, "Add a subject and your HTML before sending a test.");
      const to = [...new Set((Array.isArray(b.to) ? b.to : []).map((x: unknown) => str(x, 200).toLowerCase()).filter(isEmail))].slice(0, 5);
      if (!to.length) throw new Fail(400, "Enter at least one valid email address.");
      const results: { to: string; ok: boolean; error?: string }[] = [];
      for (const addr of to) {
        const r = { email: addr, unsub_token: TEST_TOKEN, first_name: null };
        const res = await sendOne({ from: fromHeader(c.from_name), to: [addr], subject: "[TEST] " + mergeTags(c.subject, r, false), html: renderEmail({ html: c.html, preheader: c.preheader }, r).html,
          reply_to: REPLY_TO, headers: listHeaders(TEST_TOKEN), tags: [{ name: "campaign_id", value: c.id }, { name: "kind", value: "test" }] });
        await db.from("email_sends").insert({ campaign_id: c.id, email: addr, is_test: true, status: res.ok ? "sent" : "failed", resend_id: res.ok ? res.ids[0] : null, error: res.ok ? null : res.error, attempts: 1, sent_at: res.ok ? new Date().toISOString() : null });
        results.push({ to: addr, ok: res.ok, error: res.ok ? undefined : res.error });
      }
      if (results.some((r) => r.ok)) await db.from("email_campaigns").update({ tested_at: new Date().toISOString() }).eq("id", c.id);
      return json({ results }, 200, h);
    }

    if (action === "campaign_send") {
      const { data: c } = await db.from("email_campaigns").select("*").eq("id", str(b.id, 40)).single();
      if (!c) throw new Fail(404, "Campaign not found.");
      if (c.status !== "draft") throw new Fail(409, "This campaign has already been sent or queued.");
      if (!c.subject.trim() || !c.html.trim()) throw new Fail(400, "Add a subject and your HTML first.");
      if (!c.tested_at) throw new Fail(400, "Send yourself a test email first. It must be re-sent after every change.");
      if ((c.audience?.bases ?? []).includes("unverified") && b.confirm_unverified !== true) throw new Fail(400, "Please confirm you want to include unverified contacts.");
      const { data: n } = await db.rpc("audience_count", { p_audience: c.audience });
      if (!n) throw new Fail(400, "No one matches this audience.");
      if (Number(b.confirm_count) !== n) throw new Fail(409, `The audience is now ${n} people, not ${Number(b.confirm_count) || 0}. Please check and confirm again.`);
      const { data: queued, error } = await db.rpc("queue_campaign", { p_campaign: c.id });
      if (error) throw error;
      if (queued === -1) throw new Fail(409, "This campaign has already been queued.");
      kick();
      return json({ queued }, 200, h);
    }

    if (action === "campaign_pause" || action === "campaign_resume" || action === "campaign_cancel") {
      const id = str(b.id, 40);
      if (action === "campaign_pause") await db.from("email_campaigns").update({ status: "paused", updated_at: new Date().toISOString() }).eq("id", id).eq("status", "sending");
      if (action === "campaign_resume") { await db.from("email_campaigns").update({ status: "sending", updated_at: new Date().toISOString() }).eq("id", id).eq("status", "paused"); kick(); }
      if (action === "campaign_cancel") {
        await db.from("email_campaigns").update({ status: "cancelled", finished_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).in("status", ["sending", "paused"]);
        await db.from("email_sends").update({ status: "cancelled" }).eq("campaign_id", id).eq("status", "queued").eq("is_test", false);
      }
      return json({ ok: true }, 200, h);
    }

    if (action === "requeue") {
      const ids = Array.isArray(b.ids) ? b.ids.map(String).filter((x: string) => UUID.test(x)).slice(0, 5000) : null;
      const { data, error } = await db.rpc("requeue_failed", { p_campaign: str(b.campaign_id, 40), p_ids: ids });
      if (error) throw error;
      if (data > 0) kick();
      return json({ requeued: data }, 200, h);
    }

    return json({ error: "Unknown action." }, 400, h);
  } catch (e) {
    if (e instanceof Fail) return json({ error: e.message }, e.status, h);
    console.error(e);
    return json({ error: "Something went wrong. Please try again." }, 500, h);
  }
});
