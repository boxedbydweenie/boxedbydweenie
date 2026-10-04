import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { FloatingWhatsApp, SiteFooter } from "./SiteFooter";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { SearchOverlay } from "@/components/shop/SearchOverlay";

export function SiteShell({ children, overlayHeader }: { children: ReactNode; overlayHeader?: boolean }) { return <div className="min-h-screen bg-background"><SiteHeader {...(overlayHeader ? { overlay: true } : {})} />{children}<SiteFooter /><FloatingWhatsApp /><CartDrawer /><SearchOverlay /></div>; }
