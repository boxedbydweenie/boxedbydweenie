import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Pencil, RefreshCw, Search, ShieldAlert, Upload, UserMinus, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { BASES, callMarketing, fmtWhen, guessMapping, parseCsv, type AudienceSummary, type Basis, type Contact, type FieldKey } from "@/lib/marketing";
import { Card, PageHead, Pill, StatTile } from "@/components/admin/EmailBits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/audience")({ component: Audience });

const PAGE = 50;
const SAMPLE = "email,first_name,last_name,company,tags\nada@example.com,Ada,Obi,Acme Ltd,vip\nbayo@example.com,Bayo,Ade,,event-2026\n";
const FIELDS: [FieldKey, string][] = [["email", "Email address"], ["first_name", "First name"], ["last_name", "Last name"], ["name", "Full name (we split it)"], ["company", "Company"], ["tags", "Tags (comma separated)"]];
const STATUS_CLS: Record<string, string> = { active: "bg-[#DDF0E6] text-[#1D5A3F]", unsubscribed: "bg-black/5 text-nero/60", bounced: "bg-[#FBE0DA] text-[#83252C]", complained: "bg-[#83252C] text-white" };
interface Imp { id: string; filename: string; basis: Basis; total_rows: number; added: number; updated: number; invalid: number; suppressed: number; created_at: string }

