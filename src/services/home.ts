import { HOME_DATA } from "@/data/home";
import { OCCASIONS } from "@/config/shop";
import { getBestsellers } from "./products";
import type { HomeData } from "@/types/home";

export async function getHomeData(): Promise<HomeData> {
  const best = await getBestsellers(8);
  return {
    ...HOME_DATA,
    occasions: OCCASIONS,
    products: best.map((p) => ({ id: p.id, slug: p.slug, name: p.name, line: p.line, price: p.price, inStock: p.inStock, ...(p.badges[0] ? { badge: p.badges[0] } : {}) })),
  };
}
