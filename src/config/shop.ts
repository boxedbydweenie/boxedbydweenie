import type { CategorySlug, PackagingChoice, PriceBand, SortKey } from "@/types/shop";

export const CATEGORIES: { slug: CategorySlug; name: string }[] = [
  { slug: "gift-boxes", name: "Gift Boxes" },
  { slug: "hampers", name: "Hampers" },
  { slug: "corporate-gifts", name: "Corporate Gifts" },
  { slug: "souvenirs", name: "Souvenirs and Party Favours" },
  { slug: "packaging", name: "Packaging" },
  { slug: "gift-cards", name: "Gift Cards" },
  { slug: "experiences", name: "Experiences" },
];

export const OCCASIONS = [
  { slug: "birthday", name: "Birthday" },
  { slug: "anniversary", name: "Anniversary" },
  { slug: "wedding", name: "Wedding" },
  { slug: "new-baby", name: "New Baby" },
  { slug: "thank-you", name: "Thank You" },
  { slug: "congratulations", name: "Congratulations" },
  { slug: "get-well", name: "Get Well" },
  { slug: "christmas", name: "Christmas" },
];

export const RECIPIENTS = [
  { slug: "her", name: "For her" },
  { slug: "him", name: "For him" },
  { slug: "couples", name: "For couples" },
  { slug: "children", name: "For children" },
  { slug: "colleagues", name: "For colleagues" },
];

export const PRICE_BANDS: { slug: PriceBand; name: string; min: number; max: number }[] = [
  { slug: "under-25", name: "Under ₦250,000", min: 0, max: 249999 },
  { slug: "25-50", name: "₦250,000 to ₦500,000", min: 250000, max: 500000 },
  { slug: "50-100", name: "₦500,000 to ₦1,000,000", min: 500001, max: 1000000 },
  { slug: "over-100", name: "Over ₦1,000,000", min: 1000001, max: Infinity },
];

export const SORTS: { slug: SortKey; name: string }[] = [
  { slug: "featured", name: "Featured" },
  { slug: "price-asc", name: "Price low to high" },
  { slug: "price-desc", name: "Price high to low" },
  { slug: "newest", name: "Newest" },
];

export const PACKAGING: { slug: PackagingChoice; name: string; line: string }[] = [
  { slug: "signature-black", name: "Signature Black Box", line: "Nero Black with gold satin ribbon" },
  { slug: "ivory", name: "Ivory Box", line: "Soft ivory with gold foil detail" },
];

export const GIFT_NOTE_LIMIT = 250;
export const BULK_THRESHOLD = 25;
export const SAME_DAY_CUTOFF_HOUR = 12;
export const GIFT_CARD_AMOUNTS = [10000, 25000, 50000, 100000];
export const GIFT_CARD_MIN = 5000;
export const GIFT_CARD_MAX = 1000000;

/** Placeholder promo codes until the real backend validates them. */
export const PROMO_CODES: Record<string, number> = { MOMENTS10: 10 };

export const POPULAR_SEARCHES = ["Birthday box", "Hamper", "For him", "Corporate", "Gift card", "New baby"];

export const SEARCH_PAGES = [
  { name: "Corporate gifting", to: "/corporate" },
  { name: "Instant quote", to: "/corporate/quote" },
  { name: "Gift cards", to: "/gift-cards" },
  { name: "Gift Dispenser", to: "/dispenser" },
  { name: "Delivery and returns", to: "/delivery-and-returns" },
  { name: "Contact", to: "/contact" },
] as const;

export const ORDER_STEPS = ["Order received", "Being boxed", "Out for delivery", "Delivered"];
