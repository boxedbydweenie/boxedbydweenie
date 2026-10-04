import type { LookbookEdition } from "@/types/lookbook";

/** Placeholder editions. Titles, copy and imagery are for layout only. */
const back = { kind: "back", title: "Back cover" } as const;

export const EDITIONS: LookbookEdition[] = [
  {
    slug: "the-festive-edit-2026",
    title: "The Festive Edit 2026",
    season: "Christmas and New Year",
    tone: "dark",
    gatedDownload: false,
    pages: [
      { kind: "cover", title: "Cover", image: "Festive cover — gold ribbon on black" },
      { kind: "note", title: "Editor's note", heading: "A season of small wonders", body: ["The festive season is when a gift says the most. This edit gathers the boxes our clients asked for again and again, and a few new ones we could not wait to share.", "Every box is wrapped by hand in Lagos, finished with satin ribbon and a card written in your words."], signature: "Dweenie, Founder" },
      { kind: "full-bleed", title: "The table", image: "Festive table with Signature Boxes", caption: "Set the table, then set the mood.", tone: "dark", hotspots: [{ productId: "prd-001", x: 32, y: 58 }, { productId: "prd-005", x: 70, y: 40 }] },
      { kind: "feature-image", title: "The Executive Hamper", productId: "prd-005", image: "Executive Hamper — open lid", hotspots: [{ productId: "prd-005", x: 50, y: 55 }] },
      { kind: "feature-text", title: "The Executive Hamper", productId: "prd-005", story: "Built for the people who carry the year. Sparkling wine, a leather journal and gourmet treats, nested in a keepsake hamper." },
      { kind: "grid", title: "Gifts for everyone", heading: "Something for everyone on your list", productIds: ["prd-001", "prd-002", "prd-004", "prd-006", "prd-007", "prd-008"] },
      { kind: "full-bleed", title: "Unwrapping", image: "Hands untying a gold satin bow", caption: "The moment the ribbon falls.", tone: "ivory", hotspots: [{ productId: "prd-004", x: 45, y: 50 }] },
      { kind: "feature-image", title: "The Signature Box", productId: "prd-001", image: "Signature Box — black and gold", hotspots: [{ productId: "prd-001", x: 52, y: 48 }] },
      { kind: "feature-text", title: "The Signature Box", productId: "prd-001", story: "Our house favourite. A rigid black box, gold foil and five considered pieces that feel like a hug from across the city." },
      { kind: "detail", title: "In the detail", heading: "In the detail", crops: [{ image: "Satin ribbon close-up", caption: "Double-faced satin ribbon, tied by hand." }, { image: "Box lining close-up", caption: "Soft ivory lining in every box." }, { image: "Message card close-up", caption: "Your words on heavyweight card." }] },
      { kind: "grid", title: "Stocking fillers", heading: "Small, and still a wow", productIds: ["prd-009", "prd-011", "prd-012", "prd-013"] },
      back,
    ],
  },
  {
    slug: "the-corporate-edit",
    title: "The Corporate Edit",
    season: "All year",
    tone: "dark",
    gatedDownload: true,
    pages: [
      { kind: "cover", title: "Cover", image: "Corporate cover — branded boxes stacked" },
      { kind: "note", title: "A note for teams", heading: "Gifting that represents you", body: ["From 25 boxes to more than 1,000, we handle sourcing, branding, packing and delivery so your team can focus on the moment.", "Every order comes with a dedicated consultant and a formal quote within one working day."], signature: "The BBD Corporate Team" },
      { kind: "tiers", title: "Packages", heading: "Three ways to say thank you", intro: "Per-recipient guide prices. Final pricing depends on quantity, branding and delivery." },
      { kind: "feature-image", title: "The Welcome Aboard Kit", productId: "prd-006", image: "Welcome Aboard Kit — desk flat lay", hotspots: [{ productId: "prd-006", x: 50, y: 52 }] },
      { kind: "feature-text", title: "The Welcome Aboard Kit", productId: "prd-006", story: "First days matter. A branded bottle, notebook and desk plant that tell new hires they chose well." },
      { kind: "grid", title: "Staff favourites", heading: "Staff favourites", productIds: ["prd-001", "prd-002", "prd-006", "prd-007", "prd-008", "prd-009"] },
      { kind: "full-bleed", title: "At scale", image: "Rows of branded boxes ready to ship", caption: "Three hundred boxes, one standard.", tone: "dark", hotspots: [{ productId: "prd-002", x: 28, y: 60 }, { productId: "prd-006", x: 68, y: 46 }] },
      { kind: "detail", title: "Branding options", heading: "Your brand, finished well", crops: [{ image: "Foil logo on lid", caption: "Foil-stamped logo on the lid." }, { image: "Branded ribbon", caption: "Custom printed ribbon." }, { image: "Personalised card", caption: "A named card for every recipient." }] },
      { kind: "grid", title: "For clients", heading: "For clients and partners", productIds: ["prd-005", "prd-004", "prd-014", "prd-015"] },
      back,
    ],
  },
  ...([
    ["weddings-and-celebrations", "Weddings and Celebrations", "Celebrations", "ivory", "Bridal party boxes in ivory", ["prd-001", "prd-004", "prd-011", "prd-012"]],
    ["new-arrivals", "New Arrivals", "Autumn 2026", "dark", "New boxes in black and gold", ["prd-003", "prd-013", "prd-023", "prd-024"]],
    ["everyday-luxuries", "Everyday Luxuries", "All year", "ivory", "Candles and silk in soft light", ["prd-002", "prd-007", "prd-009", "prd-014"]],
  ] as const).map(([slug, title, season, tone, image, ids]): LookbookEdition => ({
    slug, title, season, tone, gatedDownload: false,
    pages: [
      { kind: "cover", title: "Cover", image },
      { kind: "note", title: "Editor's note", heading: `Welcome to ${title}`, body: ["A small, careful edit of the boxes we love right now.", "Every piece is chosen, wrapped and delivered with the same attention to detail."], signature: "Dweenie, Founder" },
      { kind: "full-bleed", title: "The mood", image: `${title} — mood`, caption: "Moments, Boxed.", tone: tone === "dark" ? "ivory" : "dark", hotspots: [{ productId: ids[0], x: 38, y: 55 }, { productId: ids[1], x: 66, y: 42 }] },
      { kind: "grid", title: "The edit", heading: "The edit", productIds: [...ids] },
      { kind: "detail", title: "In the detail", heading: "In the detail", crops: [{ image: "Ribbon", caption: "Tied by hand." }, { image: "Lining", caption: "Soft ivory lining." }, { image: "Card", caption: "Written in your words." }] },
      back,
    ],
  })),
];
