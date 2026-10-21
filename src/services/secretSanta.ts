import { toast } from "sonner";
import { callSanta } from "@/lib/api";
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
  /** Secret keys for real (server) exchanges: organiser key per exchange, participant key per participant. */
  tokens?: Record<string, string>;
}

const initial = (): SantaState => ({
  exchanges: [DEMO_EXCHANGE], participants: DEMO_PARTICIPANTS, matches: [], messages: DEMO_MESSAGES, orders: [],
  session: { [DEMO_EXCHANGE_ID]: DEMO_PARTICIPANT_ID }, role: "participant",
});
export const santaStore = createStore<SantaState>("bbd-santa", initial());
/* ---------- Server (real exchanges). The demo exchange stays local. ---------- */
interface ServerView { exchange: Exchange; participants: Participant[]; matches: Match[]; messages: Message[]; orders: SantaGiftOrder[]; isOrganiser: boolean; meId: string | null }
const isDemo = (id: string) => id === DEMO_EXCHANGE_ID;
function applyView(v: ServerView) {
  const id = v.exchange.id;
  patch((s) => ({
    exchanges: [...s.exchanges.filter((e) => e.id !== id), v.exchange],
    participants: [...s.participants.filter((p) => p.exchangeId !== id), ...v.participants],
    matches: [...s.matches.filter((m) => m.exchangeId !== id), ...v.matches],
    messages: [...s.messages.filter((m) => m.exchangeId !== id), ...v.messages],
    orders: [...s.orders.filter((o) => o.exchangeId !== id), ...v.orders],
    session: v.meId ? { ...s.session, [id]: v.meId } : s.session,
  }));
}
const authFor = (id: string) => {
  const s = santaStore.get(), pid = s.session[id], t = s.tokens ?? {};
  return { id, ...(t[`o:${id}`] ? { orgToken: t[`o:${id}`] } : {}), ...(pid && t[`p:${pid}`] ? { pid, pToken: t[`p:${pid}`] } : {}) };
};
const saveTokens = (add: Record<string, string>) => patch((s) => ({ tokens: { ...(s.tokens ?? {}), ...add } }));
const exchangeOfParticipant = (pid: string) => santaStore.get().participants.find((p) => p.id === pid)?.exchangeId ?? "";
/** Calls the server for one exchange and shows the result. Failures are shown to the person, then re-thrown. */
async function remote(exId: string, action: string, extra: Record<string, unknown> = {}) {
  try {
    const r = await callSanta<{ view: ServerView } & Record<string, unknown>>({ action, ...authFor(exId), ...extra });
    applyView(r.view);
    return r;
  } catch (e) { toast.error(e instanceof Error ? e.message : "Something went wrong."); throw e; }
}
/** Re-reads an exchange from the server (other people's joins, messages, the draw). */
export async function refreshExchange(id: string) {
  if (isDemo(id) || !(authFor(id).orgToken || authFor(id).pToken)) return;
  try { const r = await callSanta<{ view: ServerView }>({ action: "get", ...authFor(id) }); applyView(r.view); } catch { /* keep what we have */ }
}
/** Lets an organiser open their exchange on another device with the secret link. */
export function adoptOrganiserKey(id: string, key: string) { if (key) saveTokens({ [`o:${id}`]: key }); }
export function adoptKeys(id: string, k: { org: string; pid: string; pToken: string }) {
  if (k.org) saveTokens({ [`o:${id}`]: k.org });
  if (k.pid && k.pToken) { saveTokens({ [`p:${k.pid}`]: k.pToken }); patch((s) => ({ session: { ...s.session, [id]: k.pid } })); }
}
export const participantKey = (id: string) => { const s = santaStore.get(); const pid = s.session[id]; return pid ? { pid, token: (s.tokens ?? {})[`p:${pid}`] ?? "" } : null; };
export const organiserKey = (id: string) => (santaStore.get().tokens ?? {})[`o:${id}`] ?? "";

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

let pendingCode = "";
export type CodeCheck = { ok: true; exchange: Exchange } | { ok: false; reason: "invalid" | "closed" | "full" | "expired" };
export async function checkCode(code: string): Promise<CodeCheck> {
  const s = santaStore.get();
  const e = s.exchanges.find((x) => isDemo(x.id) && x.code.toUpperCase() === code.trim().toUpperCase());
  if (!e) {
    try { const r = await callSanta<CodeCheck>({ action: "check-code", code }); if (r.ok) { pendingCode = code.trim().toUpperCase(); patch((st) => ({ exchanges: [...st.exchanges.filter((e) => e.id !== r.exchange.id), r.exchange] })); } return r; } catch { return { ok: false, reason: "invalid" }; }
  }
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
  try {
    const r = await callSanta<{ exchangeId: string; orgToken: string; participantId: string | null; pToken: string | null; view: ServerView }>({ action: "create", exchange: input });
    saveTokens({ [`o:${r.exchangeId}`]: r.orgToken, ...(r.participantId && r.pToken ? { [`p:${r.participantId}`]: r.pToken } : {}) });
    applyView(r.view); patch(() => ({ role: "organiser" }));
    return r.view.exchange;
  } catch (e) { toast.error(e instanceof Error ? e.message : "We could not create the exchange."); throw e; }
}
export async function invitePeople(exchangeId: string, people: { name: string; contact: string }[]) {
  if (!isDemo(exchangeId)) { const r = await remote(exchangeId, "invite", { people }); return Number(r["added"] ?? 0); }
  const add = people.filter((p) => p.name.trim()).map((p): Participant => ({ id: uid("pt"), exchangeId, name: p.name.trim(), contact: p.contact.trim(), status: "invited", wishlist: [], likes: "", dislikes: "", sizes: "", noAlcohol: false }));
  patch((s) => ({ participants: [...s.participants, ...add] }));
  return add.length;
}
/** Parses "Name, email or phone" lines (also works for simple CSV files). */
export function parsePeopleList(text: string) {
  return text.split(/\r?\n/).map((l) => l.split(/[,;\t]/).map((x) => x.trim())).filter(([n]) => n && !/^name$/i.test(n)).map(([name = "", contact = ""]) => ({ name, contact }));
}
export async function removeParticipant(id: string) {
  const ex = exchangeOfParticipant(id); if (ex && !isDemo(ex)) { await remote(ex, "remove-participant", { participantId: id }); return; } patch((s) => ({ participants: s.participants.filter((p) => p.id !== id) })); }
