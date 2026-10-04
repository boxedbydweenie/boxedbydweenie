import { useEffect, useState } from "react";
import { BowTie } from "@/components/shop/BowTie";
import { currentStage, STAGES } from "@/services/secretSanta";
import { daysUntil, formatLong } from "@/services/calendar";
import type { Exchange, ExchangeDates } from "@/types/secretSanta";
import { cn } from "@/lib/utils";

const shortDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export function SantaTimeline({ dates, stage, dark }: { dates: ExchangeDates; stage?: number; dark?: boolean }) {
  return <ol className="grid grid-cols-4 gap-2">{STAGES.map(([k, label], i) => {
    const active = stage === i; const done = stage !== undefined && i < stage;
    return <li key={k} className="relative">
      <div className={cn("h-1 rounded-full", done || active ? "bg-gold" : dark ? "bg-line-dark" : "bg-border")} />
      <p className={cn("mt-3 text-[11px] font-semibold uppercase tracking-wider", active ? (dark ? "text-gold" : "text-nero") : dark ? "text-on-dark-muted" : "text-muted-foreground")}>{label}{active ? " · now" : ""}</p>
      <p className={cn("mt-1 text-sm", dark ? "text-on-dark" : "")}>{dates[k] ? shortDate(dates[k]) : "—"}</p>
    </li>;
  })}</ol>;
}

export function NextDateCountdown({ exchange, dark }: { exchange: Exchange; dark?: boolean }) {
  const i = currentStage(exchange);
  if (i >= 4) return <p className={dark ? "text-on-dark-muted" : "text-muted-foreground"}>Exchange day has passed.</p>;
  const [k, label] = STAGES[i]!;
  const d = daysUntil(exchange.dates[k]);
  return <p className={dark ? "text-on-dark-muted" : "text-muted-foreground"}><span className={cn("text-2xl font-semibold tabular-nums", dark ? "text-gold" : "text-nero")}>{d}</span> {d === 1 ? "day" : "days"} to {label.toLowerCase()} · {formatLong(exchange.dates[k])}</p>;
}

export function ProgressRing({ value, total, label }: { value: number; total: number; label: string }) {
  const pct = total ? value / total : 0; const r = 28; const c = 2 * Math.PI * r;
  return <div className="relative size-20 shrink-0" role="img" aria-label={`${value} of ${total} ${label}`}>
    <svg viewBox="0 0 72 72" className="size-20 -rotate-90"><circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-line-dark" /><circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} className="text-gold transition-all duration-500" /></svg>
    <span className="absolute inset-0 flex flex-col items-center justify-center text-on-dark"><strong className="text-lg leading-none">{value}/{total}</strong><span className="text-[9px] uppercase tracking-wider text-on-dark-muted">{label}</span></span>
  </div>;
}

export function Sparkles({ className }: { className?: string }) {
  return <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>{[[12, 20, 0], [80, 14, 600], [66, 70, 1200], [22, 76, 1800], [46, 8, 900], [90, 50, 300]].map(([x, y, d], i) => <span key={i} className="animate-sparkle absolute size-1.5 rotate-45 bg-gold" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}ms` }} />)}</div>;
}

/** Nero gift box drawn in CSS; lid can close (draw) or lift (reveal). */
export function GiftBox({ lid, bow, className }: { lid?: "close" | "lift" | "static"; bow?: "tie" | "untie" | "static" | "none"; className?: string }) {
  return <div className={cn("relative mx-auto h-44 w-52", className)}>
    <div className="absolute inset-x-2 bottom-0 h-32 rounded-sm border border-line-dark bg-nero-soft shadow-soft"><div className="foil absolute inset-y-0 left-1/2 w-3 -translate-x-1/2" /></div>
    <div className={cn("absolute inset-x-0 bottom-[7.5rem] z-10 h-8 rounded-sm border border-line-dark bg-nero", lid === "close" && "animate-lid-close", lid === "lift" && "animate-lid-lift")}>
      <div className="foil absolute inset-y-0 left-1/2 w-3 -translate-x-1/2" />
      {bow !== "none" && <div className="absolute -top-14 left-1/2 w-28 -translate-x-1/2">
        {bow === "untie" ? <div className="relative h-16"><div className="animate-bow-untie-l absolute left-0 top-0 w-1/2 overflow-hidden"><BowTie className="h-16 w-28 !translate-x-0" /></div><div className="animate-bow-untie-r absolute right-0 top-0 w-1/2 overflow-hidden"><div className="-ml-14"><BowTie className="h-16 w-28" /></div></div></div>
          : <div className={bow === "tie" ? "ribbon-draw" : ""}><BowTie className="h-16 w-28" /></div>}
      </div>}
    </div>
  </div>;
}

/** Names drop into the box, the lid closes, the ribbon ties. About 3 seconds. */
export function DrawAnimation({ names, onDone }: { names: string[]; onDone: () => void }) {
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => setFinished(true), reduce ? 400 : 3000);
    return () => clearTimeout(t);
  }, []);
  return <div role="dialog" aria-modal aria-label="Drawing names" className="surface-dark fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center">
    <Sparkles />
    <div className="relative h-72 w-64">
      {!finished && names.slice(0, 8).map((n, i) => <span key={n + i} className="animate-card-drop absolute left-1/2 top-0 -ml-14 w-28 rounded-sm bg-paper px-2 py-2 text-xs font-semibold text-nero shadow-soft" style={{ animationDelay: `${i * 140}ms`, ["--r" as string]: `${(i % 2 ? 1 : -1) * (4 + i)}deg` }}>{n}</span>)}
      <GiftBox lid="close" bow="tie" className="absolute bottom-0 left-1/2 -translate-x-1/2" />
    </div>
    <div aria-live="polite" className="mt-8 min-h-24">{finished && <div className="animate-rise-in"><h2 className="text-2xl text-on-dark">Names drawn.</h2><p className="mt-2 text-on-dark-muted">Everyone has been notified.</p><button onClick={onDone} className="mt-6 min-h-11 rounded-md bg-gold px-6 text-sm font-semibold text-nero">Done</button></div>}</div>
  </div>;
}
