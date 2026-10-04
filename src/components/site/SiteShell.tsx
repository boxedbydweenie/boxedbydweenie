import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { FloatingWhatsApp, SiteFooter } from "./SiteFooter";

export function SiteShell({ children }: { children: ReactNode }) { return <div className="min-h-screen bg-background"><SiteHeader />{children}<SiteFooter /><FloatingWhatsApp /></div>; }