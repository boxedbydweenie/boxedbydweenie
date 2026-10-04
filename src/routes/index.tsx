import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Award, BriefcaseBusiness, Gift, Handshake, PackageOpen, PartyPopper, Search, Sparkles, Truck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DISPENSER_BUDGETS, DISPENSER_OCCASIONS, DISPENSER_RECIPIENTS } from "@/config/dispenser";
import { getHomeData } from "@/services/home";
import type { HomeData } from "@/types/home";
import { SiteShell } from "@/components/site/SiteShell";
import { Button, ProductCard } from "@/components/site/Brand";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBrand } from "@/services/brand";
import type { BrandProfile } from "@/types/brand";
import { IMAGES, type ImageKey } from "@/data/images";
import { Photo, useScrollReveal } from "@/components/home/Photo";
import { Bridge, FounderNote, HeadBlock, OurJourney, SECTION, TrustLine, TrustedBy, WhatPeopleSay, WhatWeDo, WhoWeAre, WRAP } from "@/components/brand/BrandSections";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  loader: async () => { const [home, brand] = await Promise.all([getHomeData(), getBrand()]); return { home, brand }; },
  head: () => ({
    meta: [
      { title: "Luxury Gifts in Lagos — Boxed by Dweenie" },
      { name: "description", content: "Thoughtful luxury gifts and exquisite packaging for every occasion, delivered across Nigeria." },
      { property: "og:title", content: "Boxed by Dweenie — Moments, Boxed." },
      { property: "og:description", content: "Thoughtful luxury gifts and exquisite packaging for every occasion." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "preload", as: "image", href: IMAGES.hero.src, fetchPriority: "high" }],
  }),
  component: HomePage,
});

function HomePage() {
  const { home: data, brand } = Route.useLoaderData();
  useScrollReveal();
  return <SiteShell overlayHeader><main className="home-polish">
    <Hero brand={brand} /><TrustedBy brand={brand} /><WhoWeAre brand={brand} /><WhatWeDo /><OurJourney brand={brand} /><FounderNote brand={brand} /><WhatPeopleSay brand={brand} /><Bridge />
    <TwoDoors /><Dispenser /><Occasions data={data} /><Bestsellers data={data} /><CorporateBand /><Calendar data={data} /><LookBook /><SecretSanta /><HowItWorks /><Closing /><MobileBuyBar />
  </main></SiteShell>;
}

function Hero({ brand }: { brand: BrandProfile }) {
  const photo = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const on = () => { if (photo.current && window.scrollY < 1200) photo.current.style.transform = `translateY(${window.scrollY * 0.15}px)`; };
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const d = (ms: number) => ({ animationDelay: `${ms}ms` });
  return <section id="home-hero" className="surface-rich relative -mt-20 flex min-h-[92svh] items-center overflow-hidden pb-20 pt-32 lg:min-h-screen">
    <div aria-hidden className="pattern-leaf absolute -right-10 -top-10 h-80 w-80 opacity-[0.08]" />
    <div className="relative mx-auto grid w-full max-w-[1200px] items-center gap-12 px-5 lg:grid-cols-[1.05fr_.95fr]">
      <div>
        <p className="eyebrow hero-fade text-gold" style={d(0)}>Boxed by Dweenie · Luxury gifting and packaging</p>
        <div aria-hidden className="rule-foil animate-rule-draw mt-5 w-32" style={d(200)} />
        <h1 className="mt-7 font-display text-5xl leading-[1.05] text-on-dark md:text-7xl lg:text-8xl">
          <span className="hero-line"><span style={d(400)}>Moments,</span></span>
          <span className="hero-line"><span className="text-foil" style={d(520)}>Boxed.</span></span>
        </h1>
        <p className="hero-fade mt-6 max-w-xl text-lg leading-relaxed text-on-dark-muted" style={d(900)}>We are a Lagos gifting company. We curate, box and deliver luxury gifts for people and for companies, with a guaranteed wow.</p>
        <div className="hero-fade mt-8 flex flex-wrap items-center gap-3" style={d(1100)}>
          <Button asChild size="lg"><Link to="/shop">Shop gifts</Link></Button>
          <Button asChild size="lg" variant="outline" className="text-on-dark"><Link to="/dispenser">Gift in 60 seconds</Link></Button>
          <a href="#who-we-are" className="link-draw ml-1 inline-flex min-h-11 items-center text-sm font-semibold text-on-dark">Get to know us</a>
        </div>
        <TrustLine brand={brand} className="hero-fade mt-6" />
      </div>
      <div className="hero-photo relative" style={d(300)}>
        <div ref={photo} className="will-change-transform"><div className="hero-float relative">
          <Photo name="hero" priority className="aspect-[4/3] w-full rounded-md shadow-soft" sizes="(min-width: 1024px) 560px, 100vw" />
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-md"><div className="hero-ribbon foil absolute left-0 top-1/2 h-1 w-[160%] opacity-70" /></div>
        </div></div>
      </div>
    </div>
    <div aria-hidden className="absolute bottom-6 left-1/2 hidden h-10 w-px -translate-x-1/2 overflow-hidden md:block"><div className="scroll-cue-line h-full w-full bg-gold" /></div>
  </section>;
}

