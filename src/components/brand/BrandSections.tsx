import { Link } from "@tanstack/react-router";
import { ArrowRight, Award, CreditCard, Gift, Heart, Package, PartyPopper, Sparkles, Star } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { BrandLogo, BrandProfile, BrandStat } from "@/types/brand";
import { anySample, formatStat, hasFounder } from "@/services/brand";
import { Button } from "@/components/site/Brand";
import { BowTie } from "@/components/shop/BowTie";
import { Photo, SampleChip } from "@/components/home/Photo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export const WRAP = "mx-auto w-full max-w-[1200px] px-5";
export const SECTION = "relative py-16 lg:py-28";

/** Shared heading block: eyebrow, gold rule (metallic on dark), heading, intro. */
export function HeadBlock({ eyebrow, title, intro, dark, center, as: H = "h2", className }: { eyebrow: string; title: string; intro?: string; dark?: boolean; center?: boolean; as?: "h1" | "h2"; className?: string }) {
  return <div className={cn("max-w-2xl", center && "mx-auto text-center", className)}>
    <p className={cn("eyebrow", dark ? "text-gold" : "text-muted-foreground")}>{eyebrow}</p>
    <div aria-hidden className={cn("mt-4 w-12", dark ? "rule-foil" : "gold-rule", center && "mx-auto")} />
    <H className={cn("mt-5 text-2xl md:text-4xl", dark && "text-on-dark")}>{title}</H>
    {intro && <p className={cn("mt-4 leading-relaxed", dark ? "text-on-dark-muted" : "text-muted-foreground")}>{intro}</p>}
  </div>;
}

/** Trust line for the hero, built from the first two stats. */
export function TrustLine({ brand, className }: { brand: BrandProfile; className?: string }) {
  const [a, b] = brand.stats;
  if (!a) return null;
  return <p className={cn("text-sm text-on-dark-muted", className)}>{[a, b].filter(Boolean).map((s) => `${formatStat(s!)} ${s!.label}`).join(" · ")}</p>;
}

function Mark({ item }: { item: BrandLogo }) {
  return item.logo
    ? <img src={item.logo} alt={item.name} loading="lazy" decoding="async" className="logo-mono h-9 w-auto max-w-[140px] object-contain" />
    : <span className="whitespace-nowrap font-heading text-sm uppercase tracking-[0.25em] text-nero/80">{item.name}</span>;
}

export function TrustedBy({ brand }: { brand: BrandProfile }) {
  if (!brand.clients.length) return null;
  const scroll = brand.clients.length > 6;
  const list = scroll ? [...brand.clients, ...brand.clients] : brand.clients;
  return <section aria-label="Trusted by" className="relative overflow-hidden border-b border-border bg-ivory py-8 md:py-10">
    <SampleChip show={anySample(brand.clients)} />
    <p className="eyebrow text-center text-muted-foreground">Trusted by</p>
    <div className={cn("mt-5", scroll ? "marquee-mask" : WRAP)}>
      <ul className={cn("flex items-center gap-x-10 gap-y-4", scroll ? "animate-marquee w-max hover:[animation-play-state:paused]" : "flex-wrap justify-center")}>
        {list.map((c, i) => <li key={`${c.name}-${i}`} aria-hidden={i >= brand.clients.length || undefined}><Mark item={c} /></li>)}
      </ul>
    </div>
  </section>;
}

export function WhoWeAre({ brand }: { brand: BrandProfile }) {
  return <section id="who-we-are" className="grid scroll-mt-24 lg:grid-cols-[.9fr_1.1fr]">
    <div className="surface-rich relative flex items-center overflow-hidden px-5 py-14 lg:px-[max(5vw,3rem)] lg:py-20">
      <div aria-hidden className="pattern-leaf absolute inset-0 opacity-[0.07]" />
      <div className="relative" data-reveal>
        <p className="eyebrow text-gold">About us</p><div aria-hidden className="rule-foil mt-4 w-12" />
        <h2 className="mt-5 text-3xl text-on-dark md:text-5xl">Who we are</h2>
        <blockquote className="mt-8 max-w-md font-heading text-xl uppercase leading-snug tracking-wide text-gold md:text-2xl">“To be your number one luxury gift plug all season round.”</blockquote>
      </div>
    </div>
    <div className="grid items-center gap-8 bg-paper px-5 py-14 md:grid-cols-[1fr_.75fr] lg:px-[max(5vw,3rem)] lg:py-20" data-reveal>
      <div>
        <p className="text-lg leading-relaxed">Boxed by Dweenie, also known as BBD, is a luxury gifting and packaging company. We create gifts for every occasion and exquisite boxing and packaging for products and presents.</p>
        <Link to="/about" className="link-draw mt-6 inline-flex min-h-11 items-center font-semibold">Read our story <ArrowRight className="ml-2 size-4" /></Link>
      </div>
      {brand.teamPhoto
        ? <img src={brand.teamPhoto} alt="The Boxed by Dweenie team in the studio" loading="lazy" className="aspect-[4/5] w-full rounded-md object-cover" />
        : <Photo name="studio" className="aspect-[4/3] w-full rounded-md md:aspect-[4/5]" sizes="(min-width: 768px) 25vw, 100vw" />}
    </div>
  </section>;
}

