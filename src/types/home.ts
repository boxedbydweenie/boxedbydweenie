export interface Product { id: string; name: string; line: string; price: number; badge?: string }
export interface Occasion { name: string; slug: string }
export interface CalendarMoment { date: string; name: string; note: string }
export interface Review { name: string; role: string; rating: number; quote: string }
export interface HomeData { products: Product[]; occasions: Occasion[]; moments: CalendarMoment[]; reviews: Review[] }