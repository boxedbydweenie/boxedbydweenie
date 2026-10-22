import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Copy, FileUp, ImagePlus, Monitor, Pause, Play, Rocket, Smartphone, Trash2, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { BASES, callMarketing, CAMPAIGN_STATUS, fmtWhen, pct, uploadEmailImage, type AudienceSummary, type Basis, type Campaign, type CampaignStats } from "@/lib/marketing";
import { Card, Pill, SendTable, StatTile } from "@/components/admin/EmailBits";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/campaigns/$id")({ component: Editor });

const TAGS = ["{{first_name}}", "{{last_name}}", "{{company}}", "{{unsubscribe_url}}"];
const DEFAULT_TESTS = "ibrahimdurosimi@gmail.com, hello@boxedbydweenie.com";
const field = "min-h-11 w-full rounded-md border border-black/15 bg-white px-3 text-sm focus:border-nero focus:outline-none focus:ring-2 focus:ring-gold/60";

function Editor() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [c, setC] = useState<Campaign | null>(null);
  const [missing, setMissing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<AudienceSummary | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [preview, setPreview] = useState<{ html: string; warnings: string[] } | null>(null);
  const [device, setDevice] = useState<"desktop" | "phone">("desktop");
  const [tests, setTests] = useState(DEFAULT_TESTS);
  const [testing, setTesting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [okUnverified, setOkUnverified] = useState(false);
  const [sending, setSending] = useState(false);
  const [imgBusy, setImgBusy] = useState(false);
  const [lastImg, setLastImg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const load = useCallback(async () => {
    const sb = supabase();
    const { data } = await sb.from("email_campaigns").select("*").eq("id", id).maybeSingle();
    if (!data) return setMissing(true);
    setC(data as Campaign);
    const s = await sb.rpc("email_campaign_stats");
    setStats(((s.data ?? []) as CampaignStats[]).find((x) => x.campaign_id === id) ?? null);
  }, [id]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { void supabase().rpc("marketing_audience_summary").then(({ data }) => { if (data) setSummary(data as AudienceSummary); }); }, []);

  const isDraft = c?.status === "draft";
  const live = c?.status === "sending";
  useEffect(() => { if (!live) return; const t = setInterval(() => void load(), 8000); return () => clearInterval(t); }, [live, load]);

  const patch = (p: Partial<Campaign>) => { setC((x) => (x ? { ...x, ...p } : x)); setDirty(true); };
  const audKey = JSON.stringify(c?.audience);
  useEffect(() => {
    if (!c || !isDraft) return;
    const t = setTimeout(() => { void supabase().rpc("audience_count", { p_audience: c.audience }).then(({ data }) => setCount(typeof data === "number" ? data : null)); }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audKey, isDraft]);

  // Live preview, rendered by the server so it is exactly what recipients get.
  const html = c?.html ?? ""; const pre = c?.preheader ?? "";
  useEffect(() => {
    if (!html.trim()) { setPreview(null); return; }
    const t = setTimeout(() => { void callMarketing<{ html: string; warnings: string[] }>("render", { html, preheader: pre }).then(setPreview).catch(() => undefined); }, 500);
    return () => clearTimeout(t);
  }, [html, pre]);

  const save = useCallback(async (quiet = false) => {
    if (!c) return null;
    setSaving(true);
    try {
      const r = await callMarketing<{ campaign: Campaign }>("campaign_save", { id: c.id, name: c.name, subject: c.subject, preheader: c.preheader, from_name: c.from_name, html: c.html, audience: c.audience });
      setC(r.campaign); setDirty(false); if (!quiet) toast.success("Saved.");
      return r.campaign;
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save."); return null; } finally { setSaving(false); }
  }, [c]);

  useEffect(() => { // gentle autosave
    if (!dirty || !isDraft) return;
    const t = setTimeout(() => void save(true), 2500);
    return () => clearTimeout(t);
  }, [dirty, isDraft, save, c]);
  useEffect(() => { const f = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); }; window.addEventListener("beforeunload", f); return () => window.removeEventListener("beforeunload", f); }, [dirty]);

  const readFile = async (f: File | undefined) => {
    if (!f) return;
    if (!/\.html?$/i.test(f.name) && f.type !== "text/html") return void toast.error("Please choose an .html file.");
    if (f.size > 400_000) return void toast.error("That file is over 400 KB. Large emails get clipped by Gmail. Please shrink it.");
    const text = await f.text();
    patch({ html: text });
    toast.success(`Loaded ${f.name}.`);
  };
  const addImage = async (f: File | undefined) => {
    if (!f) return;
    setImgBusy(true);
    try { const url = await uploadEmailImage(f); setLastImg(url); await navigator.clipboard?.writeText(url).catch(() => undefined); toast.success("Image uploaded. Link copied."); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed."); } finally { setImgBusy(false); }
  };

  const toggleBasis = (b: Basis) => {
    if (!c) return;
    const has = c.audience.bases.includes(b);
    patch({ audience: { ...c.audience, bases: has ? c.audience.bases.filter((x) => x !== b) : [...c.audience.bases, b] } });
    if (b === "unverified") setOkUnverified(false);
  };
  const toggleTag = (kind: "tags" | "exclude_tags", t: string) => {
    if (!c) return;
    const cur = c.audience[kind]; const other = kind === "tags" ? "exclude_tags" : "tags";
    patch({ audience: { ...c.audience, [kind]: cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t], [other]: c.audience[other].filter((x) => x !== t) } });
  };

  const sendTest = async () => {
    if (!c) return;
    const saved = dirty ? await save(true) : c; if (!saved) return;
    setTesting(true);
    try {
      const r = await callMarketing<{ results: { to: string; ok: boolean; error?: string }[] }>("test_send", { campaign_id: c.id, to: tests.split(/[\s,;]+/).filter(Boolean) });
      const ok = r.results.filter((x) => x.ok).length;
      if (ok) toast.success(`Test sent to ${ok} address${ok === 1 ? "" : "es"}. Check your inbox.`);
      r.results.filter((x) => !x.ok).forEach((x) => toast.error(`${x.to}: ${x.error ?? "failed"}`));
      await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Test failed."); } finally { setTesting(false); }
  };

  const doSend = async () => {
    if (!c || count == null) return;
    setSending(true);
    try {
      const r = await callMarketing<{ queued: number }>("campaign_send", { id: c.id, confirm_count: count, confirm_unverified: c.audience.bases.includes("unverified") ? okUnverified : undefined });
      toast.success(`Sending to ${r.queued} people. Emails go out in batches over the next minutes.`);
      setConfirmOpen(false); setTyped(""); await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not start the send."); } finally { setSending(false); }
  };
  const control = async (action: "campaign_pause" | "campaign_resume" | "campaign_cancel", msg: string) => {
    if (!c) return;
    if (action === "campaign_cancel" && !window.confirm("Cancel this campaign? Emails still waiting in the queue will not be sent.")) return;
    try { await callMarketing(action, { id: c.id }); toast.success(msg); await load(); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed."); }
  };
  const remove = async () => {
    if (!c || !window.confirm("Delete this draft for good?")) return;
    try { await callMarketing("campaign_delete", { id: c.id }); setDirty(false); void nav({ to: "/admin/campaigns" }); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed."); }
  };

  const unverified = c?.audience.bases.includes("unverified") ?? false;
  const checks = useMemo(() => !c ? [] : [
    { ok: !!c.subject.trim(), label: "Subject line written" },
    { ok: !!c.html.trim(), label: "Email HTML added" },
    { ok: c.audience.bases.length > 0 && (count ?? 0) > 0, label: count != null ? `${count.toLocaleString()} people will receive it` : "Audience chosen" },
    { ok: !!c.tested_at && !dirty, label: c.tested_at && !dirty ? "Test email sent" : "Send a test email" },
  ], [c, count, dirty]);
  const ready = checks.every((x) => x.ok);

  if (missing) return <div className="rounded-2xl bg-white p-10 text-center"><h1 className="text-3xl">Campaign not found</h1><Link to="/admin/campaigns" className="mt-4 inline-block underline">Back to campaigns</Link></div>;
  if (!c) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const st = CAMPAIGN_STATUS[c.status]!;
  const dlv = stats ? stats.delivered + stats.opened + stats.clicked : 0; const opn = stats ? stats.opened + stats.clicked : 0;

  return <div>
    <Link to="/admin/campaigns" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-nero"><ArrowLeft className="size-4" />All campaigns</Link>
    <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 flex-1"><p className="eyebrow text-[#8E6A10]">Campaign</p><div aria-hidden className="mt-3 h-px w-12 bg-gold" />
        {isDraft ? <input aria-label="Campaign name" value={c.name} onChange={(e) => patch({ name: e.target.value })} className="mt-3 w-full border-0 border-b-2 border-transparent bg-transparent font-heading text-4xl hover:border-black/10 focus:border-gold focus:outline-none md:text-5xl" /> : <h1 className="mt-4 text-4xl md:text-5xl">{c.name}</h1>}
      </div>
      <div className="flex items-center gap-3"><Pill cls={st.cls}>{st.label}</Pill>
        {isDraft && <><span className="text-xs text-muted-foreground" role="status">{saving ? "Saving…" : dirty ? "Unsaved changes" : "All changes saved"}</span>
          <button type="button" onClick={() => void save()} disabled={saving || !dirty} className="min-h-10 rounded-full border border-nero px-5 text-sm font-semibold hover:bg-nero hover:text-white disabled:opacity-40">Save</button>
          <button type="button" onClick={() => void remove()} aria-label="Delete draft" className="grid size-10 place-items-center rounded-full border border-black/15 text-[#83252C] hover:bg-[#FBE0DA]"><Trash2 className="size-4" /></button></>}
      </div>
    </div>

    {!isDraft && <div className="mt-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile tone="bg-[#E7B93B] text-nero" label="Recipients" value={stats?.total ?? c.total} />
        <StatTile tone="bg-[#263D35] text-[#F4EFE5]" label="Delivered" value={pct(dlv, stats?.total ?? 0)} />
        <StatTile tone="bg-[#EB826C] text-nero" label="Opened" value={pct(opn, dlv)} />
        <StatTile tone="bg-[#86BAA3] text-nero" label="Clicked" value={pct(stats?.clicked ?? 0, dlv)} />
        <StatTile tone="bg-[#192850] text-[#F4EFE5]" label="Bounced / failed" value={(stats?.bounced ?? 0) + (stats?.failed ?? 0)} />
      </div>
      {(c.status === "sending" || c.status === "paused") && stats && <Card title={c.status === "sending" ? "Sending now" : "Paused"} hint={`${stats.total - stats.queued} of ${stats.total} processed. Started ${fmtWhen(c.queued_at)}.`}>
        <div className="h-3 overflow-hidden rounded-full bg-black/5"><div className="h-full rounded-full bg-gradient-to-r from-[#E7B93B] to-[#EB826C] transition-all" style={{ width: `${stats.total ? Math.round(((stats.total - stats.queued) / stats.total) * 100) : 0}%` }} /></div>
        <div className="mt-4 flex flex-wrap gap-3">
          {c.status === "sending" ? <button type="button" onClick={() => void control("campaign_pause", "Paused.")} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-nero px-5 text-sm font-semibold"><Pause className="size-4" />Pause</button>
            : <button type="button" onClick={() => void control("campaign_resume", "Resumed.")} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-nero px-5 text-sm font-semibold text-white"><Play className="size-4" />Resume</button>}
          <button type="button" onClick={() => void control("campaign_cancel", "Cancelled.")} className="min-h-10 rounded-full border border-[#83252C]/40 px-5 text-sm font-semibold text-[#83252C]">Cancel campaign</button>
        </div></Card>}
      <Card title="Who got it" hint="Every email, with its status. Failed and soft-bounced emails can be resent."><SendTable campaignId={c.id} showCampaign={false} onChanged={() => void load()} /></Card>
      <Card title="What was sent"><dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Subject</dt><dd className="font-medium">{c.subject}</dd></div><div><dt className="text-muted-foreground">From</dt><dd className="font-medium">{c.from_name}</dd></div></dl></Card>
    </div>}

    {isDraft && <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <Card title="1. The basics" accent="from-[#E7B93B] to-[#EB826C]">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="text-sm font-semibold">Subject line</span><input className={cn(field, "mt-1.5")} value={c.subject} maxLength={200} onChange={(e) => patch({ subject: e.target.value })} placeholder="e.g. Gifts that say it better" /><span className="mt-1 block text-xs text-muted-foreground">{c.subject.length} characters. Around 40 to 60 reads best on a phone.</span></label>
            <label className="sm:col-span-2"><span className="text-sm font-semibold">Preview text <span className="font-normal text-muted-foreground">(the grey line beside the subject)</span></span><input className={cn(field, "mt-1.5")} value={c.preheader} maxLength={200} onChange={(e) => patch({ preheader: e.target.value })} placeholder="A short teaser that makes people open it" /></label>
            <label><span className="text-sm font-semibold">From name</span><input className={cn(field, "mt-1.5")} value={c.from_name} maxLength={60} onChange={(e) => patch({ from_name: e.target.value })} /><span className="mt-1 block text-xs text-muted-foreground">Sent from news@mail.boxedbydweenie.com. Replies go to hello@.</span></label>
          </div>
        </Card>

        <Card title="2. Your email" hint="Upload the HTML file you designed, or paste it below." accent="from-[#EB826C] to-[#86BAA3]">
          <div role="button" tabIndex={0} onClick={() => fileRef.current?.click()} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileRef.current?.click(); }}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); void readFile(e.dataTransfer.files[0]); }}
            className={cn("flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition", drag ? "border-gold bg-gold/10" : "border-black/20 bg-[#F4EFE5]/50 hover:border-nero/50")}>
            <FileUp className="size-8" /><p className="font-semibold">{c.html ? "Replace the HTML file" : "Drop your HTML file here"}</p><p className="text-sm text-muted-foreground">or click to choose one. {c.html ? `Currently ${(c.html.length / 1024).toFixed(1)} KB.` : ""}</p>
            <input ref={fileRef} type="file" accept=".html,.htm,text/html" className="sr-only" onChange={(e) => { void readFile(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personalise</span>
            {TAGS.map((t) => <button key={t} type="button" onClick={() => { void navigator.clipboard?.writeText(t); toast.success(`${t} copied. Paste it into your HTML.`); }} className="inline-flex min-h-8 items-center gap-1 rounded-full bg-[#F4EFE5] px-3 font-mono text-xs hover:bg-gold/40"><Copy className="size-3" />{t}</button>)}</div>
          <p className="mt-2 text-xs text-muted-foreground">{"{{unsubscribe_url}}"} is optional. If your file does not include it, we add a compliant footer with the unsubscribe link and our address automatically.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-[#F4EFE5]/60 p-3">
            <button type="button" onClick={() => imgRef.current?.click()} disabled={imgBusy} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-nero px-4 text-sm font-semibold disabled:opacity-50"><ImagePlus className="size-4" />{imgBusy ? "Uploading…" : "Upload an image for your email"}</button>
            <input ref={imgRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(e) => { void addImage(e.target.files?.[0]); e.target.value = ""; }} />
            {lastImg ? <button type="button" onClick={() => { void navigator.clipboard?.writeText(lastImg); toast.success("Link copied."); }} className="min-w-0 max-w-full truncate text-xs underline" title={lastImg}>{lastImg}</button> : <span className="text-xs text-muted-foreground">You get a link to use as the image src in your HTML. All your uploads live under Images.</span>}
          </div>
          <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold">Paste or edit the HTML</summary>
            <textarea value={c.html} onChange={(e) => patch({ html: e.target.value })} spellCheck={false} rows={12} className="mt-3 w-full rounded-md border border-black/15 bg-white p-3 font-mono text-xs" placeholder="<html>…</html>" /></details>
        </Card>

        <Card title="3. Who gets it" hint="Only active subscribers are ever emailed. Unsubscribed and bounced addresses are always left out." accent="from-[#86BAA3] to-[#192850]">
          <div className="space-y-2">
            {BASES.map((b) => { const on = c.audience.bases.includes(b.key); const n = summary?.bases?.[b.key];
              return <label key={b.key} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition", on ? "border-nero bg-[#F4EFE5]/60" : "border-black/10 hover:border-black/30")}>
                <input type="checkbox" checked={on} onChange={() => toggleBasis(b.key)} className="mt-1 size-4 accent-[var(--color-nero)]" />
                <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", b.dot)} />
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{b.label}</span><span className="block text-xs text-muted-foreground">{b.hint}</span></span>
                <span className="font-heading text-xl">{n != null ? n.toLocaleString() : ""}</span>
              </label>; })}
          </div>
          {unverified && <p className="mt-3 flex gap-2 rounded-lg bg-[#FBE0DA] p-3 text-sm text-[#83252C]"><TriangleAlert className="mt-0.5 size-4 shrink-0" />Bought or scraped addresses carry a high risk of spam complaints and bounces. That can damage the sending reputation for our order emails too. You will be asked to confirm before sending.</p>}
          {summary && Object.keys(summary.tags ?? {}).length > 0 && <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <TagPicker title="Only people tagged" tags={summary.tags} picked={c.audience.tags} onToggle={(t) => toggleTag("tags", t)} />
            <TagPicker title="Leave out people tagged" tags={summary.tags} picked={c.audience.exclude_tags} onToggle={(t) => toggleTag("exclude_tags", t)} />
          </div>}
          <p className="mt-5 rounded-xl bg-gold/20 p-4 font-heading text-2xl">{count == null ? "Counting…" : `${count.toLocaleString()} ${count === 1 ? "person" : "people"} will get this`}</p>
        </Card>

        <Card title="4. Preview" hint="Exactly what readers will see, including the footer we add." accent="from-[#192850] to-[#39243F]">
          <div className="mb-4 flex items-center gap-2">{([["desktop", Monitor, "Desktop"], ["phone", Smartphone, "Phone"]] as const).map(([k, I, l]) => <button key={k} type="button" aria-pressed={device === k} onClick={() => setDevice(k)} className={cn("inline-flex min-h-9 items-center gap-1.5 rounded-full border px-4 text-sm", device === k ? "border-nero bg-nero text-white" : "border-black/15 bg-white")}><I className="size-4" />{l}</button>)}</div>
          {preview?.warnings.length ? <ul className="mb-4 space-y-1.5">{preview.warnings.map((w) => <li key={w} className="flex gap-2 rounded-lg bg-[#F8EBB8] p-2.5 text-sm text-[#6B4D00]"><TriangleAlert className="mt-0.5 size-4 shrink-0" />{w}</li>)}</ul> : null}
          {preview ? <div className="rounded-xl bg-[#F4EFE5] p-4"><iframe title="Email preview" sandbox="" srcDoc={preview.html} className={cn("mx-auto block h-[36rem] rounded-lg border border-black/10 bg-white transition-all", device === "phone" ? "w-[22rem] max-w-full" : "w-full")} /></div>
            : <p className="rounded-xl bg-[#F4EFE5]/60 p-8 text-center text-sm text-muted-foreground">Add your HTML above and the preview appears here.</p>}
        </Card>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="space-y-5">
          <Card title="Test it" hint="Send yourself a copy first. Required before the real send." accent="from-[#E7B93B] to-[#EB826C]">
            <label className="text-sm font-semibold" htmlFor="tests">Send test to</label>
            <textarea id="tests" value={tests} onChange={(e) => setTests(e.target.value)} rows={3} className="mt-1.5 w-full rounded-md border border-black/15 bg-white p-2.5 text-sm" />
            <p className="mt-1 text-xs text-muted-foreground">Separate addresses with commas. Up to 5.</p>
            <button type="button" onClick={() => void sendTest()} disabled={testing || !c.subject.trim() || !c.html.trim()} className="mt-3 min-h-11 w-full rounded-full border border-nero text-sm font-semibold hover:bg-nero hover:text-white disabled:opacity-40">{testing ? "Sending…" : "Send test email"}</button>
          </Card>
          <Card title="Ready to send?" accent="from-[#86BAA3] to-[#263D35]">
            <ul className="space-y-2.5">{checks.map((k) => <li key={k.label} className="flex items-center gap-2.5 text-sm"><span className={cn("grid size-5 place-items-center rounded-full", k.ok ? "bg-[#86BAA3] text-nero" : "bg-black/10")}>{k.ok ? <Check className="size-3.5" /> : <X className="size-3 opacity-50" />}</span><span className={k.ok ? "" : "text-muted-foreground"}>{k.label}</span></li>)}</ul>
            <button type="button" disabled={!ready || dirty || saving} onClick={() => { setTyped(""); setOkUnverified(false); setConfirmOpen(true); }} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#E7B93B] to-[#EB826C] text-sm font-bold text-nero shadow-lg transition hover:-translate-y-0.5 disabled:opacity-40 disabled:shadow-none"><Rocket className="size-4" />Send campaign</button>
            {!ready && <p className="mt-2 text-xs text-muted-foreground">Finish the checklist to unlock sending. Any edit means a fresh test.</p>}
          </Card>
        </div>
      </aside>
    </div>}

    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DialogContent><DialogHeader><DialogTitle>Send to {count?.toLocaleString()} people?</DialogTitle><DialogDescription>“{c.subject}” goes out in batches over the next few minutes. Once started you can pause or cancel, but emails already sent cannot be recalled.</DialogDescription></DialogHeader>
        <label className="block text-sm font-semibold">Type {count} to confirm<input value={typed} onChange={(e) => setTyped(e.target.value)} inputMode="numeric" className={cn(field, "mt-1.5")} /></label>
        {unverified && <label className="flex gap-2 rounded-lg bg-[#FBE0DA] p-3 text-sm text-[#83252C]"><input type="checkbox" checked={okUnverified} onChange={(e) => setOkUnverified(e.target.checked)} className="mt-0.5 size-4" />I understand this includes unverified (bought or scraped) contacts and accept the risk.</label>}
        <DialogFooter><button type="button" onClick={() => setConfirmOpen(false)} className="min-h-11 rounded-full border border-black/20 px-5 text-sm">Not yet</button>
          <button type="button" disabled={sending || typed.trim() !== String(count) || (unverified && !okUnverified)} onClick={() => void doSend()} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-nero px-6 text-sm font-semibold text-white disabled:opacity-40"><Rocket className="size-4" />{sending ? "Starting…" : "Send now"}</button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}

function TagPicker({ title, tags, picked, onToggle }: { title: string; tags: Record<string, number>; picked: string[]; onToggle: (t: string) => void }) {
  return <div><p className="text-sm font-semibold">{title}</p><div className="mt-2 flex flex-wrap gap-2">{Object.entries(tags).sort((a, b) => b[1] - a[1]).map(([t, n]) => <button key={t} type="button" aria-pressed={picked.includes(t)} onClick={() => onToggle(t)} className={cn("min-h-8 rounded-full border px-3 text-xs transition", picked.includes(t) ? "border-nero bg-nero text-white" : "border-black/15 bg-white hover:border-black/40")}>{t} · {n}</button>)}</div></div>;
}
