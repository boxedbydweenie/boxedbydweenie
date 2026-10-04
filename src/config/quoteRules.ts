// PLACEHOLDER VALUES, TO BE CONFIRMED BY BOXED BY DWEENIE
import type { BrandingKey, DeliveryMode, QuotePurpose } from "@/types/quote";

export const PURPOSES: { slug: QuotePurpose; name: string; line: string }[] = [
  { slug: "year-end", name: "Year-end and festive", line: "Christmas and new-year boxes for staff and clients" },
  { slug: "employee-rewards", name: "Employee rewards", line: "Milestones, awards and thank-yous" },
  { slug: "onboarding", name: "Onboarding", line: "Welcome kits for new hires" },
  { slug: "client-appreciation", name: "Client appreciation", line: "Keep your best relationships warm" },
  { slug: "event-souvenirs", name: "Event souvenirs", line: "Conferences, launches and AGMs" },
  { slug: "other", name: "Other", line: "Tell us more in your notes" },
];

/** Map older purpose links (from /corporate) onto quote purposes. */
export const PURPOSE_ALIASES: Record<string, QuotePurpose> = {
  executive: "client-appreciation",
  "branded-merchandise": "event-souvenirs",
  "gift-cards": "other",
};

export const MIN_QUANTITY = 25;
export const QUANTITY_PICKS = [25, 50, 100, 250, 500, 1000];
export const BUDGET_MIN = 10000;
export const BUDGET_MAX = 250000;
export const BUDGET_STEP = 2500;
export const MAX_SELECTIONS = 3;
/** Products shown in step 3 must be within this share of the budget per recipient. */
export const BUDGET_FIT_TOLERANCE = 0.25;

/** Per-unit price range for corporate orders, keyed by product id. */
export const UNIT_PRICE_RANGES: Record<string, { low: number; high: number }> = {
  "prd-001": { low: 58000, high: 65000 },
  "prd-002": { low: 28000, high: 32000 },
  "prd-004": { low: 76000, high: 85000 },
  "prd-005": { low: 165000, high: 185000 },
  "prd-006": { low: 36000, high: 42000 },
  "prd-007": { low: 16000, high: 18500 },
  "prd-008": { low: 108000, high: 120000 },
  "prd-009": { low: 52000, high: 58000 },
  "prd-011": { low: 25000, high: 28000 },
  "prd-012": { low: 19500, high: 22000 },
  "prd-013": { low: 135000, high: 150000 },
  "prd-014": { low: 33000, high: 38000 },
  "prd-015": { low: 88000, high: 98000 },
  "prd-023": { low: 47000, high: 52000 },
  "prd-024": { low: 41000, high: 46000 },
};

/** "Curate it for me" range around the chosen budget. */
export const CURATE_RANGE = { low: 0.9, high: 1.1 };

export const BRANDING: { key: BrandingKey; name: string; perUnit: number }[] = [
  { key: "logo-lid", name: "Logo on box lid", perUnit: 1500 },
  { key: "sleeve", name: "Custom sleeve", perUnit: 2500 },
  { key: "ribbon", name: "Branded ribbon", perUnit: 800 },
  { key: "message-card", name: "Printed message card", perUnit: 500 },
  { key: "names", name: "Individual names", perUnit: 700 },
];

export const DELIVERY_MODES: { slug: DeliveryMode; name: string; line: string }[] = [
  { slug: "one-address", name: "One address", line: "We deliver everything to one office" },
  { slug: "branches", name: "Several branches", line: "Split across your offices" },
  { slug: "each-recipient", name: "Each recipient's address", line: "Doorstep delivery to every person" },
];

export const QUOTE_LOCATIONS = ["Lagos", "FCT Abuja", "Rivers", "Ogun", "Oyo", "Kano", "Other states"];

/**
 * Delivery fees by mode and location.
 * one-address and branches: fee per drop (one drop per location).
 * each-recipient: fee per gift, averaged across chosen locations.
 */
export const DELIVERY_FEES: Record<DeliveryMode, Record<string, number>> = {
  "one-address": { Lagos: 20000, "FCT Abuja": 45000, Rivers: 50000, Ogun: 30000, Oyo: 40000, Kano: 60000, "Other states": 60000 },
  branches: { Lagos: 15000, "FCT Abuja": 40000, Rivers: 45000, Ogun: 25000, Oyo: 35000, Kano: 55000, "Other states": 55000 },
  "each-recipient": { Lagos: 3500, "FCT Abuja": 5000, Rivers: 6000, Ogun: 4500, Oyo: 5500, Kano: 7000, "Other states": 7000 },
};

/** Volume discount on gifts, highest matching tier wins. */
export const VOLUME_TIERS: { min: number; percent: number }[] = [
  { min: 100, percent: 5 },
  { min: 250, percent: 8 },
  { min: 500, percent: 10 },
  { min: 1000, percent: 12 },
];

export const STANDARD_LEAD_DAYS = 10; // working days
export const EXPRESS_SURCHARGE_PERCENT = 15;
export const VAT_PERCENT = 7.5;
export const QUOTE_VALIDITY_DAYS = 7;