export const SERVICES = [
  { icon: Gift, title: "Luxury gifting for all occasions", line: "Curated gifts for every moment worth marking.", to: "/shop", search: {} },
  { icon: Package, title: "Exquisite packaging", line: "Boxing that turns any present into an occasion.", to: "/shop", search: { type: "packaging" } },
  { icon: CreditCard, title: "Gift cards", line: "Let them choose, beautifully.", to: "/gift-cards", search: {} },
  { icon: Award, title: "Employee reward packages", line: "Thank your people properly, at any scale.", to: "/corporate", search: {} },
  { icon: PartyPopper, title: "Souvenirs and party favours", line: "Keepsakes your guests will actually keep.", to: "/shop", search: { type: "souvenirs" } },
  { icon: Heart, title: "Gift registry", line: "Weddings, babies and milestones, made easy.", to: "/contact", search: {} },
  { icon: Sparkles, title: "Experiential gifting", line: "Moments to live, not just unwrap.", to: "/shop", search: { type: "experiences" } },
] as const;

export function WhatWeDo() {
  return <section className={cn(SECTION, "bg-ivory")}><div className={WRAP}>
    <div data-reveal><HeadBlock eyebrow="Our services" title="What we do" /></div>
    <ul className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4" data-reveal>
      {SERVICES.map(({ icon: Icon, title, line, to, search }) => <li key={title}><Link to={to} search={search} className="lift hairline group flex h-full flex-col rounded-md bg-paper p-4 hover:bg-nero hover:text-on-dark md:p-6">
        <span className="flex size-10 items-center justify-center rounded-full border border-gold text-nero transition-colors group-hover:text-gold"><Icon className="size-4" aria-hidden /></span>
        <h3 className="mt-4 text-xs leading-snug md:text-sm">{title}</h3>
        <p className="mt-2 hidden text-sm text-muted-foreground transition-colors group-hover:text-on-dark-muted sm:block">{line}</p>
        <span className="mt-auto pt-4 text-xs font-semibold">Explore <ArrowRight className="inline size-3 transition-transform group-hover:translate-x-1" /></span>
      </Link></li>)}
      <li><Link to="/dispenser" className="lift surface-rich hairline-dark flex h-full flex-col justify-between rounded-md p-4 md:p-6">
        <h3 className="text-xs leading-snug text-on-dark md:text-sm">Not sure where to start?</h3>
        <span className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-3 text-center text-xs font-semibold text-primary-foreground md:text-sm">Try the Gift Dispenser</span>
      </Link></li>
    </ul>
  </div></section>;
}

function CountUp({ stat }: { stat: BrandStat }) {
  const ref = useRef<HTMLSpanElement>(null);
  const target = stat.value ?? 0;
  const [n, setN] = useState(target);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setN(0);
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t: number) => { const p = Math.min(1, (t - start) / 1400); setN(Math.round(target * (1 - (1 - p) ** 3))); if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [target]);
  return <span ref={ref}>{formatStat({ ...stat, value: n })}</span>;
}

export function OurJourney({ brand }: { brand: BrandProfile }) {
  if (!brand.stats.length && !brand.milestones.length) return null;
  return <section className={cn(SECTION, "surface-rich overflow-hidden")}>
    <div aria-hidden className="pattern-leaf absolute inset-0 opacity-[0.07]" />
    <SampleChip dark show={anySample(brand.stats) || anySample(brand.milestones)} />
    <div className={cn(WRAP, "relative")}>
      <div data-reveal><HeadBlock eyebrow="Since 2021" title="Our journey" dark /></div>
      {brand.stats.length > 0 && <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">{brand.stats.map((s) => <div key={s.label} className="flex flex-col-reverse"><dt className="eyebrow mt-2 text-on-dark-muted">{s.label}</dt><dd className="text-foil font-sans text-4xl font-light tabular-nums md:text-6xl"><CountUp stat={s} /></dd></div>)}</dl>}
      {brand.milestones.length > 0 && <div className="relative mt-14 -mx-5 overflow-x-auto px-5 pb-2">
        <ol className="relative flex min-w-max snap-x md:min-w-0" aria-label="Milestones">
          <span aria-hidden className="draw-line rule-foil absolute inset-x-0 top-[5px]" />
          {brand.milestones.map((m) => <li key={m.year + m.line} className="relative w-[220px] shrink-0 snap-start pr-6 pt-8 md:w-auto md:flex-1">
            <span aria-hidden className="absolute left-0 top-0 size-3 rounded-full bg-gold ring-4 ring-nero" />
            <p className="eyebrow text-gold">{m.year}</p><p className="mt-3 text-sm leading-relaxed text-on-dark-muted">{m.line}</p>
          </li>)}
        </ol>
      </div>}
    </div>
  </section>;
}

function Monogram({ name }: { name: string }) {
  const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2);
  return <div role="img" aria-label={`Monogram for ${name}`} className="surface-rich relative mx-auto flex aspect-[4/5] w-44 items-center justify-center rounded-sm border border-gold md:w-full">
    <div aria-hidden className="absolute inset-3 border border-gold/40" />
    <span className="text-foil font-display text-6xl md:text-8xl">{initials}</span>
  </div>;
}

