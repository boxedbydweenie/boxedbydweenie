import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { FilePlus2, ShoppingBag } from "lucide-react";
import logo from "@/assets/bbd-logo.png.asset.json";
import { PlaceholderTile } from "@/components/site/PlaceholderTile";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { openCart } from "@/hooks/use-shop";
import { addToCart } from "@/services/cart";
import { addToQuoteList } from "@/services/lookbook";
import { getProductById } from "@/services/products";
import { CORPORATE_PACKAGES } from "@/config/corporate";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Hotspot, LookbookEdition, LookbookPage } from "@/types/lookbook";

function ProductActions({ productId, onDone }: { productId: string; onDone: () => void }) {
  const p = getProductById(productId);
  if (!p) return null;
  return <div>
    <p className="eyebrow text-muted-foreground">From the Look Book</p>
    <h3 className="mt-2 text-base">{p.name}</h3>
    <p className="mt-1 text-sm text-muted-foreground">{p.line}</p>
    <p className="mt-3 font-semibold">{formatNaira(p.price)}</p>
    <div className="mt-4 grid grid-cols-2 gap-2">
      <Button size="sm" onClick={async () => { await addToCart({ kind: "product", productId: p.id, slug: p.slug, name: p.name, price: p.price, quantity: 1, packaging: "signature-black" }); onDone(); openCart(); }}><ShoppingBag /> Add to bag</Button>
      <Button size="sm" variant="outline" onClick={async () => { await addToQuoteList(p.id); onDone(); toast(`${p.name} added to your quote list`); }}><FilePlus2 /> Add to quote</Button>
    </div>
    <Link to="/shop/$slug" params={{ slug: p.slug }} className="mt-3 inline-flex min-h-11 items-center text-xs font-semibold underline underline-offset-4">View details</Link>
  </div>;
}

function HotspotDot({ spot }: { spot: Hotspot }) {
  const mobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const name = getProductById(spot.productId)?.name ?? "product";
  const dot = <button type="button" aria-label={`Shop ${name}`} onClick={(e) => { e.stopPropagation(); setOpen(true); }}
    className="absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center" style={{ left: `${spot.x}%`, top: `${spot.y}%` }}>
    <span className="animate-hotspot block size-4 rounded-full border-2 border-paper bg-gold" />
  </button>;
  if (mobile) return <>{dot}<Sheet open={open} onOpenChange={setOpen}><SheetContent side="bottom" className="rounded-t-lg bg-paper p-6" onClick={(e) => e.stopPropagation()}><SheetTitle className="sr-only">{name}</SheetTitle><ProductActions productId={spot.productId} onDone={() => setOpen(false)} /></SheetContent></Sheet></>;
  return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild>{dot}</PopoverTrigger><PopoverContent className="w-72 bg-paper" onClick={(e) => e.stopPropagation()}><ProductActions productId={spot.productId} onDone={() => setOpen(false)} /></PopoverContent></Popover>;
}

function ImageSlot({ label, tone = "ivory", hotspots = [], className }: { label: string; tone?: "ivory" | "dark"; hotspots?: Hotspot[]; className?: string }) {
  return <div className={cn("relative", className)}>
    <PlaceholderTile label={label} tone={tone} className="absolute inset-0 rounded-none border-0" />
    {hotspots.map((h) => <HotspotDot key={`${h.productId}-${h.x}`} spot={h} />)}
  </div>;
}

const Paper = ({ dark, children, className }: { dark?: boolean; children: ReactNode; className?: string }) =>
  <div className={cn("relative h-full w-full overflow-y-auto", dark ? "surface-dark" : "bg-ivory text-nero", className)}>{children}</div>;

