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
  { slug: "under-25", name: "Under ₦25,000" },
  { slug: "25-50", name: "₦25,000 to ₦50,000" },
  { slug: "50-100", name: "₦50,000 to ₦100,000" },
  { slug: "over-100", name: "Over ₦100,000" },
];

export const DISPENSE_DURATION_MS = 2000;
