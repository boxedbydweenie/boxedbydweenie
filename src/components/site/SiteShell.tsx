import type { ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { SiteHeader } from "./SiteHeader";
import { FloatingWhatsApp, SiteFooter } from "./SiteFooter";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { SearchOverlay } from "@/components/shop/SearchOverlay";

const FEATURES: [RegExp, string][] = [
  [/^\/(shop|cart|checkout|gift-cards|search|order)/, "shop"],
  [/^\/corporate/, "corporate"],
  [/^\/(calendar|gift-calendar)/, "calendar"],
  [/^\/secret-santa/, "santa"],
  [/^\/(lookbook|look-book)/, "lookbook"],
  [/^\/dispenser/, "dispenser"],
  [/^\/(about|contact)/, "about"],
];

/** Which brand colour a page uses (see the feature colours in styles.css). */
export function featureFor(path: string) { return FEATURES.find(([re]) => re.test(path))?.[1]; }

export function SiteShell({ children, overlayHeader }: { children: ReactNode; overlayHeader?: boolean }) { const path = useLocation({ select: (l) => l.pathname }); return <div className="min-h-screen bg-background"><SiteHeader {...(overlayHeader ? { overlay: true } : {})} /><div data-feature={featureFor(path)}>{children}</div><SiteFooter /><FloatingWhatsApp /><CartDrawer /><SearchOverlay /></div>; }
