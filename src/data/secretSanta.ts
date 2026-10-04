import type { Exchange, Message, Participant } from "@/types/secretSanta";

/** Demo exchange used for previewing organiser and participant views. Placeholder names. */
export const DEMO_EXCHANGE: Exchange = {
  id: "demo", code: "BOX26A", name: "Lagos Office Christmas 2026", type: "office",
  organiserName: "Ngozi Eze", organisation: "Demo Company Ltd",
  welcome: "Welcome to our office Secret Santa. Keep it thoughtful, keep it secret.",
  budget: 25000, payer: "each", organiserTakesPart: true,
  dates: { joinBy: "2026-11-20", draw: "2026-11-25", orderBy: "2026-12-05", exchange: "2026-12-18" },
  delivery: "one-address", address: "Demo Company Ltd, 10 Adeola Odeku Street, Victoria Island, Lagos",
  status: "open", maxParticipants: 50, showMatches: false, allowReveal: true,
  exclusions: [["p3", "p4"]], createdAt: "2026-10-01T09:00:00.000Z",
};

const base = { exchangeId: "demo", wishlist: [], likes: "", dislikes: "", sizes: "", noAlcohol: false };
export const DEMO_PARTICIPANTS: Participant[] = [
  { ...base, id: "p1", name: "Tolu Adeyemi", contact: "tolu@example.com", status: "wishlist", wishlist: [{ productId: "prd-002", addedAt: "2026-10-02" }], likes: "Tea, notebooks, scented candles", dislikes: "Strong perfume", sizes: "M", noAlcohol: true },
  { ...base, id: "p2", name: "Ngozi Eze", contact: "ngozi@example.com", status: "joined", isOrganiser: true, likes: "Dark chocolate" },
  { ...base, id: "p3", name: "Chidi Okafor", contact: "chidi@example.com", status: "wishlist", wishlist: [{ productId: "prd-002", addedAt: "2026-10-02" }], likes: "Coffee, jazz" },
  { ...base, id: "p4", name: "Amara Okafor", contact: "amara@example.com", status: "joined", likes: "Skincare, plants" },
  { ...base, id: "p5", name: "Bola Ade", contact: "0800 000 0005", status: "joined" },
  { ...base, id: "p6", name: "Yusuf Bello", contact: "yusuf@example.com", status: "wishlist", wishlist: [{ productId: "prd-002", addedAt: "2026-10-03" }], noAlcohol: true },
  { ...base, id: "p7", name: "Funmi Lawal", contact: "funmi@example.com", status: "joined", likes: "Books, silk" },
  { ...base, id: "p8", name: "Kemi Johnson", contact: "kemi@example.com", status: "invited" },
];

export const DEMO_MESSAGES: Message[] = [
  { id: "m1", exchangeId: "demo", kind: "announcement", fromId: "organiser", body: "Welcome everyone. Please add your wishlist before 20 November so your Santa has ideas.", at: "2026-10-01T10:00:00.000Z" },
];
