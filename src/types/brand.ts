export interface BrandStat { value: number; suffix?: string; label: string }
/** `logo` is an image URL under /public/clients. */
export interface BrandLogo { name: string; logo: string }
export interface CustomerReview { name: string; title: string; text: string }
export interface BrandProfile {
  stats: BrandStat[];
  clients: BrandLogo[];
  reviews: CustomerReview[];
}
