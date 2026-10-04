import type { BrandProfile } from "@/types/brand";

/**
 * Company profile content. Empty values are hidden on the site — never shown as placeholders.
 * Logo, portrait, signature and photo fields take an image URL (e.g. from an uploaded asset).
 * Stats: set `value` to a number to show it; `null` hides it.
 */
export const BRAND: BrandProfile = {
  stats: [
    { value: null, suffix: "+", label: "gifts delivered" },
    { value: null, suffix: "+", label: "companies served" },
    { value: null, label: "years in business" },
    { value: null, label: "cities delivered to" },
  ],
  clients: [],
  recognition: [],
  milestones: [
    { year: "June 2021", line: "The Plug Shop Limited, the company behind Boxed by Dweenie, is incorporated." },
  ],
  founder: { name: "", title: "", note: [], portrait: "", signature: "" },
  reviews: [],
  corporateTestimonials: [],
  teamPhoto: "",
};
