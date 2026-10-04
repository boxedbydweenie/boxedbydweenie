import { OCCASIONS } from "@/data/occasions";
import { PRODUCTS } from "@/data/products";
import { createStore } from "@/lib/store";
import type { Occasion, OccasionInstance, Person, PersonalDate, ScheduledGift } from "@/types/calendar";
import type { ShopProduct } from "@/types/shop";

const delay = <T,>(v: T, ms = 80) => new Promise<T>((r) => setTimeout(() => r(v), ms));
const pad = (n: number) => String(n).padStart(2, "0");
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (iso: string) => new Date(`${iso}T00:00:00`);
export const todayIso = () => isoDate(new Date());
export const daysUntil = (iso: string, from = todayIso()) => Math.round((parse(iso).getTime() - parse(from).getTime()) / 86400000);
export const addDays = (iso: string, n: number) => { const d = parse(iso); d.setDate(d.getDate() + n); return isoDate(d); };
export const formatLong = (iso: string) => parse(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long" });

function dateFor(o: Occasion, year: number): { date: string | null; tbc: boolean } {
  const r = o.rule;
  if (r.type === "fixed") return { date: `${year}-${pad(r.month)}-${pad(r.day)}`, tbc: false };
  if (r.type === "nth-weekday") {
    const d = new Date(year, r.month - 1, 1);
    d.setDate(1 + ((r.weekday - d.getDay() + 7) % 7) + (r.nth - 1) * 7 + (r.offsetDays ?? 0));
    return { date: isoDate(d), tbc: false };
  }
  if (r.type === "moveable") {
    const c = r.confirmed[year];
    return c ? { date: c, tbc: false } : { date: `${year}-${pad(r.estimate.month)}-${pad(r.estimate.day)}`, tbc: true };
  }
  return { date: null, tbc: false };
}

const instance = (o: Occasion, year: number): OccasionInstance => {
  const { date, tbc } = dateFor(o, year);
  return { occasion: o, date, tbc, orderBy: date && !tbc ? addDays(date, -o.orderByOffsetDays) : null };
};

/** Every occasion placed in the given year. */
export const getOccasionsForYear = (year: number) => delay(OCCASIONS.map((o) => instance(o, year)));

/** The next occurrence of each dated occasion, soonest first. */
export function upcomingOccasionsSync(from = todayIso()): OccasionInstance[] {
  const y = Number(from.slice(0, 4));
  return OCCASIONS.map((o) => { const a = instance(o, y); return a.date && a.date < from ? instance(o, y + 1) : a; })
    .filter((i) => i.date)
    .sort((a, b) => a.date!.localeCompare(b.date!));
}
export const getUpcomingOccasions = (limit?: number) => delay(upcomingOccasionsSync().slice(0, limit));
/** Soonest occasion with a confirmed date. */
export const getNextUp = () => delay(upcomingOccasionsSync().find((i) => !i.tbc) ?? null);
export const getOccasion = (slug: string) => {
  const o = OCCASIONS.find((x) => x.slug === slug);
  if (!o) return delay(null);
  return delay(o.rule.type === "anytime" ? instance(o, new Date().getFullYear()) : upcomingOccasionsSync().find((i) => i.occasion.slug === slug) ?? null);
};

/** Six products for an occasion, from its linked shop filter, topped up with bestsellers. */
export function curatedProducts(o: Occasion, count = 6): ShopProduct[] {
  const s = o.shop;
  const match = PRODUCTS.filter((p) => p.inStock && (
    (s.occasion && p.occasions.includes(s.occasion)) || (s.recipient && p.recipients.includes(s.recipient)) || (s.type && p.category === s.type) ||
    (o.category === "workplace" && p.corporateEligible)));
  const rest = [...PRODUCTS].sort((a, b) => a.featured - b.featured).filter((p) => !match.includes(p));
  return [...match, ...rest].slice(0, count);
}

/** Placeholder .ics download. A real backend could serve this instead. */
export function downloadIcs(title: string, date: string, description = "") {
  const d = date.replaceAll("-", "");
  const end = addDays(date, 1).replaceAll("-", "");
  const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Boxed by Dweenie//Gift Calendar//EN", "BEGIN:VEVENT", `UID:${d}-${title.replace(/\W/g, "")}@boxedbydweenie.com`, `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${end}`, `SUMMARY:${title}`, `DESCRIPTION:${description}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url; a.download = `${title.replace(/\W+/g, "-").toLowerCase()}.ics`; a.click();
  URL.revokeObjectURL(url);
}

/* ---------- My dates ---------- */
export const peopleStore = createStore<Person[]>("bbd-people", []);
export const scheduledStore = createStore<ScheduledGift[]>("bbd-scheduled-gifts", []);
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

export const getPeople = () => delay(peopleStore.get());
export const getPerson = (id: string) => delay(peopleStore.get().find((p) => p.id === id) ?? null);

export type NewPerson = Omit<Person, "id" | "createdAt" | "dates"> & { dates: Omit<PersonalDate, "id" | "personId">[] };
export async function addPerson(input: NewPerson) {
  const id = uid("per");
  const person: Person = { ...input, id, createdAt: new Date().toISOString(), dates: input.dates.map((d) => ({ ...d, id: uid("dt"), personId: id })) };
  peopleStore.set([...peopleStore.get(), person]);
  return person;
}
export async function updatePerson(person: Person) {
  peopleStore.set(peopleStore.get().map((p) => (p.id === person.id ? person : p)));
}
export async function removePerson(id: string) {
  peopleStore.set(peopleStore.get().filter((p) => p.id !== id));
}

/** Next ISO occurrence of a day/month on or after `from`. */
export function nextOccurrence(d: Pick<PersonalDate, "day" | "month">, from = todayIso()) {
  const y = Number(from.slice(0, 4));
  const iso = `${y}-${pad(d.month)}-${pad(d.day)}`;
  return iso >= from ? iso : `${y + 1}-${pad(d.month)}-${pad(d.day)}`;
}
export function nextDateFor(p: Person) {
  return p.dates.map((d) => ({ date: d, on: nextOccurrence(d) })).sort((a, b) => a.on.localeCompare(b.on))[0] ?? null;
}
export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

const RELATION_TAGS: Record<string, string[]> = { Partner: ["her", "him", "couples"], Parent: ["her", "him"], Sibling: ["her", "him"], Child: ["children"], Friend: ["her", "him"], Colleague: ["colleagues"], Client: ["colleagues"], Other: [] };
/** Gift ideas within budget, avoiding alcohol when asked, leaning on likes. */
export function giftIdeas(p: Person, count = 4): ShopProduct[] {
  const likes = p.notes.likes.toLowerCase().split(/[,\s]+/).filter((w) => w.length > 2);
  const tags = RELATION_TAGS[p.relationship] ?? [];
  const alcohol = /wine|champagne|spirit|whisky|gin|prosecco/i;
  return PRODUCTS.filter((x) => x.inStock && x.category !== "gift-cards" && (!p.notes.budget || x.price <= p.notes.budget) && !(p.notes.noAlcohol && x.inside.some((i) => alcohol.test(i))))
    .map((x) => ({ x, score: (x.recipients.some((r) => tags.includes(r)) ? 2 : 0) + likes.filter((l) => `${x.name} ${x.line} ${x.inside.join(" ")}`.toLowerCase().includes(l)).length * 3 }))
    .sort((a, b) => b.score - a.score || a.x.featured - b.x.featured).slice(0, count).map((s) => s.x);
}

export async function scheduleGift(g: Omit<ScheduledGift, "id" | "status">) {
  const gift: ScheduledGift = { ...g, id: uid("gift"), status: "scheduled" };
  scheduledStore.set([...scheduledStore.get(), gift]);
  return gift;
}
export const giftsFor = (personId: string, all: ScheduledGift[]) => all.filter((g) => g.personId === personId).sort((a, b) => b.deliveryDate.localeCompare(a.deliveryDate));
