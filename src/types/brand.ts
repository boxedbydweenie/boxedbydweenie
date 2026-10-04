export interface BrandStat { value: number | null; suffix?: string; label: string }
export interface BrandLogo { name: string; logo: string }
export interface Milestone { year: string; line: string }
export interface Founder { name: string; title: string; note: string[]; portrait: string; signature: string }
export interface CustomerReview { name: string; role: string; rating: number; text: string }
export interface CorporateTestimonial { name: string; title: string; company: string; quote: string }
export interface BrandProfile {
  stats: BrandStat[];
  clients: BrandLogo[];
  recognition: BrandLogo[];
  milestones: Milestone[];
  founder: Founder;
  reviews: CustomerReview[];
  corporateTestimonials: CorporateTestimonial[];
  teamPhoto: string;
}
