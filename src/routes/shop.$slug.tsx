import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CalendarDays, Heart, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { Button, Eyebrow, GoldRule, ProductCard, SectionHeading, Stepper } from "@/components/site/Brand";
import { PlaceholderTile } from "@/components/site/PlaceholderTile";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Calendar } from "@/components/ui/calendar";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { BULK_THRESHOLD, CATEGORIES, GIFT_NOTE_LIMIT, PACKAGING } from "@/config/shop";
import { earliestDelivery, toIso } from "@/config/delivery";
import { formatDayMonth, formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { addToCart } from "@/services/cart";
import { toggleWishlist } from "@/services/account";
import { getProductBySlug, getRelated } from "@/services/products";
import { openCart, useWishlist } from "@/hooks/use-shop";
import type { PackagingChoice, ShopProduct } from "@/types/shop";

export const Route = createFileRoute("/shop/$slug")({
  loader: async ({ params }) => {
    const product = await getProductBySlug(params.slug);
    if (!product) throw notFound();
    return { product, related: getRelated(product) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Gift not found — Boxed by Dweenie" }, { name: "robots", content: "noindex" }] };
    const p = loaderData.product;
    const title = `${p.name} — Boxed by Dweenie`;
    return { meta: [
      { title }, { name: "description", content: p.description },
      { property: "og:title", content: title }, { property: "og:description", content: p.line },
      { property: "og:type", content: "product" }, { name: "twitter:card", content: "summary_large_image" },
    ] };
  },
  notFoundComponent: GiftNotFound,
  component: ProductPage,
});

function GiftNotFound() {
  return <SiteShell><main className="bg-paper px-5 py-24 text-center"><h1 className="text-3xl">This gift is not boxed yet</h1><p className="mt-4 text-muted-foreground">It may have sold out or moved.</p><Button asChild className="mt-8"><Link to="/shop">Back to the shop</Link></Button></main></SiteShell>;
}

const card = (p: ShopProduct) => ({ id: p.id, slug: p.slug, name: p.name, line: p.line, price: p.price, inStock: p.inStock, ...(p.badges[0] ? { badge: p.badges[0] } : {}) });

function Gallery({ p }: { p: ShopProduct }) {
  const [api, setApi] = useState<CarouselApi>();
  const [index, setIndex] = useState(0);
  useEffect(() => { if (!api) return; const on = () => setIndex(api.selectedScrollSnap()); api.on("select", on); return () => { api.off("select", on); }; }, [api]);
  return <div>
    <Carousel setApi={setApi} opts={{ loop: true }} aria-label={`${p.name} images`}>
      <CarouselContent>{p.images.map((img, i) => <CarouselItem key={img}><PlaceholderTile label={img} tone={i % 2 ? "dark" : "ivory"} className="aspect-[4/5] w-full" /></CarouselItem>)}</CarouselContent>
    </Carousel>
    <div className="mt-3 grid grid-cols-4 gap-3">{p.images.map((img, i) => <button key={img} type="button" onClick={() => api?.scrollTo(i)} aria-label={`Show image ${i + 1}`} aria-current={index === i} className={cn("rounded-md border-2 transition-colors", index === i ? "border-nero" : "border-transparent")}><PlaceholderTile label={img} tone={i % 2 ? "dark" : "ivory"} className="aspect-square w-full" /></button>)}</div>
  </div>;
}

function ProductPage() {
  const { product: p, related } = Route.useLoaderData();
  const wishlist = useWishlist();
  const liked = wishlist.includes(p.id);
  const [packaging, setPackaging] = useState<PackagingChoice>("signature-black");
  const [note, setNote] = useState("");
  const [handwritten, setHandwritten] = useState(false);
  const [earliest, setEarliest] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>();
  const [qty, setQty] = useState(1);
  useEffect(() => { setEarliest(earliestDelivery(p.sameDay)); setDate(undefined); setQty(1); }, [p.id, p.sameDay]);
  const category = CATEGORIES.find((c) => c.slug === p.category)?.name;
  const add = async () => {
    await addToCart({ kind: "product", productId: p.id, slug: p.slug, name: p.name, price: p.price, quantity: qty, packaging, handwritten, ...(note.trim() ? { note: note.trim() } : {}), ...(date ? { deliveryDate: toIso(date) } : {}) });
    openCart();
  };
  return <SiteShell><main className="bg-paper pb-24 lg:pb-0">
    <div className="mx-auto max-w-7xl px-5 pt-6">
      <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbLink asChild><Link to="/shop">Shop</Link></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>{p.name}</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
    </div>
    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-8 lg:grid-cols-2 lg:gap-16">
      <Gallery p={p} />
      <div>
        <Eyebrow>{category}</Eyebrow>
        <h1 className="mt-3 text-2xl md:text-4xl">{p.name}</h1>
        <p className="mt-3 text-xl font-semibold">{formatNaira(p.price)}</p>
        {p.poem?.length ? <p className="mt-4 font-heading text-lg italic leading-snug text-nero/80">{p.poem.map((l, i) => <span key={i} className="block">{l}</span>)}</p> : null}
        <p className="mt-3 text-muted-foreground">{p.idealFor ? <><span className="font-semibold text-nero">Ideal for: </span>{p.idealFor}</> : p.line}</p>
        {p.saysAboutYou && <p className="mt-2 text-sm text-muted-foreground"><span className="font-semibold text-nero">What it says about you: </span>{p.saysAboutYou}</p>}
        {(p.badges.length > 0 || p.sameDay) && <div className="mt-4 flex flex-wrap gap-2">{[...new Set([...p.badges, ...(p.sameDay ? ["Same-day Lagos"] : [])])].map((b) => <span key={b} className="rounded-sm bg-gold px-2 py-1 text-[10px] font-bold uppercase text-nero">{b}</span>)}</div>}
        <GoldRule className="mt-6" />

        <fieldset className="mt-6"><legend className="eyebrow text-nero">Packaging</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">{PACKAGING.map((o) => <label key={o.slug} className={cn("flex min-h-11 cursor-pointer gap-3 rounded-md border p-4 transition-colors", packaging === o.slug ? "border-nero bg-ivory" : "border-border hover:border-nero/50")}>
            <input type="radio" name="packaging" value={o.slug} checked={packaging === o.slug} onChange={() => setPackaging(o.slug)} className="mt-1 size-4 accent-[var(--color-nero)]" />
            <span><span className="block text-sm font-semibold">{o.name}</span><span className="text-xs text-muted-foreground">{o.line}</span></span>
          </label>)}</div>
        </fieldset>

        <div className="mt-6">
          <label htmlFor="note" className="eyebrow text-nero">Add a gift note</label>
          <Textarea id="note" value={note} maxLength={GIFT_NOTE_LIMIT} onChange={(e) => setNote(e.target.value)} placeholder="Write something they will keep" className="mt-3 min-h-24 bg-paper" aria-describedby="note-count" />
          <div className="mt-2 flex items-center justify-between gap-3">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm"><Switch checked={handwritten} onCheckedChange={setHandwritten} />Handwritten card</label>
            <span id="note-count" className="text-xs text-muted-foreground">{note.length}/{GIFT_NOTE_LIMIT}</span>
          </div>
        </div>

        <div className="mt-6">
          <p className="eyebrow text-nero">Delivery date</p>
          <Popover><PopoverTrigger asChild><Button variant="outline" className="mt-3 w-full justify-start sm:w-auto"><CalendarDays />{date ? formatDayMonth(toIso(date)) : "Choose a date"}</Button></PopoverTrigger>
            <PopoverContent className="w-auto bg-paper p-0" align="start"><Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => !earliest || toIso(d) < earliest} /></PopoverContent>
          </Popover>
          {earliest && <p className="mt-2 text-xs text-muted-foreground">Earliest available: {formatDayMonth(earliest)}{p.sameDay ? ". Same-day Lagos when ordered before 12 noon." : "."}</p>}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Stepper value={qty} onChange={setQty} />
          <Button size="lg" className="flex-1" onClick={add} disabled={!p.inStock}><ShoppingBag />{p.inStock ? "Add to bag" : "Sold out"}</Button>
          <Button size="icon" variant="outline" aria-pressed={liked} aria-label={liked ? "Remove from wishlist" : "Add to wishlist"} onClick={() => toggleWishlist(p.id)}><Heart className={liked ? "fill-current" : ""} /></Button>
        </div>
        <p className="mt-4 text-sm">Ordering {BULK_THRESHOLD} or more? <Link to="/corporate/quote" search={{ items: p.corporateEligible ? p.id : undefined }} className="font-semibold underline underline-offset-4">Get an instant quote.</Link></p>

        <Accordion type="multiple" defaultValue={["inside"]} className="mt-6">
          <AccordionItem value="inside"><AccordionTrigger>What's inside</AccordionTrigger><AccordionContent><ul className="list-disc space-y-1 pl-5">{p.inside.map((i) => <li key={i}>{i}</li>)}</ul></AccordionContent></AccordionItem>
          <AccordionItem value="delivery"><AccordionTrigger>Delivery</AccordionTrigger><AccordionContent>{p.sameDay ? "Same-day delivery within Lagos for orders placed before 12 noon. " : ""}Next-day delivery across Lagos and Abuja, and two to four working days elsewhere in Nigeria. Fees are calculated at checkout by state.</AccordionContent></AccordionItem>
          <AccordionItem value="returns"><AccordionTrigger>Returns</AccordionTrigger><AccordionContent>Because every gift is hand-finished and often personalised, we cannot accept returns. If anything arrives damaged, tell us within 24 hours and we will make it right. <Link to="/delivery-and-returns" className="underline underline-offset-4">Read the full policy</Link>.</AccordionContent></AccordionItem>
        </Accordion>
      </div>
    </div>

    {related.pairs.length > 0 && <section className="bg-ivory py-16"><div className="mx-auto max-w-7xl px-5"><SectionHeading eyebrow="Complete the moment" title="Pairs well with" /><div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">{related.pairs.map((r) => <ProductCard key={r.id} product={card(r)} />)}</div></div></section>}
    {related.occasion.length > 0 && <section className="py-16"><div className="mx-auto max-w-7xl px-5"><SectionHeading eyebrow="Same occasion" title="More for this occasion" /><div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">{related.occasion.map((r) => <ProductCard key={r.id} product={card(r)} />)}</div></div></section>}

    <div data-bottom-bar className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 border-t border-border bg-paper px-5 py-3 shadow-soft lg:hidden">
      <div className="min-w-0 flex-1"><p className="truncate text-xs text-muted-foreground">{p.name}</p><p className="font-semibold">{formatNaira(p.price * qty)}</p></div>
      <Button onClick={add} disabled={!p.inStock}><ShoppingBag />{p.inStock ? "Add to bag" : "Sold out"}</Button>
    </div>
  </main></SiteShell>;
}
