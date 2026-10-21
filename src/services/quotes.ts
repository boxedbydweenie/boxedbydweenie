import { callLeads } from "@/lib/api";
import { createStore } from "@/lib/store";
import {
  BRANDING, CURATE_RANGE, DELIVERY_FEES, EXPRESS_SURCHARGE_PERCENT, QUOTE_VALIDITY_DAYS,
  STANDARD_LEAD_DAYS, UNIT_PRICE_RANGES, VAT_PERCENT, VOLUME_TIERS,
} from "@/config/quoteRules";
import { getProductById } from "./products";
import type { Estimate, EstimateLine, Quote, QuoteRequest } from "@/types/quote";

const quotesStore = createStore<Quote[]>("bbd-quotes", []);
const draftStore = createStore<{ step: number; request: QuoteRequest; savedAt: string } | null>("bbd-quote-draft", null);

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function addWorkingDays(from: Date, days: number) {
  const d = new Date(from);
  let added = 0;
  while (added < days) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) added++; }
  return d;
}
export const standardReadyDate = () => iso(addWorkingDays(new Date(), STANDARD_LEAD_DAYS));
export const isRush = (requiredBy: string) => !!requiredBy && requiredBy < standardReadyDate();

const round = (n: number) => Math.round(n / 100) * 100;

function unitRange(r: QuoteRequest) {
  const ranges = (r.selections.length ? r.selections : ["curate"]).map((id) =>
    id === "curate" ? { low: r.budget * CURATE_RANGE.low, high: r.budget * CURATE_RANGE.high } : UNIT_PRICE_RANGES[id] ?? { low: r.budget, high: r.budget });
  return { low: Math.min(...ranges.map((x) => x.low)), high: Math.max(...ranges.map((x) => x.high)) };
}

function deliveryFee(r: QuoteRequest) {
  const table = DELIVERY_FEES[r.deliveryMode];
  const locs = r.locations.length ? r.locations : ["Lagos"];
  const fees = locs.map((l) => table[l] ?? table["Other states"] ?? 0);
  if (r.deliveryMode === "each-recipient") return (fees.reduce((a, b) => a + b, 0) / fees.length) * r.quantity;
  if (r.deliveryMode === "one-address") return Math.max(...fees);
  return fees.reduce((a, b) => a + b, 0);
}

export async function calculateEstimate(r: QuoteRequest): Promise<Estimate> {
  if (!Number.isFinite(r.quantity) || r.quantity <= 0 || !Number.isFinite(r.budget)) throw new Error("Invalid quantity or budget");
  const q = r.quantity;
  const unit = unitRange(r);
  const gifts = { low: unit.low * q, high: unit.high * q };
  const brandPerUnit = BRANDING.filter((b) => r.branding.includes(b.key)).reduce((s, b) => s + b.perUnit, 0);
  const branding = brandPerUnit * q;
  const delivery = deliveryFee(r);
  const discountPercent = [...VOLUME_TIERS].reverse().find((t) => q >= t.min)?.percent ?? 0;
  const discount = { low: (gifts.low * discountPercent) / 100, high: (gifts.high * discountPercent) / 100 };
  const rush = isRush(r.requiredBy);
  const express = rush
    ? { low: ((gifts.low - discount.low + branding) * EXPRESS_SURCHARGE_PERCENT) / 100, high: ((gifts.high - discount.high + branding) * EXPRESS_SURCHARGE_PERCENT) / 100 }
    : { low: 0, high: 0 };
  const subtotal = { low: gifts.low + branding + delivery - discount.low + express.low, high: gifts.high + branding + delivery - discount.high + express.high };
  const vat = { low: (subtotal.low * VAT_PERCENT) / 100, high: (subtotal.high * VAT_PERCENT) / 100 };
  const lines: EstimateLine[] = [
    { label: "Gifts", detail: `${q.toLocaleString("en-NG")} × ₦${round(unit.low).toLocaleString("en-NG")} to ₦${round(unit.high).toLocaleString("en-NG")}`, low: gifts.low, high: gifts.high },
    { label: "Branding", detail: brandPerUnit ? `₦${brandPerUnit.toLocaleString("en-NG")} per gift` : "None selected", low: branding, high: branding },
    { label: "Delivery", low: delivery, high: delivery },
    { label: "Volume discount", detail: discountPercent ? `${discountPercent}% on gifts` : `From ${VOLUME_TIERS[0]?.min} gifts`, low: discount.low, high: discount.high, negative: true },
    ...(rush ? [{ label: "Express surcharge", detail: `${EXPRESS_SURCHARGE_PERCENT}%`, low: express.low, high: express.high }] : []),
    { label: "VAT", detail: `${VAT_PERCENT}%`, low: vat.low, high: vat.high },
  ].map((l) => ({ ...l, low: round(l.low), high: round(l.high) }));
  return {
    lines, rush, discountPercent,
    unit: { low: round(unit.low), high: round(unit.high) },
    subtotal: { low: round(subtotal.low), high: round(subtotal.high) },
    vat: { low: round(vat.low), high: round(vat.high) },
    total: { low: round(subtotal.low + vat.low), high: round(subtotal.high + vat.high) },
  };
}

