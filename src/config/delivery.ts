import { SAME_DAY_CUTOFF_HOUR } from "./shop";

/** Mock delivery fees by state. Replace with the real logistics table. */
export const DELIVERY_FEES: Record<string, number> = {
  Lagos: 5000,
  "FCT Abuja": 9000,
  Ogun: 8000,
  Oyo: 10000,
  Rivers: 12000,
  Edo: 12000,
  Enugu: 12000,
  Kano: 15000,
  "Other states": 15000,
};

export const STATES = Object.keys(DELIVERY_FEES);

export const deliveryFeeFor = (state: string) => DELIVERY_FEES[state] ?? DELIVERY_FEES["Other states"];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Earliest delivery date: same day in Lagos before the cut-off, otherwise next day. */
export function earliestDelivery(sameDay: boolean, now = new Date()): string {
  const d = new Date(now);
  if (!(sameDay && now.getHours() < SAME_DAY_CUTOFF_HOUR)) d.setDate(d.getDate() + 1);
  return iso(d);
}

export const toIso = iso;
