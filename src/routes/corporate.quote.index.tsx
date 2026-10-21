import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronUp, Download, Sparkles, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { SiteShell } from "@/components/site/SiteShell";
import { Button, Eyebrow, GoldRule, LoadingButton } from "@/components/site/Brand";
import { PlaceholderTile } from "@/components/site/PlaceholderTile";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CORPORATE_PACKAGES } from "@/config/corporate";
import {
  BRANDING, BUDGET_FIT_TOLERANCE, BUDGET_MAX, BUDGET_MIN, BUDGET_STEP, DELIVERY_MODES, MAX_SELECTIONS, MIN_QUANTITY,
  PURPOSES, PURPOSE_ALIASES, QUANTITY_PICKS, QUOTE_LOCATIONS, QUOTE_VALIDITY_DAYS, UNIT_PRICE_RANGES,
} from "@/config/quoteRules";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getProducts } from "@/services/products";
import { calculateEstimate, clearDraft, getDraft, saveDraft, standardReadyDate, submitQuote } from "@/services/quotes";
import type { Estimate, QuotePurpose, QuoteRequest } from "@/types/quote";
import type { ShopProduct } from "@/types/shop";

const searchSchema = z.object({
  purpose: z.string().optional().catch(undefined),
  package: z.string().optional().catch(undefined),
  items: z.string().optional().catch(undefined),
  quantity: z.coerce.number().int().positive().optional().catch(undefined),
  budget: z.coerce.number().int().positive().optional().catch(undefined),
});

