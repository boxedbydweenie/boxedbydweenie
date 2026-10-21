import { Link } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import logo, { logos } from "@/assets/brand/logo";
import { Button } from "@/components/ui/button";
import { Photo } from "@/components/home/Photo";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { openCart, openSearch, useCart } from "@/hooks/use-shop";
import { cartCount } from "@/services/cart";

const shopGroups = [
  ["By occasion", [["Birthday", { occasion: "birthday" }], ["Anniversary", { occasion: "anniversary" }], ["Wedding", { occasion: "wedding" }], ["Christmas", { occasion: "christmas" }]]],
  ["By recipient", [["For her", { recipient: "her" }], ["For him", { recipient: "him" }], ["For couples", { recipient: "couples" }], ["For children", { recipient: "children" }]]],
  ["By type", [["Gift boxes", { type: "gift-boxes" }], ["Hampers", { type: "hampers" }], ["Experiences", { type: "experiences" }], ["Gift cards", { type: "gift-cards" }]]],
] as [string, [string, Record<string, string>][]][];
const moreWays = [["Gift Dispenser", "/dispenser", "Find the perfect gift in 60 seconds"], ["Gift Calendar", "/calendar", "Save the dates that matter. We remind you."], ["Secret Santa", "/secret-santa", "Draw names, the easy way"], ["Gift Cards", "/gift-cards", "Let them choose what they love"], ["Look Book", "/lookbook", "Browse our editions"]] as const;
const corporateLinks = [["Corporate gifting", "/corporate", "Staff rewards, client gifts, events"], ["Get an instant quote", "/corporate/quote", "Priced options in minutes"], ["Book a consultation", "/corporate#consultation", "We bring a sample to your office"], ["Read our company profile", "/profile", "Turn the pages online"], ["Corporate look book", "/lookbook/the-corporate-edit", "This season's boxes and branding"]] as const;
const topLink = "eyebrow flex min-h-11 items-center text-nero hover:text-[#8E6A10]";
const active = { className: "text-[#8E6A10] underline decoration-gold decoration-2 underline-offset-[10px]" };
/** Full-width panel that opens under the whole header bar. */
const wide = "invisible absolute inset-x-0 top-full -translate-y-1 border-y border-line-dark bg-nero opacity-0 shadow-soft transition-all duration-300 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100";

