import { PRODUCTS } from "@/data/products";
import { PRICE_BANDS } from "@/config/shop";
import { DISPENSER_RECIPIENTS } from "@/config/dispenser";
import type { ShopProduct } from "@/types/shop";

export interface DispenserAnswers { who: string; occasion: string; budget: string }
export interface Pick { label: "Top pick" | "Crowd favourite" | "Something different"; product: ShopProduct }
export interface PicksResult { picks: Pick[]; restocking: boolean }

const LABELS: Pick["label"][] = ["Top pick", "Crowd favourite", "Something different"];

/** Small seeded shuffle so "Dispense again" gives fresh picks for the same answers. */
function shuffle<T>(list: T[], seed: number) {
  const a = [...list];
  let s = seed + 1;
  for (let i = a.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}

/**
 * Mock recommender: filter by recipient, occasion and price band, then choose three by tag.
 * Replace with a real recommendation service later.
 */
export async function getPicks(answers: DispenserAnswers, round = 0): Promise<PicksResult> {
  await new Promise((r) => setTimeout(r, 150));
  const band = PRICE_BANDS.find((b) => b.slug === answers.budget);
  const recipients = DISPENSER_RECIPIENTS.find((r) => r.slug === answers.who)?.matches ?? [];
  const pool = PRODUCTS.filter((p) => p.inStock && p.category !== "packaging" && p.category !== "gift-cards" && (!band || (p.price >= band.min && p.price <= band.max)));
  const byRecipient = (p: ShopProduct) => !recipients.length || p.recipients.some((r) => recipients.includes(r));
  const byOccasion = (p: ShopProduct) => answers.occasion === "just-because" || !answers.occasion || p.occasions.includes(answers.occasion);

  // Strict match first, then relax occasion, then recipient, so the machine rarely comes up empty.
  let matches = pool.filter((p) => byRecipient(p) && byOccasion(p));
  if (matches.length < 3) matches = [...matches, ...pool.filter((p) => !matches.includes(p) && byRecipient(p))];
  if (matches.length < 3) matches = [...matches, ...pool.filter((p) => !matches.includes(p) && byOccasion(p))];

  if (matches.length === 0) {
    const best = [...PRODUCTS].filter((p) => p.inStock).sort((a, b) => a.featured - b.featured).slice(0, 3);
    return { restocking: true, picks: best.map((product, i) => ({ label: LABELS[i]!, product })) };
  }

  const ordered = shuffle(matches, round);
  const top = [...ordered].sort((a, b) => Number(b.occasions.includes(answers.occasion)) - Number(a.occasions.includes(answers.occasion)))[0]!;
  const rest = ordered.filter((p) => p !== top);
  const crowd = rest.find((p) => p.badges.includes("Bestseller")) ?? rest[0];
  const different = rest.find((p) => p !== crowd && p.category !== top.category && p.category !== crowd?.category) ?? rest.find((p) => p !== crowd);
  const chosen = [top, crowd, different].filter((p): p is ShopProduct => !!p);
  return { restocking: false, picks: chosen.map((product, i) => ({ label: LABELS[i]!, product })) };
}

export function randomAnswers(): DispenserAnswers {
  const who = DISPENSER_RECIPIENTS[Math.floor(Math.random() * DISPENSER_RECIPIENTS.length)]!.slug;
  return { who, occasion: "just-because", budget: "25-50" };
}
