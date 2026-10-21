import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/orders")({ component: Orders });

const STATUSES = [
  ["pending_payment", "Awaiting payment"], ["paid", "Paid"], ["packed", "Packed"], ["out_for_delivery", "Out for delivery"],
  ["delivered", "Delivered"], ["cancelled", "Cancelled"], ["payment_failed", "Payment failed"],
] as const;
const TONE: Record<string, string> = { paid: "bg-gold text-nero", packed: "bg-[#192850] text-white", out_for_delivery: "bg-[#39243F] text-white", delivered: "bg-[#263D35] text-white", cancelled: "bg-black/70 text-white", payment_failed: "bg-[#83252C] text-white", pending_payment: "bg-black/10" };

interface Person { name?: string; email?: string; phone?: string; address?: string; area?: string; state?: string; deliveryDate?: string; notes?: string }
interface Order { id: string; ref: string; status: string; customer: Person; recipient: Person; send_to: string; items: { name?: string; quantity?: number; price?: number; packaging?: string; note?: string; deliveryDate?: string }[]; subtotal: number; discount: number; delivery_fee: number; total: number; promo_code: string | null; created_at: string; paid_at: string | null }

function Orders() {
  const [rows, setRows] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const load = useCallback(async () => {
    const { data, error } = await supabase().from("orders").select("*").order("created_at", { ascending: false }).limit(300);
    if (error) return void toast.error("Could not load orders.");
    setRows(data as Order[]);
  }, []);
  useEffect(() => { void load(); }, [load]);
  const setStatus = async (o: Order, status: string) => {
    setRows((c) => c?.map((x) => (x.id === o.id ? { ...x, status } : x)) ?? c);
    const { error } = await supabase().from("orders").update({ status }).eq("id", o.id);
    if (error) { toast.error("Could not update the order."); void load(); } else toast.success(`${o.ref} marked ${STATUSES.find((s) => s[0] === status)?.[1]}.`);
  };
  const shown = (rows ?? []).filter((o) => filter === "all" || o.status === filter);
  return <div>
    <p className="eyebrow text-[#8E6A10]">Fulfilment</p><div aria-hidden className="mt-3 h-px w-12 bg-gold" /><h1 className="mt-4 text-4xl md:text-5xl">Orders</h1>
    <div className="mt-6 flex flex-wrap gap-2">{[["all", "All"], ...STATUSES].map(([k, l]) => <button key={k} type="button" onClick={() => setFilter(k)} aria-pressed={filter === k} className={cn("min-h-9 rounded-full border px-3.5 text-sm", filter === k ? "border-nero bg-nero text-white" : "border-black/20 bg-white")}>{l}{k !== "all" && rows ? ` (${rows.filter((o) => o.status === k).length})` : ""}</button>)}</div>
    <div className="mt-6 overflow-hidden rounded-lg bg-white shadow-sm">
      {!rows && <p className="p-8 text-sm text-muted-foreground">Loading orders</p>}
      {rows && shown.length === 0 && <p className="p-8 text-sm text-muted-foreground">{rows.length === 0 ? "No orders yet. They will appear here as soon as customers check out." : "No orders in this view."}</p>}
      <ul className="divide-y divide-black/5">{shown.map((o) => <li key={o.id} className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setOpen(open === o.id ? null : o.id)} className="min-w-0 flex-1 text-left"><span className="font-semibold">{o.ref}</span> <span className="text-sm text-muted-foreground">· {o.customer.name} · {new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span><span className="block text-sm">{formatNaira(o.total)} · deliver to {o.recipient.area ?? ""}{o.recipient.area ? ", " : ""}{o.recipient.state}</span></button>
          <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", TONE[o.status])}>{STATUSES.find((s) => s[0] === o.status)?.[1]}</span>
          <select aria-label={`Status for ${o.ref}`} value={o.status} onChange={(e) => void setStatus(o, e.target.value)} className="min-h-10 rounded-md border border-black/20 bg-white px-2 text-sm">{STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </div>
        {open === o.id && <div className="mt-4 grid gap-6 rounded-md bg-[#F7F4EC] p-4 text-sm md:grid-cols-2">
          <div><p className="font-semibold">Items</p><ul className="mt-1 space-y-1">{o.items.map((i, n) => <li key={n}>{i.quantity ?? 1} × {i.name} {i.packaging && <span className="text-muted-foreground">({i.packaging})</span>}{i.note && <span className="block text-muted-foreground">Note: “{i.note}”</span>}</li>)}</ul>
            <p className="mt-3">Subtotal {formatNaira(o.subtotal)}{o.discount ? ` · Discount −${formatNaira(o.discount)}` : ""} · Delivery {formatNaira(o.delivery_fee)}</p><p className="font-semibold">Total {formatNaira(o.total)}{o.promo_code ? ` (code ${o.promo_code})` : ""}</p></div>
          <div className="space-y-3"><div><p className="font-semibold">Buyer</p><p>{o.customer.name}<br />{o.customer.email}<br />{o.customer.phone}</p></div>
            <div><p className="font-semibold">Deliver to {o.send_to === "me" ? "(buyer)" : "(recipient)"}</p><p>{o.recipient.name}<br />{o.recipient.phone}<br />{o.recipient.address}, {o.recipient.area}, {o.recipient.state}{o.recipient.deliveryDate ? <><br />On {o.recipient.deliveryDate}</> : null}{o.recipient.notes ? <><br />Notes: {o.recipient.notes}</> : null}</p></div></div>
        </div>}
      </li>)}</ul>
    </div>
  </div>;
}