function Audience() {
  const [sum, setSum] = useState<AudienceSummary | null>(null);
  const [syncing, setSyncing] = useState(false);
  const loadSum = useCallback(async () => { const { data } = await supabase().rpc("marketing_audience_summary"); if (data) setSum(data as AudienceSummary); }, []);
  const sync = useCallback(async (quiet = true) => {
    setSyncing(true);
    try { const r = await callMarketing<{ changed: number }>("sync"); if (!quiet) toast.success(r.changed ? `${r.changed} new contacts pulled in from the site.` : "Already up to date."); await loadSum(); }
    catch (e) { if (!quiet) toast.error(e instanceof Error ? e.message : "Sync failed."); } finally { setSyncing(false); }
  }, [loadSum]);
  useEffect(() => { void loadSum(); void sync(true); }, [loadSum, sync]);
  const [version, setVersion] = useState(0);
  const refresh = () => { void loadSum(); setVersion((v) => v + 1); };

  return <div>
    <PageHead eyebrow="Email marketing" title="Audience" intro="Everyone you can email, where they came from, and who has opted out."
      actions={<button type="button" onClick={() => void sync(false)} disabled={syncing} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-nero px-5 text-sm font-semibold hover:bg-nero hover:text-white disabled:opacity-50"><RefreshCw className={cn("size-4", syncing && "animate-spin")} />Refresh from site</button>} />
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile tone="bg-[#E7B93B] text-nero" label="Can be emailed" value={sum?.active?.toLocaleString() ?? "…"} sub="active contacts" />
      <StatTile tone="bg-[#263D35] text-[#F4EFE5]" label="Total contacts" value={sum?.total?.toLocaleString() ?? "…"} />
      <StatTile tone="bg-[#EB826C] text-nero" label="Unsubscribed" value={sum?.unsubscribed ?? "…"} sub="always respected" />
      <StatTile tone="bg-[#83252C] text-white" label="Bounced / complained" value={sum ? sum.bounced + sum.complained : "…"} sub="suppressed for good" />
    </div>
    {sum && <Card className="mt-6" title="Where they came from" hint="Each contact keeps the strongest reason we have for emailing them.">
      <div className="flex h-4 overflow-hidden rounded-full bg-black/5">{BASES.map((b) => { const n = sum.bases?.[b.key] ?? 0; return n && sum.active ? <div key={b.key} className={b.dot} style={{ width: `${(n / sum.active) * 100}%` }} title={`${b.label}: ${n}`} /> : null; })}</div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{BASES.map((b) => <li key={b.key} className="flex items-center gap-2.5 text-sm"><span className={cn("size-2.5 rounded-full", b.dot)} /><span className="flex-1">{b.label}</span><b>{(sum.bases?.[b.key] ?? 0).toLocaleString()}</b></li>)}</ul>
      {Object.keys(sum.tags ?? {}).length > 0 && <div className="mt-5 flex flex-wrap gap-2">{Object.entries(sum.tags).sort((a, b) => b[1] - a[1]).map(([t, n]) => <span key={t} className="rounded-full bg-[#F4EFE5] px-3 py-1 text-xs">{t} · {n}</span>)}</div>}
    </Card>}
    <div className="mt-6"><AddContacts onDone={refresh} /></div>
    <div className="mt-6"><Importer onDone={refresh} /></div>
    <div className="mt-6"><Contacts version={version} onChanged={refresh} /></div>
    <div className="mt-6"><History version={version} /></div>
  </div>;
}

const EMAIL_RE = /[^\s,;<>"'()]+@[^\s,;<>"'()]+\.[^\s,;<>"'()]+/g;
interface NewRow { email: string; first_name: string; last_name: string; company: string; tags: string[] }

/** Turns pasted text into contacts. Accepts one address per line, "Ada Obi <ada@x.com>", "Ada Obi, ada@x.com, Acme Ltd", or many addresses separated by commas. */
function parsePasted(text: string): { rows: NewRow[]; invalid: number } {
  const seen = new Set<string>(); const rows: NewRow[] = []; let invalid = 0;
  const push = (r: NewRow) => { if (seen.has(r.email)) return; seen.add(r.email); rows.push(r); };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim(); if (!line) continue;
    const found = line.match(EMAIL_RE);
    if (!found) { invalid++; continue; }
    if (found.length > 1) { found.forEach((e) => push({ email: e.toLowerCase(), first_name: "", last_name: "", company: "", tags: [] })); continue; }
    const parts = line.replace(found[0]!, " ").replace(/[<>"']/g, " ").split(/[,;\t|]/).map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean);
    const [first = "", ...rest] = (parts[0] ?? "").split(" ");
    push({ email: found[0]!.toLowerCase(), first_name: first, last_name: rest.join(" "), company: parts[1] ?? "", tags: [] });
  }
  return { rows, invalid };
}

function AddContacts({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"one" | "paste">("one");
  const [f, setF] = useState({ email: "", first_name: "", last_name: "", company: "" });
  const [pasted, setPasted] = useState("");
  const [basis, setBasis] = useState<Basis | "">("");
  const [tags, setTags] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ added: number; updated: number; invalid: number; suppressed: number } | null>(null);
  const parsed = mode === "paste" ? parsePasted(pasted) : null;
  const rows: NewRow[] = mode === "one" ? (f.email.trim() ? [{ ...f, email: f.email.trim().toLowerCase(), tags: [] }] : []) : parsed!.rows;
  const picked = BASES.find((b) => b.key === basis);
  const input = "mt-1 min-h-11 w-full rounded-md border border-black/15 bg-white px-3 text-sm";

  const go = async () => {
    if (!basis || !rows.length) return;
    setBusy(true); setResult(null);
    const importId = crypto.randomUUID(); const total = { added: 0, updated: 0, invalid: 0, suppressed: 0 };
    try {
      const tagList = tags.split(",").map((x) => x.trim()).filter(Boolean);
      for (let i = 0; i < rows.length; i += 500) {
        const r = await callMarketing<typeof total>("import_chunk", { import_id: importId, filename: mode === "one" ? "Added by hand" : "Pasted list", basis, tags: tagList, rows: rows.slice(i, i + 500) });
        (Object.keys(total) as (keyof typeof total)[]).forEach((k) => { total[k] += r[k]; });
      }
      total.invalid += parsed?.invalid ?? 0;
      setResult(total); onDone();
      if (total.added + total.updated > 0) { toast.success(total.added + total.updated === 1 ? "Contact saved." : `${total.added + total.updated} contacts saved.`); setF({ email: "", first_name: "", last_name: "", company: "" }); setPasted(""); setOk(false); }
      else toast.error("Nothing was added. See the summary below.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save. Please try again."); onDone(); } finally { setBusy(false); }
  };

  return <Card title="Add contacts" hint="No CSV needed. Add one person, or paste a list of emails. Anyone who has unsubscribed or bounced is never brought back." accent="from-[#86BAA3] to-[#E7B93B]">
    <div className="inline-flex rounded-full border border-black/15 bg-white p-1 text-sm font-semibold" role="tablist">
      {([["one", "Add one person"], ["paste", "Paste a list"]] as const).map(([k, label]) => <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => { setMode(k); setResult(null); }} className={cn("min-h-9 rounded-full px-4", mode === k ? "bg-nero text-white" : "hover:bg-black/5")}>{label}</button>)}
    </div>
    {result && <div className="mt-5 grid gap-3 rounded-xl bg-[#DDF0E6] p-4 text-sm sm:grid-cols-4"><span><b className="font-heading text-2xl">{result.added}</b><br />new contacts</span><span><b className="font-heading text-2xl">{result.updated}</b><br />updated</span><span><b className="font-heading text-2xl">{result.suppressed}</b><br />skipped (opted out or bounced)</span><span><b className="font-heading text-2xl">{result.invalid}</b><br />not valid emails</span></div>}
    <div className="mt-5 space-y-5">
      {mode === "one" ? <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm sm:col-span-2"><span className="font-semibold">Email address</span><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="name@company.com" autoComplete="off" className={input} /></label>
        <label className="text-sm"><span className="font-semibold">First name</span><input value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} className={input} /></label>
        <label className="text-sm"><span className="font-semibold">Last name</span><input value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} className={input} /></label>
        <label className="text-sm sm:col-span-2"><span className="font-semibold">Company <span className="font-normal text-muted-foreground">(optional)</span></span><input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} className={input} /></label>
      </div> : <div>
        <label className="text-sm"><span className="font-semibold">Paste emails</span>
          <textarea value={pasted} onChange={(e) => setPasted(e.target.value)} rows={7} placeholder={"ada@company.com\nBayo Ade <bayo@company.com>\nChidi Eze, chidi@company.com, Acme Ltd"} className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 font-mono text-sm" /></label>
        <p className="mt-2 text-xs text-muted-foreground">One per line, or separated by commas. You can add a name (and company) on the same line.</p>
        {pasted.trim() && <p className="mt-2 text-sm"><b>{parsed!.rows.length}</b> valid {parsed!.rows.length === 1 ? "email" : "emails"} found{parsed!.invalid > 0 && <span className="text-[#83252C]"> · {parsed!.invalid} {parsed!.invalid === 1 ? "line" : "lines"} without an email will be skipped</span>}</p>}
      </div>}
      <div><p className="text-sm font-semibold">Where did {mode === "one" ? "this contact" : "these contacts"} come from?</p>
        <select value={basis} onChange={(e) => setBasis(e.target.value as Basis)} aria-label="Where did they come from" className="mt-1.5 min-h-11 w-full rounded-md border border-black/15 bg-white px-3 text-sm sm:max-w-md"><option value="">Choose one…</option>{BASES.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}</select>
        {picked && <p className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground"><span className={cn("size-2 rounded-full", picked.dot)} />{picked.hint}</p>}
        {basis === "unverified" && <p className="mt-3 flex gap-2 rounded-lg bg-[#FBE0DA] p-3 text-sm text-[#83252C]"><ShieldAlert className="mt-0.5 size-4 shrink-0" />Unverified contacts are left out of campaigns unless you tick them on purpose.</p>}
      </div>
      <label className="block text-sm"><span className="font-semibold">Tags <span className="font-normal text-muted-foreground">(optional, comma separated)</span></span><input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. banks, lagos-expo-2026" className={input} /></label>
      <label className="flex gap-3 rounded-xl bg-gold/20 p-4 text-sm"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-nero)]" /><span>I confirm I am allowed to email {mode === "one" ? "this person" : "these people"}, and that they can opt out at any time with the link in every email.</span></label>
      <button type="button" disabled={busy || !ok || !basis || !rows.length} onClick={() => void go()} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-nero px-8 text-sm font-semibold text-white shadow-lg disabled:opacity-40"><UserPlus className="size-4" />{busy ? "Saving…" : rows.length > 1 ? `Add ${rows.length.toLocaleString()} contacts` : "Add contact"}</button>
    </div>
  </Card>;
}

