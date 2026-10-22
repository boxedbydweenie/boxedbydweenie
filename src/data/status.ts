/** Project status shown on /status. Edit this file (or ask Claude) to update the page. */
export type State = "live" | "preview" | "next" | "waiting";

export interface Feature { name: string; note: string; state: State }
export interface Group { title: string; tone: "forest" | "navy" | "oxblood" | "plum"; items: Feature[] }
export interface Need { what: string; why: string; owner: string }
export interface Step { when: string; title: string; detail: string; done?: boolean }

export const UPDATED = "22 October 2026";
export const LAUNCH_NOTE = "Corporate orders must be confirmed by 20 November for guaranteed pre-Christmas delivery.";

export const STATE_LABEL: Record<State, string> = { live: "Live", preview: "Working, being finished", next: "Up next", waiting: "Waiting on you" };

export const GROUPS: Group[] = [
  { title: "Brand and company", tone: "forest", items: [
    { name: "Homepage", note: "New look with the stacked box hero, Three ways to gift and occasions.", state: "live" },
    { name: "About", note: "Our story, numbers and clients, from the company profile.", state: "live" },
    { name: "Company profile flip-book", note: "Read the full profile online with page-turn sound and animation.", state: "live" },
    { name: "Contact", note: "Enquiries are saved and show in the team area.", state: "live" },
    { name: "Delivery, Privacy and Terms", note: "Full draft wording is on the site. Needs your approval (and ideally a lawyer's read) before launch.", state: "waiting" },
  ] },
  { title: "Shop", tone: "oxblood", items: [
    { name: "Shop and product pages", note: "21 products with photos, occasion filters, packaging, gift note and delivery date.", state: "live" },
    { name: "Gift Dispenser", note: "Three questions, three picks, order in about a minute.", state: "live" },
    { name: "Checkout", note: "Delivery fees by state, promo code and order summary are ready.", state: "live" },
    { name: "Online payment (Paystack)", note: "Built and secured. Needs the Paystack account keys to take real payments.", state: "waiting" },
    { name: "Customer accounts", note: "Real sign-up and sign-in. Orders, saved recipients, wishlist and dates follow the customer to any device.", state: "live" },
    { name: "Gift cards", note: "Codes are created when payment succeeds and can be spent at checkout. Delivery by email on the chosen date is live. Needs Paystack keys to test buying end to end.", state: "preview" },
    { name: "Order confirmation emails", note: "Built and live: the customer and the team (hello@ with Cc) are emailed when an order is paid. Will first run for real once Paystack is on.", state: "live" },
    { name: "Confirm 14 draft products", note: "Photos, prices and contents for the products still marked as drafts.", state: "waiting" },
  ] },
  { title: "Corporate", tone: "navy", items: [
    { name: "Corporate page", note: "Client wall, what we do, instant quote and consultation booking.", state: "live" },
    { name: "Instant quote", note: "Companies build a quote and get a shareable link. Every quote is saved for the team.", state: "live" },
    { name: "Consultation requests", note: "Saved and visible to the team.", state: "live" },
    { name: "Quote prices", note: "Quote prices and shop prices currently differ and need one agreed set of numbers.", state: "waiting" },
    { name: "Quote email", note: "Emailed quotes work and send from the verified domain. A branded PDF version is still to build.", state: "live" },
  ] },
  { title: "Team area and extras", tone: "plum", items: [
    { name: "Team area", note: "Staff sign in to manage products, prices, photos, orders and enquiries.", state: "live" },
    { name: "Gift Calendar", note: "Dates are saved to the customer's account and sync across devices. Email reminders are live: a daily 7am job emails customers before their dates.", state: "live" },
    { name: "Secret Santa", note: "Groups work across devices with a private server-side draw. Invite emails are live. Paying for the gifts through checkout is still to build.", state: "live" },
    { name: "Newsletter sign-up", note: "Sign-ups are saved. Sending newsletters is the next project (email marketing: sending, tracking and resending).", state: "next" },
  ] },
];

export const NEEDS: Need[] = [
  { what: "Paystack account and keys", why: "Switches on real card payments. A test run comes first.", owner: "Boxed by Dweenie" },
  { what: "Point boxedbydweenie.com at the site", why: "So customers use the real web address instead of the temporary one.", owner: "Whoever manages the domain" },
  { what: "Confirm the 14 draft products", why: "Final names, prices, photos and contents.", owner: "Boxed by Dweenie" },
  { what: "One set of prices for quotes and shop", why: "So a corporate quote never contradicts a shop price.", owner: "Boxed by Dweenie" },
  { what: "Approve Delivery, Privacy and Terms wording", why: "Needed before launch.", owner: "Boxed by Dweenie" },
  { what: "Make the code repository private", why: "It is currently public. Do this just before launch.", owner: "Boxed by Dweenie" },
  { what: "Fill the remaining placeholders", why: "Corporate price list in src/config/corporate.ts still has REPLACE values.", owner: "Boxed by Dweenie" },
  { what: "Confirm the WhatsApp number", why: "Used on the site's chat button and quote pages.", owner: "Boxed by Dweenie" },
];

export const PLAN: Step[] = [
  { when: "Done", title: "Site, shop and corporate pages", detail: "Brand redesign, shop, Gift Dispenser, checkout, corporate page, instant quote, company profile.", done: true },
  { when: "Done", title: "Team area", detail: "Staff sign-in, products and prices, photo upload, orders and enquiries.", done: true },
  { when: "Done", title: "Emails", detail: "Sending domain verified; order, quote, gift card, Secret Santa and Gift Calendar emails are live.", done: true },
  { when: "Done", title: "Accounts, gift cards, Secret Santa server", detail: "Customer sign-in with sync across devices, gift card issue and spend, private server-side Secret Santa draw.", done: true },
  { when: "Paused", title: "Development paused", detail: "Building is on hold. Items below are what remains." },
  { when: "This week", title: "Paystack keys", detail: "Add the Paystack account keys and webhook so real payments can be taken." },
  { when: "This week", title: "Test purchase", detail: "A real test order from basket to payment to confirmation email." },
  { when: "Next", title: "Final content", detail: "Confirm draft products, agree prices, approve legal wording." },
  { when: "Next", title: "Custom domain and go-live", detail: "Connect boxedbydweenie.com, make the code repository private, final check." },
  { when: "After launch", title: "Email marketing", detail: "Send newsletters and campaigns from our own system, with sent history, delivery tracking and resend for failures." },
  { when: "After launch", title: "More to build", detail: "Team views for gift cards, newsletter and Secret Santa; paying for Secret Santa gifts through checkout; lighter look for the remaining dark pages; branded quote PDF." },
];
