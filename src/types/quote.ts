export type QuotePurpose = "year-end" | "employee-rewards" | "onboarding" | "client-appreciation" | "event-souvenirs" | "other";
export type BrandingKey = "logo-lid" | "sleeve" | "ribbon" | "message-card" | "names";
export type DeliveryMode = "one-address" | "branches" | "each-recipient";

export interface QuoteRequest {
  purpose: QuotePurpose | null;
  quantity: number;
  budget: number;
  /** Product ids, or "curate" for "Curate it for me". Max 3. */
  selections: string[];
  branding: BrandingKey[];
  logoFileName: string | null;
  deliveryMode: DeliveryMode;
  locations: string[];
  requiredBy: string;
  recipientListFileName: string | null;
  contact: { name: string; company: string; email: string; phone: string; role: string; notes: string; consent: boolean };
}

export interface Range { low: number; high: number }

export interface EstimateLine { label: string; detail?: string; low: number; high: number; negative?: boolean }

export interface Estimate {
  lines: EstimateLine[];
  unit: Range;
  subtotal: Range;
  vat: Range;
  total: Range;
  rush: boolean;
  discountPercent: number;
}

export interface Quote {
  ref: string;
  createdAt: string;
  validUntil: string;
  status: "Estimate";
  request: QuoteRequest;
  estimate: Estimate;
  /** Payload the CRM will receive. */
  crm: Record<string, unknown>;
}