export async function submitQuote(request: QuoteRequest): Promise<Quote> {
  const estimate = await calculateEstimate(request);
  const now = new Date();
  const valid = new Date(now); valid.setDate(valid.getDate() + QUOTE_VALIDITY_DAYS);
  const build = (ref: string): Quote => {
    const crm = {
      source: "website-quote-builder", reference: ref, submittedAt: now.toISOString(), contact: request.contact, purpose: request.purpose,
      quantity: request.quantity, budgetPerRecipient: request.budget,
      products: request.selections.map((id) => (id === "curate" ? { id, name: "Curate it for me" } : { id, name: getProductById(id)?.name ?? id })),
      branding: request.branding, logoFileName: request.logoFileName,
      delivery: { mode: request.deliveryMode, locations: request.locations, requiredBy: request.requiredBy, rush: estimate.rush, recipientListFileName: request.recipientListFileName },
      estimate: { lines: estimate.lines, totalLow: estimate.total.low, totalHigh: estimate.total.high, currency: "NGN" },
    };
    return { ref, createdAt: iso(now), validUntil: iso(valid), status: "Estimate", request, estimate, crm };
  };
  // Saved on the server so the team sees it in the admin and the link works on any device.
  const c = request.contact;
  const res = await callLeads<{ reference: string }>({
    kind: "quote", name: c.name, email: c.email, phone: c.phone, company: c.company, role: c.role, message: c.notes,
    quantity: String(request.quantity), requiredBy: request.requiredBy || undefined,
    quote: build("pending"),
  });
  const quote = build(res.reference);
  quotesStore.set([...quotesStore.get(), quote]);
  draftStore.set(null);
  return quote;
}

export async function getQuote(ref: string): Promise<Quote | null> {
  const local = quotesStore.get().find((q) => q.ref === ref);
  if (local) return local;
  try {
    const r = await callLeads<{ quote: Quote | null }>({ action: "get-quote", ref });
    return r.quote ?? null;
  } catch { return null; }
}

export async function emailQuote(ref: string, email: string) {
  try {
    const r = await callLeads<{ sent: boolean }>({ action: "email-quote", ref, email });
    return { ok: true, message: r.sent ? `We have emailed quote ${ref} to ${email}.` : `Your quote ${ref} is saved and our team has it. Copy this page's link to share it.` };
  } catch { return { ok: false, message: "We could not send that email. Please try again." }; }
}

export async function saveDraft(step: number, request: QuoteRequest) {
  draftStore.set({ step, request, savedAt: new Date().toISOString() });
}
export const getDraft = async () => draftStore.get();
export async function clearDraft() { draftStore.set(null); }
