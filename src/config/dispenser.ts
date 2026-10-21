/** Gift Dispenser question options. `matches` maps to product recipient tags. */
export const DISPENSER_RECIPIENTS = [
  { slug: "her", name: "Her", matches: ["her"] },
  { slug: "him", name: "Him", matches: ["him"] },
  { slug: "couple", name: "A couple", matches: ["couples"] },
  { slug: "parent", name: "A parent", matches: ["her", "him"] },
  { slug: "colleague", name: "A colleague", matches: ["colleagues"] },
  { slug: "client", name: "A client", matches: ["colleagues"] },
  { slug: "child", name: "A child", matches: ["children"] },
  { slug: "someone-new", name: "Someone new", matches: [] as string[] },
];

export const DISPENSER_OCCASIONS = [
  { slug: "birthday", name: "Birthday" },
  { slug: "anniversary", name: "Anniversary" },
  { slug: "thank-you", name: "Thank you" },
  { slug: "congratulations", name: "Congratulations" },
  { slug: "new-baby", name: "New baby" },
  { slug: "get-well", name: "Get well" },
  { slug: "just-because", name: "Just because" },
  { slug: "christmas", name: "Christmas" },
];

export const DISPENSER_BUDGETS = [
  { slug: "under-25", name: "Under ₦250,000" },
  { slug: "25-50", name: "₦250,000 to ₦500,000" },
  { slug: "50-100", name: "₦500,000 to ₦1,000,000" },
  { slug: "over-100", name: "Over ₦1,000,000" },
];

/** What would make them light up. `words` are matched against each gift's name and contents. */
export const DISPENSER_VIBES = [
  { slug: "pamper", name: "Pampered and calm", line: "Self-care, softness, a quiet moment", words: ["silk", "robe", "candle", "spa", "bath", "perfume", "skin", "lotion", "scent", "diffuser", "sheet", "slipper", "blanket", "towel", "wellness", "tea", "room spray"] },
  { slug: "tech", name: "Smart and useful", line: "Gadgets they will really use", words: ["speaker", "charger", "earbud", "headphone", "lamp", "power bank", "laptop", "bluetooth", "wireless", "watch", "tech"] },
  { slug: "feast", name: "Fed and spoiled", line: "Treats, wine and a full table", words: ["wine", "prosecco", "champagne", "chocolate", "cookie", "treat", "rice", "pasta", "oil", "jam", "nuts", "snack", "biscuit", "cracker", "juice", "drink", "tea", "coffee", "pantry"] },
  { slug: "home", name: "Cosy and at home", line: "Comfort that makes a house a home", words: ["bowl", "candle", "blanket", "pillow", "throw", "mug", "cup", "glass", "tray", "decor", "home", "kitchen", "sheet", "diffuser"] },
  { slug: "all", name: "A bit of everything", line: "Surprise me with a mix", words: [] as string[] },
];

/** The impression you want to leave. Nudges ranking, never hides gifts. */
export const DISPENSER_IMPRESSIONS = [
  { slug: "thoughtful", name: "Deeply thoughtful", line: "They feel truly seen" },
  { slug: "luxurious", name: "Impressively luxurious", line: "A statement they will show off" },
  { slug: "fun", name: "Fun and memorable", line: "A smile they talk about for weeks" },
  { slug: "professional", name: "Polished and professional", line: "Gracious, on-brand, appropriate" },
];

export const DISPENSER_TIMINGS = [
  { slug: "today", name: "Today", line: "Same-day in Lagos, order before 12 noon" },
  { slug: "soon", name: "In the next few days", line: "Next-day in Lagos and Abuja" },
  { slug: "later", name: "I have time", line: "Pick a date at checkout" },
];

export const DISPENSE_DURATION_MS = 3200;
