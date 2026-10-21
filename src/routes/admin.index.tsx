import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatNaira } from "@/lib/format";

export const Route = createFileRoute("/admin/")({ component: Overview });

interface Stats { active: number; hidden: number; soldOut: number; orders: number; toPack: number; revenue: number; newLeads: number }

function Overview() {
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { void (async () => {
    const sb = supabase();
    const [p, o, l] = await Promise.all([
      sb.from("products").select("active,in_stock"),
      sb.from("orders").select("status,total"),
      sb.from("leads").select("status"),
    ]);
    if (p.error || o.error || l.error) return setErr("Could not load the numbers. Refresh and try again.");
    const prods = p.data ?? [], ords = o.data ?? [];
    setS({
      active: prods.filter((x) => x.active).length, hidden: prods.filter((x) => !x.active).length, soldOut: prods.filter((x) => x.active && !x.in_stock).length,
      orders: ords.length, toPack: ords.filter((x) => x.status === "paid").length,
      revenue: ords.filter((x) => ["paid", "packed", "out_for_delivery", "delivered"].includes(x.status)).reduce((a, x) => a + x.total, 0),
      newLeads: (l.data ?? []).filter((x) => x.status === "new").length,
    });
  })(); }, []);
  const cards = s ? [
    { to: "/admin/orders", k: "Orders to pack", v: s.toPack, sub: `${s.orders} orders in total`, tone: "bg-[#83252C] text-white" },
    { to: "/admin/leads", k: "New enquiries", v: s.newLeads, sub: "Waiting for a reply", tone: "bg-[#192850] text-white" },
    { to: "/admin/products", k: "Products on sale", v: s.active, sub: `${s.soldOut} sold out · ${s.hidden} hidden`, tone: "bg-[#263D35] text-white" },
    { to: "/admin/orders", k: "Paid revenue", v: formatNaira(s.revenue), sub: "Paid, packed and delivered orders", tone: "bg-gold text-nero" },
  ] as const : [];
  return <div>
    <p className="eyebrow text-[#8E6A10]">Welcome back</p><div aria-hidden className="mt-3 h-px w-12 bg-gold" />
    <h1 className="mt-4 text-4xl md:text-5xl">Overview</h1>
    {err && <p role="alert" className="mt-6 text-destructive">{err}</p>}
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {!s && !err && [0, 1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-lg bg-black/5" />)}
      {cards.map((c) => <Link key={c.k} to={c.to} className={`rounded-lg p-6 shadow-[0_24px_40px_-30px_rgba(41,40,40,.6)] transition hover:-translate-y-1 ${c.tone}`}>
        <p className="text-xs font-semibold uppercase tracking-[.18em] opacity-80">{c.k}</p>
        <p className="mt-3 font-heading text-5xl leading-none">{c.v}</p>
        <p className="mt-3 text-sm opacity-80">{c.sub}</p>
      </Link>)}
    </div>
    <div className="mt-10 rounded-lg bg-white p-6 text-sm text-muted-foreground shadow-sm">
      <p className="font-semibold text-nero">Quick guide</p>
      <ul className="mt-2 list-disc space-y-1 pl-5"><li>Products: change prices, photos, descriptions, stock and visibility. Changes show on the website within moments.</li><li>Orders: move an order from Paid to Packed, Out for delivery and Delivered.</li><li>Enquiries: contact, quote and consultation requests from the website.</li></ul>
    </div>
  </div>;
}
