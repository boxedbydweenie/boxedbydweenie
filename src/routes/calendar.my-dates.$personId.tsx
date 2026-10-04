import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Gift, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site/SiteShell";
import { Button, Eyebrow, GoldRule, ProductCard } from "@/components/site/Brand";
import { MyDatesGate } from "@/components/calendar/MyDatesGate";
import { PersonAvatar } from "@/components/calendar/PersonAvatar";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePeople, useScheduledGifts } from "@/hooks/use-calendar";
import { useUser } from "@/hooks/use-shop";
import { daysUntil, downloadIcs, formatLong, giftIdeas, giftsFor, nextOccurrence, removePerson, scheduleGift, todayIso } from "@/services/calendar";
import { getProductById } from "@/services/products";
import { formatNaira } from "@/lib/format";

export const Route = createFileRoute("/calendar/my-dates/$personId")({
  head: () => ({ meta: [
    { title: "Saved person — My dates — Boxed by Dweenie" },
    { name: "description", content: "Upcoming dates, gift ideas and gift history for someone you care about." },
    { property: "og:title", content: "My dates — Boxed by Dweenie" },
    { property: "og:description", content: "Upcoming dates, gift ideas and gift history." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: PersonPage,
});

function PersonPage() {
  const { personId } = Route.useParams();
  const user = useUser();
  const people = usePeople();
  const scheduled = useScheduledGifts();
  const navigate = useNavigate();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const person = people.find((p) => p.id === personId);

  if (!user) return <SiteShell><main className="mx-auto max-w-5xl px-5 py-16"><MyDatesGate /></main></SiteShell>;
  if (!person) return <SiteShell><main className="mx-auto max-w-xl px-5 py-24 text-center"><h1 className="text-2xl">Person not found</h1><p className="mt-3 text-muted-foreground">They may have been removed from this device.</p><Button asChild className="mt-6"><Link to="/calendar/my-dates">Back to my dates</Link></Button></main></SiteShell>;

  const upcoming = person.dates.map((d) => ({ d, on: nextOccurrence(d) })).sort((a, b) => a.on.localeCompare(b.on));
  const ideas = giftIdeas(person, 4);
  const gifts = giftsFor(person.id, scheduled);
  const today = todayIso();

  return <SiteShell><main className="bg-paper">
    <div className="border-b border-border bg-ivory"><div className="mx-auto max-w-5xl px-5 py-10">
      <Link to="/calendar/my-dates" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><ArrowLeft className="size-4" /> My dates</Link>
      <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5 sm:flex">
        <PersonAvatar person={person} className="size-16 text-lg" />
        <div className="min-w-0 flex-1"><Eyebrow>{person.relationship}</Eyebrow><h1 className="mt-2 truncate text-3xl">{person.name}</h1></div>
        <div className="col-span-2 flex gap-2"><Button onClick={() => setScheduleOpen(true)}><Gift /> Schedule a gift</Button><Button variant="ghost" size="icon" aria-label={`Remove ${person.name}`} onClick={async () => { await removePerson(person.id); navigate({ to: "/calendar/my-dates" }); }}><Trash2 /></Button></div>
      </div>
    </div></div>

    <div className="mx-auto grid max-w-5xl gap-12 px-5 py-10 lg:grid-cols-[1fr_1.4fr]">
      <section>
        <h2 className="text-sm">Upcoming dates</h2><GoldRule className="mt-3" />
        <ul className="mt-4 divide-y divide-border border-y border-border">{upcoming.map(({ d, on }) => <li key={d.id} className="flex items-center justify-between gap-3 py-4">
          <div><p className="font-semibold">{d.label}</p><p className="text-sm text-muted-foreground">{formatLong(on)}{d.year ? ` · since ${d.year}` : ""}</p></div>
          <div className="text-right"><p className="text-sm font-semibold">{daysUntil(on) === 0 ? "Today" : `${daysUntil(on)} days`}</p><button className="text-xs underline underline-offset-4" onClick={() => downloadIcs(`${person.name}: ${d.label}`, on)}>Add to my calendar</button></div>
        </li>)}</ul>
        <h2 className="mt-10 text-sm">Notes</h2><GoldRule className="mt-3" />
        <dl className="mt-4 space-y-2 text-sm">
          {person.notes.likes && <div><dt className="inline font-semibold">Likes: </dt><dd className="inline">{person.notes.likes}</dd></div>}
          {person.notes.dislikes && <div><dt className="inline font-semibold">Dislikes: </dt><dd className="inline">{person.notes.dislikes}</dd></div>}
          {person.notes.sizes && <div><dt className="inline font-semibold">Sizes: </dt><dd className="inline">{person.notes.sizes}</dd></div>}
          <div><dt className="inline font-semibold">Usual budget: </dt><dd className="inline">{person.notes.budget ? formatNaira(person.notes.budget) : "Not set"}</dd></div>
          {person.notes.noAlcohol && <div className="font-semibold">No alcohol</div>}
          <div className="text-muted-foreground">Reminders {person.reminder.daysBefore.sort((a, b) => b - a).join(", ")} days before by {person.reminder.channels.map((c) => c === "sms" ? "SMS" : c === "whatsapp" ? "WhatsApp" : "email").join(" and ")}.</div>
        </dl>
      </section>

      <section>
        <h2 className="text-sm">Gift ideas for {person.name.split(" ")[0]}</h2><GoldRule className="mt-3" />
        <p className="mt-3 text-sm text-muted-foreground">Matched to their notes{person.notes.budget ? ` and a budget of ${formatNaira(person.notes.budget)}` : ""}.</p>
        {ideas.length ? <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8">{ideas.map((p) => <ProductCard key={p.id} product={{ id: p.id, slug: p.slug, name: p.name, line: p.line, price: p.price, inStock: p.inStock }} />)}</div> : <p className="mt-6 text-sm">No gifts fit this budget yet. <Link to="/shop" className="underline">Browse the shop</Link>.</p>}
      </section>
    </div>

    <section className="bg-ivory py-12"><div className="mx-auto max-w-5xl px-5">
      <h2 className="text-lg">What you sent before</h2><GoldRule className="mt-3" />
      {gifts.length === 0 ? <p className="mt-5 text-sm text-muted-foreground">Nothing yet. Scheduled and sent gifts for {person.name} will appear here.</p> : <ol className="mt-6 border-l border-nero/20 pl-6">{gifts.map((g) => { const p = getProductById(g.productId); return <li key={g.id} className="relative pb-6"><span className="absolute -left-[31px] top-1 size-3 rounded-full bg-gold" />
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{formatLong(g.deliveryDate)} · {g.deliveryDate >= today ? "Scheduled, confirm later" : "Sent"}</p>
        <p className="mt-1 font-semibold">{p?.name ?? "Gift"}{p ? ` · ${formatNaira(p.price)}` : ""}</p><p className="text-sm text-muted-foreground">{g.occasionLabel}</p></li>; })}</ol>}
    </div></section>

    <ScheduleDialog open={scheduleOpen} onOpenChange={setScheduleOpen} personId={person.id} ideas={ideas.length ? ideas : giftIdeas({ ...person, notes: { ...person.notes, budget: 0 } }, 6)} dates={upcoming.map(({ d, on }) => ({ label: d.label, on }))} />
  </main></SiteShell>;
}

function ScheduleDialog({ open, onOpenChange, personId, ideas, dates }: { open: boolean; onOpenChange: (o: boolean) => void; personId: string; ideas: { id: string; name: string; price: number }[]; dates: { label: string; on: string }[] }) {
  const [productId, setProductId] = useState("");
  const [occasion, setOccasion] = useState(dates[0]?.label ?? "Just because");
  const [date, setDate] = useState(dates[0]?.on ?? todayIso());
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="bg-paper">
      <DialogTitle>Schedule a gift</DialogTitle>
      <DialogDescription>Choose a gift now and set the delivery date. You can confirm and pay later.</DialogDescription>
      <form className="grid gap-4" onSubmit={async (e) => { e.preventDefault(); if (!productId) return; await scheduleGift({ personId, productId, deliveryDate: date, occasionLabel: occasion }); toast("Gift scheduled. We will remind you to confirm."); onOpenChange(false); }}>
        <div><Label>Gift</Label><Select value={productId} onValueChange={setProductId}><SelectTrigger className="mt-2 min-h-11"><SelectValue placeholder="Choose a gift" /></SelectTrigger><SelectContent>{ideas.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} · {formatNaira(p.price)}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>For</Label><Select value={occasion} onValueChange={(v) => { setOccasion(v); const d = dates.find((x) => x.label === v); if (d) setDate(d.on); }}><SelectTrigger className="mt-2 min-h-11"><SelectValue /></SelectTrigger><SelectContent>{[...dates.map((d) => d.label), "Just because"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
        <div><Label htmlFor="delivery-date">Delivery date</Label><Input id="delivery-date" type="date" min={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 min-h-11" required /></div>
        <Button type="submit" disabled={!productId}>Schedule gift</Button>
      </form>
    </DialogContent>
  </Dialog>;
}
