import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";

export const Route = createFileRoute("/admin/leads")({ component: Leads });

const STATUSES = [["new", "New"], ["contacted", "Contacted"], ["won", "Won"], ["lost", "Lost"]] as const;
const KIND: Record<string, string> = { contact: "Contact", consultation: "Consultation", quote: "Quote" };
interface QuoteDetails { estimate?: { total?: { low: number; high: number }; lines?: { label: string; detail?: string; low: number; high: number; negative?: boolean }[]; rush?: boolean }; crm?: { products?: { name: string }[]; branding?: string[]; delivery?: { mode?: string; locations?: string[] }; purpose?: string | null; budgetPerRecipient?: number } }
interface Lead { id: string; ref: string; kind: string; name: string; email: string; phone: string | null; company: string | null; role: string | null; details: QuoteDetails | null; quantity: string | null; required_by: string | null; enquiry_type: string | null; message: string | null; status: string; created_at: string }

function Leads() {
  const [rows, setRows] = useState<Lead[] | null>(null);
  const [filter, setFilter] = useState("all");
  const load = useCallback(async () => {
    const { data, error } = await supabase().from("leads").select("*").order("created_at", { ascending: false }).limit(300);
    if (error) return void toast.error("Could not load enquiries.");
    setRows(data as Lead[]);
  }, []);
  useEffect(() => { void load(); }, [load]);
  const setStatus = async (l: Lead, status: string) => {
    setRows((c) => c?.map((x) => (x.id === l.id ? { ...x, status } : x)) ?? c);
    const { error } = await supabase().from("leads").update({ status }).eq("id", l.id);
    if (error) { toast.error("Could not update."); void load(); }
  };
  const shown = (rows ?? []).filter((l) => filter === "all" || l.status === filter);
  return <div>
    <p className="eyebrow text-[#8E6A10]">From the website</p><div aria-hidden className="mt-3 h-px w-12 bg-gold" /><h1 className="mt-4 text-4xl md:text-5xl">Enquiries</h1>
    <div className="mt-6 flex flex-wrap gap-2">{[["all", "All"], ...STATUSES].map(([k, l]) => <button key={k} type="button" onClick={() => setFilter(k)} aria-pressed={filter === k} className={cn("min-h-9 rounded-full border px-3.5 text-sm", filter === k ? "border-nero bg-nero text-white" : "border-black/20 bg-white")}>{l}{k !== "all" && rows ? ` (${rows.filter((o) => o.status === k).length})` : ""}</button>)}</div>
    <div className="mt-6 space-y-3">
      {!rows && <p className="text-sm text-muted-foreground">Loading enquiries</p>}
      {rows && shown.length === 0 && <p className="rounded-lg bg-white p-8 text-sm text-muted-foreground">No enquiries here yet.</p>}
      {shown.map((l) => <article key={l.id} className="rounded-lg bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="flex flex-wrap items-center gap-2"><span className="font-heading text-2xl">{l.name}</span><span className="rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">{KIND[l.kind] ?? l.kind}</span></p>
            <p className="text-sm text-muted-foreground">{[l.company, l.role].filter(Boolean).join(" · ")}{l.company || l.role ? " · " : ""}{l.ref} · {new Date(l.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p></div>
          <select aria-label={`Status for ${l.ref}`} value={l.status} onChange={(e) => void setStatus(l, e.target.value)} className="min-h-10 rounded-md border border-black/20 bg-white px-2 text-sm">{STATUSES.map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select>
        </div>
        <p className="mt-3 text-sm"><a className="underline" href={`mailto:${l.email}`}>{l.email}</a>{l.phone && <> · <a className="underline" href={`tel:${l.phone}`}>{l.phone}</a> · <a className="underline" href={`https://wa.me/${l.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a></>}</p>
        {(l.quantity || l.required_by || l.enquiry_type) && <p className="mt-2 text-sm text-muted-foreground">{[l.enquiry_type, l.quantity && `Quantity: ${l.quantity}`, l.required_by && `Needed by ${l.required_by}`].filter(Boolean).join(" · ")}</p>}
        {l.details?.estimate?.total && <div className="mt-3 rounded-md border border-gold/60 bg-[#FBF6E6] p-3 text-sm">
          <p className="font-semibold">Estimate {formatNaira(Math.round(l.details.estimate.total.low))} to {formatNaira(Math.round(l.details.estimate.total.high))}{l.details.estimate.rush ? " (rush)" : ""}</p>
          <p className="mt-1 text-muted-foreground">{[l.details.crm?.products?.map((p) => p.name).join(", "), l.details.crm?.branding?.length ? `Branding: ${l.details.crm.branding.join(", ")}` : null, l.details.crm?.delivery ? `Delivery: ${l.details.crm.delivery.mode}, ${(l.details.crm.delivery.locations ?? []).join(", ")}` : null, l.details.crm?.budgetPerRecipient ? `Budget ${formatNaira(l.details.crm.budgetPerRecipient)} each` : null].filter(Boolean).join(" · ")}</p>
          <a className="mt-1 inline-block underline" href={`/corporate/quote/${l.ref}`} target="_blank" rel="noreferrer">Open full quote</a></div>}
        {l.message && <p className="mt-3 whitespace-pre-wrap rounded-md bg-[#F7F4EC] p-3 text-sm">{l.message}</p>}
      </article>)}
    </div>
  </div>;
}
