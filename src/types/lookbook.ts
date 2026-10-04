export interface Hotspot {
  productId: string;
  /** Position as a percentage of the image slot. */
  x: number;
  y: number;
}

export type LookbookPage =
  | { kind: "cover"; title: string; image: string }
  | { kind: "note"; title: string; heading: string; body: string[]; signature: string }
  | { kind: "full-bleed"; title: string; image: string; caption: string; tone?: "ivory" | "dark"; hotspots: Hotspot[] }
  | { kind: "feature-image"; title: string; productId: string; image: string; hotspots: Hotspot[] }
  | { kind: "feature-text"; title: string; productId: string; story: string }
  | { kind: "grid"; title: string; heading: string; productIds: string[] }
  | { kind: "detail"; title: string; heading: string; crops: { image: string; caption: string }[] }
  | { kind: "tiers"; title: string; heading: string; intro: string }
  | { kind: "back"; title: string };

export interface LookbookEdition {
  slug: string;
  title: string;
  season: string;
  tone: "ivory" | "dark";
  /** Corporate editions ask for details before downloading. */
  gatedDownload: boolean;
  pages: LookbookPage[];
}

export type LookbookSummary = Omit<LookbookEdition, "pages"> & { pageCount: number };

export interface PdfRequest {
  edition: string;
  name: string;
  company: string;
  email: string;
}
