import type { CategorySlug, ShopProduct } from "@/types/shop";

/** Placeholder catalogue. Names, prices and contents are for layout only. */
type Seed = [name: string, line: string, price: number, category: CategorySlug, occasions: string[], recipients: string[], inside: string[], badges?: string[], sameDay?: boolean, minQty?: number];

const seeds: Seed[] = [
  ["The Signature Box", "Our house favourite, boxed in black and gold", 65000, "gift-boxes", ["birthday", "anniversary", "congratulations"], ["her", "him", "couples"], ["Scented candle", "Silk eye mask", "Artisan chocolates", "Rose gold notebook", "Handwritten card"], ["Bestseller"], true, 25],
  ["The Thank You Box", "Gratitude in every detail", 32000, "gift-boxes", ["thank-you"], ["her", "him", "colleagues"], ["Shortbread biscuits", "Loose-leaf tea", "Ceramic mug", "Thank you card"], [], true, 25],
  ["New Mum Care Box", "Rest and ritual for the first weeks", 78000, "gift-boxes", ["new-baby"], ["her"], ["Nursing robe", "Shea body butter", "Herbal tea", "Baby muslin set", "Bath soak", "Keepsake card"], ["New"], false, 0],
  ["The Gentleman's Box", "Considered essentials for him", 85000, "gift-boxes", ["birthday", "anniversary"], ["him"], ["Leather card holder", "Beard oil", "Cologne miniature", "Dark chocolate", "Cufflinks"], ["Same-day Lagos"], true, 25],
  ["The Executive Hamper", "A generous hamper for leadership", 185000, "hampers", ["christmas", "thank-you", "congratulations"], ["him", "her", "colleagues"], ["Sparkling wine", "Premium nuts", "Leather journal", "Fountain pen", "Gourmet cookies", "Scented candle", "Branded card"], ["Bestseller"], false, 10],
  ["The Welcome Aboard Kit", "A first-day welcome for new hires", 42000, "corporate-gifts", ["congratulations"], ["colleagues"], ["Insulated bottle", "Notebook and pen", "Desk plant", "Snack selection", "Welcome card"], ["Corporate"], false, 25],
  ["A Little Luxury", "Small gestures, beautifully boxed", 18500, "gift-boxes", ["birthday", "thank-you", "get-well"], ["her", "him"], ["Mini candle", "Truffles", "Lip balm", "Gift tag"], [], true, 25],
  ["The Celebration Hamper", "Raise a glass to good news", 120000, "hampers", ["congratulations", "wedding", "birthday"], ["couples", "her", "him"], ["Champagne", "Two flutes", "Macarons", "Chocolate-dipped dates", "Celebration card"], ["Bestseller"], true, 10],
  ["Sunday Morning", "An unhurried breakfast ritual", 58000, "hampers", ["anniversary", "thank-you"], ["couples", "her"], ["Ground coffee", "Granola", "Honey jar", "Linen napkins", "Two mugs"], [], true, 25],
  ["Forever Yours", "For the one who still gives you butterflies", 95000, "gift-boxes", ["anniversary", "wedding"], ["her", "couples"], ["Preserved roses", "Perfume", "Silk scrunchies", "Chocolates", "Love letter card"], [], true, 0],
  ["Get Well Soon Box", "Comfort, care and a little sunshine", 28000, "gift-boxes", ["get-well"], ["her", "him", "children"], ["Herbal tea", "Fuzzy socks", "Fruit drops", "Hand cream", "Card"], [], true, 25],
  ["Little Star Box", "Joy for the little ones", 22000, "gift-boxes", ["birthday", "christmas"], ["children"], ["Plush toy", "Colouring set", "Sweets jar", "Storybook"], [], true, 25],
  ["The Festive Hamper", "The season's biggest gifting moment", 150000, "hampers", ["christmas"], ["couples", "colleagues", "him", "her"], ["Red wine", "Christmas cake", "Spiced nuts", "Gold bauble set", "Candle", "Festive card"], ["Seasonal"], false, 10],
  ["Employee Appreciation Box", "Thank your team properly", 38000, "corporate-gifts", ["thank-you", "christmas"], ["colleagues"], ["Branded tumbler", "Snack selection", "Notebook", "Thank you card"], ["Corporate"], false, 50],
  ["The Client Delight Hamper", "Keep your best clients close", 98000, "corporate-gifts", ["christmas", "thank-you"], ["colleagues"], ["Sparkling juice", "Gourmet biscuits", "Leather coaster set", "Branded card", "Chocolate selection"], ["Corporate"], false, 25],
  ["Party Favour Bags (set of 10)", "Tiny thank-yous for every guest", 24000, "souvenirs", ["birthday", "wedding"], ["children", "couples"], ["10 gold-tied bags", "Sweets", "Mini bubbles", "Name tags"], [], false, 1],
  ["Wedding Souvenir Set (set of 20)", "Keepsakes for your big day", 70000, "souvenirs", ["wedding"], ["couples"], ["20 mini candles", "Custom labels", "Ribbon ties", "Ivory boxes"], [], false, 1],
  ["Signature Gift Wrap", "Bring your gift, we box it beautifully", 8500, "packaging", ["birthday", "anniversary", "christmas"], ["her", "him"], ["Black rigid box", "Gold satin ribbon", "Tissue paper", "Gift tag"], [], true, 0],
  ["Ivory Keepsake Box", "A box worth keeping long after", 12000, "packaging", ["wedding", "new-baby"], ["her", "couples"], ["Ivory rigid box", "Gold foil seal", "Crinkle fill", "Card"], [], true, 0],
  ["BBD Gift Card", "Let them choose their wow", 25000, "gift-cards", ["birthday", "thank-you", "christmas", "congratulations"], ["her", "him", "colleagues"], ["Digital or printed card", "Personal message", "Valid for 12 months", "Use across the shop"], [], true, 0],
  ["Spa Day for Two", "An afternoon of stillness", 140000, "experiences", ["anniversary", "birthday"], ["couples", "her"], ["Two 60-minute massages", "Facial", "Herbal tea", "Robe and slippers"], ["Experience"], false, 0],
  ["Private Dinner Experience", "A table set just for two", 210000, "experiences", ["anniversary", "wedding"], ["couples"], ["Private chef", "Three-course menu", "Floral styling", "Live violinist", "Keepsake menu"], ["Experience"], false, 0],
  ["Soft Life Selection", "Rest, ritual and indulgence", 52000, "gift-boxes", ["birthday", "get-well", "thank-you"], ["her"], ["Silk pillowcase", "Body oil", "Bath salts", "Candle", "Chocolate bar"], ["Bestseller"], true, 25],
  ["Congratulations Box", "For promotions, graduations and big wins", 46000, "gift-boxes", ["congratulations"], ["her", "him", "colleagues"], ["Mini champagne", "Gold pen", "Notebook", "Truffles", "Congratulations card"], [], true, 25],
];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const PRODUCTS: ShopProduct[] = seeds.map(([name, line, price, category, occasions, recipients, inside, badges = [], sameDay = false, minQty = 0], i) => ({
  id: `prd-${String(i + 1).padStart(3, "0")}`,
  slug: slugify(name),
  name,
  line,
  description: `${line}. Each ${name} is hand-finished in our Lagos studio, wrapped in your choice of packaging and delivered with a guaranteed wow.`,
  price,
  images: [name, `${name}, opened`, `${name}, contents`, `${name}, packaging detail`],
  category,
  occasions,
  recipients,
  tags: [category, ...occasions, ...recipients],
  inside,
  badges,
  inStock: i !== 16,
  sameDay,
  corporateEligible: minQty > 1,
  minCorporateQty: minQty,
  featured: badges.includes("Bestseller") ? i : 100 + i,
  addedOn: `2026-${String(1 + (i % 9)).padStart(2, "0")}-${String(1 + ((i * 3) % 27)).padStart(2, "0")}`,
}));
