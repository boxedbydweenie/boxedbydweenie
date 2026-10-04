export type CategorySlug = "gift-boxes" | "hampers" | "corporate-gifts" | "souvenirs" | "packaging" | "gift-cards" | "experiences";
export type PriceBand = "under-25" | "25-50" | "50-100" | "over-100";
export type SortKey = "featured" | "price-asc" | "price-desc" | "newest";
export type PackagingChoice = "signature-black" | "ivory";

export interface ShopProduct {
  id: string;
  slug: string;
  name: string;
  line: string;
  description: string;
  price: number;
  images: string[];
  category: CategorySlug;
  occasions: string[];
  recipients: string[];
  tags: string[];
  inside: string[];
  badges: string[];
  inStock: boolean;
  sameDay: boolean;
  corporateEligible: boolean;
  minCorporateQty: number;
  featured: number;
  addedOn: string;
}

export interface ShopFilters {
  occasion?: string;
  recipient?: string;
  type?: string;
  budget?: string;
  sameday?: boolean;
  sort?: SortKey;
  q?: string;
}

export interface GiftCardDetails {
  design: "white-ribbon" | "black-leaf" | "ivory-bow";
  recipientName: string;
  recipientContact: string;
  message: string;
  sendOn: string | null;
}

export interface CartItem {
  key: string;
  kind: "product" | "gift-card";
  productId: string;
  slug?: string;
  name: string;
  price: number;
  quantity: number;
  packaging?: PackagingChoice;
  note?: string;
  handwritten?: boolean;
  deliveryDate?: string;
  giftCard?: GiftCardDetails;
}

export interface Recipient {
  id: string;
  name: string;
  phone: string;
  address: string;
  state: string;
  area: string;
}

export type OrderStatus = 0 | 1 | 2 | 3;

export interface Order {
  id: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  sendTo: "someone" | "me";
  recipient: Omit<Recipient, "id"> & { deliveryDate: string; notes: string; surprise: boolean };
  customer: { name: string; email: string; phone: string };
  payment: "card" | "transfer" | "ussd";
}

export interface AccountUser {
  name: string;
  email: string;
  phone: string;
}