export function LookbookPageView({ page, edition }: { page: LookbookPage; edition: LookbookEdition }) {
  switch (page.kind) {
    case "cover":
      return <Paper dark className="overflow-hidden"><ImageSlot label={page.image} tone="dark" className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-nero via-nero/40 to-transparent" />
        <div className="absolute inset-x-0 top-0 p-6"><img src={logo.url} alt="Boxed by Dweenie" className="h-8 w-auto" /></div>
        <div className="absolute inset-x-0 bottom-0 p-6"><p className="eyebrow text-gold">{edition.season}</p><div className="foil mt-3 h-px w-14" /><h2 className="mt-4 font-display text-2xl leading-tight text-on-dark md:text-3xl">{edition.title}</h2></div>
      </Paper>;
    case "note":
      return <Paper className="flex flex-col justify-center p-8 md:p-10"><p className="eyebrow text-muted-foreground">Editor's note</p><div className="gold-rule mt-4 w-10" /><h2 className="mt-5 text-xl">{page.heading}</h2>
        {page.body.map((b) => <p key={b} className="mt-4 text-sm leading-relaxed text-muted-foreground">{b}</p>)}
        <p className="mt-8 font-heading text-sm uppercase tracking-[0.2em]">— {page.signature}</p></Paper>;
    case "full-bleed":
      return <Paper dark={page.tone === "dark"} className="overflow-hidden"><ImageSlot label={page.image} tone={page.tone ?? "dark"} hotspots={page.hotspots} className="absolute inset-0" />
        <p className="absolute inset-x-0 bottom-0 bg-nero/85 px-6 py-4 text-sm italic text-on-dark">{page.caption}</p></Paper>;
    case "feature-image":
      return <Paper className="overflow-hidden"><ImageSlot label={page.image} hotspots={page.hotspots} className="absolute inset-0" /></Paper>;
    case "feature-text": {
      const p = getProductById(page.productId);
      if (!p) return <Paper>{null}</Paper>;
      return <Paper className="flex flex-col justify-center p-8 md:p-10"><p className="eyebrow text-muted-foreground">Featured</p><div className="gold-rule mt-4 w-10" /><h2 className="mt-5 text-xl">{p.name}</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{page.story}</p>
        <h3 className="mt-6 text-xs">What's inside</h3><ul className="mt-2 space-y-1 text-sm">{p.inside.map((i) => <li key={i} className="border-b border-border py-1">{i}</li>)}</ul>
        <div className="mt-6 flex flex-wrap items-center gap-3"><span className="text-lg font-semibold">{formatNaira(p.price)}</span><HotspotButton productId={p.id} /></div></Paper>;
    }
    case "grid":
      return <Paper className="p-6 md:p-8"><p className="eyebrow text-muted-foreground">{edition.title}</p><h2 className="mt-3 text-lg">{page.heading}</h2>
        <div className={cn("mt-5 grid gap-3", page.productIds.length > 4 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2")}>
          {page.productIds.map((id) => { const p = getProductById(id); if (!p) return null; return <div key={id}><ImageSlot label={p.name} hotspots={[{ productId: id, x: 85, y: 15 }]} className="aspect-square" /><p className="mt-2 text-xs font-semibold leading-tight">{p.name}</p><p className="text-xs text-muted-foreground">{formatNaira(p.price)}</p></div>; })}
        </div></Paper>;
    case "detail":
      return <Paper dark className="p-6 md:p-8"><p className="eyebrow text-gold">Close up</p><h2 className="mt-3 text-lg text-on-dark">{page.heading}</h2>
        <div className="mt-5 grid gap-4">{page.crops.map((c) => <figure key={c.image} className="grid grid-cols-[40%_1fr] items-center gap-4"><PlaceholderTile label={c.image} tone="ivory" className="aspect-square" /><figcaption className="text-sm text-on-dark-muted">{c.caption}</figcaption></figure>)}</div></Paper>;
    case "tiers":
      return <Paper className="p-6 md:p-8"><p className="eyebrow text-muted-foreground">Corporate packages</p><h2 className="mt-3 text-lg">{page.heading}</h2><p className="mt-2 text-xs text-muted-foreground">{page.intro}</p>
        <div className="mt-5 grid gap-3">{CORPORATE_PACKAGES.map((t) => <div key={t.id} className={cn("rounded-md border p-4", t.highlighted ? "border-gold bg-paper" : "border-border")}>
          <div className="flex items-baseline justify-between gap-2"><h3 className="text-sm">{t.name}</h3><span className="text-xs font-semibold">{formatNaira(t.fromPrice)}{t.toPrice ? ` – ${formatNaira(t.toPrice)}` : "+"}</span></div>
          <p className="mt-1 text-xs text-muted-foreground">{t.summary}</p>
          {t.branding && <p className="mt-2 text-xs"><span className="font-semibold">Branding:</span> {t.branding.join(", ")}</p>}
        </div>)}</div>
        <Button asChild size="sm" className="mt-5"><Link to="/corporate/quote">Get an instant quote</Link></Button></Paper>;
    case "back":
      return <Paper dark className="flex flex-col items-center justify-center p-8 text-center"><div className="pattern-bow-light pointer-events-none absolute inset-0 opacity-[0.06]" />
        <img src={logo.url} alt="Boxed by Dweenie" className="relative h-10 w-auto" />
        <h2 className="relative mt-8 text-2xl text-on-dark">Let's create a wow.</h2><div className="foil relative mt-5 h-px w-14" />
        <div className="relative mt-6 space-y-1 text-sm text-on-dark-muted"><a className="block py-3 hover:text-gold" href="tel:+2349092125960">0909 212 5960</a><a className="block py-3 hover:text-gold" href="mailto:info@boxedbydweenie.com">info@boxedbydweenie.com</a><p>@boxedbydweenie</p></div>
        <div className="relative mt-8 flex size-24 items-center justify-center border border-dashed border-line-dark text-[10px] uppercase tracking-[0.2em] text-on-dark-muted">QR code</div></Paper>;
  }
}

function HotspotButton({ productId }: { productId: string }) {
  const p = getProductById(productId);
  if (!p) return null;
  return <>
    <Button size="sm" onClick={async () => { await addToCart({ kind: "product", productId: p.id, slug: p.slug, name: p.name, price: p.price, quantity: 1, packaging: "signature-black" }); openCart(); }}><ShoppingBag /> Add to bag</Button>
    <Button size="sm" variant="outline" onClick={async () => { await addToQuoteList(p.id); toast(`${p.name} added to your quote list`); }}><FilePlus2 /> Add to quote</Button>
  </>;
}

/** Small cover used on the library and thumbnail strip. */
export function EditionCover({ title, season, tone }: { title: string; season: string; tone: "ivory" | "dark" }) {
  const dark = tone === "dark";
  return <div className={cn("relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-md p-5", dark ? "surface-dark border border-line-dark" : "border border-border bg-ivory text-nero")}>
    <div className={cn("absolute inset-0", dark ? "pattern-bow-light opacity-[0.1]" : "pattern-bow opacity-[0.08]")} />
    <p className={cn("eyebrow relative", dark ? "text-gold" : "text-muted-foreground")}>{season}</p>
    <div className={cn("relative mt-3 h-px w-10", dark ? "foil" : "bg-nero")} />
    <h3 className={cn("relative mt-3 font-display text-lg leading-tight", dark && "text-on-dark")}>{title}</h3>
  </div>;
}
