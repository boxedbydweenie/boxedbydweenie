import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { FloatingWhatsApp, SiteFooter } from "./SiteFooter";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { SearchOverlay } from "@/components/shop/SearchOverlay";

export function SiteShell({ children }: { children: ReactNode }) { return <div className="min-h-screen bg-background"><SiteHeader />{children}<SiteFooter /><FloatingWhatsApp /><CartDrawer /><SearchOverlay /></div>; }
