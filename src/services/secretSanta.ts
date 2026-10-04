import { createStore } from "@/lib/store";
import { PRODUCTS } from "@/data/products";
import { DEMO_EXCHANGE, DEMO_MESSAGES, DEMO_PARTICIPANTS } from "@/data/secretSanta";
import { DEMO_EXCHANGE_ID, DEMO_PARTICIPANT_ID, MAX_WISHLIST, MIN_DATE_GAP_DAYS, MIN_TO_DRAW, SANTA_NOTE } from "@/config/secretSanta";
import { daysUntil, todayIso } from "@/services/calendar";
import type { Exchange, ExchangeDates, Match, Message, Participant, SantaGiftOrder } from "@/types/secretSanta";

export interface SantaState {
  exchanges: Exchange[];
  participants: Participant[];
  matches: Match[];
  messages: Message[];
  orders: SantaGiftOrder[];
  /** Which participant this device is, per exchange. */
  session: Record<string, string>;
  role: "organiser" | "participant";
}

const initial = (): SantaState => ({
  exchanges: [DEMO_EXCHANGE], participants: DEMO_PARTICIPANTS, matches: [], messages: DEMO_MESSAGES, orders: [],
  session: { [DEMO_EXCHANGE_ID]: DEMO_PARTICIPANT_ID }, role: "participant",
});
export const santaStore = createStore<SantaState>("bbd-santa", initial());
const delay = <T,>(v: T, ms = 120) => new Promise<T>((r) => setTimeout(() => r(v), ms));
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;
const patch = (fn: (s: SantaState) => Partial<SantaState>) => { const s = santaStore.get(); santaStore.set({ ...s, ...fn(s) }); };
const updateParticipant = (id: string, p: Partial<Participant>) => patch((s) => ({ participants: s.participants.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
const updateExchange = (id: string, p: Partial<Exchange>) => patch((s) => ({ exchanges: s.exchanges.map((x) => (x.id === id ? { ...x, ...p } : x)) }));

export async function resetDemo() { santaStore.set(initial()); }
export async function setRole(role: SantaState["role"]) { patch(() => ({ role })); }

/* ---------- Reads (scoped helpers) ---------- */
export const exchangeById = (s: SantaState, id: string) => s.exchanges.find((e) => e.id === id) ?? null;
export const participantsOf = (s: SantaState, id: string) => s.participants.filter((p) => p.exchangeId === id);
export const joinedCount = (s: SantaState, id: string) => participantsOf(s, id).filter((p) => p.status !== "invited").length;

export type CodeCheck = { ok: true; exchange: Exchange } | { ok: false; reason: "invalid" | "closed" | "full" | "expired" };
export async function checkCode(code: string): Promise<CodeCheck> {
  const s = santaStore.get();
  const e = s.exchanges.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
  if (!e) return delay({ ok: false, reason: "invalid" });
  if (e.status === "closed" || e.status === "complete") return delay({ ok: false, reason: "closed" });
  if (e.status === "drawn" || daysUntil(e.dates.joinBy) < 0) return delay({ ok: false, reason: "expired" });
  if (joinedCount(s, e.id) >= e.maxParticipants) return delay({ ok: false, reason: "full" });
  return delay({ ok: true, exchange: e });
}

/** A participant can only ever see their own match. */
export function myMatch(s: SantaState, exchangeId: string, participantId: string) {
  const m = s.matches.find((x) => x.exchangeId === exchangeId && x.giverId === participantId);
  return m ? s.participants.find((p) => p.id === m.receiverId) ?? null : null;
}
/** Organiser sees matches only when they opted in before the draw. */
export function organiserMatches(s: SantaState, exchangeId: string) {
  const e = exchangeById(s, exchangeId);
  return e?.showMatches ? s.matches.filter((m) => m.exchangeId === exchangeId) : [];
}

/* ---------- Organiser ---------- */
export function dateWarnings(d: ExchangeDates): string[] {
  const order: [keyof ExchangeDates, string][] = [["joinBy", "Join by"], ["draw", "Draw date"], ["orderBy", "Order by"], ["exchange", "Exchange day"]];
  const w: string[] = [];
  if (d.joinBy && daysUntil(d.joinBy) < 0) w.push("The join-by date is in the past.");
  for (let i = 1; i < order.length; i++) {
    const [a, la] = order[i - 1]!; const [b, lb] = order[i]!;
    if (!d[a] || !d[b]) continue;
    const gap = daysUntil(d[b], d[a]);
    if (gap < 0) w.push(`${lb} must come after ${la.toLowerCase()}.`);
    else if (gap < MIN_DATE_GAP_DAYS) w.push(`${la} and ${lb.toLowerCase()} are only ${gap} ${gap === 1 ? "day" : "days"} apart. Allow at least ${MIN_DATE_GAP_DAYS}.`);
  }
  return w;
}

const makeCode = () => { const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; return Array.from({ length: 6 }, () => c[Math.floor(Math.random() * c.length)]).join(""); };
export type NewExchange = Omit<Exchange, "id" | "code" | "status" | "createdAt" | "exclusions" | "showMatches" | "maxParticipants" | "allowReveal">;
export async function createExchange(input: NewExchange) {
  const id = uid("ex");
  const exchange: Exchange = { ...input, id, code: makeCode(), status: "open", createdAt: new Date().toISOString(), exclusions: [], showMatches: false, allowReveal: true, maxParticipants: 200 };
  const organiser: Participant | null = input.organiserTakesPart ? { id: uid("pt"), exchangeId: id, name: input.organiserName, contact: "", status: "joined", wishlist: [], likes: "", dislikes: "", sizes: "", noAlcohol: false, isOrganiser: true } : null;
  patch((s) => ({ exchanges: [...s.exchanges, exchange], participants: organiser ? [...s.participants, organiser] : s.participants, session: organiser ? { ...s.session, [id]: organiser.id } : s.session, role: "organiser" }));
  return delay(exchange);
}

export async function invitePeople(exchangeId: string, people: { name: string; contact: string }[]) {
  const add = people.filter((p) => p.name.trim()).map((p): Participant => ({ id: uid("pt"), exchangeId, name: p.name.trim(), contact: p.contact.trim(), status: "invited", wishlist: [], likes: "", dislikes: "", sizes: "", noAlcohol: false }));
  patch((s) => ({ participants: [...s.participants, ...add] }));
  return add.length;
}
/** Parses "Name, email or phone" lines (also works for simple CSV files). */
export function parsePeopleList(text: string) {
  return text.split(/\r?\n/).map((l) => l.split(/[,;\t]/).map((x) => x.trim())).filter(([n]) => n && !/^name$/i.test(n)).map(([name = "", contact = ""]) => ({ name, contact }));
}
export async function removeParticipant(id: string) { patch((s) => ({ participants: s.participants.filter((p) => p.id !== id) })); }
export async function addExclusion(exchangeId: string, a: string, b: string) {
  const e = exchangeById(santaStore.get(), exchangeId);
  if (!e || a === b || e.exclusions.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return;
  updateExchange(exchangeId, { exclusions: [...e.exclusions, [a, b]] });
}
export async function removeExclusion(exchangeId: string, index: number) {
  const e = exchangeById(santaStore.get(), exchangeId);
  if (e) updateExchange(exchangeId, { exclusions: e.exclusions.filter((_, i) => i !== index) });
}
export async function updateExchangeSettings(id: string, p: Partial<Pick<Exchange, "dates" | "showMatches" | "allowReveal" | "status">>) { updateExchange(id, p); }
export async function postAnnouncement(exchangeId: string, body: string) {
  patch((s) => ({ messages: [...s.messages, { id: uid("msg"), exchangeId, kind: "announcement", fromId: "organiser", body, at: new Date().toISOString() }] }));
}
/** Placeholder: marks exchange day as done and all gifts delivered. */
export async function completeExchange(id: string) {
  patch((s) => ({
    exchanges: s.exchanges.map((e) => (e.id === id ? { ...e, status: "complete" } : e)),
    orders: s.orders.map((o) => (o.exchangeId === id ? { ...o, status: "delivered" } : o)),
    participants: s.participants.map((p) => (p.exchangeId === id && p.status === "ordered" ? { ...p, status: "delivered" } : p)),
  }));
}

/**
 * Draws names: nobody draws themselves and excluded pairs never draw each other.
 * Only joined participants take part.
 */
export async function drawNames(exchangeId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const s = santaStore.get();
  const people = participantsOf(s, exchangeId).filter((p) => p.status !== "invited");
  const e = exchangeById(s, exchangeId);
  if (!e) return { ok: false, message: "Exchange not found." };
  if (people.length < MIN_TO_DRAW) return { ok: false, message: `At least ${MIN_TO_DRAW} people need to join before the draw.` };
  const blocked = (a: string, b: string) => a === b || e.exclusions.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const ids = people.map((p) => p.id);
  for (let attempt = 0; attempt < 2000; attempt++) {
    const r = [...ids];
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j]!, r[i]!]; }
    if (ids.every((g, i) => !blocked(g, r[i]!))) {
      patch((st) => ({
        matches: [...st.matches.filter((m) => m.exchangeId !== exchangeId), ...ids.map((g, i) => ({ exchangeId, giverId: g, receiverId: r[i]! }))],
        exchanges: st.exchanges.map((x) => (x.id === exchangeId ? { ...x, status: "drawn" } : x)),
      }));
      return delay({ ok: true }, 300);
    }
  }
  return { ok: false, message: "These exclusions make a fair draw impossible. Remove one and try again." };
}

/* ---------- Participant ---------- */
export async function joinExchange(exchangeId: string, input: Pick<Participant, "name" | "contact">) {
  const s = santaStore.get();
  const invited = participantsOf(s, exchangeId).find((p) => p.status === "invited" && p.contact && p.contact.toLowerCase() === input.contact.toLowerCase());
  const id = invited?.id ?? uid("pt");
  if (invited) updateParticipant(id, { name: input.name, status: "joined" });
  else patch((st) => ({ participants: [...st.participants, { id, exchangeId, name: input.name, contact: input.contact, status: "joined", wishlist: [], likes: "", dislikes: "", sizes: "", noAlcohol: false }] }));
  patch((st) => ({ session: { ...st.session, [exchangeId]: id }, role: "participant" }));
  return delay(id);
}
export async function saveHelpYourSanta(id: string, p: Pick<Participant, "likes" | "dislikes" | "sizes" | "noAlcohol"> & { address?: string; wishlist: string[] }) {
  const cur = santaStore.get().participants.find((x) => x.id === id);
  updateParticipant(id, {
    likes: p.likes, dislikes: p.dislikes, sizes: p.sizes, noAlcohol: p.noAlcohol, ...(p.address !== undefined ? { address: p.address } : {}),
    wishlist: p.wishlist.slice(0, MAX_WISHLIST).map((productId) => ({ productId, addedAt: todayIso() })),
    ...(cur && (cur.status === "joined" || cur.status === "wishlist") ? { status: p.wishlist.length ? "wishlist" : "joined" } : {}),
  });
}
export async function toggleWishlistItem(id: string, productId: string) {
  const p = santaStore.get().participants.find((x) => x.id === id);
  if (!p) return false;
  const has = p.wishlist.some((w) => w.productId === productId);
  if (!has && p.wishlist.length >= MAX_WISHLIST) return false;
  const wishlist = has ? p.wishlist.filter((w) => w.productId !== productId) : [...p.wishlist, { productId, addedAt: todayIso() }];
  updateParticipant(id, { wishlist, ...(p.status === "joined" || p.status === "wishlist" ? { status: wishlist.length ? "wishlist" : "joined" } : {}) });
  return true;
}
export async function updateDelivery(id: string, address: string) { updateParticipant(id, { address }); }

export const giftsWithinBudget = (budget: number, wishlistFirst: string[] = []) =>
  PRODUCTS.filter((p) => p.inStock && p.category !== "gift-cards" && p.price <= budget)
    .sort((a, b) => Number(wishlistFirst.includes(b.id)) - Number(wishlistFirst.includes(a.id)) || a.price - b.price);

export async function orderSantaGift(exchangeId: string, giverId: string, productId: string) {
  const receiver = myMatch(santaStore.get(), exchangeId, giverId);
  if (!receiver) throw new Error("No match yet");
  const order: SantaGiftOrder = { id: uid("sso"), exchangeId, giverId, receiverId: receiver.id, productId, note: SANTA_NOTE, status: "ordered", at: new Date().toISOString() };
  patch((s) => ({ orders: [...s.orders, order] }));
  const giver = santaStore.get().participants.find((p) => p.id === giverId);
  if (giver && giver.status !== "delivered") updateParticipant(giverId, { status: "ordered" });
  return delay(order, 400);
}
export const orderBy = (s: SantaState, exchangeId: string, giverId: string) => s.orders.find((o) => o.exchangeId === exchangeId && o.giverId === giverId) ?? null;
export const orderFor = (s: SantaState, exchangeId: string, receiverId: string) => s.orders.find((o) => o.exchangeId === exchangeId && o.receiverId === receiverId) ?? null;

/** Anonymous question to your giftee ("recipient") or to your Santa ("santa"). */
export async function sendQuestion(exchangeId: string, fromId: string, to: "recipient" | "santa", body: string) {
  const s = santaStore.get();
  const toId = to === "recipient" ? s.matches.find((m) => m.exchangeId === exchangeId && m.giverId === fromId)?.receiverId : s.matches.find((m) => m.exchangeId === exchangeId && m.receiverId === fromId)?.giverId;
  if (!toId) return;
  patch((st) => ({ messages: [...st.messages, { id: uid("msg"), exchangeId, kind: "question", fromId, toId, body, at: new Date().toISOString() }] }));
}
export async function sendThanks(exchangeId: string, fromId: string, body: string) {
  const s = santaStore.get();
  const toId = s.matches.find((m) => m.exchangeId === exchangeId && m.receiverId === fromId)?.giverId;
  if (!toId) return;
  patch((st) => ({ messages: [...st.messages, { id: uid("msg"), exchangeId, kind: "thanks", fromId, toId, body, at: new Date().toISOString() }] }));
}
/** Reveals your Santa only on exchange day, when the organiser allows it. */
export function revealMySanta(s: SantaState, exchangeId: string, me: string) {
  const e = exchangeById(s, exchangeId);
  if (!e?.allowReveal || !(e.status === "complete" || daysUntil(e.dates.exchange) <= 0)) return null;
  const m = s.matches.find((x) => x.exchangeId === exchangeId && x.receiverId === me);
  return m ? s.participants.find((p) => p.id === m.giverId) ?? null : null;
}

export function exportParticipantsCsv(s: SantaState, exchangeId: string) {
  const rows = [["Name", "Contact", "Status"], ...participantsOf(s, exchangeId).map((p) => [p.name, p.contact, p.status])];
  const csv = rows.map((r) => r.map((c) => `"${c.replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a"); a.href = url; a.download = "secret-santa-participants.csv"; a.click(); URL.revokeObjectURL(url);
}

export const STAGES = [["joinBy", "Join by"], ["draw", "Draw"], ["orderBy", "Order by"], ["exchange", "Exchange day"]] as const;
/** Index of the next upcoming key date (4 when all have passed). */
export function currentStage(e: Exchange) {
  const i = STAGES.findIndex(([k]) => daysUntil(e.dates[k]) >= 0);
  return i === -1 ? 4 : i;
}