export const Route = createFileRoute("/corporate/quote/")({
  validateSearch: (s) => searchSchema.parse(s),
  loader: () => getProducts(),
  head: () => ({ meta: [
    { title: "Instant Corporate Quote — Boxed by Dweenie" },
    { name: "description", content: "See a live price estimate for staff, client and event gifts, then get a formal PDF quote and a gifting consultant." },
    { property: "og:title", content: "Instant Corporate Quote — Boxed by Dweenie" },
    { property: "og:description", content: "A live estimate for corporate gifts in under two minutes." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: QuoteBuilder,
});

const STEPS = ["Purpose", "Quantity", "Gifts", "Branding", "Delivery", "Details"];
const WHATSAPP = "https://wa.me/2348134907391";
const CSV_TEMPLATE = "data:text/csv;charset=utf-8," + encodeURIComponent("Full name,Phone,Address,City or area,State\n");
const fmtRange = (r: { low: number; high: number }) => (r.low === r.high ? formatNaira(r.low) : `${formatNaira(r.low)} to ${formatNaira(r.high)}`);

const blank = (): QuoteRequest => ({
  purpose: null, quantity: 100, budget: 40000, selections: [], branding: [], logoFileName: null,
  deliveryMode: "one-address", locations: ["Lagos"], requiredBy: "", recipientListFileName: null,
  contact: { name: "", company: "", email: "", phone: "", role: "", notes: "", consent: false },
});

type Errors = Partial<Record<"purpose" | "quantity" | "budget" | "selections" | "locations" | "requiredBy" | "name" | "company" | "email" | "phone" | "consent", string>>;
function validate(step: number, r: QuoteRequest): Errors {
  const e: Errors = {};
  if (step === 0 && !r.purpose) e.purpose = "Choose what the gifts are for.";
  if (step === 1) {
    if (!r.quantity || r.quantity < MIN_QUANTITY) e.quantity = `Enter at least ${MIN_QUANTITY} gifts.`;
    if (r.budget < BUDGET_MIN || r.budget > BUDGET_MAX) e.budget = `Choose between ${formatNaira(BUDGET_MIN)} and ${formatNaira(BUDGET_MAX)}.`;
  }
  if (step === 2 && r.selections.length === 0) e.selections = "Choose at least one starting point.";
  if (step === 4) {
    if (!r.locations.length) e.locations = "Choose at least one city or state.";
    if (!r.requiredBy) e.requiredBy = "Choose the date you need the gifts by.";
  }
  if (step === 5) {
    const c = r.contact;
    if (!c.name.trim()) e.name = "Enter your name.";
    if (!c.company.trim()) e.company = "Enter your company.";
    if (!z.string().email().safeParse(c.email.trim()).success) e.email = "Enter a valid work email.";
    if (c.phone.replace(/\D/g, "").length < 7) e.phone = "Enter a phone number.";
    if (!c.consent) e.consent = "Please agree so we can contact you.";
  }
  return e;
}

function QuoteBuilder() {
  const products = Route.useLoaderData() as ShopProduct[];
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [req, setReq] = useState<QuoteRequest>(() => {
    const r = blank();
    const purpose = search.purpose ? (PURPOSE_ALIASES[search.purpose] ?? search.purpose) : null;
    if (purpose && PURPOSES.some((p) => p.slug === purpose)) r.purpose = purpose as QuotePurpose;
    const pkg = CORPORATE_PACKAGES.find((p) => p.id === search.package);
    if (pkg) r.budget = Math.min(BUDGET_MAX, pkg.fromPrice);
    if (search.quantity) r.quantity = search.quantity;
    if (search.budget) r.budget = Math.min(BUDGET_MAX, Math.max(BUDGET_MIN, search.budget));
    if (search.items) r.selections = search.items.split(",").filter((id) => UNIT_PRICE_RANGES[id]).slice(0, MAX_SELECTIONS);
    return r;
  });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [estimateError, setEstimateError] = useState(false);
  const [draft, setDraft] = useState<Awaited<ReturnType<typeof getDraft>>>(null);
  const [sheet, setSheet] = useState(false);
  const [busy, setBusy] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => { getDraft().then((d) => { if (d && !search.purpose && !search.package && !search.items && !search.quantity) setDraft(d); }); }, [search.purpose, search.package, search.items, search.quantity]);
  useEffect(() => {
    let live = true;
    calculateEstimate(req).then((e) => { if (live) { setEstimate(e); setEstimateError(false); } }).catch(() => live && setEstimateError(true));
    return () => { live = false; };
  }, [req]);
  useEffect(() => () => { if (logoUrl) URL.revokeObjectURL(logoUrl); }, [logoUrl]);

  const set = (p: Partial<QuoteRequest>) => { setReq((r) => ({ ...r, ...p })); setErrors({}); };
  const setContact = (p: Partial<QuoteRequest["contact"]>) => { setReq((r) => ({ ...r, contact: { ...r.contact, ...p } })); setErrors({}); };
  const go = (n: number) => { setStep(n); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const next = () => { const e = validate(step, req); setErrors(e); if (!Object.keys(e).length) go(step + 1); };
  const submit = async () => {
    const e = validate(5, req); setErrors(e); if (Object.keys(e).length) return;
    setBusy(true);
    try { const q = await submitQuote(req); navigate({ to: "/corporate/quote/$ref", params: { ref: q.ref } }); }
    catch { setBusy(false); toast.error("We could not create your quote. Please try again or chat with us on WhatsApp."); }
  };
  const saveLater = async () => { await saveDraft(step, req); toast.success("Saved. Pick up where you left off on this device."); };

  const panel = <EstimatePanel estimate={estimate} error={estimateError} onSave={saveLater} quantity={req.quantity} />;

  return <SiteShell><main className="bg-paper pb-28 lg:pb-0">
    <section className="brand-pattern-green relative overflow-hidden text-on-dark">
      <div className="relative mx-auto max-w-7xl px-5 py-12 md:py-16">
        <Eyebrow dark>Instant quote</Eyebrow><GoldRule className="mt-4" />
        <h1 className="mt-5 text-4xl text-on-dark md:text-6xl">Build your corporate <span className="text-gold">gift quote</span></h1>
        <p className="mt-4 max-w-2xl text-on-dark-muted">See a live estimate as you go. Share your details at the end for a formal PDF quote and a dedicated gifting consultant.</p>
      </div>
    </section>

    <div className="sticky top-14 z-20 border-b border-border bg-paper/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-5 py-3">
        <div className="h-1 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuemin={1} aria-valuemax={6} aria-valuenow={step + 1} aria-label={`Step ${step + 1} of 6, ${STEPS[step]}`}><div className="h-full bg-gold transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
        <ol className="mt-2 hidden grid-cols-6 gap-2 text-xs sm:grid">{STEPS.map((s, i) => <li key={s} className={cn(i === step ? "font-semibold text-nero" : "text-muted-foreground")}>{i < step ? <button type="button" className="underline-offset-4 hover:underline" onClick={() => go(i)}>{i + 1}. {s}</button> : `${i + 1}. ${s}`}</li>)}</ol>
        <p className="mt-2 text-xs font-semibold sm:hidden">Step {step + 1} of 6 · {STEPS[step]}</p>
      </div>
    </div>

    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {draft && <div role="status" className="mb-8 flex flex-col gap-4 rounded-md border border-gold bg-ivory p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">You have a saved quote from {new Date(draft.savedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}. Pick up where you left off?</p>
          <div className="flex gap-2"><Button size="sm" onClick={() => { setReq(draft.request); setStep(draft.step); setDraft(null); }}>Restore</Button><Button size="sm" variant="ghost" onClick={() => { clearDraft(); setDraft(null); }}>Start fresh</Button></div>
        </div>}

        {step === 0 && <StepShell title="What is it for?" error={errors.purpose}>
          <div className="grid gap-3 sm:grid-cols-2">{PURPOSES.map((p) => <RadioCard key={p.slug} name="purpose" checked={req.purpose === p.slug} onChange={() => set({ purpose: p.slug })} title={p.name} line={p.line} />)}</div>
        </StepShell>}

        {step === 1 && <StepShell title="How many and how much?">
          <Label htmlFor="qty">Number of gifts</Label>
          <Input id="qty" type="number" inputMode="numeric" min={1} value={req.quantity || ""} onChange={(e) => set({ quantity: Math.max(0, Math.floor(Number(e.target.value))) })} aria-invalid={!!errors.quantity} className="mt-2 min-h-11 max-w-48 bg-paper" />
          <div className="mt-3 flex flex-wrap gap-2">{QUANTITY_PICKS.map((n) => <button key={n} type="button" onClick={() => set({ quantity: n })} aria-pressed={req.quantity === n} className={cn("min-h-11 rounded-full border px-4 text-sm transition-colors", req.quantity === n ? "border-nero bg-gold text-nero" : "border-border hover:border-nero")}>{n === 1000 ? "1,000+" : n.toLocaleString("en-NG")}</button>)}</div>
          {req.quantity > 0 && req.quantity < MIN_QUANTITY && <p className="mt-3 text-sm">For fewer than {MIN_QUANTITY} gifts, <Link to="/shop" className="font-semibold underline underline-offset-4">shop directly</Link>.</p>}
          {errors.quantity && <p className="mt-2 text-sm text-destructive">{errors.quantity}</p>}
          <div className="mt-8">
            <Label htmlFor="budget">Budget per recipient</Label>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Slider value={[req.budget]} onValueChange={([v]) => set({ budget: v ?? req.budget })} min={BUDGET_MIN} max={BUDGET_MAX} step={BUDGET_STEP} aria-label="Budget per recipient" className="flex-1" />
              <div className="relative max-w-44"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span><Input id="budget" inputMode="numeric" value={req.budget || ""} onChange={(e) => set({ budget: Number(e.target.value.replace(/\D/g, "")) })} aria-invalid={!!errors.budget} className="min-h-11 bg-paper pl-7" /></div>
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{formatNaira(BUDGET_MIN)}</span><span>{formatNaira(BUDGET_MAX)}</span></div>
            {errors.budget && <p className="mt-2 text-sm text-destructive">{errors.budget}</p>}
          </div>
          {req.quantity > 0 && <p className="mt-8 rounded-md bg-ivory p-4 text-sm" aria-live="polite"><span className="font-semibold">{req.quantity.toLocaleString("en-NG")} gifts</span> at about <span className="font-semibold">{formatNaira(req.budget)}</span> each</p>}
        </StepShell>}

        {step === 2 && <GiftsStep products={products} req={req} set={set} error={errors.selections} />}

        {step === 3 && <StepShell title="Make it yours">
          <div className="grid gap-3 sm:grid-cols-2">{BRANDING.map((b) => { const on = req.branding.includes(b.key); return <label key={b.key} className={cn("flex min-h-16 cursor-pointer items-center justify-between gap-4 rounded-md border p-4 transition-colors", on ? "border-nero bg-ivory" : "border-border hover:border-nero/50")}>
            <span><span className="block text-sm font-semibold">{b.name}</span><span className="text-xs text-muted-foreground">{formatNaira(b.perUnit)} per gift</span></span>
            <Switch checked={on} onCheckedChange={(v) => set({ branding: v ? [...req.branding, b.key] : req.branding.filter((k) => k !== b.key) })} aria-label={b.name} />
          </label>; })}</div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 sm:items-center">
            <div>
              <p className="text-sm font-semibold">Your logo</p>
              <p className="mt-1 text-xs text-muted-foreground">PNG, JPG or SVG. Your consultant will ask for a vector file later.</p>
              <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-nero px-4 text-sm font-semibold hover:bg-ivory focus-within:ring-2 focus-within:ring-ring">
                <Upload className="size-4" />{req.logoFileName ? "Replace logo" : "Upload logo"}
                <input type="file" accept="image/png,image/jpeg,image/svg+xml" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 5_000_000) { toast.error("Please upload a file under 5 MB."); return; } setLogoUrl(URL.createObjectURL(f)); set({ logoFileName: f.name }); }} />
              </label>
              {req.logoFileName && <p className="mt-2 truncate text-xs text-muted-foreground">{req.logoFileName}</p>}
            </div>
            <div className="relative" aria-label="Logo preview on a box lid">
              <PlaceholderTile tone="dark" label={logoUrl ? "" : "Your logo here"} className="aspect-[4/3] w-full" />
              <div className="pointer-events-none absolute inset-x-0 top-1/2 h-4 -translate-y-1/2 foil opacity-80" />
              {logoUrl && <div className="absolute inset-0 flex items-center justify-center"><div className="rounded-sm bg-paper/95 p-3 shadow-soft"><img src={logoUrl} alt="Your logo on the box lid" className="max-h-16 max-w-32 object-contain" /></div></div>}
            </div>
          </div>
        </StepShell>}

        {step === 4 && <StepShell title="Delivery">
          <div className="grid gap-3 sm:grid-cols-3">{DELIVERY_MODES.map((m) => <RadioCard key={m.slug} name="mode" checked={req.deliveryMode === m.slug} onChange={() => set({ deliveryMode: m.slug })} title={m.name} line={m.line} />)}</div>
          <fieldset className="mt-8"><legend className="text-sm font-semibold">Cities or states</legend>
            <div className="mt-3 flex flex-wrap gap-2">{QUOTE_LOCATIONS.map((l) => { const on = req.locations.includes(l); return <button key={l} type="button" aria-pressed={on} onClick={() => set({ locations: on ? req.locations.filter((x) => x !== l) : [...req.locations, l] })} className={cn("inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors", on ? "border-nero bg-gold text-nero" : "border-border hover:border-nero")}>{on && <Check className="size-4" />}{l}</button>; })}</div>
            {errors.locations && <p className="mt-2 text-sm text-destructive">{errors.locations}</p>}
          </fieldset>
          <div className="mt-8">
            <Label htmlFor="requiredBy">Required by</Label>
            <Input id="requiredBy" type="date" min={new Date().toISOString().slice(0, 10)} value={req.requiredBy} onChange={(e) => set({ requiredBy: e.target.value })} aria-invalid={!!errors.requiredBy} className="mt-2 min-h-11 w-auto bg-paper" />
            <p className="mt-2 text-xs text-muted-foreground">Standard lead time means we can deliver from {new Date(standardReadyDate() + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long" })}.</p>
            {errors.requiredBy && <p className="mt-2 text-sm text-destructive">{errors.requiredBy}</p>}
            {estimate?.rush && <div role="alert" className="mt-4 flex items-start gap-3 rounded-md border-2 border-gold bg-ivory p-4 text-sm"><AlertTriangle className="mt-0.5 size-5 shrink-0" />This is a rush order. An express surcharge applies.</div>}
          </div>
          {req.deliveryMode === "each-recipient" && <div className="mt-8 rounded-md border border-dashed border-border p-5">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-nero px-4 text-sm font-semibold hover:bg-ivory focus-within:ring-2 focus-within:ring-ring"><Upload className="size-4" />Upload recipient list (CSV)<input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => set({ recipientListFileName: e.target.files?.[0]?.name ?? null })} /></label>
            {req.recipientListFileName && <p className="mt-2 text-xs text-muted-foreground">{req.recipientListFileName}</p>}
            <p className="mt-3 text-sm"><a href={CSV_TEMPLATE} download="bbd-recipient-template.csv" className="inline-flex items-center gap-1 underline underline-offset-4"><Download className="size-4" />Download the template</a>. You can also send it to your consultant later.</p>
          </div>}
        </StepShell>}

        {step === 5 && <StepShell title="Your details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" id="name" value={req.contact.name} onChange={(v) => setContact({ name: v })} error={errors.name} autoComplete="name" />
            <Field label="Company" id="company" value={req.contact.company} onChange={(v) => setContact({ company: v })} error={errors.company} autoComplete="organization" />
            <Field label="Work email" id="email" type="email" value={req.contact.email} onChange={(v) => setContact({ email: v })} error={errors.email} autoComplete="email" />
            <Field label="Phone" id="phone" type="tel" value={req.contact.phone} onChange={(v) => setContact({ phone: v })} error={errors.phone} autoComplete="tel" />
            <Field label="Role (optional)" id="role" value={req.contact.role} onChange={(v) => setContact({ role: v })} autoComplete="organization-title" />
            <div className="sm:col-span-2"><Label htmlFor="notes">Notes (optional)</Label><Textarea id="notes" maxLength={1000} value={req.contact.notes} onChange={(e) => setContact({ notes: e.target.value })} className="mt-2 bg-paper" placeholder="Themes, colours, dietary needs, anything we should know" /></div>
          </div>
          <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm"><Checkbox checked={req.contact.consent} onCheckedChange={(v) => setContact({ consent: v === true })} className="mt-0.5" aria-invalid={!!errors.consent} /><span>I agree that Boxed by Dweenie may contact me about this quote. See our <Link to="/privacy" className="underline underline-offset-4">privacy policy</Link>.</span></label>
          {errors.consent && <p className="mt-2 text-sm text-destructive">{errors.consent}</p>}
        </StepShell>}

        <div className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-6">
          {step > 0 ? <Button variant="ghost" onClick={() => go(step - 1)}><ArrowLeft />Back</Button> : <span />}
          {step < 5 ? <Button size="lg" onClick={next}>Next<ArrowRight /></Button> : <LoadingButton size="lg" loading={busy} onClick={submit}>Get my quote</LoadingButton>}
        </div>
      </div>

      <aside className="hidden lg:block"><div className="sticky top-32">{panel}</div></aside>
    </div>

    <div data-bottom-bar className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-paper px-5 py-3 shadow-soft lg:hidden">
      <button type="button" onClick={() => setSheet(true)} className="flex min-h-12 w-full items-center justify-between gap-3 text-left" aria-label="Open your estimate">
        <span className="min-w-0"><span className="eyebrow block text-muted-foreground">Your estimate</span><span className="block truncate font-semibold">{estimateError ? "Unavailable" : estimate ? fmtRange(estimate.total) : "Calculating"}</span></span>
        <ChevronUp className="size-5 shrink-0" />
      </button>
    </div>
    <Sheet open={sheet} onOpenChange={setSheet}><SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-lg bg-paper"><SheetTitle className="sr-only">Your estimate</SheetTitle><SheetDescription className="sr-only">Live estimate breakdown</SheetDescription>{panel}</SheetContent></Sheet>
  </main></SiteShell>;
}

function StepShell({ title, error, children }: { title: string; error?: string | undefined; children: React.ReactNode }) {
  return <section className="animate-rise-in"><h2 className="text-2xl md:text-3xl">{title}</h2><GoldRule className="mb-8 mt-4" />{children}{error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}</section>;
}

function RadioCard({ name, checked, onChange, title, line }: { name: string; checked: boolean; onChange: () => void; title: string; line: string }) {
  return <label className={cn("flex min-h-16 cursor-pointer gap-3 rounded-md border p-4 transition-colors", checked ? "border-nero bg-ivory" : "border-border hover:border-nero/50")}>
    <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-1 size-4 shrink-0 accent-[var(--color-nero)]" />
    <span><span className="block text-sm font-semibold">{title}</span><span className="text-xs text-muted-foreground">{line}</span></span>
  </label>;
}

function Field({ label, id, value, onChange, error, type = "text", autoComplete }: { label: string; id: string; value: string; onChange: (v: string) => void; error?: string | undefined; type?: string; autoComplete?: string }) {
  return <div><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} maxLength={200} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} className="mt-2 min-h-11 bg-paper" />{error && <p className="mt-1 text-xs text-destructive">{error}</p>}</div>;
}

function GiftsStep({ products, req, set, error }: { products: ShopProduct[]; req: QuoteRequest; set: (p: Partial<QuoteRequest>) => void; error?: string | undefined }) {
  const options = useMemo(() => products.filter((p) => {
    const r = UNIT_PRICE_RANGES[p.id];
    if (!p.corporateEligible || !r) return false;
    return req.selections.includes(p.id) || (r.low <= req.budget * (1 + BUDGET_FIT_TOLERANCE) && r.high >= req.budget * (1 - BUDGET_FIT_TOLERANCE));
  }), [products, req.budget, req.selections]);
  const toggle = (id: string) => {
    if (req.selections.includes(id)) return set({ selections: req.selections.filter((x) => x !== id) });
    if (req.selections.length >= MAX_SELECTIONS) { toast.message(`You can choose up to ${MAX_SELECTIONS}.`); return; }
    set({ selections: [...req.selections, id] });
  };
  const Card = ({ id, title, line, children }: { id: string; title: string; line: string; children: React.ReactNode }) => {
    const on = req.selections.includes(id);
    return <button type="button" onClick={() => toggle(id)} aria-pressed={on} className={cn("relative rounded-md border-2 p-2 text-left transition-colors", on ? "border-nero" : "border-transparent hover:border-border")}>
      {on && <span className="absolute right-3 top-3 z-10 flex size-7 items-center justify-center rounded-full bg-gold text-nero"><Check className="size-4" /></span>}
      {children}<span className="mt-3 block text-sm font-semibold">{title}</span><span className="block text-xs text-muted-foreground">{line}</span>
    </button>;
  };
  return <StepShell title="Choose a starting point" error={error}>
    <p className="-mt-4 mb-6 text-sm text-muted-foreground">Pick up to {MAX_SELECTIONS}. Your consultant will refine the final mix. {req.selections.length}/{MAX_SELECTIONS} chosen.</p>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      <Card id="curate" title="Curate it for me" line={`Around ${formatNaira(req.budget)} each`}><div className="surface-dark flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 rounded-md border border-line-dark p-4 text-center"><Sparkles className="size-7 text-gold" /><span className="font-heading text-xs uppercase tracking-[0.2em] text-on-dark">Bespoke selection</span></div></Card>
      {options.map((p) => { const r = UNIT_PRICE_RANGES[p.id]!; return <Card key={p.id} id={p.id} title={p.name} line={fmtRange(r)}><PlaceholderTile label={p.name} className="aspect-[4/5] w-full" /></Card>; })}
    </div>
    {options.length === 0 && <p className="mt-6 text-sm text-muted-foreground">No ready-made boxes sit close to this budget. Choose “Curate it for me” and we will build one.</p>}
  </StepShell>;
}

function EstimatePanel({ estimate, error, onSave, quantity }: { estimate: Estimate | null; error: boolean; onSave: () => void; quantity: number }) {
  const wa = `${WHATSAPP}?text=${encodeURIComponent(`Hello, I am building a corporate quote for about ${quantity} gifts and would like to speak to a consultant.`)}`;
  return <div className="rounded-md border border-border bg-ivory p-6">
    <h2 className="text-lg">Your estimate</h2><GoldRule className="mt-3" />
    {error ? <div role="alert" className="mt-5 flex items-start gap-3 text-sm"><AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />We could not calculate an estimate right now. Check the quantity and budget, or talk to a consultant.</div>
      : !estimate ? <p className="mt-5 text-sm text-muted-foreground">Calculating</p>
      : <>
        <dl className="mt-5 space-y-3 text-sm" aria-live="polite">{estimate.lines.map((l) => <div key={l.label} className="flex justify-between gap-4"><dt><span className="block">{l.label}</span>{l.detail && <span className="text-xs text-muted-foreground">{l.detail}</span>}</dt><dd className="shrink-0 text-right">{l.negative && l.high > 0 ? "−" : ""}{fmtRange(l)}</dd></div>)}</dl>
        <div className="mt-5 border-t border-border pt-4"><p className="eyebrow text-muted-foreground">Estimated total</p><p className="mt-1 text-xl font-bold">{fmtRange(estimate.total)}</p></div>
      </>}
    <p className="mt-4 text-xs text-muted-foreground">Estimate only. Your consultant confirms the final quote. Valid for {QUOTE_VALIDITY_DAYS} days.</p>
    <div className="mt-5 grid gap-2"><Button variant="outline" onClick={onSave}>Save and continue later</Button><Button asChild variant="ghost"><a href={wa} target="_blank" rel="noreferrer">Talk to a consultant</a></Button></div>
  </div>;
}
