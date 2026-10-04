import { BRAND } from "@/data/brand";
import type { BrandProfile, BrandStat } from "@/types/brand";

const filled = (s: string) => s.trim().length > 0;

/** Returns the company profile with every empty item removed. */
export async function getBrand(): Promise<BrandProfile> {
  return {
    stats: BRAND.stats.filter((s): s is BrandStat & { value: number } => typeof s.value === "number" && filled(s.label)).slice(0, 4),
    clients: BRAND.clients.filter((c) => filled(c.name) && filled(c.logo)),
    recognition: BRAND.recognition.filter((c) => filled(c.name) && filled(c.logo)),
    milestones: BRAND.milestones.filter((m) => filled(m.year) && filled(m.line)),
    founder: { ...BRAND.founder, note: BRAND.founder.note.filter(filled) },
    reviews: BRAND.reviews.filter((r) => filled(r.name) && filled(r.text)),
    corporateTestimonials: BRAND.corporateTestimonials.filter((t) => filled(t.name) && filled(t.quote)),
    teamPhoto: BRAND.teamPhoto,
  };
}

export const hasFounder = (b: BrandProfile) => filled(b.founder.name) && b.founder.note.length > 0;
export const formatStat = (s: BrandStat) => `${(s.value ?? 0).toLocaleString("en-GB")}${s.suffix ?? ""}`;
