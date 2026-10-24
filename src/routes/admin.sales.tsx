import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Gift, Mail, ReceiptText, Users } from "lucide-react";
import { formatNaira } from "@/lib/format";
import { humanAgo, PAID, useAdminData } from "@/components/admin/AdminData";
import { Hero, Metric, Shortcut } from "@/components/admin/AdminBits";
import { Card } from "@/components/admin/EmailBits";

export const Route = createFileRoute("/admin/sales")({ component: Sales });

const STAGES = [
  ["pending_payment", "Awaiting payment", "#9A948A"], ["paid", "Paid, to pack", "#E7B93B"], ["packed", "Packed", "#192850"],
  ["out_for_delivery", "Out for delivery", "#39243F"], ["delivered", "Delivered", "#263D35"],
] as const;

function Sales() {
  const { ready, snap, numbers: n } = useAdminData();
  const count = (s: string) => snap.orders.filter((o) => o.status === s).length;
  const max = Math.max(1, ...STAGES.map(([s]) => count(s)));
  const emails = new Set(snap.orders.filter((o) => PAID.includes(o.status)).map((o) => o.customer?.email?.toLowerCase()).filter(Boolean));
  const avg = n.ordersTotal && snap.orders.filter((o) => PAID.includes(o.status)).length ? Math.round(n.revenueTotal / snap.orders.filter((o) => PAID.includes(o.status)).length) : 0;
  return <div className="space-y-8">
    <Hero eyebrow="Sales & Customers" title="Orders, people and enquiries" accent="#EB826C" blurb="Everything that brings money in, in one place: pack orders, look after customers and answer every enquiry or quote." />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric to="/admin/orders" tone="bg-[#83252C] text-white" label="To pack" value={ready ? n.toPack : "…"} sub="Paid and waiting" icon={ReceiptText} />
      <Metric to="/admin/leads" tone="bg-[#192850] text-[#F4EFE5]" label="New enquiries" value={ready ? n.newLeads : "…"} sub={ready ? `${n.quotesOpen} open quotes` : undefined} icon={Mail} />
      <Metric to="/admin/customers" tone="bg-[#263D35] text-[#F4EFE5]" label="Paying customers" value={ready ? emails.size : "…"} sub={ready && avg ? `${formatNaira(avg)} average order` : undefined} icon={Users} />
      <Metric tone="bg-[#E7B93B] text-nero" label="Revenue this month" value={ready ? formatNaira(n.revenueMonth) : "…"} sub={ready ? `${formatNaira(n.revenueTotal)} all time` : undefined} />
    </section>
    <Card title="Where every order is right now" hint="Click the Orders page to move an order along." accent="from-[#E7B93B] to-[#EB826C]">
      <ul className="space-y-3">{STAGES.map(([s, l, c]) => <li key={s}><Link to="/admin/orders" className="group grid grid-cols-[130px_1fr_40px] items-center gap-3 text-sm sm:grid-cols-[170px_1fr_48px]">
        <span className="font-medium">{l}</span><span className="h-3 overflow-hidden rounded-full bg-black/5"><span className="block h-full rounded-full transition-all group-hover:opacity-80" style={{ width: `${(count(s) / max) * 100}%`, background: c, minWidth: count(s) ? 12 : 0 }} /></span><span className="text-right font-heading text-xl">{ready ? count(s) : "…"}</span></Link></li>)}</ul>
    </Card>
    <div className="grid gap-4 md:grid-cols-2">
      <Shortcut to="/admin/orders" icon={ReceiptText} title="Orders" desc="Pack, dispatch and track every order." badge={n.toPack} />
      <Shortcut to="/admin/customers" icon={Users} title="Customers" desc="Everyone who has bought or got in touch, with what they spent." />
      <Shortcut to="/admin/leads" icon={Mail} title="Enquiries & quotes" desc="Contact, consultation and corporate quote requests." badge={n.newLeads} />
      <Shortcut to="/admin/gift-cards" icon={Gift} title="Gift cards" desc="Issued cards, balances and send dates." />
    </div>
    <Card title="Latest orders" accent="from-[#192850] to-[#86BAA3]">
      {ready && snap.orders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet. They will appear here as soon as customers check out.</p>}
      <ul className="divide-y divide-black/5">{snap.orders.slice(0, 6).map((o) => <li key={o.id} className="flex min-h-14 items-center gap-3 py-2 text-sm"><span className="font-semibold">{o.ref}</span><span className="min-w-0 flex-1 truncate text-muted-foreground">{o.customer?.name}</span><span>{formatNaira(o.total)}</span><span className="hidden w-24 text-right text-xs text-muted-foreground sm:block">{humanAgo(o.created_at)}</span></li>)}</ul>
      {snap.orders.length > 0 && <Link to="/admin/orders" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold underline">All orders<ArrowRight className="size-4" /></Link>}
    </Card>
  </div>;
}