export function FounderNote({ brand }: { brand: BrandProfile }) {
  if (!hasFounder(brand)) return null;
  const f = brand.founder;
  return <section className={cn(SECTION, "bg-ivory")}>
    <SampleChip show={!!f.sample} />
    <div className={cn(WRAP, "grid max-w-[1000px] items-center gap-8 md:grid-cols-[.7fr_1.3fr] md:gap-14")} data-reveal>
      {f.portrait ? <img src={f.portrait} alt={`${f.name}, ${f.title}`} loading="lazy" className="mx-auto aspect-[4/5] w-44 rounded-sm border border-gold object-cover md:w-full" /> : <Monogram name={f.name} />}
      <div>
        <p className="eyebrow text-muted-foreground">A note from our founder</p><div aria-hidden className="gold-rule mt-4 w-12" />
        <div className="mt-6 space-y-4 text-base leading-relaxed md:text-lg">{f.note.map((p) => <p key={p}>{p}</p>)}</div>
        {f.signature ? <img src={f.signature} alt={`${f.name}'s signature`} loading="lazy" className="mt-6 h-12 w-auto" /> : <p aria-hidden className="mt-6 text-4xl" style={{ fontFamily: "var(--font-script)" }}>{f.name}</p>}
        <p className="mt-3 font-semibold">{f.name}</p>{f.title && <p className="text-sm text-muted-foreground">{f.title}</p>}
      </div>
    </div>
  </section>;
}

export function Recognition({ brand }: { brand: BrandProfile }) {
  if (!brand.recognition.length) return null;
  return <div className="mt-12 border-t border-border pt-8"><p className="eyebrow text-center text-muted-foreground">Featured and recognised</p><ul className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">{brand.recognition.map((r) => <li key={r.name}><Mark item={r} /></li>)}</ul></div>;
}

function Card({ children }: { children: ReactNode }) { return <article className="lift hairline flex h-full flex-col rounded-md bg-ivory p-6">{children}</article>; }

export function WhatPeopleSay({ brand }: { brand: BrandProfile }) {
  const { reviews, corporateTestimonials: corp } = brand;
  if (!reviews.length && !corp.length && !brand.recognition.length) return null;
  const tabs = [reviews.length && "customers", corp.length && "companies"].filter(Boolean) as string[];
  return <section className={cn(SECTION, "bg-paper")}>
    <SampleChip show={anySample(reviews) || anySample(corp) || anySample(brand.recognition)} />
    <div className={WRAP}>
      {tabs.length > 0 && <><div data-reveal><HeadBlock eyebrow="Kind words" title="What people say" /></div>
        <Tabs defaultValue={tabs[0] ?? "customers"} className="mt-8">
          {tabs.length > 1 && <TabsList><TabsTrigger value="customers" className="min-h-10 px-4">Customers</TabsTrigger><TabsTrigger value="companies" className="min-h-10 px-4">Companies</TabsTrigger></TabsList>}
          {reviews.length > 0 && <TabsContent value="customers"><Carousel className="mt-6"><CarouselContent>{reviews.map((r, i) => <CarouselItem key={i} className="basis-[88%] md:basis-1/2 lg:basis-1/3"><Card><div className="flex gap-1" role="img" aria-label={`${r.rating} out of 5 stars`}>{Array.from({ length: r.rating }, (_, j) => <Star key={j} className="size-4 fill-gold text-gold" />)}</div><blockquote className="mt-4 flex-1 leading-relaxed">“{r.text}”</blockquote><p className="mt-5 font-semibold">{r.name}</p>{r.role && <p className="text-sm text-muted-foreground">{r.role}</p>}</Card></CarouselItem>)}</CarouselContent>{reviews.length > 1 && <div className="mt-6 flex gap-2"><CarouselPrevious className="static size-11 translate-y-0" /><CarouselNext className="static size-11 translate-y-0" /></div>}</Carousel></TabsContent>}
          {corp.length > 0 && <TabsContent value="companies"><ul className="mt-6 grid gap-4 md:grid-cols-3">{corp.map((t, i) => <li key={i}><Card><p className="eyebrow text-muted-foreground">{t.company}</p><blockquote className="mt-4 flex-1 leading-relaxed">“{t.quote}”</blockquote><p className="mt-5 text-sm"><span className="font-semibold">{t.name}</span><span className="block text-muted-foreground">{t.title}</span></p></Card></li>)}</ul></TabsContent>}
        </Tabs></>}
      <Recognition brand={brand} />
    </div>
  </section>;
}

export function Bridge() {
  return <section className="py-12 text-center md:py-16"><div className={cn(WRAP, "max-w-3xl")} data-reveal><BowTie className="mx-auto h-10 w-16" /><div aria-hidden className="gold-rule mx-auto mt-4 w-20" /><h2 className="mt-5 text-2xl md:text-4xl">Now, let's find the perfect gift.</h2></div></section>;
}

export { Button };
