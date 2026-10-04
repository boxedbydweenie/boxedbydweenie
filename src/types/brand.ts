/** `sample: true` marks illustrative content that must be replaced before launch. */
interface Sampleable { sample?: boolean }
export interface BrandStat extends Sampleable { value: number | null; suffix?: string; label: string }
/** `logo` is an image URL; when empty the name is shown as a text wordmark. */
export interface BrandLogo extends Sampleable { name: string; logo: string }
export interface Milestone extends Sampleable { year: string; line: string }
export interface Founder extends Sampleable { name: string; title: string; note: string[]; portrait: string; signature: string }
export interface CustomerReview extends Sampleable { name: string; role: string; rating: number; text: string }
export interface CorporateTestimonial extends Sampleable { name: string; title: string; company: string; quote: string }
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
