import { HOME_DATA } from "@/data/home";
import type { HomeData } from "@/types/home";

export async function getHomeData(): Promise<HomeData> {
  return Promise.resolve(HOME_DATA);
}