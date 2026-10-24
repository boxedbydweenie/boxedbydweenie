import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Mail, Megaphone, Package, ReceiptText, Sparkles } from "lucide-react";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { humanAgo, PAID, useAdminData, type Check } from "@/components/admin/AdminData";
import { Hero, LEVEL, Metric, Shortcut, Sparkline, StatusDot } from "@/components/admin/AdminBits";
import { Card } from "@/components/admin/EmailBits";
import { NAV_GROUPS, route } from "@/components/admin/nav";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };

function Dashboard() {
  const { ready, snap, checks, checklist, status, numbers: n } = useAdminData();
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const attention = checks.filter((c) => c.level === "bad" || c.level === "warn").sort((a, b) => (a.level === "bad" ? -1 : 1) - (b.level === "bad" ? -1 : 1));
  const done = checklist.filter((c) => c.done).length;
  const todo = checklist.filter((c) => !c.done);
  const headline = !ready ? "Checking every part of the system…" : status.level === "ok" ? "Everything is running smoothly." : status.bad ? `${status.bad} ${status.bad === 1 ? "thing needs" : "things need"} action${status.warn ? ` and ${status.warn} more ${status.warn === 1 ? "needs" : "need"} a look` : ""}.` : `${status.warn} ${status.warn === 1 ? "thing needs" : "things need"} a look.`;

  return <div className="space-y-8">
    <Hero eyebrow={today} title={`${greeting()}.`} accent="#E7B93B"
      aside={<Link to="/admin/system" className="group flex items-center gap-4 rounded-2xl bg-white/10 p-4 pr-5 backdrop-blur transition hover:bg-white/15">
        <span className={cn("grid size-14 place-items-center rounded-full", ready ? LEVEL[status.level].bg : "bg-white/20")}><StatusDot level={ready ? status.level : "off"} pulse className="scale-150" /></span>
        <span><span className="block text-[11px] font-bold uppercase tracking-[.18em] text-gold">System health</span><span className="mt-0.5 block max-w-[260px] text-sm text-on-dark">{headline}</span></span>
        <ArrowRight className="size-4 text-on-dark-muted transition group-hover:translate-x-1" />
      </Link>}>
      <div className="grid gap-3 sm:grid-cols-3">
        <HeroStat label="Taken today" value={ready ? formatNaira(n.revenueToday) : "…"} />
        <HeroStat label="To pack right now" value={ready ? n.toPack : "…"} to="/admin/orders" />
        <HeroStat label="Enquiries to answer" value={ready ? n.newLeads : "…"} to="/admin/leads" />
      </div>
    </Hero>

    {ready && attention.length > 0 && <section aria-labelledby="attn">
      <h2 id="attn" className="font-heading text-2xl">Needs you now</h2>
      <ul className="mt-3 grid gap-3 md:grid-cols-2">{attention.slice(0, 6).map((c) => <AttentionRow key={c.id} c={c} />)}</ul>
      {attention.length > 6 && <Link to="/admin/system" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold underline">See all {attention.length} on Health & setup<ArrowRight className="size-4" /></Link>}
    </section>}

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key numbers">
      <Metric to="/admin/sales" tone="bg-[#E7B93B] text-nero" label="Revenue this month" value={ready ? formatNaira(n.revenueMonth) : "…"} sub={ready ? `${formatNaira(n.revenueTotal)} all time` : undefined} icon={ReceiptText} />
      <Metric to="/admin/orders" tone="bg-[#83252C] text-white" label="Orders" value={ready ? n.ordersTotal : "…"} sub={ready ? `${n.toPack} to pack · ${n.inTransit} on the way` : undefined} icon={Package} />
      <Metric to="/admin/marketing" tone="bg-[#263D35] text-[#F4EFE5]" label="People we can email" value={ready && snap.audience ? snap.audience.active.toLocaleString() : "…"} sub={ready && snap.audience ? `${snap.audience.unsubscribed} unsubscribed · ${snap.audience.bounced} bounced` : undefined} icon={Megaphone} />
      <Metric to="/admin/leads" tone="bg-[#192850] text-[#F4EFE5]" label="Open quotes" value={ready ? n.quotesOpen : "…"} sub={ready ? `${n.newLeads} new enquiries in all` : undefined} icon={Mail} />
    </section>

    <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
      <Card title="Money in, last 14 days" hint="Paid orders only." accent="from-[#E7B93B] to-[#EB826C]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="font-heading text-5xl leading-none">{ready ? formatNaira(n.days.reduce((a, d) => a + d.revenue, 0)) : "…"}</p><p className="mt-2 text-sm text-muted-foreground">{ready ? `${n.days.reduce((a, d) => a + d.orders, 0)} paid orders` : ""}</p></div>
          {ready && n.revenueTotal === 0 && <p className="max-w-xs rounded-lg bg-[#F8EBB8] p-3 text-xs text-[#6B4D00]">No paid orders yet. Once the Paystack key is in and a test purchase succeeds, this fills in.</p>}
        </div>
        <Sparkline values={n.days.map((d) => d.revenue)} className="mt-6" height={110} />
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground"><span>{n.days[0]?.label}</span><span>{n.days[13]?.label}</span></div>
      </Card>
      <HealthGlance checks={checks} ready={ready} />
    </section>

    <section aria-labelledby="jump">
      <h2 id="jump" className="font-heading text-2xl">Jump back in</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {NAV_GROUPS.map((g) => <Shortcut key={g.id} to={g.hub} icon={g.icon} title={g.label} desc={g.blurb} badge={g.id === "sales" ? n.toPack + n.newLeads : g.id === "system" ? status.bad + status.warn : undefined} />)}
      </div>
    </section>

    <section className="grid gap-6 xl:grid-cols-2">
      <Card title="Setup progress" hint={ready ? `${done} of ${checklist.length} done. The rest is on Health & setup.` : undefined} accent="from-[#86BAA3] to-[#E7B93B]">
        <div className="h-2.5 overflow-hidden rounded-full bg-black/5"><div className="h-full rounded-full bg-gradient-to-r from-[#86BAA3] to-[#E7B93B] transition-all" style={{ width: `${checklist.length ? Math.round((done / checklist.length) * 100) : 0}%` }} /></div>
        <ul className="mt-5 space-y-3">{todo.slice(0, 4).map((t) => <li key={t.key} className="flex gap-3 text-sm"><span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-gold" /><span><span className="font-semibold">{t.label}</span><span className="block text-xs text-muted-foreground">{t.area}</span></span></li>)}
          {ready && todo.length === 0 && <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-5 text-[#2E9E6B]" />Everything on the checklist is done.</li>}</ul>
        <Link to="/admin/system" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full bg-nero px-5 text-sm font-semibold text-white">Open the full checklist<ArrowRight className="size-4" /></Link>
      </Card>
      <Activity />
    </section>
  </div>;
}

function HeroStat({ label, value, to }: { label: string; value: React.ReactNode; to?: string }) {
  const inner = <><p className="text-[11px] font-bold uppercase tracking-[.16em] text-on-dark-muted">{label}</p><p className="mt-1 font-heading text-4xl leading-none text-on-dark">{value}</p></>;
  return to ? <Link to={route(to)} className="rounded-2xl bg-white/10 p-4 transition hover:bg-white/15">{inner}</Link> : <div className="rounded-2xl bg-white/10 p-4">{inner}</div>;
}

function AttentionRow({ c }: { c: Check }) {
  const body = <><StatusDot level={c.level} pulse className="mt-1.5" /><span className="min-w-0 flex-1"><span className="block font-semibold">{c.label}</span><span className="mt-0.5 block text-sm text-muted-foreground">{c.detail}</span></span>{c.to && <ArrowRight className="mt-1 size-4 shrink-0 opacity-40 transition group-hover:translate-x-1 group-hover:opacity-100" />}</>;
  const cls = "group flex gap-3 rounded-2xl bg-white p-4 shadow-[0_20px_40px_-32px_rgba(41,40,40,.5)]";
  return <li>{c.to ? <Link to={route(c.to)} className={cn(cls, "transition hover:-translate-y-0.5")}>{body}</Link> : <div className={cls}>{body}</div>}</li>;
}

function HealthGlance({ checks, ready }: { checks: Check[]; ready: boolean }) {
  const areas = ["Payments", "Orders", "Email", "Catalogue", "Platform"] as const;
  return <Card title="System at a glance" accent="from-[#2E9E6B] to-[#86BAA3]">
    <ul className="divide-y divide-black/5">{areas.map((a) => {
      const rows = checks.filter((c) => c.area === a); const worst = rows.some((r) => r.level === "bad") ? "bad" : rows.some((r) => r.level === "warn") ? "warn" : rows.every((r) => r.level === "off") ? "off" : "ok";
      const issues = rows.filter((r) => r.level === "bad" || r.level === "warn").length;
      return <li key={a}><Link to="/admin/system" hash={a.toLowerCase()} className="flex min-h-12 items-center gap-3 py-2 text-sm hover:opacity-80"><StatusDot level={ready ? worst : "off"} /><span className="flex-1 font-semibold">{a}</span><span className="text-xs text-muted-foreground">{!ready ? "…" : issues ? `${issues} to look at` : worst === "off" ? "not checked" : "all good"}</span></Link></li>;
    })}</ul>
  </Card>;
}

function Activity() {
  const { snap, ready } = useAdminData();
  type Row = { id: string; at: string; icon: typeof Mail; title: string; sub: string; to: string };
  const rows: Row[] = [
    ...snap.orders.slice(0, 8).map((o): Row => ({ id: "o" + o.id, at: o.created_at, icon: ReceiptText, title: `Order ${o.ref}${o.customer?.name ? ` from ${o.customer.name}` : ""}`, sub: `${formatNaira(o.total)} · ${PAID.includes(o.status) ? "paid" : o.status.replace(/_/g, " ")}`, to: "/admin/orders" })),
    ...snap.leads.slice(0, 8).map((l): Row => ({ id: "l" + l.id, at: l.created_at, icon: Mail, title: `${l.kind === "quote" ? "Quote request" : l.kind === "consultation" ? "Consultation" : "Enquiry"} from ${l.name}`, sub: l.company ?? l.status, to: "/admin/leads" })),
    ...snap.campaigns.slice(0, 5).map((c): Row => ({ id: "c" + c.id, at: c.queued_at ?? c.updated_at, icon: Megaphone, title: `Campaign “${c.name}”`, sub: c.status, to: `/admin/campaigns/${c.id}` })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 7);
  return <Card title="What just happened" accent="from-[#192850] to-[#86BAA3]">
    {!ready && <p className="text-sm text-muted-foreground">Loading…</p>}
    {ready && rows.length === 0 && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Sparkles className="size-4" />Quiet so far. Orders, enquiries and campaigns will appear here.</p>}
    <ul className="divide-y divide-black/5">{rows.map((r) => <li key={r.id}><Link to={route(r.to)} className="flex min-h-14 items-center gap-3 py-2 hover:opacity-80">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#F4EFE5]"><r.icon className="size-4" /></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{r.title}</span><span className="block truncate text-xs text-muted-foreground">{r.sub}</span></span>
      <span className="shrink-0 text-xs text-muted-foreground">{humanAgo(r.at)}</span></Link></li>)}</ul>
  </Card>;
}

