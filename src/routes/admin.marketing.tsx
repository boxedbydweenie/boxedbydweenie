import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Eye, Image as ImageIcon, ListChecks, Megaphone, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CAMPAIGN_STATUS, fmtWhen, pct, type CampaignStats } from "@/lib/marketing";
import { useAdminData } from "@/components/admin/AdminData";
import { Hero, Metric, Shortcut, StatusDot } from "@/components/admin/AdminBits";
import { Card, Pill } from "@/components/admin/EmailBits";
import { route } from "@/components/admin/nav";

export const Route = createFileRoute("/admin/marketing")({ component: Marketing });

function Marketing() {
  const { ready, snap, checks } = useAdminData();
  const [stats, setStats] = useState<CampaignStats[]>([]);
  useEffect(() => { void supabase().rpc("email_campaign_stats").then(({ data }) => setStats((data ?? []) as CampaignStats[])); }, []);
  const sum = (k: keyof CampaignStats) => stats.reduce((a, s) => a + (Number(s[k]) || 0), 0);
  const delivered = sum("delivered") + sum("opened") + sum("clicked"), opened = sum("opened") + sum("clicked");
  const emailChecks = checks.filter((c) => c.area === "Email");
  const issues = emailChecks.filter((c) => c.level === "bad" || c.level === "warn");
  return <div className="space-y-8">
    <Hero eyebrow="Marketing" title="Email & audience" accent="#E7B93B" blurb="Campaigns, audience, results and images live here together. Start from the tabs above or jump straight in." />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric to="/admin/audience" tone="bg-[#263D35] text-[#F4EFE5]" label="People we can email" value={ready && snap.audience ? snap.audience.active.toLocaleString() : "…"} sub={ready && snap.audience ? `${snap.audience.total.toLocaleString()} contacts in all` : undefined} icon={Users} />
      <Metric to="/admin/email-log" tone="bg-[#E7B93B] text-nero" label="Emails sent, last 7 days" value={ready ? snap.sent7.toLocaleString() : "…"} sub={ready ? `${snap.bounced7} bounced · ${snap.complained7} spam reports` : undefined} icon={ListChecks} />
      <Metric to="/admin/campaigns" tone="bg-[#EB826C] text-nero" label="Opened" value={pct(opened, delivered)} sub="of delivered, all campaigns" icon={Eye} />
      <Metric to="/admin/campaigns" tone="bg-[#192850] text-[#F4EFE5]" label="Campaigns" value={ready ? snap.campaigns.length : "…"} sub={ready ? `${snap.campaigns.filter((c) => c.status === "sending").length} sending · ${snap.campaigns.filter((c) => c.status === "paused").length} paused` : undefined} icon={Megaphone} />
    </section>
    <div className="grid gap-4 md:grid-cols-2">
      <Shortcut to="/admin/campaigns" icon={Megaphone} title="Campaigns" desc="Write, test, pace and send. Duplicate an old one to start fast." />
      <Shortcut to="/admin/audience" icon={Users} title="Audience" desc="Upload or add contacts, edit details, see who is suppressed." />
      <Shortcut to="/admin/email-log" icon={ListChecks} title="Send log & reports" desc="Who got what, what bounced, and the downloadable results." />
      <Shortcut to="/admin/images" icon={ImageIcon} title="Images" desc="Upload pictures and copy their links into your emails." />
    </div>
    <div className="grid gap-6 xl:grid-cols-2">
      <Card title="Recent campaigns" accent="from-[#E7B93B] to-[#EB826C]">
        {ready && snap.campaigns.length === 0 && <p className="text-sm text-muted-foreground">No campaigns yet. Your first one starts on the Campaigns tab.</p>}
        <ul className="divide-y divide-black/5">{snap.campaigns.slice(0, 5).map((c) => <li key={c.id}><Link to={route(`/admin/campaigns/${c.id}`)} className="flex min-h-14 items-center gap-3 py-2 hover:opacity-80"><span className="min-w-0 flex-1 truncate font-semibold">{c.name}</span><Pill cls={CAMPAIGN_STATUS[c.status]?.cls ?? ""}>{CAMPAIGN_STATUS[c.status]?.label ?? c.status}</Pill><span className="hidden text-xs text-muted-foreground sm:block">{fmtWhen(c.queued_at ?? c.updated_at)}</span></Link></li>)}</ul>
        {snap.campaigns.length > 0 && <Link to="/admin/campaigns" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold underline">All campaigns<ArrowRight className="size-4" /></Link>}
      </Card>
      <Card title="Email health" hint="The same live checks as Health & setup, for email only." accent="from-[#2E9E6B] to-[#86BAA3]">
        <ul className="divide-y divide-black/5">{emailChecks.map((c) => <li key={c.id} className="flex gap-3 py-3 text-sm"><StatusDot level={c.level} className="mt-1.5" /><span><span className="font-semibold">{c.label}</span><span className="block text-xs text-muted-foreground">{c.detail}</span></span></li>)}</ul>
        {ready && issues.length === 0 && <p className="mt-3 text-sm text-[#1D5A3F]">Email is in good shape.</p>}
      </Card>
    </div>
  </div>;
}
