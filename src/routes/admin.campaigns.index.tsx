import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Eye, MailCheck, MousePointerClick, Plus, Send, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { callMarketing, CAMPAIGN_STATUS, fmtWhen, pct, type Campaign, type CampaignStats } from "@/lib/marketing";
import { PageHead, Pill, StatTile } from "@/components/admin/EmailBits";

export const Route = createFileRoute("/admin/campaigns/")({ component: Campaigns });

function Campaigns() {
  const nav = useNavigate();
  const [rows, setRows] = useState<Campaign[] | null>(null);
  const [stats, setStats] = useState<Record<string, CampaignStats>>({});
  const [making, setMaking] = useState(false);

  const load = useCallback(async () => {
    const sb = supabase();
    const [c, s] = await Promise.all([
      sb.from("email_campaigns").select("*").order("created_at", { ascending: false }).limit(200),
      sb.rpc("email_campaign_stats"),
    ]);
    if (c.error) return void toast.error("Could not load campaigns.");
    setRows(c.data as Campaign[]);
    setStats(Object.fromEntries(((s.data ?? []) as CampaignStats[]).map((x) => [x.campaign_id, x])));
  }, []);
  useEffect(() => { void load(); }, [load]);
  const live = rows?.some((r) => r.status === "sending");
  useEffect(() => { if (!live) return; const t = setInterval(() => void load(), 10000); return () => clearInterval(t); }, [live, load]);

  const create = async () => {
    setMaking(true);
    try {
      const r = await callMarketing<{ campaign: Campaign }>("campaign_save", { name: "Untitled campaign", subject: "", preheader: "", html: "" });
      void nav({ to: "/admin/campaigns/$id", params: { id: r.campaign.id } });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not create the campaign."); setMaking(false); }
  };

  const all = Object.values(stats);
  const sum = (k: keyof CampaignStats) => all.reduce((a, s) => a + (Number(s[k]) || 0), 0);
  const delivered = sum("delivered") + sum("opened") + sum("clicked");
  const opened = sum("opened") + sum("clicked");

  return <div>
    <PageHead eyebrow="Email marketing" title="Campaigns" intro="Write, test and send newsletters to the people who want to hear from us."
      actions={<button type="button" onClick={() => void create()} disabled={making} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-nero px-6 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60"><Plus className="size-4" />{making ? "Creating…" : "New campaign"}</button>} />

    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile tone="bg-[#E7B93B] text-nero" label="Emails sent" value={sum("sent") + delivered + sum("bounced")} sub="across all campaigns" />
      <StatTile tone="bg-[#263D35] text-[#F4EFE5]" label="Delivered" value={pct(delivered, sum("sent") + delivered + sum("bounced"))} sub="reached an inbox" />
      <StatTile tone="bg-[#EB826C] text-nero" label="Opened" value={pct(opened, delivered)} sub="of delivered" />
      <StatTile tone="bg-[#192850] text-[#F4EFE5]" label="Needs attention" value={sum("failed") + sum("bounced")} sub="failed or bounced" />
    </div>

    <div className="mt-8 space-y-4">
      {!rows && <p className="text-sm text-muted-foreground">Loading campaigns…</p>}
      {rows && rows.length === 0 && <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#E7B93B]/25"><Send className="size-7" /></div>
        <h2 className="mt-4 text-2xl">Your first campaign starts here</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">Upload your email as an HTML file, choose who gets it, send yourself a test, then send. We handle the unsubscribe link for you.</p>
      </div>}
      {rows?.map((c) => {
        const s = stats[c.id]; const st = CAMPAIGN_STATUS[c.status]!; const done = s ? s.total - s.queued : 0;
        const dlv = s ? s.delivered + s.opened + s.clicked : 0; const opn = s ? s.opened + s.clicked : 0;
        return <Link key={c.id} to="/admin/campaigns/$id" params={{ id: c.id }} className="group block overflow-hidden rounded-2xl bg-white shadow-[0_20px_40px_-32px_rgba(41,40,40,.5)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-28px_rgba(41,40,40,.6)]">
          <div className="h-1.5 bg-gradient-to-r from-[#E7B93B] via-[#EB826C] to-[#86BAA3]" />
          <div className="p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0"><h2 className="truncate font-heading text-2xl group-hover:underline">{c.name}</h2><p className="mt-1 truncate text-sm text-muted-foreground">{c.subject || "No subject yet"}</p></div>
              <div className="text-right"><Pill cls={st.cls}>{st.label}</Pill><p className="mt-1.5 text-xs text-muted-foreground">{c.queued_at ? `Sent ${fmtWhen(c.queued_at)}` : `Edited ${fmtWhen(c.updated_at)}`}</p></div>
            </div>
            {c.status !== "draft" && s && s.total > 0 && <>
              {c.status === "sending" || c.status === "paused" ? <div className="mt-4"><div className="h-2 overflow-hidden rounded-full bg-black/5"><div className="h-full rounded-full bg-gradient-to-r from-[#E7B93B] to-[#EB826C] transition-all" style={{ width: `${Math.round((done / s.total) * 100)}%` }} /></div><p className="mt-1 text-xs text-muted-foreground">{done} of {s.total} processed</p></div> : null}
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
                <Metric icon={<Send className="size-4" />} label="Recipients" v={s.total} />
                <Metric icon={<MailCheck className="size-4" />} label="Delivered" v={pct(dlv, s.total)} />
                <Metric icon={<Eye className="size-4" />} label="Opened" v={pct(opn, dlv)} />
                <Metric icon={<MousePointerClick className="size-4" />} label="Clicked" v={pct(s.clicked, dlv)} />
                <Metric icon={<TriangleAlert className="size-4" />} label="Bounced / failed" v={s.bounced + s.failed} warn={s.bounced + s.failed > 0} />
              </dl></>}
          </div>
        </Link>;
      })}
    </div>
  </div>;
}

function Metric({ icon, label, v, warn }: { icon: React.ReactNode; label: string; v: React.ReactNode; warn?: boolean }) {
  return <div className="rounded-lg bg-[#F4EFE5]/60 p-3"><dt className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</dt><dd className={warn ? "mt-1 font-heading text-xl text-[#83252C]" : "mt-1 font-heading text-xl"}>{v}</dd></div>;
}
