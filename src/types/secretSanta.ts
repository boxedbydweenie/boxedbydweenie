export type ExchangeType = "office" | "family" | "friends";
export type Payer = "each" | "company";
export type DeliveryMode = "one-address" | "each";
export type ExchangeStatus = "open" | "drawn" | "complete" | "closed";
export type ParticipantStatus = "invited" | "joined" | "wishlist" | "ordered" | "delivered";

export interface ExchangeDates {
  joinBy: string;
  draw: string;
  orderBy: string;
  exchange: string;
}

export interface Exchange {
  id: string;
  code: string;
  name: string;
  type: ExchangeType;
  organiserName: string;
  organisation?: string;
  logo?: string;
  welcome: string;
  budget: number;
  payer: Payer;
  organiserTakesPart: boolean;
  dates: ExchangeDates;
  delivery: DeliveryMode;
  address?: string;
  status: ExchangeStatus;
  maxParticipants: number;
  showMatches: boolean;
  allowReveal: boolean;
  /** Pairs of participant ids who must not draw each other. */
  exclusions: [string, string][];
  createdAt: string;
}

export interface WishlistItem {
  productId: string;
  addedAt: string;
}

export interface Participant {
  id: string;
  exchangeId: string;
  name: string;
  contact: string;
  status: ParticipantStatus;
  wishlist: WishlistItem[];
  likes: string;
  dislikes: string;
  sizes: string;
  noAlcohol: boolean;
  address?: string;
  isOrganiser?: boolean;
}

export interface Match {
  exchangeId: string;
  giverId: string;
  receiverId: string;
}

export interface Message {
  id: string;
  exchangeId: string;
  kind: "announcement" | "question" | "thanks";
  /** Participant id, or "organiser" for announcements. */
  fromId: string;
  toId?: string;
  body: string;
  at: string;
}

export interface SantaGiftOrder {
  id: string;
  exchangeId: string;
  giverId: string;
  receiverId: string;
  productId: string;
  note: string;
  status: "ordered" | "delivered";
  at: string;
}
