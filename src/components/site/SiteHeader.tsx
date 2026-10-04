import { Link } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import logo from "@/assets/bbd-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PlaceholderTile } from "./PlaceholderTile";
import { openCart, openSearch, useCart } from "@/hooks/use-shop";
import { cartCount } from "@/services/cart";

const nav = [
  ["Gift Dispenser", "/dispenser"], ["Corporate", "/corporate"], ["Look Book", "/lookbook"],
  ["Gift Calendar", "/calendar"], ["Secret Santa", "/secret-santa"],
] as const;
const shopGroups = [
  ["By occasion", [["Birthday", { occasion: "birthday" }], ["Anniversary", { occasion: "anniversary" }], ["Wedding", { occasion: "wedding" }], ["Christmas", { occasion: "christmas" }]]],
  ["By recipient", [["For her", { recipient: "her" }], ["For him", { recipient: "him" }], ["For couples", { recipient: "couples" }], ["For children", { recipient: "children" }]]],
  ["By type", [["Gift boxes", { type: "gift-boxes" }], ["Hampers", { type: "hampers" }], ["Experiences", { type: "experiences" }], ["Gift cards", { type: "gift-cards" }]]],
] as [string, [string, Record<string, string>][]][];

export function SiteHeader() {
  const [announcement, setAnnouncement] = useState(true);
  const [compact, setCompact] = useState(false);
  const count = cartCount(useCart());
  useEffect(() => { const onScroll = () => setCompact(window.scrollY > 40); onScroll(); window.addEventListener("scroll", onScroll, { passive: true }); return () => window.removeEventListener("scroll", onScroll); }, []);
  return <>
    {announcement && <div className="surface-dark relative z-50 border-b border-line-dark px-12 py-2 text-center text-xs text-on-dark-muted"><span>Corporate orders: confirm by 20 November for guaranteed pre-Christmas delivery. </span><Link to="/corporate/quote" className="font-semibold text-gold underline underline-offset-4">Get an instant quote</Link><Button variant="ghost" size="icon" onClick={() => setAnnouncement(false)} aria-label="Dismiss announcement" className="absolute right-1 top-0 size-9 min-h-9 text-on-dark"><X /></Button></div>}
    <header className="surface-dark sticky top-0 z-40 border-b border-line-dark">
      <div className={`mx-auto flex max-w-7xl items-center justify-between px-5 transition-all duration-300 ${compact ? "h-14" : "h-20"}`}>
        <Link to="/" aria-label="Boxed by Dweenie home" className="flex min-h-11 items-center"><img src={logo.url} alt="Boxed by Dweenie" className={`w-auto transition-all duration-300 ${compact ? "h-8" : "h-10"}`} /></Link>
        <nav className="hidden items-center gap-5 text-xs lg:flex" aria-label="Main navigation">
          <div className="group relative"><Link to="/shop" className="eyebrow flex min-h-11 items-center text-on-dark hover:text-gold">Shop</Link><div className="invisible absolute left-1/2 top-full w-[780px] -translate-x-1/3 translate-y-2 border border-line-dark bg-nero p-7 opacity-0 shadow-soft transition-all duration-300 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"><div className="grid grid-cols-[repeat(3,1fr)_1.3fr] gap-7">{shopGroups.map(([title, items]) => <div key={title}><p className="eyebrow text-gold">{title}</p><ul className="mt-4 space-y-3">{items.map(([item, search]) => <li key={item}><Link to="/shop" search={search} className="text-on-dark-muted hover:text-on-dark">{item}</Link></li>)}</ul></div>)}<Link to="/shop"><PlaceholderTile tone="dark" label="The festive edit" className="aspect-[4/3]" /></Link></div></div></div>
          {nav.map(([label, to]) => <Link key={to} to={to} className="eyebrow flex min-h-11 items-center text-on-dark hover:text-gold" activeProps={{ className: "text-gold" }}>{label}</Link>)}
        </nav>
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-on-dark hover:text-gold" onClick={() => openSearch()}><Search /><span className="sr-only">Search</span></Button></TooltipTrigger><TooltipContent>Search</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button asChild variant="ghost" size="icon" className="hidden text-on-dark hover:text-gold sm:inline-flex"><Link to="/account"><UserRound /><span className="sr-only">Account</span></Link></Button></TooltipTrigger><TooltipContent>Account</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="relative text-on-dark hover:text-gold" onClick={() => openCart()}><ShoppingBag /><span className="sr-only">Bag, {count} items</span>{count > 0 && <span aria-hidden className="absolute right-0.5 top-0.5 flex min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-nero">{count}</span>}</Button></TooltipTrigger><TooltipContent>Bag, {count} items</TooltipContent></Tooltip>
          <Button asChild size="sm" className="ml-2 hidden xl:inline-flex"><Link to="/corporate/quote">Get a quote</Link></Button>
          <Sheet><SheetTrigger asChild><Button variant="ghost" size="icon" className="text-on-dark lg:hidden" aria-label="Open menu"><Menu /></Button></SheetTrigger><SheetContent side="right" className="w-full border-line-dark bg-nero p-7 text-on-dark sm:max-w-full [&>button]:hidden"><SheetTitle className="sr-only">Menu</SheetTitle><div className="flex justify-between"><img src={logo.url} alt="Boxed by Dweenie" className="h-10 w-auto" /><SheetClose asChild><Button variant="ghost" size="icon" className="text-on-dark" aria-label="Close menu"><X /></Button></SheetClose></div><nav className="mt-12 flex flex-col">{[["Shop", "/shop"], ...nav].map(([label, to]) => <SheetClose key={to} asChild><Link to={to} className="border-b border-line-dark py-4 font-heading text-xl uppercase text-on-dark hover:text-gold">{label}</Link></SheetClose>)}</nav><div className="mt-8 grid gap-3"><Button asChild><Link to="/dispenser">Gift in 60 seconds</Link></Button><Button asChild variant="outline" className="text-on-dark"><Link to="/corporate/quote">Get a quote</Link></Button></div><div className="mt-10 text-sm text-on-dark-muted"><a href="tel:+2349092125960">0909 212 5960</a><br/><a href="mailto:info@boxedbydweenie.com">info@boxedbydweenie.com</a></div></SheetContent></Sheet>
        </div>
      </div>
    </header>
  </>;
}