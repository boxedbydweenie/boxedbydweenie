import { Link } from "@tanstack/react-router";
import { Award, CreditCard, Gift, Heart, Package, PartyPopper, Sparkles, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { BrandLogo, BrandProfile, BrandStat } from "@/types/brand";
import { formatStat, hasFounder } from "@/services/brand";
import { GoldRule, SectionHeading } from "@/components/site/Brand";
import { PlaceholderTile } from "@/components/site/PlaceholderTile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

/** Trust line for the hero, built from the first two stats. */
export function TrustLine({ brand }: { brand: BrandProfile }) {
  const [a, b] = brand.stats;
  if (!a) return null;
  return <p className="mt-6 text-sm text-on-dark-muted">{[a, b].filter(Boolean).map((s) => `${formatStat(s!)} ${s!.label}`).join(" · ")}</p>;
}

function LogoImg({ item }: { item: BrandLogo }) {
  return <img src={item.logo} alt={item.name} loading="lazy" decoding="async" className="logo-mono h-10 w-auto max-w-[140px] object-contain" />;
}

export function TrustedBy({ brand }: { brand: BrandProfile }) {
  if (!brand.clients.length) return null;
  const scroll = brand.clients.length > 6;
  const list = scroll ? [...brand.clients, ...brand.clients] : brand.clients;
  return <section aria-label="Trusted by" className="overflow-hidden border-b border-border bg-ivory py-8">
    <p className="eyebrow text-center text-muted-foreground">Trusted by</p>
    <div className={cn("mt-5", scroll ? "marquee-mask" : "mx-auto max-w-7xl px-5")}>
      <ul className={cn("flex items-center gap-10", scroll ? "animate-marquee w-max hover:[animation-play-state:paused]" : "flex-wrap justify-center")}>
        {list.map((c, i) => <li key={`${c.name}-${i}`} aria-hidden={i >= brand.clients.length || undefined}><LogoImg item={c} /></li>)}
      </ul>
    </div>
  </section>;
}

export function WhoWeAre({ brand, headingLevel = "h2" }: { brand: BrandProfile; headingLevel?: "h1" | "h2" }) {
  const H = headingLevel;
  return <section id="who-we-are" className="grid scroll-mt-24 lg:grid-cols-[.8fr_1.2fr]">
    <div className="surface-dark flex items-center px-5 py-12 lg:px-[max(5vw,3rem)] lg:py-20"><div><p className="eyebrow text-gold">About us</p><GoldRule className="mt-4" /><H className="mt-5 text-3xl text-on-dark md:text-5xl">Who we are</H></div></div>
    <div className="grid items-center gap-8 bg-paper px-5 py-12 md:grid-cols-[1fr_.7fr] lg:px-[max(5vw,3rem)] lg:py-20">
      <div>
        <p className="text-lg leading-relaxed">Boxed by Dweenie, also known as BBD, is a luxury gifting and packaging company. We create gifts for every occasion and exquisite boxing and packaging for products and presents.</p>
        <blockquote className="mt-7 border-l-2 border-gold pl-5 font-heading text-lg uppercase leading-snug tracking-wide">To be your number one luxury gift plug all season round.</blockquote>
        {headingLevel === "h2" && <Link to="/about" className="mt-7 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">Read our story</Link>}
      </div>
      {brand.teamPhoto
        ? <img src={brand.teamPhoto} alt="The Boxed by Dweenie team in the studio" loading="lazy" className="hidden aspect-[4/5] w-full rounded-md object-cover md:block" />
        : <PlaceholderTile label="The BBD studio" className="hidden aspect-[4/5] w-full md:block" />}
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
  return <section className="bg-ivory py-14 md:py-20"><div className="mx-auto max-w-7xl px-5">
    <SectionHeading eyebrow="Our services" title="What we do" />
    <div className="mt-8 grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
      {SERVICES.map(({ icon: Icon, title, line, to, search }) => <Link key={title} to={to} search={search} className="group bg-paper p-4 transition-colors hover:bg-ivory md:p-6">
        <Icon className="size-5 text-nero" aria-hidden /><h3 className="mt-3 text-xs leading-snug md:text-sm">{title}</h3><p className="mt-2 hidden text-sm text-muted-foreground sm:block">{line}</p><span className="mt-3 inline-block text-xs font-semibold underline-offset-4 group-hover:underline">Explore</span>
      </Link>)}
    </div>
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
  return <section className="surface-dark py-14 md:py-20"><div className="mx-auto max-w-7xl px-5">
    <SectionHeading eyebrow="Since 2021" title="Our journey" dark />
    {brand.stats.length > 0 && <dl className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">{brand.stats.map((s) => <div key={s.label}><dd className="font-sans text-4xl font-light tabular-nums text-gold md:text-5xl"><CountUp stat={s} /></dd><dt className="eyebrow mt-2 text-on-dark-muted">{s.label}</dt></div>)}</dl>}
    {brand.milestones.length > 0 && <ol className="mt-12 flex snap-x gap-0 overflow-x-auto pb-4" aria-label="Milestones">
      {brand.milestones.map((m) => <li key={m.year + m.line} className="relative min-w-[240px] max-w-xs flex-1 snap-start pr-8 pt-8">
        <span aria-hidden className="absolute inset-x-0 top-[5px] h-px bg-gold/60" /><span aria-hidden className="absolute left-0 top-0 size-3 rounded-full bg-gold" />
        <p className="eyebrow text-gold">{m.year}</p><p className="mt-3 text-sm leading-relaxed text-on-dark-muted">{m.line}</p>
      </li>)}
    </ol>}
  </div></section>;
}

export function FounderNote({ brand }: { brand: BrandProfile }) {
  if (!hasFounder(brand)) return null;
  const f = brand.founder;
  return <section className="bg-ivory py-14 md:py-20"><div className="mx-auto grid max-w-6xl items-center gap-8 px-5 md:grid-cols-[.7fr_1.3fr] md:gap-14">
    {f.portrait && <img src={f.portrait} alt={`${f.name}, ${f.title}`} loading="lazy" className="mx-auto aspect-[4/5] w-48 rounded-sm border border-gold object-cover md:w-full" />}
    <div>
      <p className="eyebrow text-muted-foreground">A note from our founder</p><GoldRule className="mt-4" />
      <div className="mt-6 space-y-4 text-base leading-relaxed md:text-lg">{f.note.map((p) => <p key={p}>{p}</p>)}</div>
      {f.signature ? <img src={f.signature} alt={`${f.name}'s signature`} loading="lazy" className="mt-6 h-12 w-auto" /> : <p className="mt-6 text-3xl italic" style={{ fontFamily: "var(--font-script)" }}>{f.name}</p>}
      <p className="mt-3 font-semibold">{f.name}</p>{f.title && <p className="text-sm text-muted-foreground">{f.title}</p>}
    </div>
  </div></section>;
}

export function Recognition({ brand }: { brand: BrandProfile }) {
  if (!brand.recognition.length) return null;
  return <div className="mt-12 border-t border-border pt-8"><p className="eyebrow text-center text-muted-foreground">Featured and recognised</p><ul className="mt-5 flex flex-wrap items-center justify-center gap-10">{brand.recognition.map((r) => <li key={r.name}><LogoImg item={r} /></li>)}</ul></div>;
}

export function WhatPeopleSay({ brand }: { brand: BrandProfile }) {
  const { reviews, corporateTestimonials: corp } = brand;
  if (!reviews.length && !corp.length && !brand.recognition.length) return null;
  const tabs = [reviews.length && "customers", corp.length && "companies"].filter(Boolean) as string[];
  return <section className="bg-paper py-14 md:py-20"><div className="mx-auto max-w-7xl px-5">
    {tabs.length > 0 && <><SectionHeading eyebrow="Kind words" title="What people say" />
      <Tabs defaultValue={tabs[0] ?? "customers"} className="mt-8">
        {tabs.length > 1 && <TabsList><TabsTrigger value="customers">Customers</TabsTrigger><TabsTrigger value="companies">Companies</TabsTrigger></TabsList>}
        {reviews.length > 0 && <TabsContent value="customers"><Carousel className="mt-6"><CarouselContent>{reviews.map((r) => <CarouselItem key={r.name + r.text} className="md:basis-1/2"><article className="h-full border border-border bg-ivory p-6"><div className="flex gap-1 text-nero" role="img" aria-label={`${r.rating} out of 5 stars`}>{Array.from({ length: r.rating }, (_, j) => <Star key={j} className="size-4 fill-gold" />)}</div><blockquote className="mt-4 leading-relaxed">“{r.text}”</blockquote><p className="mt-5 font-semibold">{r.name}</p>{r.role && <p className="text-sm text-muted-foreground">{r.role}</p>}</article></CarouselItem>)}</CarouselContent>{reviews.length > 1 && <div className="mt-6 flex gap-2"><CarouselPrevious className="static translate-y-0" /><CarouselNext className="static translate-y-0" /></div>}</Carousel></TabsContent>}
        {corp.length > 0 && <TabsContent value="companies"><ul className="mt-6 grid gap-5 md:grid-cols-3">{corp.map((t) => <li key={t.name + t.quote}><figure className="flex h-full flex-col rounded-md border-t-2 border-gold bg-ivory p-6"><blockquote className="flex-1 leading-relaxed">“{t.quote}”</blockquote><figcaption className="mt-5 text-sm"><span className="font-semibold">{t.name}</span><span className="block text-muted-foreground">{t.title}, {t.company}</span></figcaption></figure></li>)}</ul></TabsContent>}
      </Tabs></>}
    <Recognition brand={brand} />
  </div></section>;
}

export function Bridge() {
  return <section className="py-14 text-center md:py-20"><div className="mx-auto max-w-3xl px-5"><GoldRule className="mx-auto w-20" /><h2 className="mt-6 text-2xl md:text-4xl">Now, let's find the perfect gift.</h2></div></section>;
}