function EditContact({ c, onClose, onSaved }: { c: Contact; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ email: c.email, first_name: c.first_name ?? "", last_name: c.last_name ?? "", company: c.company ?? "" });
  const [busy, setBusy] = useState(false);
  const locked = c.status !== "active";
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  const save = async () => {
    setBusy(true);
    try { await callMarketing("contact_update", { id: c.id, ...f }); toast.success("Contact updated."); onSaved(); onClose(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not save."); } finally { setBusy(false); }
  };
  const input = "mt-1 min-h-11 w-full rounded-md border border-black/15 bg-white px-3 text-sm disabled:bg-black/5 disabled:text-muted-foreground";
  return <div className="fixed inset-0 z-50 grid place-items-center bg-nero/60 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div role="dialog" aria-modal="true" aria-labelledby="edit-contact-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4"><h2 id="edit-contact-title" className="font-heading text-2xl">Edit contact</h2><button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full border border-black/15 hover:bg-black/5"><X className="size-4" /></button></div>
      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); void save(); }}>
        <label className="text-sm sm:col-span-2"><span className="font-semibold">Email address</span><input type="email" required value={f.email} disabled={locked} onChange={(e) => setF({ ...f, email: e.target.value })} className={input} />
          {locked && <span className="mt-1 block text-xs text-muted-foreground">This contact has opted out or bounced, so the address is locked. Name and company can still be changed.</span>}</label>
        <label className="text-sm"><span className="font-semibold">First name</span><input autoFocus value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} className={input} /></label>
        <label className="text-sm"><span className="font-semibold">Last name</span><input value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} className={input} /></label>
        <label className="text-sm sm:col-span-2"><span className="font-semibold">Company</span><input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} className={input} /></label>
        <div className="mt-2 flex justify-end gap-3 sm:col-span-2"><button type="button" onClick={onClose} className="min-h-11 rounded-full border border-black/15 px-6 text-sm font-semibold hover:bg-black/5">Cancel</button><button type="submit" disabled={busy || !f.email.trim()} className="min-h-11 rounded-full bg-nero px-7 text-sm font-semibold text-white disabled:opacity-40">{busy ? "Saving…" : "Save changes"}</button></div>
      </form>
    </div>
  </div>;
}

