import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Button, Eyebrow, FilterChip, GoldRule, SectionHeading } from "@/components/site/Brand";
import { AddToCalendarButton, Countdown, DateLabel, OccasionDetail } from "@/components/calendar/OccasionDetail";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePeople } from "@/hooks/use-calendar";
import { daysUntil, formatLong, getNextUp, getOccasionsForYear, initials, nextOccurrence, todayIso, upcomingOccasionsSync } from "@/services/calendar";
import type { OccasionCategory, OccasionInstance, Person } from "@/types/calendar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar/")({
  head: () => ({
    meta: [
      { title: "Gift Calendar — Boxed by Dweenie" },
      { name: "description", content: "Every gifting moment of the year in one place, with order-by dates, countdowns and your own saved birthdays and anniversaries." },
      { property: "og:title", content: "Gift Calendar — Never miss a moment" },
      { property: "og:description", content: "Public gifting occasions and your own saved dates, with reminders in good time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async () => ({ nextUp: await getNextUp() }),
  component: CalendarPage,
});

type Filter = "all" | OccasionCategory | "mine";
const FILTERS: [Filter, string][] = [["all", "All"], ["celebrations", "Celebrations"], ["faith", "Faith"], ["family", "Family"], ["workplace", "Workplace"], ["mine", "My dates"]];
const MONTHS = Array.from({ length: 12 }, (_, i) => new Date(2026, i, 1).toLocaleDateString("en-GB", { month: "long" }));
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Entry =
  | { kind: "public"; key: string; date: string; inst: OccasionInstance }
  | { kind: "personal"; key: string; date: string; person: Person; label: string };

function CalendarPage() {
  const { nextUp } = Route.useLoaderData();
  const mobile = useIsMobile();
  const navigate = useNavigate();
  const people = usePeople();
  const [view, setView] = useState<"month" | "list" | "year">("month");
  useEffect(() => { if (mobile) setView("list"); }, [mobile]);
  const [filter, setFilter] = useState<Filter>("all");
  const [corporate, setCorporate] = useState(false);
  const today = todayIso();
  const [cursor, setCursor] = useState(() => ({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 }));
  const [yearData, setYearData] = useState<OccasionInstance[]>([]);
  useEffect(() => { getOccasionsForYear(cursor.y).then(setYearData); }, [cursor.y]);
  const [day, setDay] = useState<string | null>(null);
  const [open, setOpen] = useState<OccasionInstance | null>(null);

  const showPublic = (i: OccasionInstance) => (corporate ? i.occasion.category === "workplace" : filter === "all" || filter === i.occasion.category);
  const showMine = !corporate && (filter === "all" || filter === "mine");

  const personalFor = (year: number): Entry[] => showMine ? people.flatMap((p) => p.dates.map((d) => {
    const date = `${year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
    return { kind: "personal" as const, key: d.id + year, date, person: p, label: d.label };
  })) : [];
  const yearEntries: Entry[] = useMemo(() => [
    ...yearData.filter((i) => i.date && showPublic(i)).map((i) => ({ kind: "public" as const, key: i.occasion.slug, date: i.date!, inst: i })),
    ...personalFor(cursor.y),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [yearData, filter, corporate, people, cursor.y]);
  const byDate = useMemo(() => { const m = new Map<string, Entry[]>(); yearEntries.forEach((e) => m.set(e.date, [...(m.get(e.date) ?? []), e])); return m; }, [yearEntries]);

  const upcoming: Entry[] = useMemo(() => [
    ...upcomingOccasionsSync(today).filter(showPublic).map((i) => ({ kind: "public" as const, key: i.occasion.slug, date: i.date!, inst: i })),
    ...(showMine ? people.flatMap((p) => p.dates.map((d) => ({ kind: "personal" as const, key: d.id, date: nextOccurrence(d, today), person: p, label: d.label }))) : []),
  ].sort((a, b) => a.date.localeCompare(b.date)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [filter, corporate, people, today]);
  const anytime = yearData.filter((i) => !i.date && showPublic(i));

  const openOccasion = (inst: OccasionInstance) => {
    setDay(null);
    if (mobile) navigate({ to: "/calendar/$occasion", params: { occasion: inst.occasion.slug } });
    else setOpen(inst);
  };
  const openEntry = (e: Entry) => e.kind === "public" ? openOccasion(e.inst) : navigate({ to: "/calendar/my-dates/$personId", params: { personId: e.person.id } });

  return <SiteShell><main className="bg-paper">
    {/* Hero */}
    <section className="surface-dark relative overflow-hidden">
      <div className="pattern-leaf pointer-events-none absolute inset-0 opacity-[0.06]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 md:py-24 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
        <div><Eyebrow dark>Gift Calendar</Eyebrow><div className="foil mt-5 h-px w-16" /><h1 className="mt-6 text-4xl text-on-dark md:text-6xl">Never miss a moment</h1><p className="mt-5 max-w-md text-on-dark-muted">Every gifting date of the year, with order-by dates so the box arrives on time. Add your own people and we will remind you.</p>
          <Button asChild variant="outline" className="mt-7 text-on-dark"><Link to="/calendar/my-dates">My dates</Link></Button></div>
        {nextUp && <article className="rounded-md border border-line-dark bg-nero-soft p-6 md:p-8">
          <p className="eyebrow text-gold">Next up</p>
          <h2 className="mt-4 text-2xl text-on-dark">{nextUp.occasion.name}</h2>
          <p className="mt-1 text-sm text-on-dark-muted">{formatLong(nextUp.date!)}</p>
          <p className="mt-6 font-sans text-5xl font-light tabular-nums text-gold">{daysUntil(nextUp.date!)}<span className="ml-3 font-sans text-sm uppercase tracking-[0.3em] text-on-dark-muted">days to go</span></p>
          {nextUp.orderBy && <p className="mt-4 text-sm text-on-dark">{daysUntil(nextUp.orderBy) < 0 ? "Order today for the best chance of delivery." : <>Order by <strong>{formatLong(nextUp.orderBy)}</strong></>}</p>}
          <Button asChild className="mt-6"><Link to="/shop" search={nextUp.occasion.shop}>Shop this occasion</Link></Button>
        </article>}
      </div>
    </section>

    {/* Controls */}
    <section className="mx-auto max-w-7xl px-5 py-10 md:py-14">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div role="tablist" aria-label="Calendar view" className="inline-flex w-fit rounded-md border border-border bg-ivory p-1">
          {(["month", "list", "year"] as const).map((v) => <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={cn("min-h-11 rounded-sm px-5 text-sm font-semibold capitalize transition-colors", view === v ? "bg-nero text-on-dark" : "text-nero hover:bg-paper")}>{v}</button>)}
        </div>
        <div className="flex items-center gap-3"><Switch id="corporate-view" checked={corporate} onCheckedChange={setCorporate} /><Label htmlFor="corporate-view">Corporate view</Label></div>
      </div>
      <div className={cn("mt-5 flex gap-2 overflow-x-auto pb-1", corporate && "pointer-events-none opacity-50")} aria-disabled={corporate}>
        {FILTERS.map(([k, label]) => <FilterChip key={k} active={!corporate && filter === k} onClick={() => setFilter(k)}>{label}</FilterChip>)}
      </div>
      <div className="mt-4 flex flex-wrap gap-5 text-xs text-muted-foreground"><span className="flex items-center gap-2"><span className="size-3 rounded-sm border-2 border-gold" /> Public occasion</span><span className="flex items-center gap-2"><span className="size-3 rounded-sm bg-gold" /> Your saved date</span></div>

      {/* Month */}
      {view === "month" && <div className="mt-8">
        <MonthNav cursor={cursor} setCursor={setCursor} />
        <MonthGrid y={cursor.y} m={cursor.m} byDate={byDate} today={today} onDay={setDay} />
      </div>}

      {/* List */}
      {view === "list" && <div className="mt-8 space-y-10">
        {groupByMonth(upcoming).map(([label, items]) => <section key={label}>
          <h2 className="text-sm">{label}</h2><GoldRule className="mt-3" />
          <ul className="mt-4 divide-y divide-border border-y border-border">{items.map((e) => <EntryRow key={e.key} entry={e} onOpen={() => openEntry(e)} />)}</ul>
        </section>)}
        {anytime.length > 0 && <section><h2 className="text-sm">All year</h2><GoldRule className="mt-3" /><ul className="mt-4 divide-y divide-border border-y border-border">{anytime.map((i) => <EntryRow key={i.occasion.slug} entry={{ kind: "public", key: i.occasion.slug, date: "", inst: i }} onOpen={() => openOccasion(i)} />)}</ul></section>}
        {upcoming.length === 0 && <p className="text-muted-foreground">No dates match this filter yet.</p>}
      </div>}

      {/* Year */}
      {view === "year" && <div className="mt-8">
        <div className="flex items-center justify-between"><Button variant="ghost" size="icon" aria-label="Previous year" onClick={() => setCursor((c) => ({ ...c, y: c.y - 1 }))}><ChevronLeft /></Button><h2 className="text-xl">{cursor.y}</h2><Button variant="ghost" size="icon" aria-label="Next year" onClick={() => setCursor((c) => ({ ...c, y: c.y + 1 }))}><ChevronRight /></Button></div>
        <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">{MONTHS.map((name, m) => <button key={name} onClick={() => { setCursor({ y: cursor.y, m }); setView("month"); }} className="rounded-md border border-border p-4 text-left transition-colors hover:border-nero">
          <h3 className="text-xs">{name}</h3>
          <MiniMonth y={cursor.y} m={m} byDate={byDate} />
        </button>)}</div>
      </div>}
    </section>

    {/* Corporate teaser */}
    <section className="bg-ivory py-16 md:py-20"><div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 md:flex-row md:items-center md:justify-between">
      <SectionHeading eyebrow="For teams" title="Gift on time, all year" intro="Have a whole team's birthdays and work anniversaries? Send us the list and we'll gift on time, all year." />
      <Button asChild><Link to="/corporate" hash="consultation">Talk to us</Link></Button>
    </div></section>

    {/* Day details */}
    <Dialog open={!!day} onOpenChange={(o) => !o && setDay(null)}>
      <DialogContent className="bg-paper">
        <DialogTitle>{day && formatLong(day)}</DialogTitle>
        <ul className="divide-y divide-border">{(day ? byDate.get(day) ?? [] : []).map((e) => <EntryRow key={e.key} entry={e} onOpen={() => openEntry(e)} compact />)}</ul>
        {day && !(byDate.get(day)?.length) && <p className="text-sm text-muted-foreground">Nothing on this day yet.</p>}
      </DialogContent>
    </Dialog>

    {/* Occasion drawer (desktop) */}
    <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-paper sm:max-w-xl">
        <SheetTitle className="sr-only">{open?.occasion.name}</SheetTitle>
        {open && <div className="pt-6"><OccasionDetail inst={open} compact /><Link to="/calendar/$occasion" params={{ occasion: open.occasion.slug }} className="mt-8 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">Open full page</Link></div>}
      </SheetContent>
    </Sheet>
  </main></SiteShell>;
}

function groupByMonth(entries: Entry[]) {
  const groups = new Map<string, Entry[]>();
  entries.forEach((e) => { const k = new Date(`${e.date}T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" }); groups.set(k, [...(groups.get(k) ?? []), e]); });
  return [...groups.entries()];
}

function EntryRow({ entry, onOpen, compact }: { entry: Entry; onOpen: () => void; compact?: boolean }) {
  if (entry.kind === "personal") {
    const d = daysUntil(entry.date);
    return <li className="flex items-center gap-4 py-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold text-sm font-bold text-nero">{initials(entry.person.name)}</span>
      <div className="min-w-0 flex-1"><p className="font-semibold">{entry.person.name}'s {entry.label.toLowerCase()}</p><p className="text-sm text-muted-foreground">{formatLong(entry.date)} · {d === 0 ? "Today" : `${d} days to go`}</p></div>
      <Button size="sm" onClick={onOpen}>Find a gift</Button>
    </li>;
  }
  const { inst } = entry;
  return <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4 sm:flex">
    <span className="hidden size-11 shrink-0 items-center justify-center rounded-md border-2 border-gold text-xs font-bold sm:flex">{inst.date && !inst.tbc ? new Date(`${inst.date}T00:00:00`).getDate() : "—"}</span>
    <button onClick={onOpen} className="min-w-0 flex-1 text-left"><p className="font-semibold hover:underline">{inst.occasion.name}</p><p className="text-sm text-muted-foreground">{inst.date && !inst.tbc ? <><DateLabel inst={inst} /> · </> : null}<Countdown inst={inst} /></p>{!compact && <p className="mt-1 hidden text-sm text-muted-foreground md:block">{inst.occasion.line}</p>}</button>
    <div className="flex flex-wrap justify-end gap-2">{!compact && <AddToCalendarButton inst={inst} className="hidden md:inline-flex" />}<Button size="sm" onClick={onOpen}>Find a gift</Button></div>
  </li>;
}

function MonthNav({ cursor, setCursor }: { cursor: { y: number; m: number }; setCursor: (f: (c: { y: number; m: number }) => { y: number; m: number }) => void }) {
  const shift = (d: number) => setCursor((c) => { const n = c.m + d; return { y: c.y + Math.floor(n / 12), m: ((n % 12) + 12) % 12 }; });
  return <div className="flex items-center justify-between"><Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => shift(-1)}><ChevronLeft /></Button><h2 className="text-xl">{MONTHS[cursor.m]} {cursor.y}</h2><Button variant="ghost" size="icon" aria-label="Next month" onClick={() => shift(1)}><ChevronRight /></Button></div>;
}

const cells = (y: number, m: number) => {
  const lead = (new Date(y, m, 1).getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const list = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => `${y}-${String(m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`)] as (string | null)[];
  while (list.length % 7) list.push(null);
  return list;
};

function MonthGrid({ y, m, byDate, today, onDay }: { y: number; m: number; byDate: Map<string, Entry[]>; today: string; onDay: (d: string) => void }) {
  return <div className="mt-4 overflow-hidden rounded-md border border-border">
    <div className="grid grid-cols-7 bg-ivory text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">{WEEKDAYS.map((d) => <div key={d} className="py-3">{d}</div>)}</div>
    <div className="grid grid-cols-7 gap-px bg-border">{cells(y, m).map((d, i) => {
      if (!d) return <div key={`e${i}`} className="min-h-24 bg-paper" />;
      const items = byDate.get(d) ?? [];
      return <button key={d} onClick={() => onDay(d)} aria-label={`${formatLong(d)}${items.length ? `, ${items.length} dates` : ""}`} className="min-h-24 bg-paper p-1.5 text-left align-top transition-colors hover:bg-ivory md:min-h-28 md:p-2">
        <span className={cn("inline-flex size-7 items-center justify-center rounded-full text-xs", d === today && "bg-nero font-bold text-on-dark")}>{Number(d.slice(8))}</span>
        <div className="mt-1 space-y-1">{items.slice(0, 3).map((e) => e.kind === "public"
          ? <span key={e.key} className="block truncate rounded-sm border border-gold px-1 py-0.5 text-[10px] font-semibold leading-tight md:text-xs">{e.inst.occasion.name}{e.inst.tbc ? " (TBC)" : ""}</span>
          : <span key={e.key} title={`${e.person.name}: ${e.label}`} className="inline-flex size-6 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-nero">{initials(e.person.name)}</span>)}
          {items.length > 3 && <span className="block text-[10px] text-muted-foreground">+{items.length - 3} more</span>}</div>
      </button>;
    })}</div>
  </div>;
}

function MiniMonth({ y, m, byDate }: { y: number; m: number; byDate: Map<string, Entry[]> }) {
  return <div className="mt-3 grid grid-cols-7 gap-0.5 text-center text-[10px]">{cells(y, m).map((d, i) => {
    const items = d ? byDate.get(d) ?? [] : [];
    const mine = items.some((e) => e.kind === "personal");
    return <span key={d ?? `e${i}`} className="relative flex h-5 items-center justify-center text-muted-foreground">{d ? Number(d.slice(8)) : ""}
      {items.length > 0 && <span className={cn("absolute bottom-0 size-1.5 rounded-full", mine ? "bg-gold" : "border border-gold")} />}</span>;
  })}</div>;
}
