import type { BrandProfile } from "@/types/brand";

/**
 * Company profile content, taken from the approved BOXED company profile (October 2026).
 * Client logos live in /public/clients.
 */
export const BRAND: BrandProfile = {
  stats: [
    { value: 5000, suffix: "+", label: "boxes delivered" },
    { value: 450, suffix: "+", label: "satisfied customers" },
    { value: 2, label: "countries: Nigeria and the UK" },
  ],
  clients: [
    ["Pepsico", "pepsico"], ["Credit Direct", "credit-direct"], ["FBNQuest", "fbnquest"], ["DebtRecuva", "debtrecuva"],
    ["JNCI", "jnci"], ["National Population Commission", "npc"], ["CheckoffCredit", "checkoff-credit"],
    ["Legend Lagos Airport", "legend-lagos-airport"], ["Transcorp Hotels", "transcorp-hotels"], ["Integrated", "integrated"],
    ["BP Business Solutions", "bp-business-solutions"], ["Loanbook", "loanbook"], ["Arravo", "arravo"], ["Workforce", "workforce"],
    ["NMRC", "nmrc"], ["Sterling", "sterling"], ["Transcorp", "transcorp"], ["ARKounting", "arkounting"],
    ["Transcorp Power", "transcorp-power"], ["The Special Youth", "special-youth"], ["Class Insurance Investment", "class-insurance"],
  ].map(([name, id]) => ({ name: name!, logo: `/clients/${id}.png` })),
  reviews: [
    { name: "Sandra A.", title: "On-Time Delivery", text: "BoxedByDweenie exceeded my expectations. I ordered a custom gift box for my mom's 60th birthday, and they delivered a truly personalized and memorable experience. The attention to detail, the quality of the items, and the on-time delivery made it a perfect gift." },
    { name: "Oluwaseun A.", title: "Attention To Detail", text: "I received a BoxedByDweenie gift box as a surprise from my best friend, and it truly brightened my day. The attention to detail in the packaging and the thoughtful selection of items inside showed a lot of care. I felt truly appreciated. Thank you!" },
    { name: "Chinelo O.", title: "I Was Thoroughly Impressed", text: "I recently ordered a gift box from BoxedByDweenie, and I must say, I was thoroughly impressed. The packaging was exquisite, and the contents were delightful. It made the perfect gift for my sister's birthday. She couldn't stop raving about it. Great job, BoxedByDweenie!" },
    { name: "Emeka N.", title: "Presentation Is Always Top-Notch", text: "I've ordered from BoxedByDweenie on a couple of occasions, and the presentation is always top-notch. The quality is undeniable." },
  ],
};
