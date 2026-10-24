import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Sparkles, type LucideIcon } from "lucide-react";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Level } from "./AdminData";
import { route } from "./nav";

export const LEVEL: Record<Level, { dot: string; ring: string; label: string; text: string; bg: string }> = {
  ok: { dot: "bg-[#2E9E6B]", ring: "ring-[#2E9E6B]/25", label: "Healthy", text: "text-[#1D5A3F]", bg: "bg-[#DDF0E6]" },
  warn: { dot: "bg-[#E7A21B]", ring: "ring-[#E7A21B]/30", label: "Needs a look", text: "text-[#6B4D00]", bg: "bg-[#F8EBB8]" },
  bad: { dot: "bg-[#C8362F]", ring: "ring-[#C8362F]/30", label: "Action needed", text: "text-[#83252C]", bg: "bg-[#FBE0DA]" },
  off: { dot: "bg-[#9A948A]", ring: "ring-[#9A948A]/25", label: "Not checked", text: "text-[#4A4640]", bg: "bg-black/5" },
};

export function StatusDot({ level, pulse, className }: { level: Level; pulse?: boolean; className?: string }) {
  return <span className={cn("relative inline-flex size-2.5 shrink-0", className)} aria-hidden>
    {pulse && level !== "ok" && level !== "off" && <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", LEVEL[level].dot)} />}
    <span className={cn("relative size-2.5 rounded-full ring-4", LEVEL[level].dot, LEVEL[level].ring)} />
  </span>;
}

export function LevelPill({ level, children }: { level: Level; children?: ReactNode }) {
  const l = LEVEL[level];
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider", l.bg, l.text)}><span className={cn("size-1.5 rounded-full", l.dot)} />{children ?? l.label}</span>;
}

/** Small area chart: a smooth line with a soft fill. No axes, because the numbers sit beside it. */
export function Sparkline({ values, stroke = "#E7B93B", height = 64, className }: { values: number[]; stroke?: string; height?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  const w = 280, max = Math.max(...values, 1), step = w / Math.max(values.length - 1, 1);
  const pts = values.map((v, i) => [i * step, height - 6 - (v / max) * (height - 14)] as const);
  const line = pts.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `C${x - step / 2},${pts[i - 1]![1]} ${x - step / 2},${y} ${x},${y}`)).join(" ");
  const empty = values.every((v) => v === 0);
  return <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={cn("w-full", className)} style={{ height }} role="img" aria-label="Trend over the last 14 days">
    <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={stroke} stopOpacity=".35" /><stop offset="1" stopColor={stroke} stopOpacity="0" /></linearGradient></defs>
    {empty ? <line x1="0" x2={w} y1={height - 6} y2={height - 6} stroke={stroke} strokeOpacity=".5" strokeDasharray="4 6" strokeWidth="2" />
      : <><path d={`${line} L${w},${height} L0,${height} Z`} fill={`url(#${id})`} /><path d={line} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" /></>}
  </svg>;
}

/** A section's top panel: dark brand pattern, big title, optional stats on the right. */
export function Hero({ eyebrow, title, blurb, accent = "#E7B93B", children, aside }: { eyebrow: string; title: string; blurb?: string; accent?: string; children?: ReactNode; aside?: ReactNode }) {
  return <section className="brand-pattern-black relative overflow-hidden rounded-3xl p-6 text-on-dark shadow-[0_30px_60px_-36px_rgba(0,0,0,.8)] md:p-9">
    <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full opacity-25 blur-3xl" style={{ background: accent }} />
    <div className="relative flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl">
        <p className="eyebrow" style={{ color: accent }}>{eyebrow}</p>
        <div aria-hidden className="mt-3 h-px w-12" style={{ background: accent }} />
        <h1 className="mt-4 text-4xl text-on-dark md:text-5xl">{title}</h1>
        {blurb && <p className="mt-3 text-on-dark-muted">{blurb}</p>}
      </div>
      {aside}
    </div>
    {children && <div className="relative mt-7">{children}</div>}
  </section>;
}

/** Linked number card used on section overview pages. */
export function Metric({ to, label, value, sub, tone = "bg-white", icon: Icon, warn }: { to?: string; label: string; value: ReactNode; sub?: string | undefined; tone?: string; icon?: LucideIcon; warn?: boolean }) {
  const inner = <>
    <div className="flex items-start justify-between gap-2"><p className="text-[11px] font-semibold uppercase tracking-[.16em] opacity-70">{label}</p>{Icon && <Icon className="size-4 opacity-60" />}</div>
    <p className={cn("mt-2 font-heading text-4xl leading-none", warn && "text-[#C8362F]")}>{value}</p>
    {sub && <p className="mt-2 text-xs opacity-70">{sub}</p>}
    {to && <ArrowUpRight className="absolute bottom-4 right-4 size-4 opacity-0 transition group-hover:opacity-70" />}
  </>;
  const cls = cn("group relative block rounded-2xl p-5 shadow-[0_20px_40px_-32px_rgba(41,40,40,.5)] transition", tone, to && "hover:-translate-y-0.5 hover:shadow-[0_26px_44px_-28px_rgba(41,40,40,.6)]");
  return to ? <Link to={route(to)} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

/** Big friendly shortcut tile. */
export function Shortcut({ to, icon: Icon, title, desc, badge, soon }: { to: string; icon: LucideIcon; title: string; desc: string; badge?: number | undefined; soon?: boolean }) {
  return <Link to={route(to)} className="group relative flex items-start gap-4 rounded-2xl bg-white p-5 shadow-[0_20px_40px_-32px_rgba(41,40,40,.5)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_44px_-28px_rgba(41,40,40,.6)]">
    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-nero text-gold transition group-hover:bg-gold group-hover:text-nero"><Icon className="size-5" /></span>
    <span className="min-w-0"><span className="flex items-center gap-2 font-heading text-xl leading-tight">{title}
      {badge ? <span className="rounded-full bg-[#83252C] px-2 py-0.5 font-sans text-[11px] font-bold text-white">{badge}</span> : null}
      {soon ? <span className="rounded-full bg-black/10 px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wider">Soon</span> : null}</span>
      <span className="mt-1 block text-sm text-muted-foreground">{desc}</span></span>
  </Link>;
}

export function Empty({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
    <div className="mx-auto grid size-14 place-items-center rounded-full bg-gold/25"><Icon className="size-6" /></div>
    <h2 className="mt-4 text-2xl">{title}</h2>{children && <div className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{children}</div>}
  </div>;
}

export function ComingSoon({ title, group, icon: Icon, blurb, will }: { title: string; group: string; icon: LucideIcon; blurb: string; will: string[] }) {
  return <div className="space-y-6">
    <Hero eyebrow={group} title={title} blurb={blurb} accent="#EB826C" aside={<span className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-xs font-bold uppercase tracking-[.16em] text-nero"><Sparkles className="size-4" />Coming soon</span>} />
    <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
      <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
        <div className="grid size-14 place-items-center rounded-2xl bg-nero text-gold"><Icon className="size-7" /></div>
        <h2 className="mt-5 text-3xl">What this will do</h2>
        <ul className="mt-4 space-y-3">{will.map((w) => <li key={w} className="flex gap-3 text-sm"><span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-gold" />{w}</li>)}</ul>
      </div>
      <div className="brand-pattern-green rounded-2xl p-6 text-on-dark md:p-8"><p className="eyebrow text-gold">In the meantime</p><p className="mt-3 text-on-dark-muted">This page is reserved in the menu so the structure is ready to grow into. Until it is built, ask and we can change these things for you directly.</p></div>
    </div>
  </div>;
}
