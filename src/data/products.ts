import type { CategorySlug, ShopProduct } from "@/types/shop";

/**
 * Catalogue from the 2026 product book.
 * `confirmed: true` = one of the client's six real 2026 editions (names, prices, contents from her list).
 * `confirmed: false` = placeholder written for layout from the photo; the client must confirm or replace it.
 */
interface Seed {
  name: string; collection: string; price: number; category: CategorySlug; occasions: string[]; recipients: string[];
  poem: string[]; idealFor: string; inside: string[]; saysAboutYou: string; image: string; badges: string[]; minQty: number; confirmed: boolean;
}

const seeds: Seed[] = [
  { name: "Corporate Edition", collection: "The Team Collection", price: 350000, category: "corporate-gifts", occasions: ["thank-you", "christmas"], recipients: ["colleagues"],
    poem: ["A cup kept warm, a tidier desk,", "a speaker for the long afternoon.", "Small things that make the work lighter."], idealFor: "Hard-working teams, new hires and staff awards.", inside: ["Notepad, pen and cup set", "Bluetooth speaker", "3-in-1 charger", "Rotating laptop stand", "Wireless earbuds", "Room spray and treats"], saysAboutYou: "You notice the work, and you back the people doing it.",
    image: "/products/p01.jpg", badges: ["2026 Edition", "Bestseller"], minQty: 10, confirmed: true },
  { name: "Abundance Edition", collection: "The Team Collection", price: 350000, category: "corporate-gifts", occasions: ["thank-you", "christmas"], recipients: ["colleagues"],
    poem: ["Rice for Sunday, oil for the week,", "something sweet for the children.", "A full kitchen, carried home."], idealFor: "Year-end staff gifts for the whole family.", inside: ["5kg basmati rice", "Barilla pasta, two packs", "Premium cooking oil", "Borosilicate bowls", "Pancake mix and jam", "Fruit wine and cookies"], saysAboutYou: "You look after your people, and the people they go home to.",
    image: "/products/p02.jpg", badges: ["2026 Edition"], minQty: 10, confirmed: true },
  { name: "The Welcome Box", collection: "The Team Collection", price: 200000, category: "corporate-gifts", occasions: ["thank-you", "christmas"], recipients: ["colleagues"],
    poem: ["Your name on the flask,", "your colours on the box.", "Day one, and they already belong."], idealFor: "New hires, conference guests and client kits.", inside: ["Branded steel flask", "Insulated tumbler", "Notebook", "Harrods chocolates", "Premium whisky", "Printed gift box"], saysAboutYou: "You were expecting them, and you prepared.",
    image: "/products/p03.jpg", badges: [], minQty: 10, confirmed: false },
  { name: "The Pantry Classic", collection: "The Team Collection", price: 250000, category: "corporate-gifts", occasions: ["thank-you", "christmas"], recipients: ["colleagues"],
    poem: ["Tea for the morning, pasta for the evening,", "biscuits for whoever visits.", "The everyday, done properly."], idealFor: "Large teams, where every colleague gets a box.", inside: ["Tetley tea", "Barilla pasta", "Cooking oil", "Biscuit selection", "Powdered milk", "Marmalade and honey"], saysAboutYou: "Nobody on your team was left out.",
    image: "/products/p04.jpg", badges: [], minQty: 10, confirmed: false },
  { name: "Executive Edition", collection: "The Client Collection", price: 500000, category: "hampers", occasions: ["thank-you", "christmas", "congratulations"], recipients: ["colleagues", "him", "her"],
    poem: ["A lamp for late ideas,", "power for the long trip,", "a glass raised when the deal is done."], idealFor: "Managers, senior staff and valued client contacts.", inside: ["Soundcore power bank", "Lamp and smart charger", "Posture corrector", "Vacuum and blower", "Premium glass decor", "Prosecco and fruit cake"], saysAboutYou: "You value their time as much as their business.",
    image: "/products/p05.jpg", badges: ["2026 Edition", "Bestseller"], minQty: 10, confirmed: true },
  { name: "The Home Edition", collection: "The Client Collection", price: 500000, category: "hampers", occasions: ["thank-you", "christmas", "congratulations"], recipients: ["colleagues", "him", "her"],
    poem: ["Soft sheets, a warm robe,", "a candle lit at dusk.", "Home, made gentler."], idealFor: "Clients, partners and housewarmings.", inside: ["Silk 6x6 bedsheet set", "100% cotton bathrobe", "Luxury throw", "Humidifier", "Candle and diffuser", "Prosecco and fruit cake"], saysAboutYou: "You care how they live, not only how they work.",
    image: "/products/p06.jpg", badges: ["2026 Edition"], minQty: 10, confirmed: true },
  { name: "The Host Edition", collection: "The Client Collection", price: 400000, category: "hampers", occasions: ["thank-you", "christmas", "congratulations"], recipients: ["colleagues", "him", "her"],
    poem: ["Crepes on a slow Saturday,", "coffee in its own jar,", "a candle for the table."], idealFor: "Clients who love to entertain at home.", inside: ["Electric crepe maker", "Tea, coffee, sugar jars", "Electric wine opener", "Scented candle", "Hand wash and lotion", "Wine and biscuits"], saysAboutYou: "You remembered that they love a full house.",
    image: "/products/p07.jpg", badges: [], minQty: 10, confirmed: false },
  { name: "The Connoisseur", collection: "The Client Collection", price: 450000, category: "hampers", occasions: ["thank-you", "christmas", "congratulations"], recipients: ["colleagues", "him", "her"],
    poem: ["Red wine, a copper flask,", "chocolate saved for later.", "For the one who knows what is good."], idealFor: "Long-standing clients and trusted partners.", inside: ["Red wine", "Copper flask and tumbler", "Milk chocolates", "Watch organiser", "Hand wash set", "Elderflower pressé"], saysAboutYou: "You have paid attention to their taste.",
    image: "/products/p08.jpg", badges: [], minQty: 10, confirmed: false },
  { name: "Prestige Collection", collection: "The Leadership Collection", price: 650000, category: "hampers", occasions: ["congratulations", "christmas"], recipients: ["him", "her", "colleagues"],
    poem: ["Adire, dyed by hand,", "a grill for the weekend,", "a bottle opened among friends."], idealFor: "Top clients, directors and senior partners.", inside: ["100% Adire cotton fabric", "Indoor BBQ grill", "Food processor", "Whiskey and fruit wine", "Borosilicate bowls", "Hand wash and diffuser"], saysAboutYou: "You honour where they come from and how far they have gone.",
    image: "/products/p09.jpg", badges: ["2026 Edition"], minQty: 10, confirmed: true },
  { name: "Signature Collection", collection: "The Leadership Collection", price: 850000, category: "hampers", occasions: ["congratulations", "christmas"], recipients: ["him", "her", "colleagues"],
    poem: ["Dressed in your colours,", "Harrods for tea, Rituals for the evening.", "Our finest, made to be yours."], idealFor: "VIP clients, board members and chairmen.", inside: ["Rituals diffuser set", "Harrods tea and cookies", "Baylis & Harding set", "Watch roll", "Brookstone valet", "Prosecco and Belvoir"], saysAboutYou: "For them, only your best will do.",
    image: "/products/p10.jpg", badges: ["2026 Edition", "Bestseller"], minQty: 10, confirmed: true },
  { name: "The Chairman's Reserve", collection: "The Leadership Collection", price: 1200000, category: "hampers", occasions: ["congratulations", "christmas"], recipients: ["him", "her", "colleagues"],
    poem: ["Single malt, fifteen years in oak,", "crystal to pour it into,", "and a table of everything else."], idealFor: "Chairmen, founders and guests of honour.", inside: ["Glenfiddich 15", "Whisky glass set", "Cookware set", "Electric crepe maker", "Lindor chocolate tin", "Watch organiser"], saysAboutYou: "You know who sits at the head of the table.",
    image: "/products/p11.jpg", badges: [], minQty: 10, confirmed: false },
  { name: "The Single Malt Set", collection: "The Leadership Collection", price: 300000, category: "hampers", occasions: ["congratulations", "christmas"], recipients: ["him", "her", "colleagues"],
    poem: ["One bottle, one decanter,", "two fingers poured at the day's end.", "Nothing else is needed."], idealFor: "Senior leaders, promotions and closed deals.", inside: ["Glenfiddich 15", "Crystal decanter", "Whisky glasses", "Toblerone", "Wooden gift case", "Gift wrapping"], saysAboutYou: "You mark the big moments properly.",
    image: "/products/p12.jpg", badges: [], minQty: 10, confirmed: false },
  { name: "The Christmas Table", collection: "The Festive Collection", price: 380000, category: "hampers", occasions: ["christmas"], recipients: ["couples", "colleagues", "him", "her"],
    poem: ["Tea in the pot, chocolate on the table,", "fresh towels for the guests.", "The house is ready for December."], idealFor: "Staff and clients at Christmas.", inside: ["Lindor chocolates", "Tetley tea and honey", "Barilla pasta and oats", "Luxury towel set", "Whisky glass set", "Red wine"], saysAboutYou: "You wished them a full and happy home.",
    image: "/products/p13.jpg", badges: [], minQty: 10, confirmed: false },
  { name: "The Family Feast", collection: "The Festive Collection", price: 420000, category: "hampers", occasions: ["christmas"], recipients: ["couples", "colleagues", "him", "her"],
    poem: ["Pasta for the cousins, crackers for the aunties,", "elderflower in the tall glasses.", "Everyone is home, and there is enough."], idealFor: "Family gifting and large households.", inside: ["Lindor gift box", "Ritz crackers", "Elderflower pressé", "Barilla pasta", "Tetley tea", "Marmalade and honey"], saysAboutYou: "You thought of the whole family.",
    image: "/products/p14.jpg", badges: [], minQty: 10, confirmed: false },
  { name: "The Fireside", collection: "The Festive Collection", price: 700000, category: "hampers", occasions: ["christmas"], recipients: ["couples", "colleagues", "him", "her"],
    poem: ["A red tin of chocolate,", "biscotti beside the tea,", "single malt for the last hour of the year."], idealFor: "Executives and key accounts at year-end.", inside: ["Glenfiddich 15", "Lindor chocolate tin", "Biscotti", "Whisky glass set", "Watch organiser", "Hand lotion set"], saysAboutYou: "You end the year as you ran it, with care.",
    image: "/products/p15.jpg", badges: [], minQty: 10, confirmed: false },
  { name: "The Evergreen", collection: "The Festive Collection", price: 450000, category: "hampers", occasions: ["christmas"], recipients: ["couples", "colleagues", "him", "her"],
    poem: ["Tied in green satin,", "copper that keeps the wine cool,", "strawberry jam for the morning after."], idealFor: "Partners, suppliers and friends of the business.", inside: ["Red wine", "Copper flask set", "Strawberry jam", "Milk chocolates", "Pancake mix and pasta", "Tetley tea"], saysAboutYou: "You remember the people who helped all year.",
    image: "/products/p16.jpg", badges: [], minQty: 10, confirmed: false },
  { name: "The Blush Box", collection: "The Milestone Collection", price: 150000, category: "gift-boxes", occasions: ["birthday", "wedding", "thank-you"], recipients: ["her"],
    poem: ["Pink ribbon, a candle called Blush,", "bubbles saved for Friday.", "A small box that says a great deal."], idealFor: "Birthdays, bridal showers and thank-yous.", inside: ["Blush scented candle", "Sparkling rosé", "Fragrance gift set", "Body care duo", "Personal note card", "White and gold box"], saysAboutYou: "You remembered their day.",
    image: "/products/p17.jpg", badges: [], minQty: 0, confirmed: false },
  { name: "The Spa Chest", collection: "The Milestone Collection", price: 480000, category: "gift-boxes", occasions: ["anniversary", "wedding"], recipients: ["couples", "her"],
    poem: ["Thick towels, a soft mat underfoot,", "fig and vetiver in the air.", "Close the door. The day can wait."], idealFor: "New homes, weddings and well-earned rest.", inside: ["Cotton towel set", "Cushioned bath mat", "Fig and vetiver candle", "Home perfume", "Aroma humidifier", "Hotel-style pillow"], saysAboutYou: "You want them to rest well.",
    image: "/products/p18.jpg", badges: [], minQty: 0, confirmed: false },
  { name: "The Sunday Box", collection: "The Milestone Collection", price: 320000, category: "gift-boxes", occasions: ["anniversary", "new-baby"], recipients: ["couples"],
    poem: ["Crepes off the pan,", "bourbon biscuits with the tea,", "cranberry poured over ice."], idealFor: "Anniversaries, new parents and long service.", inside: ["Electric crepe maker", "Bourbon biscuits", "Biscuit sharing pack", "Cranberry juice", "Scented candle", "Hand wash and lotion"], saysAboutYou: "You gave them a reason to slow down.",
    image: "/products/p19.jpg", badges: [], minQty: 0, confirmed: false },
  { name: "Little Luxuries", collection: "The Milestone Collection", price: 95000, category: "gift-boxes", occasions: ["birthday", "thank-you", "get-well"], recipients: ["her", "him"],
    poem: ["Chocolate, a candle, a cup for the road.", "Small enough to carry,", "kind enough to remember."], idealFor: "Thank-yous, birthdays and get-well wishes.", inside: ["Chocolate selection", "Butter biscuits", "Mixed nuts", "Scented candle", "Insulated tumbler", "Gift box"], saysAboutYou: "You thought of them, for no reason at all.",
    image: "/products/p20.jpg", badges: [], minQty: 0, confirmed: false },
];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const giftCard: ShopProduct = {
  id: "prd-gift-card", slug: "bbd-gift-card", name: "BBD Gift Card", line: "Let them choose their wow",
  description: "A Boxed by Dweenie gift card, sent digitally or printed, valid for 12 months across the shop.",
  price: 25000, images: ["/products/p20.jpg"], category: "gift-cards", occasions: ["birthday", "thank-you", "christmas", "congratulations"],
  recipients: ["her", "him", "colleagues"], tags: ["gift-cards"], inside: ["Digital or printed card", "Personal message", "Valid for 12 months", "Use across the shop"],
  badges: [], inStock: true, sameDay: true, corporateEligible: false, minCorporateQty: 0, featured: 200, addedOn: "2026-10-01",
};

export const PRODUCTS: ShopProduct[] = [
  ...seeds.map((s, i): ShopProduct => ({
    id: `prd-${String(i + 1).padStart(3, "0")}`,
    slug: slugify(s.name),
    name: s.name,
    line: s.idealFor.replace(/\.$/, ""),
    description: `${s.poem.join(" ")} ${s.saysAboutYou}`,
    price: s.price,
    images: [s.image],
    category: s.category,
    occasions: s.occasions,
    recipients: s.recipients,
    tags: [s.category, s.collection, ...s.occasions, ...s.recipients],
    inside: s.inside,
    badges: s.badges,
    inStock: true,
    sameDay: s.price <= 250000,
    corporateEligible: s.minQty > 1,
    minCorporateQty: s.minQty,
    featured: s.badges.includes("Bestseller") ? i : s.confirmed ? 20 + i : 100 + i,
    addedOn: "2026-10-01",
    collection: s.collection,
    poem: s.poem,
    idealFor: s.idealFor,
    saysAboutYou: s.saysAboutYou,
    confirmed: s.confirmed,
  })),
  giftCard,
];
