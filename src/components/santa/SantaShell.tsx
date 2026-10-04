import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/bbd-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { DEMO_EXCHANGE_ID, DEMO_PARTICIPANT_ID } from "@/config/secretSanta";
import { resetDemo, santaStore, setRole } from "@/services/secretSanta";
import { useSanta } from "@/hooks/use-santa";
import { cn } from "@/lib/utils";

export interface SantaTab { id: string; label: string; icon: ReactNode }

/** App-style shell for Secret Santa: slim dark top bar and optional bottom tabs on mobile. */
export function SantaShell({ title, children, tabs, activeTab, onTab, light }: { title?: string; children: ReactNode; tabs?: SantaTab[]; activeTab?: string; onTab?: (id: string) => void; light?: boolean }) {
  const navigate = useNavigate();
  const { role } = useSanta();
  const preview = async (r: "organiser" | "participant") => {
    await setRole(r);
    if (r === "participant") santaStore.set({ ...santaStore.get(), session: { ...santaStore.get().session, [DEMO_EXCHANGE_ID]: DEMO_PARTICIPANT_ID } });
    navigate(r === "organiser" ? { to: "/secret-santa/$id/manage", params: { id: DEMO_EXCHANGE_ID } } : { to: "/secret-santa/$id", params: { id: DEMO_EXCHANGE_ID } });
  };
  return <div className={cn("min-h-screen", light ? "bg-paper" : "surface-dark")}>
    <header className="surface-dark sticky top-0 z-40 border-b border-line-dark">
      <div className="mx-auto grid h-14 max-w-5xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4">
        <Link to="/secret-santa" aria-label="Secret Santa home"><img src={logo.url} alt="Boxed by Dweenie" className="h-7 w-auto" /></Link>
        <p className="truncate text-center font-heading text-xs uppercase tracking-[0.2em] text-on-dark">{title ?? "Secret Santa"}</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="text-on-dark" aria-label="Menu"><Menu /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Preview with demo data</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => preview("organiser")}>{role === "organiser" ? "✓ " : ""}Organiser view</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => preview("participant")}>{role === "participant" ? "✓ " : ""}Participant view</DropdownMenuItem>
            <DropdownMenuItem onSelect={async () => { await resetDemo(); toast("Demo exchange reset."); }}>Reset demo</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link to="/secret-santa/new">Start a Secret Santa</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/secret-santa" hash="join">Join with a code</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link to="/">Boxed by Dweenie home</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/shop">Shop all gifts</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {tabs && <nav aria-label="Sections" className="mx-auto hidden max-w-5xl gap-1 px-4 md:flex">{tabs.map((t) => <button key={t.id} onClick={() => onTab?.(t.id)} aria-current={activeTab === t.id ? "page" : undefined} className={cn("flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm font-semibold", activeTab === t.id ? "border-gold text-on-dark" : "border-transparent text-on-dark-muted hover:text-on-dark")}>{t.icon}{t.label}</button>)}</nav>}
    </header>
    <div className={cn(tabs && "pb-24 md:pb-0")}>{children}</div>
    {tabs && <nav aria-label="Sections" className="surface-dark fixed inset-x-0 bottom-0 z-40 grid border-t border-line-dark md:hidden" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)`, paddingBottom: "env(safe-area-inset-bottom)" }}>
      {tabs.map((t) => <button key={t.id} onClick={() => onTab?.(t.id)} aria-current={activeTab === t.id ? "page" : undefined} className={cn("flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold", activeTab === t.id ? "text-gold" : "text-on-dark-muted")}>{t.icon}{t.label}</button>)}
    </nav>}
    <CartDrawer />
  </div>;
}
