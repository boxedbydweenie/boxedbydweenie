import { PRODUCTS } from "@/data/products";
import { CATEGORIES, OCCASIONS, PRICE_BANDS, RECIPIENTS } from "@/config/shop";
import type { ShopFilters, ShopProduct } from "@/types/shop";

const delay = <T,>(v: T, ms = 120) => new Promise<T>((r) => setTimeout(() => r(v), ms));

export const getProducts = () => delay(PRODUCTS);

export const getProductBySlug = (slug: string) => delay(PRODUCTS.find((p) => p.slug === slug) ?? null);

export const getProductById = (id: string) => PRODUCTS.find((p) => p.id === id) ?? null;

export const getBestsellers = (limit = 8) => delay([...PRODUCTS].sort((a, b) => a.featured - b.featured).slice(0, limit));

export function filterProducts(list: ShopProduct[], f: ShopFilters): ShopProduct[] {
  const band = PRICE_BANDS.find((b) => b.slug === f.budget);
  const q = f.q?.trim().toLowerCase();
  const out = list.filter((p) =>
    (!f.occasion || p.occasions.includes(f.occasion)) &&
    (!f.recipient || p.recipients.includes(f.recipient)) &&
    (!f.type || p.category === f.type) &&
    (!band || (p.price >= band.min && p.price <= band.max)) &&
    (!f.sameday || p.sameDay) &&
    (!q || `${p.name} ${p.line} ${p.tags.join(" ")}`.toLowerCase().includes(q)),
  );
  switch (f.sort) {
    case "price-asc": return out.sort((a, b) => a.price - b.price);
    case "price-desc": return out.sort((a, b) => b.price - a.price);
    case "newest": return out.sort((a, b) => b.addedOn.localeCompare(a.addedOn));
    default: return out.sort((a, b) => a.featured - b.featured);
  }
}

export function getRelated(p: ShopProduct) {
  const others = PRODUCTS.filter((x) => x.id !== p.id && x.inStock);
  const pairs = others.filter((x) => x.category !== p.category && x.recipients.some((r) => p.recipients.includes(r))).slice(0, 4);
  const occasion = others.filter((x) => x.occasions.includes(p.occasions[0] ?? "") && !pairs.includes(x)).slice(0, 4);
  return { pairs, occasion };
}

export async function searchCatalogue(term: string) {
  const q = term.trim().toLowerCase();
  if (!q) return { products: [], occasions: [], categories: [] };
  const words = q.split(/\s+/);
  const hit = (s: string) => words.every((w) => s.toLowerCase().includes(w));
  return delay({
    products: PRODUCTS.filter((p) => hit(`${p.name} ${p.line} ${p.tags.join(" ")} ${p.category.replace("-", " ")}`)).slice(0, 6),
    occasions: OCCASIONS.filter((o) => words.some((w) => o.name.toLowerCase().includes(w))),
    categories: [...CATEGORIES, ...RECIPIENTS].filter((c) => words.some((w) => c.name.toLowerCase().includes(w))),
  }, 60);
}

export const labelFor = {
  occasion: (s: string) => OCCASIONS.find((o) => o.slug === s)?.name ?? s,
  recipient: (s: string) => RECIPIENTS.find((o) => o.slug === s)?.name ?? s,
  type: (s: string) => CATEGORIES.find((o) => o.slug === s)?.name ?? s,
  budget: (s: string) => PRICE_BANDS.find((o) => o.slug === s)?.name ?? s,
};
