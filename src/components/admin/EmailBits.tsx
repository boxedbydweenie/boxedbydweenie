import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Download, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { callMarketing, downloadResults, fmtWhen, SEND_STATUS, type Send } from "@/lib/marketing";
import { cn } from "@/lib/utils";

/** Page heading used by every email page: eyebrow, gold rule, title, optional actions on the right. */
export function PageHead({ eyebrow, title, intro, actions }: { eyebrow: string; title: string; intro?: string; actions?: ReactNode }) {
  return <div className="flex flex-wrap items-end justify-between gap-4">
    <div className="max-w-2xl"><p className="eyebrow text-[#8E6A10]">{eyebrow}</p><div aria-hidden className="mt-3 h-px w-12 bg-gold" /><h1 className="mt-4 text-4xl md:text-5xl">{title}</h1>{intro && <p className="mt-3 text-muted-foreground">{intro}</p>}</div>
    {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
  </div>;
}

/** Colourful number tile. */
export function StatTile({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: string; tone: string }) {
  return <div className={cn("rounded-xl p-5 shadow-[0_24px_40px_-30px_rgba(41,40,40,.6)]", tone)}>
    <p className="text-[11px] font-semibold uppercase tracking-[.18em] opacity-80">{label}</p>
    <p className="mt-2 font-heading text-4xl leading-none">{value}</p>
    {sub && <p className="mt-2 text-xs opacity-80">{sub}</p>}
  </div>;
}

export function Pill({ cls, children }: { cls: string; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider", cls)}>{children}</span>;
}

export function Card({ title, hint, children, className, accent = "from-[#E7B93B] to-[#EB826C]" }: { title?: string; hint?: string | undefined; children: ReactNode; className?: string; accent?: string }) {
  return <section className={cn("overflow-hidden rounded-2xl bg-white shadow-[0_20px_40px_-32px_rgba(41,40,40,.5)]", className)}>
    <div className={cn("h-1.5 bg-gradient-to-r", accent)} />
    <div className="p-5 md:p-6">{title && <h2 className="font-heading text-2xl">{title}</h2>}{hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}<div className={title ? "mt-5" : ""}>{children}</div></div>
  </section>;
}

const FILTERS = [["all", "All"], ["queued", "Queued"], ["sent", "Sent"], ["delivered", "Delivered"], ["opened", "Opened"], ["clicked", "Clicked"], ["bounced", "Bounced"], ["complained", "Complained"], ["failed", "Failed"], ["suppressed", "Skipped"]] as const;
const PAGE = 50;
const RESENDABLE = ["failed", "bounced"];

/** The send log: one row per email with its status, filters, search, and resend for failures (one by one or in bulk). */
export function SendTable({ campaignId, campaignName, showCampaign = true, onChanged }: { campaignId?: string; campaignName?: string; showCampaign?: boolean; onChanged?: () => void }) {
  const [rows, setRows] = useState<Send[] | null>(null);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<string>("all");
  const [q, setQ] = useState(""); const [qDebounced, setQDebounced] = useState("");
  const [tests, setTests] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  const exportCsv = async (problemsOnly: boolean) => {
    if (!campaignId) return;
    setExporting(true);
    try {
      const n = await downloadResults(campaignId, campaignName ?? "campaign", problemsOnly);
      toast.success(n ? `Downloaded ${n.toLocaleString()} ${n === 1 ? "row" : "rows"}. Open it in Excel or Google Sheets.` : "Nothing to download yet.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not download the results."); } finally { setExporting(false); }
  };

  useEffect(() => { const t = setTimeout(() => { setQDebounced(q.trim()); setPage(0); }, 300); return () => clearTimeout(t); }, [q]);

  const load = useCallback(async () => {
    let qy = supabase().from("email_sends").select("*, email_campaigns(name)", { count: "exact" }).order("queued_at", { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
    if (campaignId) qy = qy.eq("campaign_id", campaignId);
    if (!tests) qy = qy.eq("is_test", false);
    if (status === "queued") qy = qy.in("status", ["queued", "sending"]); else if (status !== "all") qy = qy.eq("status", status);
    if (qDebounced) qy = qy.ilike("email", `%${qDebounced.replace(/[%_,()]/g, "")}%`);
    const { data, count: c, error } = await qy;
    if (error) return void toast.error("Could not load the send log.");
    setRows(data as unknown as Send[]); setCount(c ?? 0);
  }, [campaignId, page, status, qDebounced, tests]);
  useEffect(() => { void load(); }, [load]);
  const live = rows?.some((r) => r.status === "queued" || r.status === "sending");
  useEffect(() => { if (!live) return; const t = setInterval(() => void load(), 8000); return () => clearInterval(t); }, [live, load]);

  const resend = async (groups: Record<string, string[] | null>) => {
    setBusy(true);
    try {
      let n = 0;
      for (const [cid, ids] of Object.entries(groups)) n += (await callMarketing<{ requeued: number }>("requeue", { campaign_id: cid, ids })).requeued;
      toast.success(n ? `${n} email${n === 1 ? "" : "s"} back in the queue. They will go out within a minute.` : "Nothing to resend. Hard bounces and unsubscribed addresses are skipped.");
      setPicked(new Set()); await load(); onChanged?.();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not resend."); } finally { setBusy(false); }
  };
  const resendPicked = () => {
    const g: Record<string, string[]> = {};
    for (const r of rows ?? []) if (picked.has(r.id)) (g[r.campaign_id] ??= []).push(r.id);
    void resend(g);
  };
  const resendable = (rows ?? []).filter((r) => RESENDABLE.includes(r.status) && !r.is_test);
  const allPicked = resendable.length > 0 && resendable.every((r) => picked.has(r.id));
  const toggle = (id: string) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const pages = Math.max(1, Math.ceil(count / PAGE));

  return <div>
    <div className="flex flex-wrap items-center gap-2">
      {FILTERS.map(([k, l]) => <button key={k} type="button" aria-pressed={status === k} onClick={() => { setStatus(k); setPage(0); setPicked(new Set()); }} className={cn("min-h-9 rounded-full border px-3.5 text-sm transition", status === k ? "border-nero bg-nero text-white" : "border-black/15 bg-white hover:border-black/40")}>{l}</button>)}
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <label className="relative min-w-[14rem] flex-1 sm:max-w-xs"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by email" aria-label="Search by email" className="min-h-10 w-full rounded-md border border-black/15 bg-white pl-9 pr-3 text-sm" /></label>
      <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={tests} onChange={(e) => { setTests(e.target.checked); setPage(0); }} className="size-4 accent-[var(--color-nero)]" />Show test emails</label>
      <div className="ml-auto flex flex-wrap gap-2">
        {picked.size > 0 && <button type="button" disabled={busy} onClick={resendPicked} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-nero px-4 text-sm font-semibold text-white disabled:opacity-50"><RotateCcw className="size-4" />Resend {picked.size} selected</button>}
        {campaignId && <>
          <button type="button" disabled={exporting} onClick={() => void exportCsv(false)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-nero/30 px-4 text-sm font-semibold hover:border-nero disabled:opacity-50"><Download className="size-4" />{exporting ? "Preparing…" : "Download all results"}</button>
          <button type="button" disabled={exporting} onClick={() => void exportCsv(true)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#83252C]/40 px-4 text-sm font-semibold text-[#83252C] hover:bg-[#FBE0DA] disabled:opacity-50"><Download className="size-4" />Download problems only</button>
        </>}
        {campaignId && <button type="button" disabled={busy} onClick={() => { if (window.confirm("Resend every failed and soft-bounced email in this campaign? Hard bounces and unsubscribed addresses are skipped.")) void resend({ [campaignId]: null }); }} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-nero px-4 text-sm font-semibold hover:bg-nero hover:text-white disabled:opacity-50"><RotateCcw className="size-4" />Resend all failed</button>}
      </div>
    </div>

    <div className="mt-5 overflow-x-auto rounded-xl border border-black/10 bg-white">
      <table className="w-full min-w-[46rem] text-left text-sm">
        <thead className="bg-[#F4EFE5] text-xs uppercase tracking-wider text-nero/70"><tr>
          <th className="w-10 px-3 py-3"><input type="checkbox" aria-label="Select all failed on this page" disabled={!resendable.length} checked={allPicked} onChange={() => setPicked(allPicked ? new Set() : new Set(resendable.map((r) => r.id)))} className="size-4 accent-[var(--color-nero)]" /></th>
          <th className="px-3 py-3">Recipient</th>{showCampaign && <th className="px-3 py-3">Campaign</th>}<th className="px-3 py-3">Status</th><th className="px-3 py-3">Sent</th><th className="px-3 py-3">Latest</th><th className="px-3 py-3">Detail</th><th className="w-24 px-3 py-3" />
        </tr></thead>
        <tbody className="divide-y divide-black/5">
          {!rows && <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">Loading the log…</td></tr>}
          {rows && rows.length === 0 && <tr><td colSpan={8} className="px-3 py-10 text-center text-muted-foreground">No emails here yet.</td></tr>}
          {rows?.map((r) => { const s = SEND_STATUS[r.status] ?? { label: r.status, cls: "bg-black/5" }; const can = RESENDABLE.includes(r.status) && !r.is_test; const latest = r.clicked_at ?? r.opened_at ?? r.delivered_at ?? r.bounced_at ?? r.complained_at ?? r.sent_at;
            return <tr key={r.id} className="hover:bg-[#FBF8F1]">
              <td className="px-3 py-3">{can && <input type="checkbox" aria-label={`Select ${r.email}`} checked={picked.has(r.id)} onChange={() => toggle(r.id)} className="size-4 accent-[var(--color-nero)]" />}</td>
              <td className="px-3 py-3 font-medium">{r.email}{r.is_test && <span className="ml-2 rounded bg-[#EB826C]/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#83252C]">Test</span>}</td>
              {showCampaign && <td className="px-3 py-3 text-muted-foreground">{r.email_campaigns?.name ?? "—"}</td>}
              <td className="px-3 py-3"><Pill cls={s.cls}>{s.label}</Pill></td>
              <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{fmtWhen(r.sent_at ?? r.queued_at)}</td>
              <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{fmtWhen(latest)}</td>
              <td className="max-w-[16rem] truncate px-3 py-3 text-xs text-muted-foreground" title={r.error ?? ""}>{r.error ?? (r.attempts > 1 ? `Attempt ${r.attempts}` : "")}</td>
              <td className="px-3 py-3 text-right">{can && <button type="button" disabled={busy} onClick={() => void resend({ [r.campaign_id]: [r.id] })} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-nero/30 px-3 text-xs font-semibold hover:border-nero disabled:opacity-50"><RotateCcw className="size-3.5" />Resend</button>}</td>
            </tr>; })}
        </tbody>
      </table>
    </div>
    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
      <span>{count ? `Showing ${page * PAGE + 1} to ${Math.min(count, page * PAGE + PAGE)} of ${count}` : ""}{live ? " · updating live" : ""}</span>
      <span className="flex items-center gap-1"><button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="grid size-9 place-items-center rounded-full border border-black/15 bg-white disabled:opacity-40"><ChevronLeft className="size-4" /></button><span className="px-2">{page + 1} / {pages}</span><button type="button" aria-label="Next page" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)} className="grid size-9 place-items-center rounded-full border border-black/15 bg-white disabled:opacity-40"><ChevronRight className="size-4" /></button></span>
    </div>
  </div>;
}
