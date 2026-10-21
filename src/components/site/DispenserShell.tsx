import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag } from "lucide-react";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { openCart, useCart } from "@/hooks/use-shop";

/** Standalone shell for the Gift Dispenser: slim glass bar, its own menu, no site footer. */
export function DispenserShell({ children, clock }: { children: ReactNode; clock?: ReactNode }) {
  const cart = useCart();
  const count = cart.reduce((t, i) => t + i.quantity, 0);
  return <div className="dsp">
    <header className="sticky top-0 z-40 border-b border-nero/10 bg-[#F4EFE5]/85 backdrop-blur-xl">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 px-5">
        <Link to="/dispenser" aria-label="Gift Dispenser home"><img src="/brand/logo-primary.svg" alt="Boxed by Dweenie" className="h-8 w-auto" /></Link>
        <p className="flex items-center justify-center gap-2 text-center text-[11px] font-semibold uppercase tracking-[.28em] text-nero/80"><span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-[#E7B93B] opacity-70" /><span className="relative inline-flex size-2 rounded-full bg-[#E7B93B]" /></span>Gift Dispenser</p>
        <div className="flex items-center gap-1">
          {clock}
          <button type="button" onClick={() => openCart()} aria-label={`Open bag${count ? `, ${count} items` : ""}`} className="relative grid size-11 place-items-center rounded-full text-nero hover:bg-nero/10"><ShoppingBag className="size-5" />{count > 0 && <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-[#E7B93B] text-[10px] font-bold text-nero">{count}</span>}</button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><button type="button" aria-label="Menu" className="grid size-11 place-items-center rounded-full text-nero hover:bg-nero/10"><Menu className="size-5" /></button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild><Link to="/">Boxed by Dweenie home</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/shop">Shop all gifts</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/corporate">Corporate gifting</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/secret-santa">Secret Santa</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/calendar">Gift Calendar</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/contact">Contact us</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
    {children}
    <footer className="border-t border-nero/10 px-5 py-8 text-center text-xs text-nero/50">Boxed by Dweenie · Happiness In a Box · <Link to="/" className="underline">Back to the main site</Link></footer>
    <CartDrawer />
  </div>;
}
