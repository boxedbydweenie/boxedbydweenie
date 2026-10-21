import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Baby, Briefcase, Cake, Check, Clock, Cpu, Crown, Gem, Gift, Heart, HeartHandshake, Home as HomeIcon, PartyPopper, RefreshCw, Shuffle, SlidersHorizontal, Smile, Sparkles, Star, Store, Timer, Truck, User, UserRound, Utensils, Wallet, Wand2, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { DispenserShell } from "@/components/site/DispenserShell";
import { ExpressSheet } from "@/components/site/DispenserSend";
import { PlaceholderTile } from "@/components/site/PlaceholderTile";
import { BowTie } from "@/components/shop/BowTie";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DISPENSE_DURATION_MS, DISPENSER_BUDGETS, DISPENSER_IMPRESSIONS, DISPENSER_OCCASIONS, DISPENSER_RECIPIENTS, DISPENSER_TIMINGS, DISPENSER_VIBES } from "@/config/dispenser";
import { earliestDelivery, toIso } from "@/config/delivery";
import { BRAND } from "@/data/brand";
import { formatStat } from "@/services/brand";
import { formatDayMonth, formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getPicks, randomAnswers, type DispenserAnswers, type Pick } from "@/services/dispenser";
import type { Order, ShopProduct } from "@/types/shop";

const opt = z.string().optional().catch(undefined);
const searchSchema = z.object({ who: opt, occasion: opt, budget: opt, vibe: opt, impression: opt, timing: opt, start: z.coerce.boolean().optional().catch(undefined) });

export const Route = createFileRoute("/dispenser")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [
    { title: "Gift Dispenser: A WOW gift in 60 seconds — Boxed by Dweenie" },
    { name: "description", content: "Answer six thoughtful questions and our Gift Dispenser serves three hand-picked luxury gifts, matched to the person, the moment and the impression you want to leave. Send it in under a minute." },
    { property: "og:title", content: "A WOW gift in 60 seconds — Boxed by Dweenie" },
    { property: "og:description", content: "Six thoughtful questions. Three perfectly matched gifts. Sent before the minute is up." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: DispenserPage,
});