function LinkList({ items, to: _t }: { items: readonly (readonly [string, string, string])[]; to?: never }) {
  return <ul className="space-y-4">{items.map(([l, to, d]) => <li key={l}><a href={to} className="group/i block text-on-dark transition-colors hover:text-gold"><span className="font-heading text-xl">{l}</span><span className="block text-xs text-on-dark-muted">{d}</span></a></li>)}</ul>;
}

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const [announcement, setAnnouncement] = useState(true);
  const [compact, setCompact] = useState(false);
  const count = cartCount(useCart());
  useEffect(() => { const onScroll = () => setCompact(window.scrollY > 40); onScroll(); window.addEventListener("scroll", onScroll, { passive: true }); return () => window.removeEventListener("scroll", onScroll); }, []);
  return <>
    {announcement && <div className="surface-dark relative z-50 border-b border-line-dark px-12 py-2 text-center text-xs text-on-dark-muted"><span>Corporate orders: confirm by 20 November for guaranteed pre-Christmas delivery. </span><Link to="/corporate/quote" className="font-semibold text-gold underline underline-offset-4">Get an instant quote</Link><Button variant="ghost" size="icon" onClick={() => setAnnouncement(false)} aria-label="Dismiss announcement" className="absolute right-0 top-1/2 size-11 min-h-11 -translate-y-1/2 text-on-dark"><X /></Button></div>}
    <header data-overlay={overlay || undefined} className={`sticky top-0 z-40 border-b border-[#E2D9C8] bg-[#F4EFE5]/90 text-nero backdrop-blur-md transition-shadow duration-300 ${compact ? "shadow-[0_10px_30px_-22px_rgba(41,40,40,.6)]" : ""}`}>
      <div className={`mx-auto flex max-w-7xl items-center justify-between px-5 transition-all duration-300 ${compact ? "h-14" : "h-20"}`}>
        <Link to="/" aria-label="Boxed by Dweenie home" className="flex min-h-11 items-center"><img src={logos.onLight} alt="Boxed by Dweenie" className={`w-auto transition-all duration-300 ${compact ? "h-9" : "h-[2.875rem]"}`} /></Link>
        <nav className="hidden items-center gap-10 text-xs lg:flex" aria-label="Main navigation">
          <Link to="/about" className={topLink} activeProps={active}>About</Link>
          <div className="group"><Link to="/corporate" className={topLink} activeProps={active}>Corporate</Link>
            <div className={wide}><div className="mx-auto grid max-w-7xl grid-cols-[1.1fr_1.4fr_1fr] gap-12 px-5 py-10">
              <div><p className="eyebrow text-gold">For companies</p><p className="mt-5 font-heading text-3xl leading-tight text-on-dark">Gifts your people will remember.</p><p className="mt-4 text-sm text-on-dark-muted">Over 5,000 boxes delivered to over 450 clients.</p><Link to="/corporate/quote" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-gold px-6 text-sm font-semibold text-nero">Get an instant quote</Link></div>
              <LinkList items={corporateLinks} />
              <div className="hidden border-l border-line-dark pl-10 xl:block"><p className="eyebrow text-gold">Past clients</p><p className="mt-4 text-sm leading-relaxed text-on-dark-muted">Pepsico, Credit Direct, FBNQuest, Transcorp, Sterling, Legend Lagos Airport, and over 450 more.</p></div>
            </div></div></div>
          <div className="group"><Link to="/shop" className={topLink} activeProps={active}>Retail</Link>
            <div className={wide}><div className="mx-auto grid max-w-7xl grid-cols-[repeat(3,1fr)_1.3fr] gap-12 px-5 py-10">
              {shopGroups.map(([title, items]) => <div key={title}><p className="eyebrow text-gold">{title}</p><ul className="mt-5 space-y-3.5">{items.map(([item, search]) => <li key={item}><Link to="/shop" search={search} className="font-heading text-xl text-on-dark hover:text-gold">{item}</Link></li>)}</ul></div>)}
              <Link to="/shop" className="relative block overflow-hidden rounded-[2px]"><Photo name="lookbook-2" className="aspect-[4/3] w-full" sizes="320px" /><span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 font-heading text-xl text-on-dark">The festive edit</span></Link>
            </div></div></div>
          <div className="group"><Link to="/dispenser" className={topLink}>More ways to gift</Link>
            <div className={wide}><div className="mx-auto grid max-w-7xl grid-cols-[1fr_1.6fr] gap-12 px-5 py-10">
              <div><p className="eyebrow text-gold">More ways to gift</p><p className="mt-5 font-heading text-3xl leading-tight text-on-dark">Because the right gift is never one-size-fits-all.</p></div>
              <div className="grid grid-cols-2 gap-x-10"><LinkList items={moreWays.slice(0, 3)} /><LinkList items={moreWays.slice(3)} /></div>
            </div></div></div>
        </nav>
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-nero hover:text-[#8E6A10]" onClick={() => openSearch()}><Search /><span className="sr-only">Search</span></Button></TooltipTrigger><TooltipContent>Search</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button asChild variant="ghost" size="icon" className="hidden text-nero hover:text-[#8E6A10] sm:inline-flex"><Link to="/account"><UserRound /><span className="sr-only">Account</span></Link></Button></TooltipTrigger><TooltipContent>Account</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="relative text-nero hover:text-[#8E6A10]" onClick={() => openCart()}><ShoppingBag /><span className="sr-only">Bag, {count} items</span>{count > 0 && <span aria-hidden className="absolute right-0.5 top-0.5 flex min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-nero">{count}</span>}</Button></TooltipTrigger><TooltipContent>Bag, {count} items</TooltipContent></Tooltip>
          <Button asChild size="sm" className="ml-2 hidden rounded-full bg-nero px-5 text-white hover:bg-nero/90 xl:inline-flex"><Link to="/corporate/quote">Get a quote</Link></Button>
          <Sheet><SheetTrigger asChild><Button variant="ghost" size="icon" className="text-nero lg:hidden" aria-label="Open menu"><Menu /></Button></SheetTrigger><SheetContent side="right" className="w-full border-line-dark bg-nero p-7 text-on-dark sm:max-w-full [&>button]:hidden"><SheetTitle className="sr-only">Menu</SheetTitle><div className="flex justify-between"><img src={logo.url} alt="Boxed by Dweenie" className="h-10 w-auto" /><SheetClose asChild><Button variant="ghost" size="icon" className="text-on-dark" aria-label="Close menu"><X /></Button></SheetClose></div><nav className="mt-10 flex flex-col gap-8 overflow-y-auto">
            <SheetClose asChild><Link to="/about" className="border-b border-line-dark pb-3 font-heading text-2xl text-on-dark hover:text-gold">About</Link></SheetClose>
            <div><p className="eyebrow text-gold">Corporate</p><ul className="mt-3">{corporateLinks.map(([l, to]) => <li key={l}><SheetClose asChild><a href={to} className="block border-b border-line-dark py-3 font-heading text-xl text-on-dark hover:text-gold">{l}</a></SheetClose></li>)}</ul></div>
            <div><p className="eyebrow text-gold">Retail</p><ul className="mt-3">{[["Shop all gifts", "/shop"], ["Birthday", "/shop?occasion=birthday"], ["Anniversary", "/shop?occasion=anniversary"], ["Christmas", "/shop?occasion=christmas"]].map(([l, to]) => <li key={l}><SheetClose asChild><a href={to} className="block border-b border-line-dark py-3 font-heading text-xl text-on-dark hover:text-gold">{l}</a></SheetClose></li>)}</ul></div>
            <div><p className="eyebrow text-gold">More ways to gift</p><ul className="mt-3">{moreWays.map(([l, to]) => <li key={l}><SheetClose asChild><a href={to} className="block border-b border-line-dark py-3 font-heading text-xl text-on-dark hover:text-gold">{l}</a></SheetClose></li>)}</ul></div>
          </nav><div className="mt-8 grid gap-3"><Button asChild><Link to="/corporate/quote">Get an instant quote</Link></Button><Button asChild variant="outline" className="text-on-dark"><Link to="/dispenser">Gift in 60 seconds</Link></Button></div><div className="mt-10 text-sm text-on-dark-muted"><a href="tel:+2348134907391">0813 490 7391</a><br/><a href="mailto:hello@boxedbydweenie.com">hello@boxedbydweenie.com</a></div></SheetContent></Sheet>
        </div>
      </div>
    </header>
  </>;
}