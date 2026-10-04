export type CorporatePurpose =
  | "year-end"
  | "employee-rewards"
  | "onboarding"
  | "client-appreciation"
  | "executive"
  | "event-souvenirs"
  | "branded-merchandise"
  | "gift-cards";

export interface CorporatePackage {
  /** Per-recipient price range shown in the Look Book. */
  toPrice?: number;
  branding?: string[];
  id: "essential" | "signature" | "prestige";
  name: string;
  fromPrice: number;
  summary: string;
  includes: string[];
  highlighted?: boolean;
}

export interface KeyDate {
  date: string; // ISO
  label: string;
  note?: string;
}

export interface ConsultationRequest {
  name: string;
  company: string;
  email: string;
  phone: string;
  role: string;
  quantity: string;
  requiredBy: string;
  message: string;
}

export interface ConsultationResult {
  reference: string;
}
