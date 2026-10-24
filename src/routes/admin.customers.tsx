import { createFileRoute } from "@tanstack/react-router";
import { Download, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PAID } from "@/components/admin/AdminData";
import { Empty, Hero, Metric } from "@/components/admin/AdminBits";
import { Card, Pill } from "@/components/admin/EmailBits";

export const Route = createFileRoute("/admin/customers")({ component: Customers });

interface O { ref: string; status: string; total: number; created_at: string; customer: { name?: string; email?: string; phone?: string } | null }
interface L { name: string; email: string; phone: string | null; company: string | null; created_at: string; kind: string }
interface P { email: string; name: string; phone: string; company: string; orders: number; paidOrders: number; spent: number; last: string; enquiries: number }
const SEG = { customer: ["Customer", "bg-[#DDF0E6] text-[#1D5A3F]"], shopper: ["Started an order", "bg-[#F8EBB8] text-[#6B4D00]"], enquirer: ["Enquirer", "bg-[#E3EBFA] text-[#192850]"] } as const;
const seg = (p: P): keyof typeof SEG => (p.paidOrders ? "customer" : p.orders ? "shopper" : "enquirer");

function Customers() {
  const [orders, setOrders] = useState<O[] | null>(null);
  const [leads, setLeads] = useState<L[] | null>(null);
  const [q, setQ] = useState(""); const [f, setF] = useState<"all" | keyof typeof SEG>("all"); const [sort, setSort] = useState<"spent" | "recent">("recent");
  useEffect(() => { const sb = supabase();
    void sb.from("orders").select("ref,status,total,created_at,customer").order("created_at", { ascending: false }).limit(2000).then(({ data }) => setOrders((data ?? []) as O[]));
    void sb.from("leads").select("name,email,phone,company,created_at,kind").order("created_at", { ascending: false }).limit(1000).then(({ data }) => setLeads((data ?? []) as L[]));
  }, []);
  const people = useMemo(() => {
    if (!orders || !leads) return null;
    const m = new Map<string, P>();
    const get = (email: string, name: string) => { const k = email.toLowerCase(); let p = m.get(k); if (!p) { p = { email: k, name, phone: "", company: "", orders: 0, paidOrders: 0, spent: 0, last: "", enquiries: 0 }; m.set(k, p); } return p; };
    for (const o of orders) { const e = o.customer?.email?.trim(); if (!e) continue; const p = get(e, o.customer?.name ?? ""); p.name ||= o.customer?.name ?? ""; p.phone ||= o.customer?.phone ?? ""; p.orders++; if (PAID.includes(o.status)) { p.paidOrders++; p.spent += o.total; } if (o.created_at > p.last) p.last = o.created_at; }
    for (const l of leads) { const e = l.email?.trim(); if (!e) continue; const p = get(e, l.name); p.name ||= l.name; p.phone ||= l.phone ?? ""; p.company ||= l.company ?? ""; p.enquiries++; if (l.created_at > p.last) p.last = l.created_at; }
    return [...m.values()];
  }, [orders, leads]);
  const shown = useMemo(() => (people ?? []).filter((p) => (f === "all" || seg(p) === f) && (!q.trim() || `${p.name} ${p.email} ${p.company} ${p.phone}`.toLowerCase().includes(q.trim().toLowerCase())))
    .sort((a, b) => (sort === "spent" ? b.spent - a.spent : b.last.localeCompare(a.last))), [people, q, f, sort]);
  const exportCsv = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = ["Name,Email,Phone,Company,Type,Orders,Paid orders,Spent (NGN),Last activity", ...shown.map((p) => [p.name, p.email, p.phone, p.company, SEG[seg(p)][0], p.orders, p.paidOrders, p.spent, p.last.slice(0, 10)].map(esc).join(","))].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" })); a.download = "boxed-by-dweenie-customers.csv"; a.click(); URL.revokeObjectURL(a.href);
  };
  const buyers = (people ?? []).filter((p) => p.paidOrders > 0);
  return <div className="space-y-8">
    <Hero eyebrow="Sales & Customers" title="Customers" accent="#EB826C" blurb="Built from orders and enquiries. Nobody is typed in twice: the same email is one person." />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric tone="bg-[#263D35] text-[#F4EFE5]" label="Paying customers" value={people ? buyers.length : "…"} />
      <Metric tone="bg-[#E7B93B] text-nero" label="Repeat customers" value={people ? buyers.filter((p) => p.paidOrders > 1).length : "…"} sub="Bought more than once" />
      <Metric tone="bg-[#192850] text-[#F4EFE5]" label="Enquirers" value={people ? people.filter((p) => seg(p) === "enquirer").length : "…"} sub="Not bought yet" />
      <Metric tone="bg-[#83252C] text-white" label="Biggest spender" value={people ? formatNaira(Math.max(0, ...people.map((p) => p.spent))) : "…"} />
    </section>
    <div className="flex flex-wrap items-center gap-3">
      <label className="relative min-w-[240px] flex-1"><Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, company or phone" className="min-h-11 w-full rounded-full border border-black/15 bg-white pl-11 pr-4 text-sm outline-none focus:border-nero" /></label>
      <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as "spent" | "recent")} className="min-h-11 rounded-full border border-black/15 bg-white px-4 text-sm"><option value="recent">Most recent</option><option value="spent">Biggest spenders</option></select>
      <button type="button" onClick={exportCsv} disabled={!shown.length} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-nero/30 bg-white px-5 text-sm font-semibold hover:border-nero disabled:opacity-50"><Download className="size-4" />Download CSV</button>
    </div>
    <div className="flex flex-wrap gap-2">{([["all", "All"], ["customer", "Customers"], ["shopper", "Started an order"], ["enquirer", "Enquirers"]] as const).map(([k, l]) => <button key={k} type="button" onClick={() => setF(k)} aria-pressed={f === k} className={cn("min-h-9 rounded-full border px-3.5 text-sm", f === k ? "border-nero bg-nero text-white" : "border-black/20 bg-white")}>{l}</button>)}</div>
    {!people ? <p className="text-sm text-muted-foreground">Loading customers…</p> : shown.length === 0 ? <Empty icon={Users} title="No one here yet">{people.length === 0 ? "Customers appear as soon as someone orders or sends an enquiry." : "Nobody matches that search."}</Empty> :
      <Card accent="from-[#EB826C] to-[#E7B93B]"><div className="-mx-2 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm">
        <thead className="text-[11px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-2 py-2">Person</th><th className="px-2">Type</th><th className="px-2 text-right">Orders</th><th className="px-2 text-right">Spent</th><th className="px-2">Last activity</th><th className="px-2">Reach</th></tr></thead>
        <tbody className="divide-y divide-black/5">{shown.slice(0, 300).map((p) => <tr key={p.email}>
          <td className="px-2 py-3"><span className="font-semibold">{p.name || p.email}</span><span className="block text-xs text-muted-foreground">{[p.company, p.name ? p.email : ""].filter(Boolean).join(" · ")}</span></td>
          <td className="px-2"><Pill cls={SEG[seg(p)][1]}>{SEG[seg(p)][0]}</Pill></td>
          <td className="px-2 text-right">{p.paidOrders}{p.orders > p.paidOrders ? <span className="text-xs text-muted-foreground"> (+{p.orders - p.paidOrders})</span> : null}</td>
          <td className="px-2 text-right font-semibold">{p.spent ? formatNaira(p.spent) : "—"}</td>
          <td className="px-2 text-xs text-muted-foreground">{p.last ? new Date(p.last).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
          <td className="px-2 text-xs"><a className="underline" href={`mailto:${p.email}`}>Email</a>{p.phone && <> · <a className="underline" href={`https://wa.me/${p.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a></>}</td></tr>)}</tbody></table></div>
        {shown.length > 300 && <p className="mt-3 text-xs text-muted-foreground">Showing the first 300 of {shown.length}. Download the CSV for everyone.</p>}</Card>}
  </div>;
}
