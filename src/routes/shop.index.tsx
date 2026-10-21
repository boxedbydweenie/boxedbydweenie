import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SlidersHorizontal, X } from "lucide-react";
import { useMemo } from "react";
import { z } from "zod";
import { SiteShell } from "@/components/site/SiteShell";
import { Button, EmptyState, ProductCard } from "@/components/site/Brand";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { CATEGORIES, OCCASIONS, PRICE_BANDS, RECIPIENTS, SORTS } from "@/config/shop";
import { filterProducts, getProducts, labelFor } from "@/services/products";
import type { ShopFilters, ShopProduct, SortKey } from "@/types/shop";

const searchSchema = z.object({
  occasion: z.string().optional().catch(undefined),
  recipient: z.string().optional().catch(undefined),
  type: z.string().optional().catch(undefined),
  budget: z.string().optional().catch(undefined),
  sameday: z.boolean().optional().catch(undefined),
  sort: z.enum(["featured", "price-asc", "price-desc", "newest"]).optional().catch(undefined),
  q: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/shop/")({
  validateSearch: (s) => searchSchema.parse(s),
  loader: () => getProducts(),
  head: () => ({ meta: [
    { title: "Gift Shop — Boxed by Dweenie" },
    { name: "description", content: "Shop luxury gift boxes, hampers, experiences and gift cards, beautifully packaged and delivered across Nigeria." },
    { property: "og:title", content: "Gift Shop — Boxed by Dweenie" },
    { property: "og:description", content: "Luxury gift boxes, hampers and experiences for every occasion." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  pendingComponent: ShopSkeleton,
  component: ShopPage,
});

type FilterKey = "occasion" | "recipient" | "type" | "budget";
const GROUPS: { key: FilterKey; title: string; options: { slug: string; name: string }[] }[] = [
  { key: "occasion", title: "Occasion", options: OCCASIONS },
  { key: "recipient", title: "Recipient", options: RECIPIENTS },
  { key: "type", title: "Type", options: CATEGORIES },
  { key: "budget", title: "Price", options: PRICE_BANDS },
];

function Header({ count }: { count?: number }) {
  return <div className="surface-dark relative overflow-hidden">
    <div className="mx-auto max-w-7xl px-5 py-14 md:py-24">
      <Breadcrumb><BreadcrumbList className="text-on-dark-muted [&_a:hover]:text-gold [&_[aria-current]]:text-on-dark"><BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Retail</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
      <p className="eyebrow mt-10 text-gold">Individuals &amp; Retail</p><div aria-hidden className="mt-4 h-px w-14 bg-gold" />
      <h1 className="mt-6 text-5xl leading-[1.02] md:text-7xl">The gift <span className="text-gold">shop</span></h1>
      <p className="mt-6 max-w-xl text-lg text-on-dark-muted">Luxury boxes and hampers for every occasion, wrapped by hand and delivered anywhere in Nigeria.</p>
      <div className="mt-8 flex flex-wrap gap-2.5">
        {OCCASIONS.slice(0, 6).map((o, i) => <Link key={o.slug} to="/shop" search={{ occasion: o.slug }} className={`pill ${["pill-gold", "pill-coral", "pill-sage", "pill-ivory"][i % 4]} transition hover:-translate-y-0.5`}>{o.name}</Link>)}
      </div>
      <p className="mt-8 text-sm text-on-dark-muted" aria-live="polite">{count === undefined ? "Loading gifts" : `${count} ${count === 1 ? "gift" : "gifts"}`}</p>
    </div>
  </div>;
}

function ShopSkeleton() {
  return <SiteShell><main className="bg-paper"><Header /><div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-5 py-10 md:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <div key={i}><Skeleton className="aspect-[4/5] w-full" /><Skeleton className="mt-4 h-4 w-3/4" /><Skeleton className="mt-2 h-4 w-1/2" /></div>)}</div></main></SiteShell>;
}

function FilterPanel({ f, set }: { f: ShopFilters; set: (p: Partial<ShopFilters>) => void }) {
  return <div className="space-y-8">
    {GROUPS.map((g) => <fieldset key={g.key}>
      <legend className="eyebrow text-nero">{g.title}</legend>
      <div className="mt-3 space-y-1">{g.options.map((o) => {
        const active = f[g.key] === o.slug;
        return <label key={o.slug} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <input type="radio" name={g.key} checked={active} onChange={() => set({ [g.key]: o.slug })} onClick={() => active && set({ [g.key]: undefined })} className="size-4 accent-[var(--color-nero)]" />
          {o.name}
        </label>;
      })}</div>
    </fieldset>)}
    <fieldset><legend className="eyebrow text-nero">Delivery</legend>
      <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm">Same-day Lagos<Switch checked={!!f.sameday} onCheckedChange={(v) => set({ sameday: v || undefined })} /></label>
    </fieldset>
  </div>;
}

function SortSelect({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  return <Select value={value} onValueChange={(v) => onChange(v as SortKey)}><SelectTrigger className="min-h-11 w-full bg-paper sm:w-52" aria-label="Sort"><SelectValue /></SelectTrigger><SelectContent>{SORTS.map((s) => <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>)}</SelectContent></Select>;
}

function ShopPage() {
  const all = Route.useLoaderData() as ShopProduct[];
  const f = Route.useSearch();
  const navigate = useNavigate({ from: "/shop/" });
  const set = (p: Partial<ShopFilters>) => navigate({ search: (prev) => ({ ...prev, ...p }), replace: true, resetScroll: false });
  const clear = () => navigate({ search: {}, replace: true });
  const results = useMemo(() => filterProducts([...all], f), [all, f]);
  const chips = [
    ...GROUPS.filter((g) => f[g.key]).map((g) => ({ key: g.key, label: labelFor[g.key](f[g.key]!) })),
    ...(f.sameday ? [{ key: "sameday" as const, label: "Same-day Lagos" }] : []),
    ...(f.q ? [{ key: "q" as const, label: `“${f.q}”` }] : []),
  ];
  return <SiteShell><main className="bg-paper">
    <Header count={results.length} />
    <div className="sticky top-14 z-30 border-b border-border bg-paper/95 px-5 py-3 backdrop-blur lg:hidden">
      <Sheet><SheetTrigger asChild><Button variant="outline" className="w-full"><SlidersHorizontal /> Filter and sort{chips.length ? ` (${chips.length})` : ""}</Button></SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-lg bg-paper">
          <SheetTitle>Filter and sort</SheetTitle><SheetDescription className="sr-only">Narrow down gifts</SheetDescription>
          <div className="mt-6"><p className="eyebrow text-nero">Sort</p><div className="mt-3"><SortSelect value={f.sort ?? "featured"} onChange={(sort) => set({ sort })} /></div></div>
          <div className="mt-8"><FilterPanel f={f} set={set} /></div>
          <div className="sticky bottom-0 mt-8 grid grid-cols-2 gap-3 bg-paper py-4"><Button variant="outline" onClick={clear}>Clear all</Button><SheetClose asChild><Button>Show {results.length}</Button></SheetClose></div>
        </SheetContent>
      </Sheet>
    </div>
    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block" aria-label="Filters"><FilterPanel f={f} set={set} /></aside>
      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">{chips.map((c) => <button key={c.key} type="button" onClick={() => set({ [c.key]: undefined })} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-nero bg-paper px-4 text-sm hover:bg-ivory" aria-label={`Remove filter ${c.label}`}>{c.label}<X className="size-4" /></button>)}{chips.length > 1 && <Button variant="link" onClick={clear}>Clear all</Button>}</div>
          <div className="hidden lg:block"><SortSelect value={f.sort ?? "featured"} onChange={(sort) => set({ sort })} /></div>
        </div>
        {results.length === 0
          ? <div className="mt-8"><EmptyState line="No gifts match those filters yet." action={<div className="flex flex-wrap justify-center gap-3"><Button onClick={clear}>Clear filters</Button><Button asChild variant="outline"><Link to="/dispenser">Try the Gift Dispenser</Link></Button></div>} /></div>
          : <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4 lg:gap-x-6">{results.map((p) => <ProductCard key={p.id} product={{ id: p.id, slug: p.slug, name: p.name, line: p.line, price: p.price, inStock: p.inStock, ...(p.badges[0] ? { badge: p.badges[0] } : {}) }} />)}</div>}
      </section>
    </div>
    <section className="brand-pattern-plum py-20 text-on-dark"><div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-2 lg:items-center">
      <div><p className="eyebrow text-gold">Not sure what to pick?</p><div aria-hidden className="mt-4 h-px w-14 bg-gold" /><h2 className="mt-6 text-4xl md:text-5xl">Gift in <span className="text-gold">60 seconds</span></h2><p className="mt-4 max-w-md text-on-dark-muted">Answer three quick questions and our Gift Dispenser picks the right box.</p></div>
      <div className="flex flex-col gap-3 sm:flex-row lg:justify-end"><Link to="/dispenser" className="inline-flex min-h-14 items-center justify-center rounded-full bg-gold px-9 text-[15px] font-semibold text-nero transition hover:brightness-105">Try the Gift Dispenser</Link><Link to="/corporate/quote" className="inline-flex min-h-14 items-center justify-center rounded-full border border-on-dark/70 px-9 text-[15px] font-semibold transition hover:border-gold hover:bg-gold hover:text-nero">Gifting for a team?</Link></div>
    </div></section>
  </main></SiteShell>;
}
