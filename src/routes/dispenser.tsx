import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, RefreshCw, Shuffle, SlidersHorizontal, Store } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { SiteShell } from "@/components/site/SiteShell";
import { Button, LoadingButton } from "@/components/site/Brand";
import { PlaceholderTile } from "@/components/site/PlaceholderTile";
import { BowTie } from "@/components/shop/BowTie";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { DISPENSE_DURATION_MS, DISPENSER_BUDGETS, DISPENSER_OCCASIONS, DISPENSER_RECIPIENTS } from "@/config/dispenser";
import { STATES, deliveryFeeFor, earliestDelivery, toIso } from "@/config/delivery";
import { GIFT_NOTE_LIMIT, SAME_DAY_CUTOFF_HOUR } from "@/config/shop";
import { formatDayMonth, formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getPicks, randomAnswers, type DispenserAnswers, type Pick } from "@/services/dispenser";
import { createOrder } from "@/services/orders";
import type { Order, ShopProduct } from "@/types/shop";

const searchSchema = z.object({
  who: z.string().optional().catch(undefined),
  occasion: z.string().optional().catch(undefined),
  budget: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/dispenser")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [
    { title: "Gift Dispenser: Gift in 60 Seconds — Boxed by Dweenie" },
    { name: "description", content: "Tell us three things and our Gift Dispenser serves three well-matched luxury gifts. Choose one and send it in under a minute." },
    { property: "og:title", content: "Gift in 60 Seconds — Boxed by Dweenie" },
    { property: "og:description", content: "Three taps, three beautifully matched gifts, sent in under a minute." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: DispenserPage,
});

type Phase = "intro" | "who" | "occasion" | "budget" | "dispensing" | "picks" | "done";
const QUESTIONS = [
  { key: "who" as const, title: "Who is it for?", options: DISPENSER_RECIPIENTS },
  { key: "occasion" as const, title: "What is the occasion?", options: DISPENSER_OCCASIONS },
  { key: "budget" as const, title: "What is your budget?", options: DISPENSER_BUDGETS },
];
const valid = (key: keyof DispenserAnswers, v?: string) => !!v && QUESTIONS.find((q) => q.key === key)!.options.some((o) => o.slug === v);

/* ---------- Machine ---------- */

function MachineWindow({ glow }: { glow: boolean }) {
  return <svg viewBox="0 0 300 150" className="mx-auto block h-auto max-h-28 w-full sm:max-h-none" role="img" aria-label="Gift vending machine window with rows of gold-bowed boxes">
    <defs>
      <linearGradient id="foil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#C79A26" /><stop offset=".5" stopColor="#F2D57E" /><stop offset="1" stopColor="#E7B93B" /></linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F4EFE5" stopOpacity=".10" /><stop offset=".5" stopColor="#F4EFE5" stopOpacity=".02" /><stop offset="1" stopColor="#F4EFE5" stopOpacity=".08" /></linearGradient>
    </defs>
    <rect x="1" y="1" width="298" height="148" rx="6" fill="#1f1e1e" stroke="url(#foil)" strokeWidth="1.5" />
    {[0, 1, 2].map((row) => <g key={row}>
      <line x1="12" x2="288" y1={48 + row * 46} y2={48 + row * 46} stroke="url(#foil)" strokeWidth=".8" opacity=".6" />
      {[0, 1, 2, 3, 4].map((col) => {
        const x = 22 + col * 54, y = 18 + row * 46;
        const dark = (row + col) % 2 === 0;
        return <g key={col} className={glow && row === 2 && col === 2 ? "opacity-30 transition-opacity duration-500" : ""}>
          <rect x={x} y={y} width="36" height="28" rx="2" fill={dark ? "#292828" : "#F4EFE5"} stroke="url(#foil)" strokeWidth=".8" />
          <rect x={x + 16} y={y} width="4" height="28" fill="url(#foil)" />
          <path d={`M${x + 18} ${y + 2} q-9 -9 -12 -1 q3 6 12 1 q9 -9 12 -1 q-3 6 -12 1`} fill="none" stroke="url(#foil)" strokeWidth="1.2" />
        </g>;
      })}
    </g>)}
    <rect x="1" y="1" width="298" height="148" rx="6" fill="url(#glass)" />
    <path d="M30 6 L70 6 L20 144 L6 144 Z" fill="#F4EFE5" opacity=".04" />
  </svg>;
}

function TrayBox({ dropping }: { dropping: boolean }) {
  return <div className={cn("relative mx-auto h-14 w-16", dropping ? "animate-box-drop" : "")} aria-hidden>
    <div className="absolute inset-x-0 bottom-0 h-10 rounded-sm border border-gold/60 bg-nero" />
    <div className="foil absolute bottom-0 left-1/2 h-10 w-1.5 -translate-x-1/2" />
    <div className={cn("absolute left-1/2 top-0.5 h-5 w-7 -translate-x-full rounded-[50%_10%_50%_50%] border-2 border-gold", dropping && "animate-bow-untie-l")} />
    <div className={cn("absolute left-1/2 top-0.5 h-5 w-7 rounded-[10%_50%_50%_50%] border-2 border-gold", dropping && "animate-bow-untie-r")} />
  </div>;
}

function Machine({ glow, dropping, hideWindowOnMobile, children }: { glow: boolean; dropping: boolean; hideWindowOnMobile?: boolean; children: React.ReactNode }) {
  return <div className="relative mx-auto w-full max-w-xl rounded-lg border border-gold/50 bg-nero p-3 shadow-brand sm:p-4">
    <div className="foil absolute inset-x-6 top-0 h-px" />
    <div className={cn(hideWindowOnMobile && "hidden sm:block")}><MachineWindow glow={glow} /></div>
    <div className={cn("mt-3 rounded-md border border-line-dark bg-nero-soft p-4 transition-shadow duration-500 sm:p-5", glow && "border-gold animate-panel-glow")}>{children}</div>
    <div className="mt-3 flex h-16 items-end sm:h-20 justify-center overflow-hidden rounded-md border border-line-dark bg-nero pb-2" aria-label="Collection tray">
      {(dropping || glow) ? <TrayBox dropping={dropping} /> : <span className="eyebrow mb-4 text-on-dark-muted sm:mb-5">Collect here</span>}
    </div>
    <div className="mx-auto mt-2 h-1.5 w-2/3 rounded-full foil opacity-70" />
  </div>;
}

function TimerRing({ seconds }: { seconds: number }) {
  const pct = (seconds % 60) / 60;
  const c = 2 * Math.PI * 16;
  return <div className="pointer-events-none absolute right-4 top-4 flex size-12 items-center justify-center" aria-hidden>
    <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90"><circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" className="text-line-dark" strokeWidth="2" /><circle cx="20" cy="20" r="16" fill="none" stroke="#E7B93B" strokeWidth="2" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" className="transition-[stroke-dashoffset] duration-1000 ease-linear" /></svg>
    <span className="text-[10px] font-semibold text-on-dark-muted">{seconds}s</span>
  </div>;
}

/* ---------- Page ---------- */

function DispenserPage() {
  const search = Route.useSearch();
  const startRef = useRef<number>(0);
  const [seconds, setSeconds] = useState(0);
  const [answers, setAnswers] = useState<Partial<DispenserAnswers>>(() => ({
    ...(search.who && valid("who", search.who) ? { who: search.who } : {}),
    ...(search.occasion && valid("occasion", search.occasion) ? { occasion: search.occasion } : {}),
    ...(search.budget && valid("budget", search.budget) ? { budget: search.budget } : {}),
  }));
  const firstMissing = (a: Partial<DispenserAnswers>): Phase => (QUESTIONS.find((q) => !a[q.key])?.key ?? "dispensing");
  const [phase, setPhase] = useState<Phase>(() => (Object.keys(answers).length ? firstMissing(answers) : "intro"));
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<{ picks: Pick[]; restocking: boolean } | null>(null);
  const [sending, setSending] = useState<ShopProduct | null>(null);
  const [order, setOrder] = useState<{ order: Order; seconds: number } | null>(null);

  useEffect(() => {
    startRef.current = Date.now();
    const t = setInterval(() => setSeconds(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const dispense = useCallback(async (a: DispenserAnswers, r: number) => {
    setPhase("dispensing");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const [res] = await Promise.all([getPicks(a, r), new Promise((ok) => setTimeout(ok, reduce ? 500 : DISPENSE_DURATION_MS))]);
    setResult(res);
    setPhase("picks");
  }, []);

  useEffect(() => {
    if (phase === "dispensing" && !result && answers.who && answers.occasion && answers.budget) dispense(answers as DispenserAnswers, round);
    // run once on mount when arriving with all answers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const answer = (key: keyof DispenserAnswers, value: string) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    const idx = QUESTIONS.findIndex((q) => q.key === key);
    const following = QUESTIONS.slice(idx + 1).find((q) => !next[q.key]);
    if (following) setPhase(following.key);
    else { setResult(null); dispense(next as DispenserAnswers, round); }
  };
  const back = () => {
    const idx = QUESTIONS.findIndex((q) => q.key === phase);
    setPhase(idx > 0 ? QUESTIONS[idx - 1]!.key : "intro");
  };
  const surprise = () => { const a = randomAnswers(); setAnswers(a); setResult(null); dispense(a, round); };
  const again = () => { const r = round + 1; setRound(r); setResult(null); dispense(answers as DispenserAnswers, r); };
  const change = () => { setAnswers({}); setResult(null); setPhase("who"); };

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [phase]);
  const q = QUESTIONS.find((x) => x.key === phase);
  const qIndex = QUESTIONS.findIndex((x) => x.key === phase);
  const shopSearch = {
    ...(answers.occasion && answers.occasion !== "just-because" ? { occasion: answers.occasion } : {}),
    ...(answers.budget ? { budget: answers.budget } : {}),
    ...(() => { const m = DISPENSER_RECIPIENTS.find((r) => r.slug === answers.who)?.matches; return m && m.length === 1 ? { recipient: m[0] } : {}; })(),
  };

  return <SiteShell><main className="surface-dark relative overflow-hidden">
    <div className="pattern-leaf absolute inset-0 opacity-[0.04]" />
    <TimerRing seconds={seconds} />
    <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-5 sm:py-10">
      {phase !== "picks" && phase !== "done" && <Machine glow={phase === "dispensing"} dropping={phase === "dispensing"}>
        {phase === "intro" && <div className="text-center">
          <p className="eyebrow text-gold">Gift Dispenser</p>
          <h1 className="mt-3 text-2xl text-on-dark sm:text-3xl">Gift in 60 seconds</h1>
          <p className="mt-3 text-on-dark-muted">Tell us three things. We'll do the rest.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2"><Button size="lg" onClick={() => setPhase("who")}>Start</Button><Button size="lg" variant="outline" className="text-on-dark" onClick={surprise}><Shuffle />Surprise me</Button></div>
        </div>}

        {q && <div>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" className="-ml-2 text-on-dark" onClick={back} aria-label="Back"><ArrowLeft /></Button>
            <div className="flex gap-2" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={qIndex + 1} aria-label={`Question ${qIndex + 1} of 3`}>{QUESTIONS.map((x, i) => <span key={x.key} className={cn("size-2.5 rounded-full transition-colors duration-300", i <= qIndex ? "bg-gold" : "bg-line-dark")} />)}</div>
            <span className="w-11" />
          </div>
          <h2 className="mt-2 text-center text-lg text-on-dark sm:text-2xl">{q.title}</h2>
          <div key={q.key} className={cn("mt-4 grid animate-rise-in gap-2 sm:gap-3", q.key === "budget" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-4")}>
            {q.options.map((o) => <button key={o.slug} type="button" onClick={() => answer(q.key, o.slug)} aria-pressed={answers[q.key] === o.slug} className={cn("min-h-11 rounded-md border px-3 text-sm font-semibold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:min-h-14", answers[q.key] === o.slug ? "border-gold bg-gold text-nero" : "border-line-dark text-on-dark hover:border-gold")}>{o.name}</button>)}
          </div>
        </div>}

        {phase === "dispensing" && <div className="py-4 text-center" role="status" aria-live="polite"><p className="eyebrow text-gold">Dispensing</p><p className="mt-3 text-on-dark-muted">Choosing three gifts worth a wow.</p></div>}
      </Machine>}

      {phase === "picks" && result && <section aria-labelledby="picks-title">
        <div className="px-12 text-center"><p className="eyebrow text-gold">Freshly dispensed</p><h1 id="picks-title" className="mt-2 text-2xl text-on-dark sm:text-3xl">Your three picks</h1>
          {result.restocking && <p className="mt-3 text-sm text-on-dark-muted">The machine is restocking. Here are our bestsellers instead.</p>}</div>
        <div className="-mx-4 mt-4 flex snap-x snap-mandatory sm:mt-6 gap-4 overflow-x-auto px-4 pb-3 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
          {result.picks.map((p, i) => <PickCard key={p.product.id} pick={p} index={i} onSend={() => setSending(p.product)} />)}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1 sm:mt-5 sm:flex sm:flex-wrap sm:justify-center sm:gap-2">
          <Button variant="outline" size="sm" className="whitespace-normal text-on-dark" onClick={again}><RefreshCw />Dispense again</Button>
          <Button variant="ghost" size="sm" className="whitespace-normal text-on-dark" onClick={change}><SlidersHorizontal />Change my answers</Button>
          <Button asChild variant="ghost" size="sm" className="whitespace-normal text-on-dark"><Link to="/shop" search={shopSearch}><Store />See all matching gifts</Link></Button>
        </div>
      </section>}

      {phase === "done" && order && <section className="mx-auto max-w-lg py-6 text-center" aria-live="polite">
        <BowTie />
        <p className="eyebrow mt-6 text-gold">Sent</p>
        <h1 className="mt-3 text-2xl text-on-dark sm:text-4xl">Done in {order.seconds} seconds</h1>
        <p className="mt-4 text-on-dark-muted">Order <span className="font-semibold text-on-dark">{order.order.id}</span> is being boxed for {order.order.recipient.name}, arriving {formatDayMonth(order.order.recipient.deliveryDate)}.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3"><Button asChild><Link to="/order/$id" params={{ id: order.order.id }}>Track this order</Link></Button><Button variant="outline" className="text-on-dark" onClick={change}>Send another</Button></div>
      </section>}
    </div>

    <ExpressSheet product={sending} onClose={() => setSending(null)} onDone={(o) => { setSending(null); setOrder({ order: o, seconds: Math.max(1, Math.round((Date.now() - startRef.current) / 1000)) }); setPhase("done"); window.scrollTo({ top: 0 }); }} />
  </main></SiteShell>;
}

function PickCard({ pick, index, onSend }: { pick: Pick; index: number; onSend: () => void }) {
  const p = pick.product;
  const earliest = earliestDelivery(p.sameDay);
  const today = earliest === toIso(new Date());
  return <article className="flex w-[78vw] max-w-xs shrink-0 snap-center animate-slide-up-in flex-col rounded-md border border-line-dark bg-nero-soft p-3 md:w-auto md:max-w-none" style={{ animationDelay: `${index * 120}ms` }}>
    <div className="relative"><PlaceholderTile label={p.name} className="aspect-[16/9] w-full md:aspect-[5/4]" /><span className="absolute left-2 top-2 rounded-sm bg-gold px-2 py-1 text-[10px] font-bold uppercase text-nero">{pick.label}</span></div>
    <h3 className="mt-3 text-sm text-on-dark">{p.name}</h3>
    <p className="mt-1 font-semibold text-on-dark">{formatNaira(p.price)}</p>
    <ul className="mt-2 space-y-0.5 text-xs text-on-dark-muted">{p.inside.slice(0, 3).map((i) => <li key={i}>· {i}</li>)}</ul>
    <p className="mt-2 text-xs text-gold">{today ? "Arrives today in Lagos" : `Arrives from ${formatDayMonth(earliest)}`}</p>
    <Button className="mt-3 w-full" onClick={onSend}>Send this one</Button>
  </article>;
}

/* ---------- Express send ---------- */

const PAYMENTS: { slug: Order["payment"]; name: string }[] = [{ slug: "card", name: "Card" }, { slug: "transfer", name: "Bank transfer" }, { slug: "ussd", name: "USSD" }];

function ExpressSheet({ product, onClose, onDone }: { product: ShopProduct | null; onClose: () => void; onDone: (o: Order) => void }) {
  const mobile = useIsMobile();
  const [state, setState] = useState("Lagos");
  const [date, setDate] = useState("");
  const [payment, setPayment] = useState<Order["payment"]>("card");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const todayIso = toIso(new Date());
  const sameDayOk = !!product?.sameDay && state === "Lagos" && new Date().getHours() < SAME_DAY_CUTOFF_HOUR;
  const earliest = sameDayOk ? todayIso : earliestDelivery(false);
  useEffect(() => { if (product) { setDate(earliest); setError(""); setNote(""); } }, [product, earliest]);
  const fee = deliveryFeeFor(state);
  const total = (product?.price ?? 0) + fee;
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return toIso(d); })();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!product) return;
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => String(fd.get(k) ?? "").trim();
    if (["r_name", "r_phone", "address", "c_email", "c_phone"].some((k) => !v(k)) || !date) return setError("Please complete every field marked as required.");
    if (!z.string().email().safeParse(v("c_email")).success) return setError("Enter a valid email address.");
    if (date < earliest) return setError(`The earliest delivery is ${formatDayMonth(earliest)}.`);
    setError(""); setBusy(true);
    const order = await createOrder({
      items: [{ key: `disp-${product.id}`, kind: "product", productId: product.id, slug: product.slug, name: product.name, price: product.price, quantity: 1, packaging: "signature-black", ...(note.trim() ? { note: note.trim() } : {}), deliveryDate: date }],
      subtotal: product.price, discount: 0, deliveryFee: fee, total, sendTo: "someone", payment,
      recipient: { name: v("r_name"), phone: v("r_phone"), address: v("address"), state, area: "", deliveryDate: date, notes: "", surprise: true },
      customer: { name: "", email: v("c_email"), phone: v("c_phone") },
    });
    setBusy(false);
    onDone(order);
  };

  return <Sheet open={!!product} onOpenChange={(o) => !o && onClose()}>
    <SheetContent side={mobile ? "bottom" : "right"} className={cn("overflow-y-auto bg-paper p-5 sm:p-6", mobile ? "max-h-[92vh] rounded-t-lg" : "w-full sm:max-w-md")}>
      <SheetTitle>Send {product?.name}</SheetTitle>
      <SheetDescription>{product && `${formatNaira(product.price)} · Signature Black Box`}</SheetDescription>
      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <F label="Recipient name" name="r_name" />
          <F label="Recipient phone" name="r_phone" type="tel" />
        </div>
        <F label="Delivery address" name="address" />
        <div><Label htmlFor="d-state">State</Label><Select value={state} onValueChange={setState}><SelectTrigger id="d-state" className="mt-1.5 min-h-11 bg-paper"><SelectValue /></SelectTrigger><SelectContent>{STATES.map((s) => <SelectItem key={s} value={s}>{s} · {formatNaira(deliveryFeeFor(s))}</SelectItem>)}</SelectContent></Select></div>
        <div>
          <Label htmlFor="d-date">Delivery date</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <button type="button" disabled={!sameDayOk} onClick={() => setDate(todayIso)} aria-pressed={date === todayIso} className={cn("min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40", date === todayIso ? "border-nero bg-gold text-nero" : sameDayOk ? "border-gold" : "border-border")}>Today{sameDayOk ? "" : " (unavailable)"}</button>
            <button type="button" onClick={() => setDate(tomorrow)} aria-pressed={date === tomorrow} className={cn("min-h-11 rounded-full border px-4 text-sm font-semibold", date === tomorrow ? "border-nero bg-gold text-nero" : "border-border")}>Tomorrow</button>
            <Input id="d-date" type="date" min={earliest} value={date} onChange={(e) => setDate(e.target.value)} className="min-h-11 w-auto bg-paper" />
          </div>
        </div>
        <div><Label htmlFor="d-note">Gift note</Label><Textarea id="d-note" maxLength={GIFT_NOTE_LIMIT} value={note} onChange={(e) => setNote(e.target.value)} className="mt-1.5 min-h-16 bg-paper" /><p className="mt-1 text-right text-xs text-muted-foreground">{note.length}/{GIFT_NOTE_LIMIT}</p></div>
        <div className="grid grid-cols-2 gap-3"><F label="Your email" name="c_email" type="email" /><F label="Your phone" name="c_phone" type="tel" /></div>
        <fieldset><legend className="text-sm font-medium">Payment</legend><div className="mt-1.5 grid grid-cols-3 gap-2">{PAYMENTS.map((p) => <label key={p.slug} className={cn("flex min-h-11 cursor-pointer items-center justify-center rounded-md border px-2 text-center text-xs font-semibold", payment === p.slug ? "border-nero bg-ivory" : "border-border")}><input type="radio" name="pay" className="sr-only" checked={payment === p.slug} onChange={() => setPayment(p.slug)} />{p.name}</label>)}</div><p className="mt-2 text-xs text-muted-foreground">The secure payment step will appear here.</p></fieldset>
        <p className="text-sm text-muted-foreground">Gift {formatNaira(product?.price ?? 0)} + delivery {formatNaira(fee)}</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <LoadingButton type="submit" size="lg" loading={busy} className="w-full">Pay {formatNaira(total)} and send</LoadingButton>
      </form>
    </SheetContent>
  </Sheet>;
}

function F({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return <div><Label htmlFor={`d-${name}`}>{label}</Label><Input id={`d-${name}`} name={name} type={type} required maxLength={200} className="mt-1.5 min-h-11 bg-paper" /></div>;
}
