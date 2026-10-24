import { createFileRoute } from "@tanstack/react-router";
import { Gift } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Empty, Hero, Metric } from "@/components/admin/AdminBits";
import { Card, Pill } from "@/components/admin/EmailBits";

export const Route = createFileRoute("/admin/gift-cards")({ component: GiftCards });
interface Card_ { code: string; amount: number; balance: number; status: "pending" | "active" | "void"; order_ref: string | null; to_name: string | null; to_email: string | null; send_on: string | null; sent_at: string | null; created_at: string }
const ST = { pending: ["Awaiting payment", "bg-[#F8EBB8] text-[#6B4D00]"], active: ["Active", "bg-[#DDF0E6] text-[#1D5A3F]"], void: ["Void", "bg-black/5 text-[#292828]/60"] } as const;

function GiftCards() {
  const [rows, setRows] = useState<Card_[] | null>(null);
  const [f, setF] = useState<"all" | Card_["status"]>("all");
  useEffect(() => { void supabase().from("gift_cards").select("code,amount,balance,status,order_ref,to_name,to_email,send_on,sent_at,created_at").order("created_at", { ascending: false }).limit(500).then(({ data }) => setRows((data ?? []) as Card_[])); }, []);
  const act = (rows ?? []).filter((r) => r.status === "active");
  const shown = (rows ?? []).filter((r) => f === "all" || r.status === f);
  return <div className="space-y-8">
    <Hero eyebrow="Sales & Customers" title="Gift cards" accent="#EB826C" blurb="Every card sold, who it is for, when it goes out and what is left on it." />
    <section className="grid gap-4 sm:grid-cols-3">
      <Metric tone="bg-[#E7B93B] text-nero" label="Active cards" value={rows ? act.length : "…"} />
      <Metric tone="bg-[#263D35] text-[#F4EFE5]" label="Value sold" value={rows ? formatNaira(act.reduce((a, r) => a + r.amount, 0)) : "…"} />
      <Metric tone="bg-[#83252C] text-white" label="Still to be spent" value={rows ? formatNaira(act.reduce((a, r) => a + r.balance, 0)) : "…"} sub="Outstanding balance" />
    </section>
    <div className="flex flex-wrap gap-2">{([["all", "All"], ["active", "Active"], ["pending", "Awaiting payment"], ["void", "Void"]] as const).map(([k, l]) => <button key={k} type="button" onClick={() => setF(k)} aria-pressed={f === k} className={cn("min-h-9 rounded-full border px-3.5 text-sm", f === k ? "border-nero bg-nero text-white" : "border-black/20 bg-white")}>{l}</button>)}</div>
    {rows && shown.length === 0 ? <Empty icon={Gift} title="No gift cards here yet">Cards appear as soon as a customer buys one.</Empty> :
      <Card accent="from-[#EB826C] to-[#E7B93B]"><div className="-mx-2 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-[11px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-2 py-2">Code</th><th className="px-2">For</th><th className="px-2 text-right">Value</th><th className="px-2 text-right">Balance</th><th className="px-2">Sends</th><th className="px-2">Status</th></tr></thead>
        <tbody className="divide-y divide-black/5">{shown.map((r) => <tr key={r.code}><td className="px-2 py-3 font-mono text-xs font-semibold">{r.code}</td>
          <td className="px-2">{r.to_name ?? "—"}<span className="block text-xs text-muted-foreground">{r.to_email}</span></td>
          <td className="px-2 text-right">{formatNaira(r.amount)}</td><td className="px-2 text-right font-semibold">{formatNaira(r.balance)}</td>
          <td className="px-2 text-xs">{r.sent_at ? `Sent ${new Date(r.sent_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : r.send_on ? `On ${r.send_on}` : "On payment"}</td>
          <td className="px-2"><Pill cls={ST[r.status][1]}>{ST[r.status][0]}</Pill></td></tr>)}</tbody></table></div></Card>}
  </div>;
}
