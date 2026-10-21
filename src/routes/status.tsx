import { createFileRoute } from "@tanstack/react-router";
import { Check, Clock, Hourglass, Sparkles } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Label } from "@/components/brand/ProfileSections";
import { GROUPS, LAUNCH_NOTE, NEEDS, PLAN, STATE_LABEL, UPDATED, type State } from "@/data/status";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/status")({
  head: () => ({ meta: [{ title: "Project status — Boxed by Dweenie" }, { name: "robots", content: "noindex, nofollow" }, { name: "description", content: "Where the Boxed by Dweenie website stands: what is live, what is next and what we need." }] }),
  component: Status,
});

const PILL: Record<State, string> = { live: "bg-[#263D35] text-white", preview: "bg-gold text-nero", next: "bg-[#192850] text-white", waiting: "bg-[#EB826C] text-nero" };
const ICON = { live: Check, preview: Sparkles, next: Clock, waiting: Hourglass } as const;
const TONE = { forest: "brand-pattern-green", navy: "brand-pattern-navy", oxblood: "brand-pattern-oxblood", plum: "brand-pattern-plum" } as const;

function Status() {
  const all = GROUPS.flatMap((g) => g.items);
  const count = (s: State) => all.filter((i) => i.state === s).length;
  const live = count("live"), pct = Math.round((live / all.length) * 100);
  const stats: [number, string, string][] = [[live, "Live", "bg-gold text-nero"], [count("preview"), "Being finished", "bg-[#F4EFE5] text-nero"], [count("next"), "Up next", "bg-[#86BAA3] text-nero"], [count("waiting"), "Waiting on you", "bg-[#EB826C] text-nero"]];
  return <SiteShell><main>
    <section className="brand-pattern-green text-on-dark"><div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
      <Label dark>Project status</Label>
      <h1 className="mt-6 text-5xl leading-[1.02] md:text-7xl">Where we <span className="text-gold">are</span></h1>
      <p className="mt-5 max-w-xl text-lg text-on-dark-muted">The Boxed by Dweenie website, at a glance. {live} of {all.length} pieces are live. Updated {UPDATED}.</p>
      <div className="mt-8 max-w-xl" role="img" aria-label={`${pct}% of features are live`}><div className="h-2.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} /></div><p className="mt-2 text-sm text-on-dark-muted">{pct}% live</p></div>
      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">{stats.map(([n, l, c]) => <div key={l} className={cn("rounded-lg p-5", c)}><p className="font-heading text-5xl leading-none">{n}</p><p className="mt-2 text-sm font-semibold">{l}</p></div>)}</div>
    </div></section>

    <section className="bg-[#F4EFE5] py-16 md:py-20"><div className="mx-auto max-w-6xl space-y-14 px-5">
      {GROUPS.map((g) => <div key={g.title}>
        <div className={cn("rounded-lg px-6 py-5 text-on-dark", TONE[g.tone])}><h2 className="text-3xl md:text-4xl">{g.title}</h2></div>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">{g.items.map((i) => { const Ic = ICON[i.state];
          return <li key={i.name} className="rounded-lg bg-white p-5 shadow-[0_18px_30px_-26px_rgba(41,40,40,.6)]">
            <div className="flex items-start justify-between gap-3"><h3 className="font-heading text-2xl leading-tight">{i.name}</h3><span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", PILL[i.state])}><Ic className="size-3.5" />{STATE_LABEL[i.state]}</span></div>
            <p className="mt-2 text-sm text-muted-foreground">{i.note}</p></li>; })}</ul>
      </div>)}
    </div></section>

    <section className="brand-pattern-black text-on-dark"><div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
      <Label dark>What we need from you</Label><h2 className="mt-5 text-4xl md:text-5xl">Your <span className="text-gold">to-do list</span></h2>
      <ol className="mt-10 grid gap-4 md:grid-cols-2">{NEEDS.map((n, i) => <li key={n.what} className="flex gap-4 rounded-lg border border-white/15 bg-white/5 p-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gold font-heading text-xl text-nero">{i + 1}</span>
        <div><h3 className="text-xl font-semibold">{n.what}</h3><p className="mt-1 text-sm text-on-dark-muted">{n.why}</p><p className="mt-2 text-xs font-semibold uppercase tracking-[.16em] text-gold">{n.owner}</p></div></li>)}</ol>
    </div></section>

    <section className="bg-white py-16 md:py-20"><div className="mx-auto max-w-4xl px-5">
      <Label>Go-live plan</Label><h2 className="mt-5 text-4xl md:text-5xl">The road to <span className="text-[#8E6A10]">launch</span></h2>
      <p className="mt-3 text-muted-foreground">{LAUNCH_NOTE}</p>
      <ol className="relative mt-10 space-y-8 border-l-2 border-gold/50 pl-8">{PLAN.map((s) => <li key={s.title} className="relative">
        <span className={cn("absolute -left-[2.65rem] top-0 grid size-9 place-items-center rounded-full border-2", s.done ? "border-[#263D35] bg-[#263D35] text-white" : "border-gold bg-white text-nero")}>{s.done ? <Check className="size-4" /> : <Clock className="size-4" />}</span>
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#8E6A10]">{s.when}</p><h3 className="mt-1 font-heading text-2xl">{s.title}</h3><p className="mt-1 text-sm text-muted-foreground">{s.detail}</p></li>)}</ol>
    </div></section>
  </main></SiteShell>;
}