function Door({ img, eyebrow, title, line, to, cta }: { img: ImageKey; eyebrow: string; title: string; line: string; to: "/shop" | "/corporate/quote"; cta: string }) {
  return <Link to={to} className="zoom-host group relative block min-h-[420px] overflow-hidden lg:min-h-[560px]">
    <Photo name={img} overlay className="absolute inset-0" decorative />
    <div className="relative flex h-full min-h-[inherit] flex-col justify-end p-6 text-on-dark lg:p-12">
      <p className="eyebrow text-gold">{eyebrow}</p><h2 className="mt-4 text-2xl text-on-dark md:text-4xl">{title}</h2>
      <p className="mt-3 max-w-sm text-on-dark/85">{line}</p>
      <span className="mt-6 inline-flex min-h-11 w-fit items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground">{cta} <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" /></span>
    </div>
  </Link>;
}

function TwoDoors() {
  return <section id="two-doors" className="grid gap-px bg-nero lg:grid-cols-2">
    <Door img="door-personal" eyebrow="Personal gifting" title="For someone you love" line="Birthdays, anniversaries, thank-yous and just-because." to="/shop" cta="Shop gifts" />
    <Door img="door-corporate" eyebrow="Corporate gifting" title="For your company" line="Staff rewards, client gifts and event souvenirs, quoted in minutes." to="/corporate/quote" cta="Get an instant quote" />
  </section>;
}

function Dispenser() {
  const [who, setWho] = useState("her"), [occasion, setOccasion] = useState("birthday"), [budget, setBudget] = useState("25-50");
  return <section className={cn(SECTION, "surface-rich overflow-hidden")}>
    <div aria-hidden className="rule-foil absolute inset-x-0 top-0" /><div aria-hidden className="rule-foil absolute inset-x-0 bottom-0" />
    <div className={cn(WRAP, "grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]")}>
      <div data-reveal>
        <HeadBlock eyebrow="Gift Dispenser" title="Gift in 60 seconds" dark intro="Three choices. One beautifully considered gift." />
        <div className="mt-9 grid gap-4 sm:grid-cols-3">
          <MiniSelect id="d-who" label="Who is it for?" value={who} set={setWho} options={DISPENSER_RECIPIENTS} />
          <MiniSelect id="d-occ" label="What's the occasion?" value={occasion} set={setOccasion} options={DISPENSER_OCCASIONS} />
          <MiniSelect id="d-bud" label="Your budget" value={budget} set={setBudget} options={DISPENSER_BUDGETS} />
        </div>
        <Button asChild size="lg" className="mt-6 w-full sm:w-auto"><Link to="/dispenser" search={{ who, occasion, budget }}>Dispense my gift</Link></Button>
      </div>
      <div className="relative mx-auto w-full max-w-sm">
        <div aria-hidden className="hero-glow absolute -inset-10" />
        <Photo name="dispenser-box" className="relative aspect-square w-full rounded-md" sizes="(min-width: 1024px) 384px, 80vw" />
      </div>
    </div>
  </section>;
}

function MiniSelect({ id, label, value, set, options }: { id: string; label: string; value: string; set: (v: string) => void; options: { slug: string; name: string }[] }) {
  return <div><label htmlFor={id} className="eyebrow text-on-dark-muted">{label}</label>
    <Select value={value} onValueChange={set}><SelectTrigger id={id} className="mt-2 min-h-12 border-line-dark bg-nero-soft text-on-dark"><SelectValue placeholder={label} /></SelectTrigger><SelectContent>{options.map((o) => <SelectItem key={o.slug} value={o.slug}>{o.name}</SelectItem>)}</SelectContent></Select>
  </div>;
}