export async function addExclusion(exchangeId: string, a: string, b: string) {
  if (!isDemo(exchangeId)) { await remote(exchangeId, "add-exclusion", { a, b }); return; }
  const e = exchangeById(santaStore.get(), exchangeId);
  if (!e || a === b || e.exclusions.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return;
  updateExchange(exchangeId, { exclusions: [...e.exclusions, [a, b]] });
}
export async function removeExclusion(exchangeId: string, index: number) {
  if (!isDemo(exchangeId)) { await remote(exchangeId, "remove-exclusion", { index }); return; }
  const e = exchangeById(santaStore.get(), exchangeId);
  if (e) updateExchange(exchangeId, { exclusions: e.exclusions.filter((_, i) => i !== index) });
}
export async function updateExchangeSettings(id: string, p: Partial<Pick<Exchange, "dates" | "showMatches" | "allowReveal" | "status">>) {
  if (!isDemo(id)) { await remote(id, "settings", p); return; }
  updateExchange(id, p);
}
export async function postAnnouncement(exchangeId: string, body: string) {
  if (!isDemo(exchangeId)) { await remote(exchangeId, "announce", { body }); return; }
  patch((s) => ({ messages: [...s.messages, { id: uid("msg"), exchangeId, kind: "announcement", fromId: "organiser", body, at: new Date().toISOString() }] }));
}
/** Placeholder: marks exchange day as done and all gifts delivered. */
export async function completeExchange(id: string) {
  if (!isDemo(id)) { await remote(id, "complete"); return; }
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
  if (!isDemo(exchangeId)) {
    try { const r = await callSanta<{ view: ServerView }>({ action: "draw", ...authFor(exchangeId) }); applyView(r.view); return { ok: true }; }
    catch (e) { return { ok: false, message: e instanceof Error ? e.message : "We could not run the draw." }; }
  }
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
  if (!isDemo(exchangeId)) {
    const code = santaStore.get().exchanges.find((e) => e.id === exchangeId)?.code ?? pendingCode;
    try {
      const r = await callSanta<{ exchangeId: string; participantId: string; pToken: string; view: ServerView }>({ action: "join", code, ...input });
      saveTokens({ [`p:${r.participantId}`]: r.pToken }); applyView(r.view); patch((st) => ({ role: "participant", session: { ...st.session, [r.exchangeId]: r.participantId } }));
      return r.participantId;
    } catch (e) { toast.error(e instanceof Error ? e.message : "We could not add you."); throw e; }
  }
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
  if (cur && !isDemo(cur.exchangeId)) { await remote(cur.exchangeId, "save-help", { likes: p.likes, dislikes: p.dislikes, sizes: p.sizes, noAlcohol: p.noAlcohol, address: p.address, wishlist: p.wishlist }); return; }
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
  if (!isDemo(p.exchangeId)) { await remote(p.exchangeId, "save-help", { likes: p.likes, dislikes: p.dislikes, sizes: p.sizes, noAlcohol: p.noAlcohol, wishlist: (has ? p.wishlist.filter((w) => w.productId !== productId) : [...p.wishlist, { productId }]).map((w) => w.productId) }); return true; }
  const wishlist = has ? p.wishlist.filter((w) => w.productId !== productId) : [...p.wishlist, { productId, addedAt: todayIso() }];
  updateParticipant(id, { wishlist, ...(p.status === "joined" || p.status === "wishlist" ? { status: wishlist.length ? "wishlist" : "joined" } : {}) });
  return true;
}
export async function updateDelivery(id: string, address: string) {
  const ex = exchangeOfParticipant(id); if (ex && !isDemo(ex)) { await remote(ex, "delivery", { address }); return; }
  updateParticipant(id, { address });
}

export const giftsWithinBudget = (budget: number, wishlistFirst: string[] = []) =>
  PRODUCTS.filter((p) => p.inStock && p.category !== "gift-cards" && p.price <= budget)
    .sort((a, b) => Number(wishlistFirst.includes(b.id)) - Number(wishlistFirst.includes(a.id)) || a.price - b.price);

export async function orderSantaGift(exchangeId: string, giverId: string, productId: string) {
  if (!isDemo(exchangeId)) { await remote(exchangeId, "order-gift", { productId }); return orderBy(santaStore.get(), exchangeId, giverId)!; }
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
  if (!isDemo(exchangeId)) { await remote(exchangeId, "question", { to, body }); return; }
  const s = santaStore.get();
  const toId = to === "recipient" ? s.matches.find((m) => m.exchangeId === exchangeId && m.giverId === fromId)?.receiverId : s.matches.find((m) => m.exchangeId === exchangeId && m.receiverId === fromId)?.giverId;
  if (!toId) return;
  patch((st) => ({ messages: [...st.messages, { id: uid("msg"), exchangeId, kind: "question", fromId, toId, body, at: new Date().toISOString() }] }));
}
export async function sendThanks(exchangeId: string, fromId: string, body: string) {
  if (!isDemo(exchangeId)) { await remote(exchangeId, "thanks", { body }); return; }
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
