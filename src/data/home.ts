import type { HomeData } from "@/types/home";

export const HOME_DATA: HomeData = {
  occasions: ["Birthday", "Anniversary", "Wedding", "New Baby", "Thank You", "Congratulations", "Get Well", "Christmas"].map((name) => ({ name, slug: name.toLowerCase().replaceAll(" ", "-") })),
  products: [
    { id: "p1", name: "The Golden Hour Box", line: "A warm, polished celebration", price: 65000, badge: "Bestseller" },
    { id: "p2", name: "Soft Life Selection", line: "Rest, ritual and indulgence", price: 52000 },
    { id: "p3", name: "The Gentleman", line: "Considered essentials for him", price: 78000, badge: "Same-day Lagos" },
    { id: "p4", name: "A Little Luxury", line: "Small gestures, beautifully boxed", price: 35000 },
    { id: "p5", name: "New Beginnings", line: "A tender welcome for baby", price: 85000 },
    { id: "p6", name: "The Celebration Hamper", line: "Raise a glass to good news", price: 110000, badge: "Bestseller" },
    { id: "p7", name: "Thank You, Truly", line: "Gratitude in every detail", price: 45000 },
    { id: "p8", name: "Sunday Morning", line: "An unhurried breakfast ritual", price: 72000 },
  ],
  moments: [
    { date: "2026-10-19", name: "World Menopause Day", note: "A thoughtful care package" },
    { date: "2026-11-19", name: "International Men's Day", note: "Celebrate the men who matter" },
    { date: "2026-12-25", name: "Christmas Day", note: "The season's biggest gifting moment" },
  ],
  reviews: Array.from({ length: 4 }, (_, i) => ({ name: `REPLACE Name ${i + 1}`, role: "REPLACE Role", rating: 5, quote: "REPLACE WITH REAL REVIEW. Thoughtful curation, beautiful packaging and a delivery experience that felt effortless." })),
};