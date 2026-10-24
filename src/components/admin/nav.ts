import {
  Activity, BookOpenCheck, CalendarHeart, Gift, Image as ImageIcon, LayoutDashboard, ListChecks, Mail, Megaphone, Package, PartyPopper,
  Percent, ReceiptText, ShieldCheck, Tag, Truck, UserCircle, Users, UsersRound, type LucideIcon,
} from "lucide-react";

/** Which live number (if any) a menu item shows as a badge. */
export type BadgeKey = "toPack" | "newLeads" | "attention";

export interface NavItem { to: string; label: string; icon: LucideIcon; desc: string; badge?: BadgeKey; soon?: boolean; exact?: boolean }
export interface NavGroup {
  id: string; label: string; icon: LucideIcon;
  /** Where the section name itself leads (its overview page). */
  hub: string; blurb: string;
  /** Brand colour used for the section's accent dot and header. */
  accent: string;
  items: NavItem[];
}

/** The one place the admin menu is defined. The sidebar, the section tabs, the dashboard shortcuts and the Ctrl+K search all read it. */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "sales", label: "Sales & Customers", icon: ReceiptText, hub: "/admin/sales", accent: "#83252C",
    blurb: "Orders to pack, the people who buy, and every enquiry or quote request.",
    items: [
      { to: "/admin/sales", label: "Overview", icon: LayoutDashboard, desc: "Revenue, orders and enquiries at a glance", exact: true },
      { to: "/admin/orders", label: "Orders", icon: ReceiptText, desc: "Pack, dispatch and track every order", badge: "toPack" },
      { to: "/admin/customers", label: "Customers", icon: Users, desc: "Everyone who has bought or got in touch" },
      { to: "/admin/leads", label: "Enquiries & quotes", icon: Mail, desc: "Contact, consultation and corporate quote requests", badge: "newLeads" },
      { to: "/admin/gift-cards", label: "Gift cards", icon: Gift, desc: "Issued gift cards and their balances" },
    ],
  },
  {
    id: "products", label: "Products", icon: Package, hub: "/admin/products", accent: "#263D35",
    blurb: "Everything on sale: prices, photos, stock, visibility and what still needs confirming.",
    items: [
      { to: "/admin/products", label: "Catalogue", icon: Package, desc: "Add, edit, hide and price products", exact: true },
      { to: "/admin/soon/promo-codes", label: "Promo codes", icon: Percent, desc: "Discount codes like MOMENTS10", soon: true },
      { to: "/admin/soon/delivery-fees", label: "Delivery fees", icon: Truck, desc: "Fee per state", soon: true },
    ],
  },
  {
    id: "marketing", label: "Marketing", icon: Megaphone, hub: "/admin/marketing", accent: "#E7B93B",
    blurb: "Campaigns, audience, results and images, all in one place.",
    items: [
      { to: "/admin/marketing", label: "Overview", icon: LayoutDashboard, desc: "Email performance and list health", exact: true },
      { to: "/admin/campaigns", label: "Campaigns", icon: Megaphone, desc: "Write, test, pace and send" },
      { to: "/admin/audience", label: "Audience", icon: Users, desc: "Contacts, consent, uploads and tags" },
      { to: "/admin/email-log", label: "Send log & reports", icon: ListChecks, desc: "Who got what, and what happened" },
      { to: "/admin/images", label: "Images", icon: ImageIcon, desc: "Upload pictures for your emails" },
    ],
  },
  {
    id: "engagement", label: "Gifting & Community", icon: PartyPopper, hub: "/admin/engagement", accent: "#39243F",
    blurb: "Secret Santa, the Gift Calendar and customer accounts.",
    items: [
      { to: "/admin/engagement", label: "Overview", icon: LayoutDashboard, desc: "Everything that brings customers back", exact: true },
      { to: "/admin/secret-santa", label: "Secret Santa", icon: PartyPopper, desc: "Every exchange, its organiser and how it is going" },
      { to: "/admin/soon/gift-calendar", label: "Gift Calendar", icon: CalendarHeart, desc: "Reminder emails and WhatsApp", soon: true },
      { to: "/admin/soon/accounts", label: "Customer accounts", icon: UserCircle, desc: "Sign-ins and saved details", soon: true },
    ],
  },
  {
    id: "system", label: "System", icon: ShieldCheck, hub: "/admin/system", accent: "#192850",
    blurb: "Is everything running, what is left to set up, and who has access.",
    items: [
      { to: "/admin/system", label: "Health & setup", icon: Activity, desc: "Live checks and the setup checklist", exact: true, badge: "attention" },
      { to: "/admin/team", label: "Team & access", icon: UsersRound, desc: "Who can sign in to this area" },
    ],
  },
];

export const DASHBOARD: NavItem = { to: "/admin", label: "Dashboard", icon: LayoutDashboard, desc: "Health of the whole system", exact: true };

/** Pages that are planned but not built yet. They get a tidy placeholder instead of a dead link. */
export const SOON: Record<string, { title: string; group: string; icon: LucideIcon; blurb: string; will: string[] }> = {
  "promo-codes": {
    title: "Promo codes", group: "Products", icon: Tag,
    blurb: "Create, pause and track discount codes without touching the database.",
    will: ["Create a code with a percentage and an on/off switch", "See how many orders used each code", "Pause a code the moment a campaign ends"],
  },
  "delivery-fees": {
    title: "Delivery fees", group: "Products", icon: Truck,
    blurb: "Set the delivery fee for each state in one tidy table.",
    will: ["Edit the fee for every state", "See which states your orders actually go to", "Changes reach the checkout straight away"],
  },
  "gift-calendar": {
    title: "Gift Calendar", group: "Gifting & Community", icon: CalendarHeart,
    blurb: "See how many customers are saving dates, and what reminders went out.",
    will: ["Reminders sent per day, by email and WhatsApp", "Most saved occasions, to time your campaigns", "A switch to pause reminders if something looks wrong"],
  },
  accounts: {
    title: "Customer accounts", group: "Gifting & Community", icon: UserCircle,
    blurb: "A friendly view of customer sign-ins and what they have saved.",
    will: ["New sign-ups per week", "Customers with saved people and dates", "Help a customer who is locked out"],
  },
};

export const SOON_ICON = BookOpenCheck;

/** Which group and item a path belongs to (longest matching link wins). */
export function locate(path: string): { group?: NavGroup; item?: NavItem } {
  let best: { group?: NavGroup; item?: NavItem; len: number } = { len: -1 };
  for (const g of NAV_GROUPS) for (const it of g.items) {
    const hit = it.exact ? path === it.to || path === it.to + "/" : path === it.to || path.startsWith(it.to + "/");
    if (hit && it.to.length > best.len) best = { group: g, item: it, len: it.to.length };
  }
  return best;
}

/** Menu links are plain strings in the config, so tell the typed router they are real routes. */
export const route = (to: string) => to as "/admin";