function Occasions({ data }: { data: HomeData }) {
  const track = useRef<HTMLUListElement>(null);
  const move = (dir: number) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: "smooth" });
  return <section className={cn(SECTION, "bg-ivory")}><div className={WRAP}>
    <div className="flex items-end justify-between gap-5" data-reveal><HeadBlock eyebrow="Find the right gift" title="Shop by occasion" />
      <div className="hidden gap-2 md:flex"><Button variant="outline" size="icon" className="size-11 rounded-full" aria-label="Previous occasions" onClick={() => move(-1)}><ArrowLeft /></Button><Button variant="outline" size="icon" className="size-11 rounded-full" aria-label="Next occasions" onClick={() => move(1)}><ArrowRight /></Button></div>
    </div>
    <ul ref={track} className="-mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-4 [scrollbar-width:none]">
      {data.occasions.map((o) => { const key = `occ-${o.slug}` as ImageKey; return <li key={o.slug} className="w-[62%] shrink-0 snap-start sm:w-[40%] lg:w-[23%]">
        <Link to="/shop" search={{ occasion: o.slug }} className="zoom-host lift group relative block overflow-hidden rounded-md">
          {key in IMAGES ? <Photo name={key} overlay decorative className="aspect-[4/5] w-full" sizes="(min-width: 1024px) 280px, 62vw" /> : <div className="surface-dark aspect-[4/5]" />}
          <h3 className="absolute inset-x-0 bottom-0 p-5 text-base text-on-dark">{o.name}</h3>
        </Link>
      </li>; })}
    </ul>
  </div></section>;
}

const PROD_IMAGES: ImageKey[] = ["prod-1", "prod-2", "prod-3", "prod-4"];
function Bestsellers({ data }: { data: HomeData }) {
  return <section className={SECTION}><div className={WRAP}>
    <div className="flex items-end justify-between gap-5" data-reveal><HeadBlock eyebrow="Most loved" title="Bestsellers" /><Link to="/shop" className="link-draw hidden min-h-11 shrink-0 items-center text-sm font-semibold sm:inline-flex">View all gifts</Link></div>
    <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-7" data-reveal>
      {data.products.map((p, i) => <ProductCard key={p.id} product={p} variant="home" image={PROD_IMAGES[i % 4]} image2={PROD_IMAGES[(i + 1) % 4]} />)}
    </div>
    <Link to="/shop" className="link-draw mt-8 inline-flex min-h-11 items-center text-sm font-semibold sm:hidden">View all gifts</Link>
  </div></section>;
}

function CorporateBand() {
  const points = [[Award, "Employee rewards"], [Handshake, "Client appreciation"], [BriefcaseBusiness, "Onboarding kits"], [PartyPopper, "Event souvenirs"]] as const;
  return <section className="surface-rich grid lg:grid-cols-[.9fr_1.1fr]">
    <Photo name="corporate-band" className="aspect-[4/3] w-full lg:aspect-auto lg:h-full" sizes="(min-width: 1024px) 45vw, 100vw" />
    <div className="px-5 py-16 lg:px-[max(5vw,3rem)] lg:py-28" data-reveal>
      <HeadBlock eyebrow="Corporate gifting" title="Make your people and your clients feel seen" dark />
      <div className="mt-10 grid grid-cols-2 gap-3">{points.map(([Icon, text]) => <div key={text} className="lift hairline-dark rounded-md p-5"><Icon className="size-5 text-gold" aria-hidden /><h3 className="mt-4 text-xs text-on-dark md:text-sm">{text}</h3></div>)}</div>
      <div className="mt-9 flex flex-wrap gap-3"><Button asChild><Link to="/corporate/quote">Get an instant quote</Link></Button><Button asChild variant="outline" className="text-on-dark"><Link to="/lookbook/$edition" params={{ edition: "the-corporate-edit" }}>View the corporate look book</Link></Button></div>
    </div>
  </section>;
}

const dayLabel = (n: number) => n <= 0 ? "Today" : n === 1 ? "Tomorrow" : `${n} days to go`;
function Calendar({ data }: { data: HomeData }) {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date(new Date().toDateString())), []);
  return <section className={cn(SECTION, "bg-ivory")}><div className={WRAP}>
    <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end" data-reveal><HeadBlock eyebrow="Gift Calendar" title="Never miss a moment" /><Link to="/calendar" className="link-draw inline-flex min-h-11 w-fit items-center text-sm font-semibold">See the Gift Calendar <ArrowRight className="ml-2 size-4" /></Link></div>
    <div className="mt-10 grid gap-4 md:grid-cols-3" data-reveal>{data.moments.map((m, i) => {
      const dt = new Date(`${m.date}T00:00:00`);
      const days = today ? Math.max(0, Math.round((dt.getTime() - today.getTime()) / 86400000)) : null;
      return <article key={m.date} className={cn("lift rounded-md bg-paper p-6", i === 0 ? "border border-gold" : "hairline")}>
        <div className="flex items-baseline gap-3"><span className="font-heading text-5xl leading-none">{dt.getDate()}</span><span className="eyebrow text-muted-foreground">{dt.toLocaleDateString("en-GB", { month: "long" })}</span></div>
        <h3 className="mt-5 text-lg">{m.slug ? <Link to="/calendar/$occasion" params={{ occasion: m.slug }} className="hover:underline">{m.name}</Link> : m.name}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{m.note}</p>
        <p className="mt-5 text-sm font-semibold">{days === null ? "\u00a0" : dayLabel(days)}</p>
      </article>;
    })}</div>
  </div></section>;
}

