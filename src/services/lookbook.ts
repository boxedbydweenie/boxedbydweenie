import { EDITIONS } from "@/data/lookbook";
import { createStore } from "@/lib/store";
import type { LookbookEdition, LookbookSummary, PdfRequest } from "@/types/lookbook";

const delay = <T,>(v: T, ms = 120) => new Promise<T>((r) => setTimeout(() => r(v), ms));

export const getEditions = (): Promise<LookbookSummary[]> =>
  delay(EDITIONS.map(({ pages, ...e }) => ({ ...e, pageCount: pages.length })));

export const getEdition = (slug: string): Promise<LookbookEdition | null> =>
  delay(EDITIONS.find((e) => e.slug === slug) ?? null);

/** Cover first, then facing pairs; a final odd page stands alone. */
export function buildSpreads(count: number): number[][] {
  const spreads: number[][] = [[1]];
  for (let p = 2; p <= count; p += 2) spreads.push(p + 1 <= count && p + 1 !== count ? [p, p + 1] : p + 1 === count ? [p, p + 1].slice(0, count - p === 1 && count % 2 === 0 ? 1 : 2) : [p]);
  return spreads.flatMap((s) => (s.length === 2 && s[1] === count && count % 2 === 0 ? [[s[0]!], [s[1]!]] : [s]));
}

/** Quote list shared between Look Book pages; persisted on this device. */
export const quoteListStore = createStore<string[]>("bbd-lookbook-quote", []);
export async function addToQuoteList(productId: string) {
  const list = quoteListStore.get();
  if (!list.includes(productId)) quoteListStore.set([...list, productId]);
}
export async function removeFromQuoteList(productId: string) {
  quoteListStore.set(quoteListStore.get().filter((id) => id !== productId));
}

/** Placeholder: a real backend would record the lead and return a file URL. */
export async function requestPdf(req: PdfRequest | { edition: string }) {
  await delay(null, 400);
  return { ok: true, edition: req.edition };
}
