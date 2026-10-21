import { PRODUCTS } from "@/data/products";
import { PRICE_BANDS } from "@/config/shop";
import { DISPENSER_IMPRESSIONS, DISPENSER_OCCASIONS, DISPENSER_RECIPIENTS, DISPENSER_VIBES } from "@/config/dispenser";
import type { ShopProduct } from "@/types/shop";

export interface DispenserAnswers { who: string; occasion: string; budget: string; vibe?: string; impression?: string; timing?: string; line?: string }
export interface Pick { label: "Top pick" | "Crowd favourite" | "Something different"; product: ShopProduct; reasons: string[] }
export interface PicksResult { picks: Pick[]; restocking: boolean }

const LABELS: Pick["label"][] = ["Top pick", "Crowd favourite", "Something different"];

/** Small seeded shuffle so "Dispense again" gives fresh picks for the same answers. */
function shuffle<T>(list: T[], seed: number) {
  const a = [...list];
  let s = seed + 1;
  for (let i = a.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}

const text = (p: ShopProduct) => `${p.name} ${p.line} ${p.inside.join(" ")}`.toLowerCase();

/** Words from the chosen vibe that this gift actually contains. */
function vibeHits(p: ShopProduct, vibe?: string) {
  const words = DISPENSER_VIBES.find((v) => v.slug === vibe)?.words ?? [];
  const t = text(p);
  return words.filter((w) => t.includes(w));
}

function score(p: ShopProduct, a: DispenserAnswers, recipients: string[], mid: number) {
  let s = 0;
  if (recipients.length && p.recipients.some((r) => recipients.includes(r))) s += 4;
  if (a.occasion && a.occasion !== "just-because" && p.occasions.includes(a.occasion)) s += 4;
  s += Math.min(6, vibeHits(p, a.vibe).length * 2);
  if (a.impression === "luxurious") s += (p.price - mid) / Math.max(mid, 1) * 3;
  if (a.impression === "professional" && (p.category === "corporate-gifts" || p.recipients.includes("colleagues"))) s += 3;
  if (a.impression === "thoughtful" && (p.poem?.length || p.saysAboutYou)) s += 3;
  if (a.impression === "fun" && p.badges.some((b) => /fun|party|bestseller/i.test(b))) s += 2;
  if (a.timing === "today" && p.sameDay) s += 5;
  if (p.badges.includes("Bestseller")) s += 1;
  return s;
}

function reasonsFor(p: ShopProduct, a: DispenserAnswers): string[] {
  const out: string[] = [];
  const who = DISPENSER_RECIPIENTS.find((r) => r.slug === a.who);
  const occ = DISPENSER_OCCASIONS.find((o) => o.slug === a.occasion);
  const rec = who?.matches ?? [];
  if (who && rec.length && p.recipients.some((r) => rec.includes(r))) out.push(`Made with ${who.name.toLowerCase().replace(/^a /, "a ")} in mind`);
  if (occ && a.occasion !== "just-because" && p.occasions.includes(a.occasion)) out.push(`A natural fit for ${occ.name.toLowerCase()}`);
  const hits = vibeHits(p, a.vibe);
  if (hits.length) { const v = DISPENSER_VIBES.find((x) => x.slug === a.vibe)!; out.push(`Matches “${v.name.toLowerCase()}”: ${[...new Set(hits)].slice(0, 3).join(", ")}`); }
  const imp = DISPENSER_IMPRESSIONS.find((i) => i.slug === a.impression);
  if (imp && a.impression === "thoughtful" && p.saysAboutYou) out.push(`Says: ${p.saysAboutYou}`);
  else if (imp) out.push(`Leaves them feeling: ${imp.line.toLowerCase()}`);
  if (a.timing === "today" && p.sameDay) out.push("Can arrive today in Lagos");
  return out.slice(0, 3);
}

/**
 * Recommender: filter by budget, rank every gift by how well it fits who, why, their taste, the impression you want
 * and when it must arrive, then choose a top pick, a crowd favourite and something different.
 */
export async function getPicks(answers: DispenserAnswers, round = 0): Promise<PicksResult> {
  await new Promise((r) => setTimeout(r, 150));
  const band = PRICE_BANDS.find((b) => b.slug === answers.budget);
  const recipients = DISPENSER_RECIPIENTS.find((r) => r.slug === answers.who)?.matches ?? [];
  const pool = PRODUCTS.filter((p) => p.inStock && p.category !== "packaging" && p.category !== "gift-cards" && (!band || (p.price >= band.min && p.price <= band.max)));
  if (pool.length === 0) {
    const best = [...PRODUCTS].filter((p) => p.inStock).sort((a, b) => a.featured - b.featured).slice(0, 3);
    return { restocking: true, picks: best.map((product, i) => ({ label: LABELS[i]!, product, reasons: reasonsFor(product, answers) })) };
  }
  const mid = pool.reduce((t, p) => t + p.price, 0) / pool.length;
  const ranked = shuffle(pool, round).map((p) => ({ p, s: score(p, answers, recipients, mid) })).sort((x, y) => y.s - x.s).map((x) => x.p);
  const top = ranked[0]!;
  const rest = ranked.slice(1);
  const crowd = rest.find((p) => p.badges.includes("Bestseller")) ?? rest[0];
  const different = rest.find((p) => p !== crowd && p.category !== top.category) ?? rest.find((p) => p !== crowd);
  const chosen = [top, crowd, different].filter((p): p is ShopProduct => !!p);
  return { restocking: false, picks: chosen.map((product, i) => ({ label: LABELS[i]!, product, reasons: reasonsFor(product, answers) })) };
}

export function randomAnswers(): DispenserAnswers {
  const who = DISPENSER_RECIPIENTS[Math.floor(Math.random() * DISPENSER_RECIPIENTS.length)]!.slug;
  return { who, occasion: "just-because", budget: "25-50", vibe: "all", impression: "thoughtful", timing: "soon" };
}
