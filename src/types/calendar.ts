export type OccasionCategory = "celebrations" | "faith" | "family" | "workplace";

/** How an occasion's date is worked out each year. */
export type OccasionRule =
  | { type: "fixed"; month: number; day: number }
  /** nth weekday of a month (weekday 0 = Sunday). offsetDays shifts the result, e.g. Black Friday. */
  | { type: "nth-weekday"; month: number; weekday: number; nth: number; offsetDays?: number }
  /** Moves each year. Shown as "Date to be confirmed" unless a confirmed date exists for that year. */
  | { type: "moveable"; estimate: { month: number; day: number }; confirmed: Record<number, string> }
  /** No single date, e.g. work anniversaries. */
  | { type: "anytime" };

export interface ShopLink {
  occasion?: string;
  recipient?: string;
  type?: string;
}

export interface Occasion {
  slug: string;
  name: string;
  rule: OccasionRule;
  category: OccasionCategory;
  line: string;
  note: string;
  orderByOffsetDays: number;
  shop: ShopLink;
  moveable: boolean;
}

/** An occasion placed on a specific date for display. */
export interface OccasionInstance {
  occasion: Occasion;
  /** ISO yyyy-mm-dd; estimated when tbc is true. Null for anytime occasions. */
  date: string | null;
  tbc: boolean;
  orderBy: string | null;
}

/* Generic shapes shared with the future mobile app. */
export type Relationship = "Partner" | "Parent" | "Sibling" | "Child" | "Friend" | "Colleague" | "Client" | "Other";
export type PersonalDateType = "birthday" | "anniversary" | "custom";
export type ReminderChannel = "email" | "whatsapp" | "sms";

export interface PersonalDate {
  id: string;
  personId: string;
  type: PersonalDateType;
  label: string;
  day: number;
  month: number;
  year?: number;
}

export interface Reminder {
  daysBefore: number[];
  channels: ReminderChannel[];
}

export interface PersonNotes {
  likes: string;
  dislikes: string;
  sizes: string;
  noAlcohol: boolean;
  budget: number;
}

export interface Person {
  id: string;
  name: string;
  relationship: Relationship;
  photo?: string;
  dates: PersonalDate[];
  notes: PersonNotes;
  reminder: Reminder;
  createdAt: string;
}

export interface ScheduledGift {
  id: string;
  personId: string;
  productId: string;
  deliveryDate: string;
  status: "scheduled" | "sent";
  occasionLabel: string;
}
