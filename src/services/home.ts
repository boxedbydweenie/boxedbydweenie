import { HOME_DATA } from "@/data/home";
import { OCCASIONS } from "@/config/shop";
import { getBestsellers } from "./products";
import { upcomingOccasionsSync } from "./calendar";
import type { HomeData } from "@/types/home";

export async function getHomeData(): Promise<HomeData> {
  const best = await getBestsellers(8);
  return {
    ...HOME_DATA,
    occasions: OCCASIONS,
    moments: upcomingOccasionsSync().filter((i) => !i.tbc).slice(0, 3).map((i) => ({ date: i.date!, name: i.occasion.name, note: i.occasion.line, slug: i.occasion.slug })),
    products: best.map((p) => ({ id: p.id, slug: p.slug, name: p.name, line: p.line, price: p.price, inStock: p.inStock, ...(p.badges[0] ? { badge: p.badges[0] } : {}) })),
  };
}
