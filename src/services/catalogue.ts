import { PRODUCTS } from "@/data/products";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/api";
import type { CategorySlug, ShopProduct } from "@/types/shop";

/** Shape of a row in public.products. `details` holds the descriptive fields staff edit in the admin. */
export interface ProductRow {
  id: string; slug: string; name: string; price: number; category: string;
  active: boolean; confirmed: boolean; in_stock: boolean; sort: number;
  details: Partial<{
    line: string; description: string; poem: string[]; badges: string[]; images: string[]; inside: string[];
    sameDay: boolean; idealFor: string; occasions: string[]; collection: string; recipients: string[];
    saysAboutYou: string; minCorporateQty: number; corporateEligible: boolean;
  }>;
}

/** Overlays a database row onto the built-in product (or builds a new one) so every page sees staff edits. */
export function applyRow(row: ProductRow, base?: ShopProduct): ShopProduct {
  const d = row.details ?? {};
  const b: ShopProduct = base ?? {
    id: row.id, slug: row.slug, name: row.name, line: "", description: "", price: row.price, images: [], category: row.category as CategorySlug,
    occasions: [], recipients: [], tags: [], inside: [], badges: [], inStock: true, sameDay: false, corporateEligible: true,
    minCorporateQty: 10, featured: row.sort, addedOn: new Date().toISOString().slice(0, 10),
  };
  const out: ShopProduct = {
    ...b,
    slug: row.slug, name: row.name, price: row.price, category: row.category as CategorySlug, inStock: row.in_stock, featured: row.sort,
    confirmed: row.confirmed,
    line: d.line ?? b.line,
    description: d.description ?? b.description,
    images: d.images?.length ? d.images : b.images,
    occasions: d.occasions ?? b.occasions,
    recipients: d.recipients ?? b.recipients,
    inside: d.inside ?? b.inside,
    badges: d.badges ?? b.badges,
    sameDay: d.sameDay ?? b.sameDay,
    minCorporateQty: d.minCorporateQty ?? b.minCorporateQty,
    corporateEligible: d.corporateEligible ?? b.corporateEligible,
  };
  const poem = d.poem ?? b.poem; if (poem) out.poem = poem;
  const ideal = d.idealFor ?? b.idealFor; if (ideal) out.idealFor = ideal;
  const says = d.saysAboutYou ?? b.saysAboutYou; if (says) out.saysAboutYou = says;
  const coll = d.collection ?? b.collection; if (coll) out.collection = coll;
  out.tags = [out.category, ...(coll ? [coll] : []), ...out.occasions, ...out.recipients];
  return out;
}

let started: Promise<void> | null = null;

/**
 * Pulls the live catalogue (prices, photos, stock, new or hidden products) from the database once per page load and
 * merges it into PRODUCTS in place. If the database cannot be reached, the built-in catalogue is used unchanged.
 */
export function syncCatalogue(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  started ??= (async () => {
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 4000);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&order=sort.asc`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, signal: ctl.signal });
      clearTimeout(t);
      if (!res.ok) return;
      const rows = (await res.json()) as ProductRow[];
      if (!Array.isArray(rows)) return;
      const live = new Set(rows.map((r) => r.id));
      for (const r of rows) {
        const i = PRODUCTS.findIndex((p) => p.id === r.id);
        const merged = applyRow(r, i >= 0 ? PRODUCTS[i] : undefined);
        if (i >= 0) PRODUCTS[i] = merged; else PRODUCTS.push(merged);
      }
      // The public API only returns active products, so anything missing was hidden in the admin.
      for (let i = PRODUCTS.length - 1; i >= 0; i--) if (!live.has(PRODUCTS[i]!.id)) PRODUCTS.splice(i, 1);
    } catch { /* keep built-in catalogue */ }
  })();
  return started;
}
