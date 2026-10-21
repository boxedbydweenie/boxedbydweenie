import { BRAND } from "@/data/brand";
import type { BrandProfile, BrandStat } from "@/types/brand";

/** Returns the approved company profile content. */
export async function getBrand(): Promise<BrandProfile> { return BRAND; }
export const formatStat = (s: BrandStat) => `${s.value.toLocaleString("en-GB")}${s.suffix ?? ""}`;
