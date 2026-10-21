// Secret Santa API for boxedbydweenie.com. One JSON document per exchange, changed only here.
// Nobody can see a match but its giver (the organiser only if they opted in before the draw). The draw happens on the server.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://boxedbydweenie.boxedbydweenie.workers.dev";
const ALLOWED = [
  "https://boxedbydweenie.boxedbydweenie.workers.dev", "https://boxedbydweenie.com", "https://www.boxedbydweenie.com",
  ...(Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
];
const MIN_TO_DRAW = 3, MAX_WISHLIST = 5, MAX_PARTICIPANTS = 200;
function cors(origin: string | null) {
  const ok = origin && (ALLOWED.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
  return { "Access-Control-Allow-Origin": ok ? origin! : SITE_URL, "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" };
}
const json = (b: unknown, status: number, h: Record<string, string>) => new Response(JSON.stringify(b), { status, headers: { ...h, "Content-Type": "application/json" } });
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const iso = (v: unknown) => (/^\d{4}-\d{2}-\d{2}$/.test(str(v, 10)) ? str(v, 10) : "");
const rnd = (alphabet: string, n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (x) => alphabet[x % alphabet.length]).join("");
const token = () => rnd("abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789", 28);
const uid = (p: string) => `${p}-${rnd("abcdefghijklmnopqrstuvwxyz0123456789", 9)}`;
const today = () => new Date().toISOString().slice(0, 10);
const daysUntil = (d: string) => Math.round((Date.parse(`${d}T00:00:00Z`) - Date.parse(`${today()}T00:00:00Z`)) / 86400000);

class Fail extends Error { constructor(m: string, public status = 400) { super(m); } }
type Doc = { exchange: any; participants: any[]; matches: any[]; messages: any[]; orders: any[]; orgToken: string };

async function load(id: string) {
  const { data } = await db.from("santa_exchanges").select("*").eq("id", id).maybeSingle();
  if (!data) throw new Fail("We could not find that exchange.", 404);
  return { row: data, doc: data.data as Doc };
}
async function save(row: { id: string; version: number }, doc: Doc) {
  const { data } = await db.from("santa_exchanges").update({ data: doc, version: row.version + 1, updated_at: new Date().toISOString() }).eq("id", row.id).eq("version", row.version).select("id").maybeSingle();
  if (!data) throw new Fail("Someone else changed this at the same moment. Please try again.", 409);
}

/** Who is calling, from the tokens they hold. */
function who(doc: Doc, b: any) {
  const org = str(b.orgToken, 60) !== "" && str(b.orgToken, 60) === doc.orgToken;
  const p = doc.participants.find((x) => x.id === str(b.pid, 40) && x.token === str(b.pToken, 60));
  return { org, me: p ?? null };
}

/** The slice of the exchange this caller is allowed to see. */
function view(doc: Doc, c: { org: boolean; me: any }) {
  const ex = doc.exchange, meId = c.me?.id as string | undefined;
  const myMatch = meId ? doc.matches.find((m) => m.giverId === meId) : null;
  const mySanta = meId ? doc.matches.find((m) => m.receiverId === meId) : null;
  const reveal = ex.allowReveal && (ex.status === "complete" || daysUntil(ex.dates.exchange) <= 0);
  const participants = doc.participants.map((p) => {
    const { token: _t, ...rest } = p;
    const base = { id: p.id, exchangeId: ex.id, name: p.name, status: p.status, isOrganiser: p.isOrganiser, contact: c.org ? p.contact : "", wishlist: [], likes: "", dislikes: "", sizes: "", noAlcohol: false };
    if (p.id === meId) return rest;
    if (myMatch?.receiverId === p.id) return { ...rest, contact: "", address: undefined };
    return base;
  });
  const matches: any[] = [];
  if (c.org && ex.showMatches) matches.push(...doc.matches.map((m) => ({ ...m, exchangeId: ex.id })));
  else {
    if (myMatch) matches.push({ exchangeId: ex.id, giverId: meId, receiverId: myMatch.receiverId });
    if (mySanta) matches.push({ exchangeId: ex.id, giverId: reveal ? mySanta.giverId : `santa:${meId}`, receiverId: meId });
  }
  const santaMask = (id: string) => (mySanta && id === mySanta.giverId && !reveal ? `santa:${meId}` : id);
  const messages = doc.messages
    .filter((m) => m.kind === "announcement" || m.toId === meId || m.fromId === meId)
    .map((m) => ({ ...m, fromId: santaMask(m.fromId), toId: m.toId ? santaMask(m.toId) : m.toId }));
  const orders = doc.orders.filter((o) => o.giverId === meId || o.receiverId === meId || c.org).map((o) => ({ ...o, giverId: o.giverId === meId || c.org ? o.giverId : santaMask(o.giverId) }));
  const { exclusions, ...exPublic } = ex;
  return { exchange: { ...exPublic, exclusions: c.org ? exclusions : [] }, participants, matches, messages, orders, isOrganiser: c.org, meId: meId ?? null };
}

const blank = (exchangeId: string, name: string, contact: string, extra: Record<string, unknown> = {}) => ({
  id: uid("pt"), exchangeId, name, contact, status: "joined", wishlist: [], likes: "", dislikes: "", sizes: "", noAlcohol: false, token: token(), ...extra,
});
const joined = (doc: Doc) => doc.participants.filter((p) => p.status !== "invited");

function draw(doc: Doc) {
  const people = joined(doc), ex = doc.exchange;
  if (people.length < MIN_TO_DRAW) throw new Fail(`At least ${MIN_TO_DRAW} people need to join before the draw.`);
  const blocked = (a: string, b: string) => a === b || ex.exclusions.some(([x, y]: string[]) => (x === a && y === b) || (x === b && y === a));
  const ids = people.map((p) => p.id);
  for (let attempt = 0; attempt < 3000; attempt++) {
    const r = [...ids];
    for (let i = r.length - 1; i > 0; i--) { const j = crypto.getRandomValues(new Uint32Array(1))[0]! % (i + 1); [r[i], r[j]] = [r[j]!, r[i]!]; }
    if (ids.every((g, i) => !blocked(g, r[i]!))) { doc.matches = ids.map((g, i) => ({ giverId: g, receiverId: r[i] })); ex.status = "drawn"; return; }
  }
  throw new Fail("These exclusions make a fair draw impossible. Remove one and try again.");
}

async function handle(b: any) {
  const a = str(b.action, 30);
  if (a === "create") {
    const x = b.exchange ?? {};
    const name = str(x.name, 120), organiserName = str(x.organiserName, 120);
    const dates = { joinBy: iso(x.dates?.joinBy), draw: iso(x.dates?.draw), orderBy: iso(x.dates?.orderBy), exchange: iso(x.dates?.exchange) };
    if (!name || !organiserName || Object.values(dates).some((d) => !d)) throw new Fail("Please complete the exchange name, your name and the four dates.");
    const id = uid("ex");
    let code = rnd("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
    const type = ["office", "family", "friends"].includes(x.type) ? x.type : "friends";
    const exchange = { id, code, name, type, organiserName, organisation: str(x.organisation, 120) || undefined, welcome: str(x.welcome, 600), budget: Math.max(1000, Math.min(1000000, Math.floor(Number(x.budget) || 10000))), payer: x.payer === "company" ? "company" : "each", organiserTakesPart: Boolean(x.organiserTakesPart), dates, delivery: x.delivery === "each" ? "each" : "one-address", address: str(x.address, 300) || undefined, status: "open", maxParticipants: MAX_PARTICIPANTS, showMatches: false, allowReveal: true, exclusions: [], createdAt: new Date().toISOString() };
    const orgP = exchange.organiserTakesPart ? blank(id, organiserName, "", { isOrganiser: true }) : null;
    const doc: Doc = { exchange, participants: orgP ? [orgP] : [], matches: [], messages: [], orders: [], orgToken: token() };
    for (let i = 0; i < 5; i++) {
      const { error } = await db.from("santa_exchanges").insert({ id, code, data: doc });
      if (!error) break;
      if (i === 4) throw new Fail("We could not create the exchange. Please try again.", 500);
      code = rnd("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6); exchange.code = code;
    }
    return { exchangeId: id, orgToken: doc.orgToken, participantId: orgP?.id ?? null, pToken: orgP?.token ?? null, view: view(doc, { org: true, me: orgP }) };
  }
  if (a === "check-code") {
    const code = str(b.code, 12).toUpperCase();
    const { data } = await db.from("santa_exchanges").select("*").eq("code", code).maybeSingle();
    if (!data) return { ok: false, reason: "invalid" };
    const doc = data.data as Doc, ex = doc.exchange;
    if (ex.status === "closed" || ex.status === "complete") return { ok: false, reason: "closed" };
    if (ex.status === "drawn" || daysUntil(ex.dates.joinBy) < 0) return { ok: false, reason: "expired" };
    if (joined(doc).length >= ex.maxParticipants) return { ok: false, reason: "full" };
    const { exclusions, ...pub } = ex;
    return { ok: true, exchange: { ...pub, exclusions: [] } };
  }
  if (a === "join") {
    const code = str(b.code, 12).toUpperCase();
    const { data } = await db.from("santa_exchanges").select("id").eq("code", code).maybeSingle();
    if (!data) throw new Fail("We could not find that code.", 404);
    const { row, doc } = await load(data.id);
    const ex = doc.exchange;
    if (ex.status !== "open" || daysUntil(ex.dates.joinBy) < 0) throw new Fail("Joining has closed for this exchange.");
    if (joined(doc).length >= ex.maxParticipants) throw new Fail("This exchange is full.");
    const name = str(b.name, 120), contact = str(b.contact, 160);
    if (name.length < 2) throw new Fail("Please enter your name.");
    let p = contact ? doc.participants.find((x) => x.status === "invited" && x.contact && x.contact.toLowerCase() === contact.toLowerCase()) : undefined;
    if (p) { p.name = name; p.status = "joined"; p.token = token(); }
    else { p = blank(ex.id, name, contact); doc.participants.push(p); }
    await save(row, doc);
    return { exchangeId: ex.id, participantId: p.id, pToken: p.token, view: view(doc, { org: false, me: p }) };
  }

  const { row, doc } = await load(str(b.id, 40));
  const c = who(doc, b);
  if (!c.org && !c.me) throw new Fail("Please open this exchange from your own link.", 403);
  const ex = doc.exchange;
  const needOrg = () => { if (!c.org) throw new Fail("Only the organiser can do that.", 403); };
  const needMe = () => { if (!c.me) throw new Fail("Join the exchange first.", 403); return c.me; };

  switch (a) {
    case "get": return { view: view(doc, c) };
    case "invite": {
      needOrg();
      const list = (Array.isArray(b.people) ? b.people : []).slice(0, 300);
      let added = 0;
      for (const p of list) { const name = str(p.name, 120); if (!name || doc.participants.length >= 400) continue; doc.participants.push({ ...blank(ex.id, name, str(p.contact, 160)), status: "invited" }); added++; }
      await save(row, doc); return { added, view: view(doc, c) };
    }
    case "remove-participant": {
      needOrg(); if (ex.status !== "open") throw new Fail("Names are already drawn.");
      const pid = str(b.participantId, 40);
      doc.participants = doc.participants.filter((p) => p.id !== pid); ex.exclusions = ex.exclusions.filter((e: string[]) => !e.includes(pid));
      break;
    }
    case "add-exclusion": {
      needOrg(); const x = str(b.a, 40), y = str(b.b, 40);
      if (ex.status !== "open" || x === y || !x || !y || ex.exclusions.some(([p, q]: string[]) => (p === x && q === y) || (p === y && q === x))) break;
      ex.exclusions.push([x, y]); break;
    }
    case "remove-exclusion": { needOrg(); ex.exclusions = ex.exclusions.filter((_: unknown, i: number) => i !== Number(b.index)); break; }
    case "settings": {
      needOrg();
      if (b.dates && typeof b.dates === "object") ex.dates = { joinBy: iso(b.dates.joinBy) || ex.dates.joinBy, draw: iso(b.dates.draw) || ex.dates.draw, orderBy: iso(b.dates.orderBy) || ex.dates.orderBy, exchange: iso(b.dates.exchange) || ex.dates.exchange };
      if (typeof b.showMatches === "boolean" && ex.status === "open") ex.showMatches = b.showMatches;
      if (typeof b.allowReveal === "boolean") ex.allowReveal = b.allowReveal;
      if (["open", "closed"].includes(b.status) && ex.status !== "drawn" && ex.status !== "complete") ex.status = b.status;
      break;
    }
    case "announce": {
      needOrg(); const body = str(b.body, 800); if (!body) throw new Fail("Write a message first.");
      doc.messages.push({ id: uid("msg"), exchangeId: ex.id, kind: "announcement", fromId: "organiser", body, at: new Date().toISOString() }); break;
    }
    case "complete": {
      needOrg(); ex.status = "complete";
      doc.orders.forEach((o) => { o.status = "delivered"; });
      doc.participants.forEach((p) => { if (p.status === "ordered") p.status = "delivered"; });
      break;
    }
    case "draw": { needOrg(); if (ex.status !== "open") throw new Fail("Names are already drawn."); draw(doc); break; }
    case "save-help": {
      const me = needMe();
      me.likes = str(b.likes, 400); me.dislikes = str(b.dislikes, 400); me.sizes = str(b.sizes, 200); me.noAlcohol = Boolean(b.noAlcohol);
      if (b.address !== undefined) me.address = str(b.address, 300);
      if (Array.isArray(b.wishlist)) me.wishlist = b.wishlist.slice(0, MAX_WISHLIST).map((p: unknown) => ({ productId: str(p, 40), addedAt: today() }));
      if (me.status === "joined" || me.status === "wishlist") me.status = me.wishlist.length ? "wishlist" : "joined";
      break;
    }
    case "delivery": { needMe().address = str(b.address, 300); break; }
    case "order-gift": {
      const me = needMe(); const m = doc.matches.find((x) => x.giverId === me.id);
      if (!m) throw new Fail("Your match is not ready yet.");
      doc.orders = doc.orders.filter((o) => o.giverId !== me.id);
      doc.orders.push({ id: uid("sso"), exchangeId: ex.id, giverId: me.id, receiverId: m.receiverId, productId: str(b.productId, 40), note: "From your Secret Santa", status: "ordered", at: new Date().toISOString() });
      if (me.status !== "delivered") me.status = "ordered"; break;
    }
    case "question": case "thanks": {
      const me = needMe(); const body = str(b.body, 600); if (!body) throw new Fail("Write a message first.");
      let toId: string | undefined;
      if (a === "thanks" || b.to === "santa") toId = doc.matches.find((m) => m.receiverId === me.id)?.giverId;
      else toId = doc.matches.find((m) => m.giverId === me.id)?.receiverId;
      if (!toId) throw new Fail("Names have not been drawn yet.");
      doc.messages.push({ id: uid("msg"), exchangeId: ex.id, kind: a, fromId: me.id, toId, body, at: new Date().toISOString() }); break;
    }
    default: throw new Fail("Unknown action.");
  }
  await save(row, doc);
  return { view: view(doc, c) };
}

Deno.serve(async (req) => {
  const h = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, h);
  try { return json(await handle(await req.json()), 200, h); }
  catch (e) {
    if (e instanceof Fail) return json({ error: e.message }, e.status, h);
    console.error(e); return json({ error: "Something went wrong. Please try again." }, 500, h);
  }
});
