import type { CorporatePackage, KeyDate } from "@/types/corporate";

// Placeholder prices per recipient. REPLACE with confirmed figures.
export const CORPORATE_PACKAGES: CorporatePackage[] = [
  {
    id: "essential",
    name: "Essential",
    fromPrice: 25000,
    toPrice: 55000,
    branding: ["Logo sticker seal", "Branded message card"],
    summary: "A considered thank-you for larger teams.",
    includes: ["Signature BBD box", "Two to three curated items", "Printed message card", "Logo sticker seal"],
  },
  {
    id: "signature",
    name: "Signature",
    fromPrice: 60000,
    toPrice: 140000,
    branding: ["Foil logo on lid", "Branded ribbon", "Personalised cards"],
    summary: "Our most-chosen box for staff and clients.",
    includes: ["Rigid keepsake box with ribbon", "Four to six premium items", "Logo on the box lid", "Personalised card per recipient"],
    highlighted: true,
  },
  {
    id: "prestige",
    name: "Prestige",
    fromPrice: 150000,
    toPrice: 400000,
    branding: ["Full custom box", "Engraved items", "Individual names"],
    summary: "For executives, partners and milestone moments.",
    includes: ["Luxury hamper or leather case", "Hand-selected premium pieces", "Full custom branding", "Individual names and white-glove delivery"],
  },
];

export const YEAR_END_DEADLINES: KeyDate[] = [
  { date: "2026-11-20", label: "Confirm your order for guaranteed pre-Christmas delivery." },
  { date: "2026-12-11", label: "Last date for late orders.", note: "Express surcharge applies." },
  { date: "2026-12-18", label: "All corporate deliveries complete." },
];

export const CONSULTATION_QUANTITIES = ["25 to 50", "51 to 100", "101 to 250", "251 to 500", "501 to 1,000", "Over 1,000"];

// REPLACE with the real WhatsApp business number.
export const WHATSAPP_URL = "https://wa.me/2340000000000";
