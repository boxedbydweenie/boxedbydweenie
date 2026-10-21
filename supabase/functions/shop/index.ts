// Shop API for boxedbydweenie.com
// POST { action: "create-order", ... }  -> creates a pending order, starts a Paystack payment, returns the checkout URL
// POST { action: "verify", reference }   -> asks Paystack whether the payment succeeded and marks the order paid
// POST { action: "get-order", ref, email } -> order status for the tracking page
// Prices, delivery fees and discounts are always recalculated here from the database; the browser's numbers are ignored.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://boxedbydweenie.boxedbydweenie.workers.dev";
// Sites allowed to call this API. Add more with the ALLOWED_ORIGINS secret (comma-separated).
const ALLOWED = [
  "https://boxedbydweenie.boxedbydweenie.workers.dev", "https://boxedbydweenie.com", "https://www.boxedbydweenie.com",
  ...(Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
];

const GIFT_CARD_MIN = 5000, GIFT_CARD_MAX = 1000000, MAX_QTY = 1000, NOTE_LIMIT = 250;
const PACKAGING = new Set(["signature-black", "ivory"]);

function cors(origin: string | null) {
  const ok = origin && (ALLOWED.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : SITE_URL,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
const json = (body: unknown, status: number, h: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { ...h, "Content-Type": "application/json" } });

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

async function paystack(path: string, init?: RequestInit) {
  const r = await fetch(`https://api.paystack.co${path}`, { ...init, headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const body = await r.json().catch(() => ({}));
  if (!r.ok || body.status === false) throw new Error(body.message ?? `Paystack error ${r.status}`);
  return body.data;
}

function publicOrder(o: Record<string, any>) {
  return {
    ref: o.ref, status: o.status, createdAt: o.created_at, paidAt: o.paid_at, items: o.items,
    subtotal: o.subtotal, discount: o.discount, deliveryFee: o.delivery_fee, total: o.total, giftCardApplied: o.gift_card_applied ?? 0, payable: o.payable ?? o.total,
    recipient: { name: o.recipient?.name, state: o.recipient?.state, area: o.recipient?.area, deliveryDate: o.recipient?.deliveryDate },
    customer: { name: o.customer?.name },
  };
}

/** A failed payment gives back any gift card balance used and voids gift cards bought on that order. */
async function releaseOrder(order: Record<string, any>) {
  await db.from("gift_cards").update({ status: "void" }).eq("order_ref", order.ref).eq("status", "pending");
  if (order.gift_card_code && order.gift_card_applied > 0) {
    const { data: gc } = await db.from("gift_cards").select("balance").eq("code", order.gift_card_code).maybeSingle();
    if (gc) await db.from("gift_cards").update({ balance: gc.balance + order.gift_card_applied }).eq("code", order.gift_card_code).eq("balance", gc.balance);
  }
}
const cardCode = () => { const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; const v = crypto.getRandomValues(new Uint8Array(12)); const c = Array.from(v, (x) => a[x % a.length]).join(""); return `BBD-${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8)}`; };

/** Marks an order paid if Paystack's figures match ours. Safe to call more than once. */
async function confirmPayment(reference: string) {
  const { data: order } = await db.from("orders").select("*").eq("paystack_reference", reference).maybeSingle();
  if (!order) return { error: "Order not found", status: 404 };
  if (order.status !== "pending_payment" && order.status !== "payment_failed") return { order };
  const tx = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`);
  const good = tx.status === "success" && tx.currency === "NGN" && Number(tx.amount) === (order.payable ?? order.total) * 100;
  const { data: updated } = await db.from("orders")
    .update(good ? { status: "paid", paid_at: tx.paid_at ?? new Date().toISOString() } : { status: tx.status === "abandoned" ? "pending_payment" : "payment_failed" })
    .eq("id", order.id).in("status", ["pending_payment", "payment_failed"]).select("*").maybeSingle();
  if (updated && good) await db.from("gift_cards").update({ status: "active" }).eq("order_ref", order.ref).eq("status", "pending");
  if (updated && !good && updated.status === "payment_failed" && order.status === "pending_payment") await releaseOrder(order);
  return { order: updated ?? order };
}

async function createOrder(body: Record<string, any>, origin: string | null) {
  const customer = { name: str(body.customer?.name, 120), email: str(body.customer?.email, 160).toLowerCase(), phone: str(body.customer?.phone, 40) };
  if (!customer.name || !isEmail(customer.email) || customer.phone.length < 7) return { error: "Please give your name, a valid email and a phone number.", status: 400 };
  const r = body.recipient ?? {};
  const recipient = {
    name: str(r.name, 120), phone: str(r.phone, 40), address: str(r.address, 300), state: str(r.state, 60), area: str(r.area, 120),
    deliveryDate: str(r.deliveryDate, 10), notes: str(r.notes, 500), surprise: Boolean(r.surprise),
  };
  if (!recipient.name || !recipient.address || !recipient.state || !/^\d{4}-\d{2}-\d{2}$/.test(recipient.deliveryDate)) return { error: "Please complete the delivery details.", status: 400 };
  const sendTo = body.sendTo === "me" ? "me" : "someone";

  const raw = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  if (!raw.length) return { error: "Your bag is empty.", status: 400 };
  const ids = [...new Set(raw.map((i: any) => str(i.productId, 40)))];
  const { data: products } = await db.from("products").select("id, slug, name, price, category, active").in("id", ids);
  const byId = new Map((products ?? []).map((p) => [p.id, p]));

  const items = [];
  for (const i of raw) {
    const p = byId.get(str(i.productId, 40));
    if (!p || !p.active) return { error: "One of the gifts in your bag is no longer available.", status: 409 };
    const quantity = Math.min(MAX_QTY, Math.max(1, Math.floor(Number(i.quantity) || 1)));
    let price = p.price;
    let giftCard;
    if (p.category === "gift-cards") {
      const amount = Math.floor(Number(i.giftCard?.amount ?? i.price));
      if (!(amount >= GIFT_CARD_MIN && amount <= GIFT_CARD_MAX)) return { error: "Gift card amounts must be between ₦5,000 and ₦1,000,000.", status: 400 };
      price = amount;
      giftCard = { amount, toName: str(i.giftCard?.toName, 120), toEmail: str(i.giftCard?.toEmail, 160), message: str(i.giftCard?.message, NOTE_LIMIT), sendOn: str(i.giftCard?.sendOn, 10) };
    }
    items.push({
      productId: p.id, slug: p.slug, name: p.name, price, quantity,
      packaging: PACKAGING.has(i.packaging) ? i.packaging : undefined,
      note: str(i.note, NOTE_LIMIT) || undefined, handwritten: Boolean(i.handwritten) || undefined, giftCard,
    });
  }
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  let discount = 0, promo: string | null = null;
  const code = str(body.promoCode, 40).toUpperCase();
  if (code) {
    const { data: pc } = await db.from("promo_codes").select("percent, active").eq("code", code).maybeSingle();
    if (pc?.active) { discount = Math.round(subtotal * pc.percent / 100); promo = code; }
  }
  const { data: fees } = await db.from("delivery_fees").select("state, fee");
  const feeMap = new Map((fees ?? []).map((f) => [f.state, f.fee]));
  const deliveryFee = feeMap.get(recipient.state) ?? feeMap.get("Other states") ?? 15000;
  const total = subtotal - discount + deliveryFee;

  // Gift card payment (cannot be used to buy more gift cards)
  let giftApplied = 0, giftCode: string | null = null;
  const gcode = str(body.giftCardCode, 40).toUpperCase().replace(/\s+/g, "");
  if (gcode) {
    if (items.some((i) => i.giftCard)) return { error: "Gift cards cannot be used to buy gift cards.", status: 400 };
    const { data: gc } = await db.from("gift_cards").select("balance, status").eq("code", gcode).maybeSingle();
    if (!gc || gc.status !== "active" || gc.balance <= 0) return { error: "That gift card code is not valid or has no balance left.", status: 400 };
    giftApplied = Math.min(gc.balance, total); giftCode = gcode;
    const { data: upd } = await db.from("gift_cards").update({ balance: gc.balance - giftApplied }).eq("code", gcode).eq("balance", gc.balance).select("code").maybeSingle();
    if (!upd) return { error: "That gift card was just used. Please try again.", status: 409 };
  }
  const payable = total - giftApplied;

  const ref = `BBD-${Date.now().toString(36).toUpperCase()}${crypto.getRandomValues(new Uint8Array(2)).reduce((s, b) => s + b.toString(16).padStart(2, "0"), "").toUpperCase()}`;
  const { data: order, error } = await db.from("orders").insert({
    ref, customer, recipient, send_to: sendTo, items, subtotal, discount, delivery_fee: deliveryFee, total, promo_code: promo, paystack_reference: ref,
    gift_card_code: giftCode, gift_card_applied: giftApplied, payable, ...(payable === 0 ? { status: "paid", paid_at: new Date().toISOString() } : {}),
  }).select("*").single();
  if (error) {
    if (giftCode) await releaseOrder({ ref, gift_card_code: giftCode, gift_card_applied: giftApplied });
    return { error: "We could not save your order. Please try again.", status: 500 };
  }
  const cards: Record<string, unknown>[] = [];
  for (const i of items) if (i.giftCard) for (let n = 0; n < i.quantity; n++) cards.push({ code: cardCode(), amount: i.price, balance: i.price, status: "pending", order_ref: ref, to_name: i.giftCard.toName || null, to_email: i.giftCard.toEmail || null, message: i.giftCard.message || null, send_on: /^\d{4}-\d{2}-\d{2}$/.test(i.giftCard.sendOn) ? i.giftCard.sendOn : null });
  if (cards.length) await db.from("gift_cards").insert(cards);
  if (payable === 0) return { order: publicOrder(order), authorizationUrl: null, reference: ref };

  const back = origin && (ALLOWED.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) ? origin : SITE_URL;
  const tx = await paystack("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: customer.email, amount: payable * 100, currency: "NGN", reference: ref,
      callback_url: `${back}/order/${encodeURIComponent(ref)}?verify=1`,
      metadata: { order_ref: ref, customer_name: customer.name, cancel_action: `${back}/checkout` },
    }),
  });
  return { order: publicOrder(order), authorizationUrl: tx.authorization_url, reference: ref };
}

Deno.serve(async (req) => {
  const h = cors(req.headers.get("Origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405, h);
  if (!PAYSTACK_SECRET) return json({ error: "Payments are not set up yet." }, 503, h);
  let body: Record<string, any>;
  try { body = await req.json(); } catch { return json({ error: "Invalid request." }, 400, h); }
  try {
    if (body.action === "create-order") {
      const r = await createOrder(body, req.headers.get("Origin"));
      return "error" in r ? json({ error: r.error }, r.status ?? 400, h) : json(r, 200, h);
    }
    if (body.action === "verify") {
      const ref = str(body.reference, 60);
      if (!ref) return json({ error: "Missing reference." }, 400, h);
      const r = await confirmPayment(ref);
      return "error" in r ? json({ error: r.error }, r.status ?? 400, h) : json({ order: publicOrder(r.order) }, 200, h);
    }
    if (body.action === "get-order") {
      const ref = str(body.ref, 60), email = str(body.email, 160).toLowerCase();
      const { data: o } = await db.from("orders").select("*").eq("ref", ref).maybeSingle();
      if (!o || (o.customer?.email ?? "").toLowerCase() !== email) return json({ error: "We could not find an order with those details." }, 404, h);
      const { data: gcs } = await db.from("gift_cards").select("code, amount, status").eq("order_ref", ref).eq("status", "active");
      return json({ order: publicOrder(o), giftCards: gcs ?? [] }, 200, h);
    }
    return json({ error: "Unknown action." }, 400, h);
  } catch (e) {
    console.error(e);
    return json({ error: "Something went wrong on our side. Please try again." }, 502, h);
  }
});