type QKey = "who" | "occasion" | "vibe" | "impression" | "budget" | "timing";
type Phase = "intro" | QKey | "line" | "dispensing" | "picks" | "done";
interface Q { key: QKey; kicker: string; title: string; sub: string; options: { slug: string; name: string; line?: string }[]; icons: Record<string, typeof Gift>; cols: string }
const QUESTIONS: Q[] = [
  { key: "who", kicker: "The person", title: "Who is this gift for?", sub: "The more we know about them, the better we choose.", options: DISPENSER_RECIPIENTS, cols: "sm:grid-cols-2",
    icons: { her: Heart, him: User, couple: HeartHandshake, parent: UserRound, colleague: Briefcase, client: Crown, child: Baby, "someone-new": Sparkles } },
  { key: "occasion", kicker: "The moment", title: "What are we celebrating?", sub: "Every occasion has its own kind of wow.", options: DISPENSER_OCCASIONS, cols: "sm:grid-cols-2",
    icons: { birthday: Cake, anniversary: HeartHandshake, "thank-you": Smile, congratulations: PartyPopper, "new-baby": Baby, "get-well": Heart, "just-because": Sparkles, christmas: Gift } },
  { key: "vibe", kicker: "Their taste", title: "What would make them light up?", sub: "Think about their weekend, their shelf, their favourite thing to receive.", options: DISPENSER_VIBES, cols: "sm:grid-cols-2",
    icons: { pamper: Sparkles, tech: Cpu, feast: Utensils, home: HomeIcon, all: Wand2 } },
  { key: "impression", kicker: "The impression", title: "How should they feel when they open it?", sub: "A great gift is remembered for the feeling, long after the contents.", options: DISPENSER_IMPRESSIONS, cols: "sm:grid-cols-2",
    icons: { thoughtful: Heart, luxurious: Gem, fun: PartyPopper, professional: Briefcase } },
  { key: "budget", kicker: "Your budget", title: "What feels right to spend?", sub: "We will never show you anything outside this range.", options: DISPENSER_BUDGETS, cols: "sm:grid-cols-2",
    icons: { "under-25": Wallet, "25-50": Wallet, "50-100": Gem, "over-100": Crown } },
  { key: "timing", kicker: "The clock", title: "When does it need to arrive?", sub: "We deliver nationwide, and same-day across Lagos.", options: DISPENSER_TIMINGS, cols: "sm:grid-cols-3",
    icons: { today: Zap, soon: Truck, later: Clock } },
];
const ORDER: Phase[] = ["who", "occasion", "vibe", "impression", "budget", "timing", "line"];
const valid = (key: QKey, v?: string) => !!v && QUESTIONS.find((q) => q.key === key)!.options.some((o) => o.slug === v);
const mmss = (s: number) => `0${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const FAQ: [string, string][] = [
  ["Is it really 60 seconds?", "Yes. Six quick taps, one optional line for the card, and your three matches appear. Most people choose and pay inside a minute. There is a live clock so you can watch."],
  ["How does the Dispenser choose?", "It looks at who the gift is for, the occasion, what would make them light up, the impression you want to leave, your budget and when it must arrive. Then it ranks our whole collection and serves your top pick, a crowd favourite and something different."],
  ["What if I do not love the three picks?", "Tap Dispense again for a fresh set, change your answers, or browse every matching gift in the shop."],
  ["Can I add a personal message?", "Yes. The last step lets you write a line for the card. We print it by hand-finished card and tuck it into the box."],
  ["Where do you deliver and how fast?", "Same-day in Lagos for orders placed before 12 noon on eligible gifts, next-day in Lagos and Abuja, and two to three days to other states."],
  ["Can I gift something to a whole team instead?", "Of course. For ten or more gifts, branded with your logo, use our instant corporate quote."],
];

function ClockRing({ seconds, size = 44 }: { seconds: number; size?: number }) {
  const pct = Math.min(seconds, 60) / 60, c = 2 * Math.PI * 16, over = seconds >= 60;
  return <div className="relative grid place-items-center" style={{ width: size, height: size }} role="timer" aria-label={`${seconds} seconds elapsed`}>
    <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90"><circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="2.5" /><circle cx="20" cy="20" r="16" fill="none" stroke={over ? "#EB826C" : "#E7B93B"} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset 1s linear" }} /></svg>
    <span className="dsp-term text-[11px] font-semibold text-white">{seconds}s</span>
  </div>;
}

function DispenserPage() {
  const search = Route.useSearch();
  const startRef = useRef(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [answers, setAnswers] = useState<Partial<DispenserAnswers>>(() => ({
    ...(valid("who", search.who) ? { who: search.who! } : {}), ...(valid("occasion", search.occasion) ? { occasion: search.occasion! } : {}),
    ...(valid("budget", search.budget) ? { budget: search.budget! } : {}), ...(valid("vibe", search.vibe) ? { vibe: search.vibe! } : {}),
    ...(valid("impression", search.impression) ? { impression: search.impression! } : {}), ...(valid("timing", search.timing) ? { timing: search.timing! } : {}),
  }));
  const next = (a: Partial<DispenserAnswers>): Phase => (QUESTIONS.find((q) => !a[q.key])?.key ?? "line");
  const [phase, setPhase] = useState<Phase>(() => (Object.keys(answers).length || search.start ? next(answers) : "intro"));
  const [line, setLine] = useState("");
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<{ picks: Pick[]; restocking: boolean } | null>(null);
  const [sending, setSending] = useState<ShopProduct | null>(null);
  const [order, setOrder] = useState<{ order: Order; seconds: number } | null>(null);
  const [lineStep, setLineStep] = useState(0);

  const begin = () => { startRef.current = Date.now(); setSeconds(0); setRunning(true); };
  useEffect(() => { if (phase !== "intro" && !running && phase !== "done") begin(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds(Math.floor((Date.now() - startRef.current) / 1000)), 500);
    return () => clearInterval(t);
  }, [running]);

  const dispense = useCallback(async (a: DispenserAnswers, r: number) => {
    setPhase("dispensing"); setLineStep(0);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const [res] = await Promise.all([getPicks(a, r), new Promise((ok) => setTimeout(ok, reduce ? 600 : DISPENSE_DURATION_MS))]);
    setResult(res); setPhase("picks");
  }, []);

  useEffect(() => {
    if (phase !== "dispensing") return;
    const t = setInterval(() => setLineStep((n) => n + 1), 620);
    return () => clearInterval(t);
  }, [phase]);

  const start = () => { begin(); setPhase(next(answers)); };
  const answer = (key: QKey, value: string) => {
    const a = { ...answers, [key]: value };
    setAnswers(a);
    const following = QUESTIONS.slice(QUESTIONS.findIndex((q) => q.key === key) + 1).find((q) => !a[q.key]);
    setPhase(following ? following.key : "line");
  };
  const back = () => { const i = ORDER.indexOf(phase); if (i <= 0) { setPhase("intro"); setRunning(false); } else setPhase(ORDER[i - 1]!); };
  const finishLine = () => { setResult(null); void dispense(answers as DispenserAnswers, round); };
  const surprise = () => { const a = randomAnswers(); setAnswers(a); setResult(null); if (!running) begin(); void dispense(a, round); };
  const again = () => { const r = round + 1; setRound(r); setResult(null); void dispense(answers as DispenserAnswers, r); };
  const change = () => { setAnswers({}); setResult(null); setLine(""); setPhase("who"); };
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [phase]);

  const q = QUESTIONS.find((x) => x.key === phase);
  const step = ORDER.indexOf(phase);
  const shopSearch = {
    ...(answers.occasion && answers.occasion !== "just-because" ? { occasion: answers.occasion } : {}),
    ...(answers.budget ? { budget: answers.budget } : {}),
    ...(() => { const m = DISPENSER_RECIPIENTS.find((r) => r.slug === answers.who)?.matches; return m && m.length === 1 ? { recipient: m[0] } : {}; })(),
  };
  const inFlow = phase !== "intro";

  return <DispenserShell clock={running && phase !== "done" ? <ClockRing seconds={seconds} /> : undefined}>
    <div className="dsp-grid" aria-hidden />
    {phase === "intro" && <Landing onStart={start} onSurprise={surprise} />}

    {inFlow && phase !== "picks" && phase !== "done" && <main className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-center px-5 py-10 sm:py-14">
      <div className="dsp-glow -left-40 top-10 size-80 bg-[#E7B93B]/20" aria-hidden /><div className="dsp-glow -right-40 bottom-10 size-80 bg-[#83252C]/40" aria-hidden />
      {phase !== "dispensing" && <div className="relative">
        <div className="flex items-center gap-4">
          <button type="button" onClick={back} aria-label="Back" className="grid size-11 shrink-0 place-items-center rounded-full border border-white/20 hover:border-[#E7B93B] hover:bg-white/5"><ArrowLeft className="size-5" /></button>
          <div className="flex flex-1 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={7} aria-valuenow={Math.max(step + 1, 1)} aria-label={`Step ${step + 1} of 7`}>{ORDER.map((o, i) => <span key={o} className={cn("dsp-seg", i < step && "on")}><i style={{ width: i < step ? "100%" : i === step ? "45%" : "0" }} /></span>)}</div>
          <span className="dsp-term text-xs text-white/60">{step + 1}/7</span>
        </div>
      </div>}

      {q && <section key={q.key} className="relative mt-10" aria-labelledby="q-title">
        <p className="dsp-eyebrow">{q.kicker}</p>
        <h1 id="q-title" className="mt-3 font-heading text-4xl leading-[1.05] sm:text-6xl">{q.title}</h1>
        <p className="mt-3 max-w-xl text-white/65">{q.sub}</p>
        <div className={cn("mt-8 grid gap-3", q.cols)}>
          {q.options.map((o, i) => { const Ic = q.icons[o.slug] ?? Gift;
            return <button key={o.slug} type="button" onClick={() => answer(q.key, o.slug)} aria-pressed={answers[q.key] === o.slug} className="dsp-option" style={{ animationDelay: `${i * 55}ms` }}>
              <span className="ico"><Ic className="size-5" /></span>
              <span className="min-w-0"><span className="block text-base font-semibold">{o.name}</span>{o.line && <span className="block text-sm text-white/55">{o.line}</span>}</span>
              <ArrowRight className="ml-auto size-4 shrink-0 text-white/30" />
            </button>; })}
        </div>
      </section>}

      {phase === "line" && <section className="relative mt-10" aria-labelledby="q-title">
        <p className="dsp-eyebrow">The finishing touch</p>
        <h1 id="q-title" className="mt-3 font-heading text-4xl leading-[1.05] sm:text-6xl">Write one line only <span className="text-[#E7B93B]">you</span> could write.</h1>
        <p className="mt-3 max-w-xl text-white/65">A private joke, a memory, a thank you. We will place it on the card inside the box. Optional.</p>
        <label htmlFor="line" className="sr-only">Line for the card</label>
        <textarea id="line" value={line} onChange={(e) => setLine(e.target.value.slice(0, 160))} rows={3} placeholder="“Happy birthday. Still the person I call first.”" className="mt-6 w-full resize-none rounded-2xl border border-white/20 bg-white/5 p-5 text-lg text-white placeholder:text-white/35 focus:border-[#E7B93B] focus:outline-none" />
        <p className="mt-2 text-right text-xs text-white/45">{line.length}/160</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={finishLine} className="dsp-btn dsp-btn-gold dsp-pulse"><Zap className="size-5" />Dispense my gifts</button>
          {line && <button type="button" onClick={() => { setLine(""); finishLine(); }} className="dsp-btn dsp-btn-line">Skip the card</button>}
          {!line && <button type="button" onClick={finishLine} className="dsp-btn dsp-btn-line">Skip this</button>}
        </div>
      </section>}

      {phase === "dispensing" && <section className="relative text-center" role="status" aria-live="polite">
        <div className="dsp-glass dsp-scan relative mx-auto max-w-md overflow-hidden rounded-3xl p-6">
          <div className="grid grid-cols-5 gap-2.5">{Array.from({ length: 15 }, (_, i) => <div key={i} className="dsp-cell" style={{ animationDelay: `${((i * 7) % 15) * 160}ms` }}><Gift className="size-4 text-[#E7B93B]/70" /></div>)}</div>
        </div>
        <p className="dsp-eyebrow mt-8">Dispensing</p>
        <h1 className="mt-3 font-heading text-4xl sm:text-5xl">Choosing three gifts worth a <span className="text-[#E7B93B]">wow</span></h1>
        <ul className="dsp-term mx-auto mt-6 max-w-sm space-y-2 text-left text-sm text-white/75">
          {["Reading the person and the moment", "Scanning the collection for taste", "Weighing the impression you want", "Checking budget and delivery date", "Wrapping up your top three"].map((t, i) => <li key={t} className={cn("flex items-center gap-3 transition-opacity", lineStep > i ? "opacity-100" : "opacity-20")}><span className={cn("grid size-5 place-items-center rounded-full", lineStep > i + 0 ? "bg-[#E7B93B] text-nero" : "border border-white/30")}>{lineStep > i + 1 || (lineStep > i && i === 4) ? <Check className="size-3" /> : null}</span>{t}</li>)}
        </ul>
      </section>}
    </main>}

    {phase === "picks" && result && <main className="relative mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <div className="dsp-glow left-1/2 top-0 size-[30rem] -translate-x-1/2 bg-[#E7B93B]/15" aria-hidden />
      <section aria-labelledby="picks-title" className="relative">
        <div className="text-center"><p className="dsp-eyebrow">Freshly dispensed · {seconds}s</p>
          <h1 id="picks-title" className="mt-3 font-heading text-5xl sm:text-7xl">Your three <span className="text-[#E7B93B]">picks</span></h1>
          <p className="mx-auto mt-3 max-w-xl text-white/65">Chosen for {DISPENSER_RECIPIENTS.find((r) => r.slug === answers.who)?.name.toLowerCase() ?? "them"}{answers.occasion && answers.occasion !== "just-because" ? `, for ${DISPENSER_OCCASIONS.find((o) => o.slug === answers.occasion)?.name.toLowerCase()}` : ""}. Pick one and it is on its way.</p>
          {result.restocking && <p className="mt-3 text-sm text-[#EB826C]">Nothing matched that budget exactly, so here are our bestsellers instead.</p>}</div>
        <div className="-mx-5 mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
          {result.picks.map((p, i) => <PickCard key={p.product.id} pick={p} index={i} onSend={() => setSending(p.product)} />)}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={again} className="dsp-btn dsp-btn-line"><RefreshCw className="size-4" />Dispense again</button>
          <button type="button" onClick={change} className="dsp-btn dsp-btn-line"><SlidersHorizontal className="size-4" />Change my answers</button>
          <Link to="/shop" search={shopSearch} className="dsp-btn dsp-btn-line"><Store className="size-4" />See all matching gifts</Link>
        </div>
      </section>
    </main>}

    {phase === "done" && order && <main className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg flex-col items-center justify-center px-5 py-16 text-center" aria-live="polite">
      <div className="dsp-glow left-1/2 top-1/4 size-80 -translate-x-1/2 bg-[#E7B93B]/25" aria-hidden />
      <div className="relative"><BowTie /><p className="dsp-eyebrow mt-8">Sent</p>
        <h1 className="mt-3 font-heading text-5xl sm:text-6xl">Done in <span className="text-[#E7B93B]">{order.seconds}</span> seconds</h1>
        <p className="mt-4 text-white/70">Order <span className="font-semibold text-white">{order.order.id}</span> is being boxed for {order.order.recipient.name}, arriving {formatDayMonth(order.order.recipient.deliveryDate)}.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3"><Link to="/order/$id" params={{ id: order.order.id }} className="dsp-btn dsp-btn-gold">Track this order</Link><button type="button" className="dsp-btn dsp-btn-line" onClick={() => { change(); begin(); }}>Send another</button></div></div>
    </main>}

    <ExpressSheet product={sending} initialNote={line} onClose={() => setSending(null)} onDone={(o) => { setSending(null); setOrder({ order: o, seconds: Math.max(1, Math.round((Date.now() - startRef.current) / 1000)) }); setRunning(false); setPhase("done"); window.scrollTo({ top: 0 }); }} />
  </DispenserShell>;
}

function PickCard({ pick, index, onSend }: { pick: Pick; index: number; onSend: () => void }) {
  const p = pick.product;
  const earliest = earliestDelivery(p.sameDay);
  const today = earliest === toIso(new Date());
  return <article className="dsp-pick dsp-glass flex w-[82vw] max-w-sm shrink-0 snap-center flex-col rounded-3xl p-4 md:w-auto md:max-w-none" style={{ animationDelay: `${index * 160}ms` }}>
    <div className="relative overflow-hidden rounded-2xl"><PlaceholderTile label={p.name} className="aspect-[5/4] w-full" /><span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#E7B93B] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-nero">{index === 0 && <Star className="size-3" />}{pick.label}</span></div>
    <h2 className="mt-4 font-heading text-2xl leading-tight">{p.name}</h2>
    <p className="mt-1 text-xl font-semibold text-[#E7B93B]">{formatNaira(p.price)}</p>
    {pick.reasons.length > 0 && <div className="mt-3 rounded-xl bg-white/5 p-3"><p className="dsp-eyebrow !text-[10px]">Why this one</p><ul className="mt-2 space-y-1.5 text-sm text-white/80">{pick.reasons.map((r) => <li key={r} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#E7B93B]" />{r}</li>)}</ul></div>}
    <ul className="mt-3 space-y-0.5 text-xs text-white/55">{p.inside.slice(0, 3).map((i) => <li key={i}>· {i}</li>)}</ul>
    <p className="mt-3 text-xs font-semibold text-[#E7B93B]">{today ? "Arrives today in Lagos" : `Arrives from ${formatDayMonth(earliest)}`}</p>
    <div className="mt-auto flex gap-2 pt-4"><button type="button" onClick={onSend} className="dsp-btn dsp-btn-gold flex-1 !min-h-12">Send this one</button><Link to="/shop/$slug" params={{ slug: p.slug }} className="dsp-btn dsp-btn-line !min-h-12 !px-5" aria-label={`View ${p.name}`}>View</Link></div>
  </article>;
}

/* ---------------- Landing ---------------- */

function Landing({ onStart, onSurprise }: { onStart: () => void; onSurprise: () => void }) {
  const chips = ["Who is it for?", "What are we celebrating?", "What would make them light up?", "How should they feel?", "What feels right to spend?", "When must it arrive?", "One line only you could write"];
  return <main className="relative">
    {/* Hero */}
    <section className="relative overflow-hidden">
      <div className="dsp-glow -left-32 top-20 size-96 bg-[#E7B93B]/20" aria-hidden /><div className="dsp-glow -right-24 top-40 size-96 bg-[#39243F]/70" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-14 md:grid-cols-[1.1fr_.9fr] md:pb-24 md:pt-20">
        <div>
          <p className="dsp-eyebrow inline-flex items-center gap-2 rounded-full border border-[#E7B93B]/30 bg-[#E7B93B]/10 px-4 py-2"><Timer className="size-3.5" />Gift Dispenser</p>
          <h1 className="mt-6 font-heading text-[2.9rem] leading-[0.98] sm:text-7xl lg:text-[5.4rem]">A <span className="text-[#E7B93B]">wow</span> gift.<br />In 60 seconds.</h1>
          <p className="mt-6 max-w-xl text-lg text-white/70">Answer a few thoughtful questions about the person, the moment and the impression you want to leave. Our dispenser serves three hand-picked luxury gifts. You choose, pay and send, before the minute is up.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <button type="button" onClick={onStart} className="dsp-btn dsp-btn-gold dsp-pulse"><Zap className="size-5" />Start the 60-second clock</button>
            <button type="button" onClick={onSurprise} className="dsp-btn dsp-btn-line"><Shuffle className="size-4" />Surprise me</button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">{["Hand-wrapped", "Same-day Lagos", "Delivered nationwide"].map((t) => <li key={t} className="flex items-center gap-2"><Check className="size-4 text-[#E7B93B]" />{t}</li>)}</ul>
        </div>
        <div className="relative mx-auto w-full max-w-md" aria-hidden>
          <div className="dsp-glass dsp-scan relative overflow-hidden rounded-[2rem] p-8">
            <div className="absolute right-5 top-5"><ClockRing seconds={42} size={56} /></div>
            <img src="/home/boxes-stack.webp" alt="" className="dsp-float mx-auto w-4/5 drop-shadow-[0_30px_40px_rgba(0,0,0,.6)]" />
            <div className="dsp-term mt-4 flex items-center justify-between text-xs text-white/60"><span>MATCH 98%</span><span className="text-[#E7B93B]">● 3 GIFTS READY</span></div>
          </div>
        </div>
      </div>
      <div className="relative border-y border-white/10 bg-white/[.03] py-4" aria-label="The questions we ask"><div className="overflow-hidden"><div className="dsp-marquee">{[...chips, ...chips].map((c, i) => <span key={i} className="dsp-chip">{c}</span>)}</div></div></div>
    </section>

    {/* Concept */}
    <section className="relative mx-auto max-w-6xl px-5 py-20 md:py-28">
      <p className="dsp-eyebrow">The idea</p>
      <h2 className="mt-4 max-w-3xl font-heading text-4xl leading-tight sm:text-6xl">The best gifts prove you <span className="text-[#E7B93B]">paid attention.</span></h2>
      <p className="mt-5 max-w-2xl text-lg text-white/65">Price does not make a gift memorable. Feeling understood does. So we do not just ask your budget. We ask about them, then do the hard part of choosing.</p>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {[[Heart, "Chosen for them", "Their taste, the occasion and the feeling you want to create all shape the match. Never a random bestseller."], [Gem, "Luxury, wrapped by hand", "Every box is finished in our signature packaging, with a card in your own words."], [Truck, "Sent before you know it", "Same-day in Lagos on eligible gifts. Next-day in Lagos and Abuja. Nationwide in days."]].map(([Ic, t, d]) => { const I = Ic as typeof Heart; return <div key={t as string} className="dsp-glass rounded-3xl p-7"><span className="grid size-12 place-items-center rounded-2xl bg-[#E7B93B]/15 text-[#E7B93B]"><I className="size-6" /></span><h3 className="mt-5 font-heading text-2xl">{t as string}</h3><p className="mt-2 text-white/65">{d as string}</p></div>; })}
      </div>
    </section>

    {/* How it works */}
    <section className="relative border-y border-white/10 bg-[#141212] py-20 md:py-28"><div className="mx-auto max-w-6xl px-5">
      <p className="dsp-eyebrow">How it works</p><h2 className="mt-4 font-heading text-4xl sm:text-6xl">Three steps. <span className="text-[#E7B93B]">One minute.</span></h2>
      <ol className="mt-14 grid gap-10 md:grid-cols-3">
        {[["01", "Tell us about them", "Six quick taps: who, the moment, their taste, the impression, budget and timing. Add one personal line if you like."], ["02", "The Dispenser matches", "We rank our whole collection against your answers and serve your top pick, a crowd favourite and something different, with the reason for each."], ["03", "Choose, pay, sent", "Pick one, confirm the delivery details and pay securely. We wrap it by hand and deliver it on your date."]].map(([n, t, d]) => <li key={n}>
          <span className="dsp-step-num" aria-hidden>{n}</span><h3 className="mt-3 font-heading text-3xl">{t}</h3><p className="mt-3 text-white/65">{d}</p></li>)}
      </ol>
      <div className="mt-12"><button type="button" onClick={onStart} className="dsp-btn dsp-btn-gold">Try it now <ArrowRight className="size-4" /></button></div>
    </div></section>

    {/* Proof */}
    <section className="relative mx-auto max-w-6xl px-5 py-20 md:py-28">
      <p className="dsp-eyebrow">Trusted to make an impression</p><h2 className="mt-4 max-w-3xl font-heading text-4xl sm:text-6xl">Gifts people <span className="text-[#E7B93B]">keep talking about.</span></h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">{BRAND.stats.slice(0, 3).map((s) => <div key={s.label} className="dsp-glass rounded-3xl p-7"><p className="font-heading text-5xl text-[#E7B93B]">{formatStat(s)}</p><p className="mt-2 text-white/65">{s.label}</p></div>)}</div>
      <ul className="mt-6 grid gap-4 md:grid-cols-2">{BRAND.reviews.slice(0, 2).map((r) => <li key={r.name} className="dsp-glass rounded-3xl p-7"><div className="flex gap-1 text-[#E7B93B]" aria-label="5 out of 5 stars">{Array.from({ length: 5 }, (_, i) => <Star key={i} className="size-4 fill-current" />)}</div><h3 className="mt-3 font-heading text-2xl">{r.title}</h3><p className="mt-2 line-clamp-4 text-white/70">{r.text}</p><p className="mt-4 text-sm font-semibold text-white/90">{r.name}</p></li>)}</ul>
    </section>

    {/* FAQ */}
    <section className="relative border-t border-white/10 bg-[#141212] py-20 md:py-24"><div className="mx-auto max-w-3xl px-5">
      <p className="dsp-eyebrow">Good to know</p><h2 className="mt-4 font-heading text-4xl sm:text-5xl">Questions, answered</h2>
      <Accordion type="single" collapsible className="mt-8">{FAQ.map(([q, a], i) => <AccordionItem key={q} value={`f${i}`} className="border-white/15"><AccordionTrigger className="text-left text-lg text-white hover:no-underline">{q}</AccordionTrigger><AccordionContent className="text-base text-white/70">{a}</AccordionContent></AccordionItem>)}</Accordion>
      <p className="mt-8 text-sm text-white/60">Gifting a whole team? <Link to="/corporate/quote" className="text-[#E7B93B] underline underline-offset-4">Get an instant corporate quote</Link>.</p>
    </div></section>

    {/* Final CTA */}
    <section className="relative overflow-hidden py-24 text-center"><div className="dsp-glow left-1/2 top-0 size-[32rem] -translate-x-1/2 bg-[#E7B93B]/20" aria-hidden />
      <div className="relative mx-auto max-w-3xl px-5"><h2 className="font-heading text-5xl leading-tight sm:text-7xl">Ready? <span className="text-[#E7B93B]">The clock starts when you do.</span></h2>
        <p className="mx-auto mt-5 max-w-xl text-white/65">Someone is about to feel truly seen. Let us help you make it a moment they never forget.</p>
        <button type="button" onClick={onStart} className="dsp-btn dsp-btn-gold dsp-pulse mt-9"><Zap className="size-5" />Start the 60-second clock</button></div>
    </section>
  </main>;
}