function LookBook() {
  return <section className={SECTION}><div className={cn(WRAP, "grid items-center gap-12 lg:grid-cols-[1.2fr_.8fr]")}>
    <Link to="/lookbook" aria-label="Open the Look Book" className="covers relative mx-auto grid w-full max-w-lg grid-cols-2 gap-4 py-6">
      <Photo name="lookbook-1" className="aspect-[3/4] -rotate-2 rounded-sm shadow-soft" sizes="(min-width: 1024px) 260px, 45vw" />
      <Photo name="lookbook-2" className="mt-12 aspect-[3/4] rotate-2 rounded-sm shadow-soft" sizes="(min-width: 1024px) 260px, 45vw" />
    </Link>
    <div data-reveal><HeadBlock eyebrow="Seasonal edit" title="The Look Book" intro="This season's boxes, page by page." /><Button asChild className="mt-7"><Link to="/lookbook">Open the Look Book</Link></Button></div>
  </div></section>;
}

function SecretSanta() {
  return <section className={cn(SECTION, "surface-rich")}><div className="mx-auto max-w-3xl px-5 text-center" data-reveal>
    <Gift className="mx-auto size-10 text-gold" aria-hidden />
    <h2 className="mt-6 text-3xl text-on-dark md:text-5xl">Secret Santa, sorted.</h2>
    <p className="mx-auto mt-5 max-w-2xl text-on-dark-muted">Set up your office or family gift exchange in five minutes. We draw the names, wrap the gifts and deliver them.</p>
    <div className="mt-8 flex flex-wrap justify-center gap-3"><Button asChild><Link to="/secret-santa/new">Start a Secret Santa</Link></Button><Button asChild variant="outline" className="text-on-dark"><Link to="/secret-santa" hash="join">Join with a code</Link></Button></div>
  </div></section>;
}

function HowItWorks() {
  const steps = [[Search, "Choose", "Find the right gift for the person and moment."], [Sparkles, "Personalise", "Add their name, a note or your company mark."], [PackageOpen, "We box it", "Every detail is arranged and checked by hand."], [Truck, "Delivered", "Sent beautifully, on the date that matters."]] as const;
  return <section className={SECTION}><div className={WRAP}>
    <div data-reveal><HeadBlock eyebrow="Simple by design" title="How it works" center /></div>
    <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
      <span aria-hidden className="draw-line gold-rule absolute left-[12.5%] right-[12.5%] top-7 hidden md:block" />
      {steps.map(([Icon, t, l], i) => <li key={t} className="relative text-center">
        <span className="relative mx-auto flex size-14 items-center justify-center rounded-full border border-gold bg-paper"><Icon className="size-5" aria-hidden /></span>
        <p className="eyebrow mt-5 text-muted-foreground">Step {i + 1}</p><h3 className="mt-2 text-lg">{t}</h3><p className="mx-auto mt-2 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">{l}</p>
      </li>)}
    </ol>
  </div></section>;
}

function Closing() {
  return <section className="relative overflow-hidden bg-ivory py-20 text-center lg:py-28"><div aria-hidden className="pattern-bow absolute inset-0 opacity-[0.035]" /><div className="relative mx-auto max-w-3xl px-5" data-reveal>
    <Sparkles className="mx-auto text-gold" aria-hidden /><h2 className="mt-6 text-3xl md:text-5xl">Let's create a wow.</h2>
    <div className="mt-8 flex flex-wrap justify-center gap-3"><Button asChild><Link to="/shop">Shop gifts</Link></Button><Button asChild variant="outline"><a href="https://wa.me/2349092125960">Chat on WhatsApp</a></Button></div>
  </div></section>;
}

/** Mobile-only buy bar shown between the hero and the Two doors section. */
function MobileBuyBar() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => { const hero = document.getElementById("home-hero"), doors = document.getElementById("two-doors"); if (!hero || !doors) return; setShow(hero.getBoundingClientRect().bottom < 0 && doors.getBoundingClientRect().top > window.innerHeight * 0.85); };
    on(); window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); };
  }, []);
  if (!show) return null;
  return <div data-bottom-bar className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-3 border-t border-line-dark bg-nero px-5 py-3 pr-20 lg:hidden"><Button asChild size="sm" className="min-h-11"><Link to="/shop">Shop gifts</Link></Button><Button asChild size="sm" variant="outline" className="min-h-11 text-on-dark"><Link to="/corporate/quote">Get a quote</Link></Button></div>;
}