function Importer({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<string>("");
  const [header, setHeader] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [map, setMap] = useState<Record<FieldKey, number> | null>(null);
  const [basis, setBasis] = useState<Basis | "">("");
  const [tags, setTags] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ added: number; updated: number; invalid: number; suppressed: number } | null>(null);
  const [drag, setDrag] = useState(false);

  const reset = () => { setFile(""); setHeader([]); setRows([]); setMap(null); setBasis(""); setTags(""); setOk(false); setProgress(0); };
  const read = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) return void toast.error("That file is over 25 MB. Please split it.");
    const all = parseCsv(await f.text());
    if (all.length < 2) return void toast.error("We could not find any rows. Save your sheet as CSV and try again.");
    const [h, ...r] = all; setResult(null); setFile(f.name); setHeader(h!); setRows(r); setMap(guessMapping(h!, r)); setOk(false);
  };
  const cell = (r: string[], k: FieldKey) => (map && map[k] >= 0 ? (r[map[k]] ?? "").trim() : "");
  const build = (r: string[]) => {
    let first = cell(r, "first_name"), last = cell(r, "last_name");
    const full = cell(r, "name"); if (!first && full) { const p = full.split(/\s+/); first = p[0] ?? ""; last = last || p.slice(1).join(" "); }
    return { email: cell(r, "email"), first_name: first, last_name: last, company: cell(r, "company"), tags: cell(r, "tags").split(/[,;|]/).map((x) => x.trim()).filter(Boolean) };
  };
  const emailOk = map && map.email >= 0;
  const go = async () => {
    if (!map || !basis) return;
    setBusy(true); setProgress(0);
    const importId = crypto.randomUUID(); const total = { added: 0, updated: 0, invalid: 0, suppressed: 0 };
    try {
      const data = rows.map(build); const SIZE = 500;
      for (let i = 0; i < data.length; i += SIZE) {
        const r = await callMarketing<typeof total>("import_chunk", { import_id: importId, filename: file, basis, tags: tags.split(",").map((x) => x.trim()).filter(Boolean), rows: data.slice(i, i + SIZE) });
        (Object.keys(total) as (keyof typeof total)[]).forEach((k) => { total[k] += r[k]; });
        setProgress(Math.min(100, Math.round(((i + SIZE) / data.length) * 100)));
      }
      setResult(total); reset(); onDone(); toast.success("Import finished.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Import stopped. Run it again, nothing is duplicated."); onDone(); } finally { setBusy(false); }
  };

  return <Card title="Upload contacts" hint="A CSV file with at least an email column. Anyone who has unsubscribed or bounced is never brought back by an upload." accent="from-[#EB826C] to-[#E7B93B]">
    {result && <div className="mb-5 grid gap-3 rounded-xl bg-[#DDF0E6] p-4 text-sm sm:grid-cols-4"><span><b className="font-heading text-2xl">{result.added}</b><br />new contacts</span><span><b className="font-heading text-2xl">{result.updated}</b><br />updated</span><span><b className="font-heading text-2xl">{result.suppressed}</b><br />skipped (opted out or bounced)</span><span><b className="font-heading text-2xl">{result.invalid}</b><br />invalid emails</span></div>}
    {!rows.length ? <>
      <div role="button" tabIndex={0} onClick={() => ref.current?.click()} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") ref.current?.click(); }} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); void read(e.dataTransfer.files[0]); }}
        className={cn("flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition", drag ? "border-gold bg-gold/10" : "border-black/20 bg-[#F4EFE5]/50 hover:border-nero/50")}>
        <Upload className="size-8" /><p className="font-semibold">Drop a CSV file here</p><p className="text-sm text-muted-foreground">or click to choose one</p>
        <input ref={ref} type="file" accept=".csv,text/csv,.txt" className="sr-only" onChange={(e) => { void read(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
      <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(SAMPLE)}`} download="sample-contacts.csv" className="mt-3 inline-flex items-center gap-1.5 text-sm underline"><Download className="size-4" />Download a sample file</a>
    </> : <div className="space-y-6">
      <p className="text-sm"><b>{file}</b> · {rows.length.toLocaleString()} rows <button type="button" onClick={reset} className="ml-2 underline">Choose another file</button></p>
      <div><h3 className="font-heading text-xl">1. Match your columns</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{FIELDS.map(([k, label]) => <label key={k} className="text-sm"><span className="font-semibold">{label}</span>
          <select value={map?.[k] ?? -1} onChange={(e) => setMap((m) => (m ? { ...m, [k]: Number(e.target.value) } : m))} className="mt-1 min-h-10 w-full rounded-md border border-black/15 bg-white px-2"><option value={-1}>Not in my file</option>{header.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}</select></label>)}</div>
        {!emailOk && <p className="mt-3 text-sm text-[#83252C]">Choose which column holds the email address.</p>}
        {emailOk && <div className="mt-4 overflow-x-auto rounded-xl border border-black/10"><table className="w-full min-w-[32rem] text-left text-xs"><thead className="bg-[#F4EFE5] uppercase tracking-wider"><tr><th className="px-3 py-2">Email</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Tags</th></tr></thead><tbody className="divide-y divide-black/5">{rows.slice(0, 5).map((r, i) => { const d = build(r); return <tr key={i}><td className="px-3 py-2">{d.email}</td><td className="px-3 py-2">{[d.first_name, d.last_name].filter(Boolean).join(" ")}</td><td className="px-3 py-2">{d.company}</td><td className="px-3 py-2">{d.tags.join(", ")}</td></tr>; })}</tbody></table></div>}
      </div>
      <div><h3 className="font-heading text-xl">2. Where did these contacts come from?</h3>
        <div className="mt-3 space-y-2">{BASES.map((b) => <label key={b.key} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-3.5", basis === b.key ? "border-nero bg-[#F4EFE5]/60" : "border-black/10 hover:border-black/30")}>
          <input type="radio" name="basis" checked={basis === b.key} onChange={() => setBasis(b.key)} className="mt-1 size-4 accent-[var(--color-nero)]" /><span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", b.dot)} /><span><span className="block text-sm font-semibold">{b.label}</span><span className="block text-xs text-muted-foreground">{b.hint}</span></span></label>)}</div>
        {basis === "unverified" && <p className="mt-3 flex gap-2 rounded-lg bg-[#FBE0DA] p-3 text-sm text-[#83252C]"><ShieldAlert className="mt-0.5 size-4 shrink-0" />These will be kept apart and left out of campaigns unless you tick them on purpose. Bought lists often hold old, wrong or trap addresses, so complaints and bounces are likely.</p>}
      </div>
      <label className="block text-sm"><span className="font-semibold">3. Tag this upload <span className="font-normal text-muted-foreground">(optional, comma separated)</span></span><input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. lagos-expo-2026, corporate" className="mt-1.5 min-h-11 w-full rounded-md border border-black/15 bg-white px-3" /></label>
      <label className="flex gap-3 rounded-xl bg-gold/20 p-4 text-sm"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-nero)]" /><span>I confirm I am allowed to email these people, and that they can opt out at any time with the link in every email.</span></label>
      {busy && <div><div className="h-2.5 overflow-hidden rounded-full bg-black/5"><div className="h-full rounded-full bg-gradient-to-r from-[#E7B93B] to-[#EB826C] transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-1 text-xs text-muted-foreground">Importing… {progress}%</p></div>}
      <button type="button" disabled={busy || !ok || !basis || !emailOk} onClick={() => void go()} className="min-h-12 rounded-full bg-nero px-8 text-sm font-semibold text-white shadow-lg disabled:opacity-40">{busy ? "Importing…" : `Import ${rows.length.toLocaleString()} rows`}</button>
    </div>}
  </Card>;
}

function Contacts({ version, onChanged }: { version: number; onChanged: () => void }) {
  const [rows, setRows] = useState<Contact[] | null>(null); const [count, setCount] = useState(0); const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [q, setQ] = useState(""); const [qd, setQd] = useState(""); const [status, setStatus] = useState("all"); const [basis, setBasis] = useState("all");
  useEffect(() => { const t = setTimeout(() => { setQd(q.trim()); setPage(0); }, 300); return () => clearTimeout(t); }, [q]);
  const load = useCallback(async () => {
    let qy = supabase().from("marketing_contacts").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
    if (status !== "all") qy = qy.eq("status", status); if (basis !== "all") qy = qy.eq("basis", basis);
    if (qd) { const s = qd.replace(/[%_,()]/g, ""); qy = qy.or(`email.ilike.%${s}%,first_name.ilike.%${s}%,last_name.ilike.%${s}%,company.ilike.%${s}%`); }
    const { data, count: c, error } = await qy; if (error) return void toast.error("Could not load contacts.");
    setRows(data as Contact[]); setCount(c ?? 0);
  }, [page, qd, status, basis]);
  useEffect(() => { void load(); }, [load, version]);
  const suppress = async (c: Contact, erase: boolean) => {
    if (!window.confirm(erase ? `Erase ${c.email}'s personal details? We keep the address only as a "do not email" record.` : `Stop emailing ${c.email}?`)) return;
    try { await callMarketing("contact_suppress", { id: c.id, erase }); toast.success(erase ? "Erased." : "Removed from marketing."); void load(); onChanged(); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed."); }
  };
  const pages = Math.max(1, Math.ceil(count / PAGE)); const sel = "min-h-10 rounded-md border border-black/15 bg-white px-2 text-sm";
  return <Card title="Contacts" accent="from-[#86BAA3] to-[#192850]">
    <div className="flex flex-wrap items-center gap-3">
      <label className="relative min-w-[14rem] flex-1 sm:max-w-xs"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, company" aria-label="Search contacts" className="min-h-10 w-full rounded-md border border-black/15 bg-white pl-9 pr-3 text-sm" /></label>
      <select aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} className={sel}><option value="all">Any status</option><option value="active">Active</option><option value="unsubscribed">Unsubscribed</option><option value="bounced">Bounced</option><option value="complained">Complained</option></select>
      <select aria-label="Source" value={basis} onChange={(e) => { setBasis(e.target.value); setPage(0); }} className={sel}><option value="all">Any source</option>{BASES.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}</select>
    </div>
    <div className="mt-4 overflow-x-auto rounded-xl border border-black/10"><table className="w-full min-w-[44rem] text-left text-sm"><thead className="bg-[#F4EFE5] text-xs uppercase tracking-wider text-nero/70"><tr><th className="px-3 py-3">Contact</th><th className="px-3 py-3">Source</th><th className="px-3 py-3">Tags</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Added</th><th className="w-36 px-3 py-3" /></tr></thead>
      <tbody className="divide-y divide-black/5">
        {!rows && <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Loading…</td></tr>}
        {rows?.length === 0 && <tr><td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">No contacts match.</td></tr>}
        {rows?.map((c) => { const b = BASES.find((x) => x.key === c.basis); return <tr key={c.id} className="hover:bg-[#FBF8F1]">
          <td className="px-3 py-3"><span className="font-medium">{c.email}</span><span className="block text-xs text-muted-foreground">{[[c.first_name, c.last_name].filter(Boolean).join(" "), c.company].filter(Boolean).join(" · ")}</span></td>
          <td className="px-3 py-3"><span className="inline-flex items-center gap-2 text-xs"><span className={cn("size-2 rounded-full", b?.dot)} />{b?.label}</span></td>
          <td className="max-w-[12rem] px-3 py-3 text-xs text-muted-foreground">{c.tags.join(", ")}</td>
          <td className="px-3 py-3"><Pill cls={STATUS_CLS[c.status] ?? ""}>{c.status}</Pill></td>
          <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">{fmtWhen(c.created_at)}</td>
          <td className="px-3 py-3 text-right"><span className="inline-flex gap-1"><button type="button" onClick={() => setEditing(c)} aria-label={`Edit ${c.email}`} title="Edit contact" className="grid size-8 place-items-center rounded-full border border-black/15 hover:bg-black/5"><Pencil className="size-4" /></button>{c.status !== "bounced" && c.status !== "complained" && <>{c.status === "active" && <button type="button" onClick={() => void suppress(c, false)} aria-label={`Stop emailing ${c.email}`} title="Stop emailing" className="grid size-8 place-items-center rounded-full border border-black/15 hover:bg-black/5"><UserMinus className="size-4" /></button>}<button type="button" onClick={() => void suppress(c, true)} className="min-h-8 rounded-full border border-black/15 px-2.5 text-xs hover:bg-[#FBE0DA]">Erase</button></>}</span></td></tr>; })}
      </tbody></table></div>
    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground"><span>{count ? `${page * PAGE + 1} to ${Math.min(count, page * PAGE + PAGE)} of ${count.toLocaleString()}` : ""}</span>
      <span className="flex items-center gap-1"><button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="grid size-9 place-items-center rounded-full border border-black/15 bg-white disabled:opacity-40"><ChevronLeft className="size-4" /></button><span className="px-2">{page + 1} / {pages}</span><button type="button" aria-label="Next page" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)} className="grid size-9 place-items-center rounded-full border border-black/15 bg-white disabled:opacity-40"><ChevronRight className="size-4" /></button></span></div>
    {editing && <EditContact c={editing} onClose={() => setEditing(null)} onSaved={() => { void load(); onChanged(); }} />}
  </Card>;
}

function History({ version }: { version: number }) {
  const [rows, setRows] = useState<Imp[] | null>(null);
  useEffect(() => { void supabase().from("marketing_imports").select("*").order("created_at", { ascending: false }).limit(20).then(({ data }) => setRows((data ?? []) as Imp[])); }, [version]);
  if (!rows?.length) return null;
  return <Card title="Upload history" accent="from-[#192850] to-[#39243F]"><ul className="divide-y divide-black/5 text-sm">{rows.map((r) => <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3"><span><b>{r.filename}</b> <span className="text-muted-foreground">· {BASES.find((b) => b.key === r.basis)?.label} · {fmtWhen(r.created_at)}</span></span><span className="text-xs text-muted-foreground">{r.total_rows} rows · {r.added} new · {r.updated} updated · {r.suppressed} skipped · {r.invalid} invalid</span></li>)}</ul></Card>;
}
