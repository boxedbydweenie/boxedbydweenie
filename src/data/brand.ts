import type { BrandProfile } from "@/types/brand";

/**
 * Company profile content. Empty values are hidden on the site.
 * Entries flagged `sample: true` are illustrative only and show a "Sample content" chip
 * (see SHOW_SAMPLE_CHIPS in src/config/site.ts). Replace them with real details.
 * Logo, portrait, signature and photo fields take an image URL.
 */
export const BRAND: BrandProfile = {
  stats: [
    { value: 10000, suffix: "+", label: "gifts delivered", sample: true },
    { value: 150, suffix: "+", label: "companies served", sample: true },
    { value: 5, label: "years in business", sample: true },
    { value: 12, label: "cities delivered to", sample: true },
  ],
  clients: [1, 2, 3, 4, 5, 6].map((n) => ({ name: `Sample Client ${["One", "Two", "Three", "Four", "Five", "Six"][n - 1]}`, logo: "", sample: true })),
  recognition: ["One", "Two", "Three"].map((n) => ({ name: `Sample Publication ${n}`, logo: "", sample: true })),
  milestones: [
    { year: "June 2021", line: "The Plug Shop Limited, the company behind Boxed by Dweenie, is incorporated." },
    { year: "2022", line: "Sample: our first corporate year-end order of 200 boxes.", sample: true },
    { year: "2023", line: "Sample: the BBD packaging studio opens in Lagos.", sample: true },
    { year: "2024", line: "Sample: same-day delivery launches across Lagos.", sample: true },
    { year: "2025", line: "Sample: nationwide delivery to 12 cities.", sample: true },
  ],
  founder: {
    name: "Founder Name",
    title: "Founder and Creative Director",
    note: [
      "I started Boxed by Dweenie because I believe a gift should say what words sometimes cannot.",
      "Too often, thoughtful people were let down by rushed choices and plain packaging.",
      "So we built a company that takes the care off your hands and puts it into every box, ribbon and note.",
      "When your gift is opened, we want both of you to feel the wow.",
    ],
    portrait: "",
    signature: "",
    sample: true,
  },
  reviews: [
    { name: "Sample Customer", role: "Birthday gift, Lekki", rating: 5, text: "The box arrived on the day, beautifully wrapped. My sister has not stopped talking about it.", sample: true },
    { name: "Sample Customer", role: "Anniversary gift, Abuja", rating: 5, text: "I ordered from London at the last minute and they made it look effortless.", sample: true },
    { name: "Sample Customer", role: "New baby gift, Ikoyi", rating: 5, text: "Every detail was considered, down to the handwritten note.", sample: true },
    { name: "Sample Customer", role: "Thank-you gift, Victoria Island", rating: 5, text: "Classy, calm and on time. Exactly what I wanted.", sample: true },
  ],
  corporateTestimonials: [
    { name: "Sample Name", title: "HR Manager", company: "Sample Company", quote: "Every one of our staff boxes arrived on time and looked exactly like the sample.", sample: true },
    { name: "Sample Name", title: "Head of Marketing", company: "Sample Company", quote: "Our clients still mention the year-end gift. The branding was subtle and very classy.", sample: true },
    { name: "Sample Name", title: "Procurement Lead", company: "Sample Company", quote: "A formal quote within hours and invoicing that made procurement easy.", sample: true },
  ],
  teamPhoto: "",
};
