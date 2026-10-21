import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Photo, useScrollReveal } from "@/components/home/Photo";
import { ClientWall, Label, Reviews, StatBadges, WRAP } from "@/components/brand/ProfileSections";
import { getBrand } from "@/services/brand";

export const Route = createFileRoute("/about")({
  loader: () => getBrand(),
  head: () => ({ meta: [
    { title: "About Boxed by Dweenie — Happiness In a Box" },
    { name: "description", content: "Boxed by Dweenie creates luxurious gifts for every occasion, season and age group. Personal and corporate, with nationwide delivery. Operating in Nigeria and the UK." },
    { property: "og:title", content: "About Boxed by Dweenie" },
    { property: "og:description", content: "Happiness In a Box. Over 5,000 boxes delivered to over 450 clients." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AboutPage,
});

const SERVICES = [
  ["Customised Corporate Gifts", "Gifts designed around your brand, your people and your budget."],
  ["Gift Hampers", "Generous, beautifully composed hampers for every season."],
  ["Gift Cards", "The easy way to let someone choose what they love."],
  ["Premium Brand Gifts", "Considered pieces from brands people are glad to receive."],
  ["Gift Wrapping", "Wrapped, ribboned and finished by hand."],
  ["Prints and Customisation", "Your logo, your message, printed with care."],
  ["Nationwide Delivery", "Delivered to every address you need."],
] as const;

const TONES = ["tone-forest", "tone-navy", "tone-plum", "tone-oxblood", "tone-beige", "tone-coral", "tone-sage"] as const;

function AboutPage() {
  const brand = Route.useLoaderData();
  useScrollReveal();
  return <SiteShell><main data-feature="about">
    {/* Opening: forest felt with the bow pattern */}
    <section className="brand-pattern-green relative overflow-hidden text-on-dark">
      <div className={`${WRAP} grid gap-12 py-20 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:py-32`}>
        <div>
          <p className="eyebrow text-gold">Who we are</p>
          <div aria-hidden className="mt-4 h-px w-14 bg-gold" />
          <h1 className="mt-8 text-5xl leading-[1.02] md:text-7xl"><span className="rise" style={{ "--d": 0 } as React.CSSProperties}><span>Happiness</span></span><span className="rise text-gold" style={{ "--d": 1 } as React.CSSProperties}><span>In a Box.</span></span></h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-on-dark-muted">Convey your heartfelt sentiments with gifts of unparalleled elegance.</p>
          <div className="mt-8 flex flex-wrap gap-2.5"><span className="pill pill-gold">Personal and corporate</span><span className="pill pill-coral">Nationwide delivery</span><span className="pill pill-sage">Nigeria and the UK</span></div>
        </div>
        <div className="relative mx-auto w-full max-w-md">
          <div aria-hidden className="absolute -inset-3 translate-x-4 translate-y-4 border border-gold/60" />
          <Photo name="studio" className="relative aspect-[4/5] w-full" sizes="(min-width: 1024px) 28rem, 90vw" />
        </div>
      </div>
    </section>

    {/* The company */}
    <section className="relative overflow-hidden bg-ivory py-20 lg:py-28">
      <div aria-hidden className="bow-watermark -right-24 top-6 size-[34rem]" />
      <div className={`${WRAP} relative grid gap-12 lg:grid-cols-[.8fr_1.2fr]`}>
        <Label>About us</Label>
        <div className="space-y-6 text-xl leading-relaxed md:text-2xl" data-reveal>
          <p className="font-heading text-3xl leading-snug md:text-4xl">Boxed by Dweenie creates unique, luxurious gifts for all occasions, seasons and age groups.</p>
          <p className="text-base text-nero/75 md:text-lg">We believe gifting strengthens relationships. We serve both personal and corporate customers, with nationwide delivery. BBD is a product of The Plug Shop Limited, incorporated in June 2021, with operations in Nigeria and the UK.</p>
        </div>
      </div>
    </section>

    {/* Vision and mission */}
    <section className="grid lg:grid-cols-2">
      <div className="brand-pattern-navy px-5 py-20 text-on-dark lg:px-[max(6vw,3rem)] lg:py-28"><div className="max-w-md" data-reveal>
        <p className="eyebrow text-gold">Our vision</p><div aria-hidden className="mt-4 h-px w-14 bg-gold" />
        <p className="mt-8 font-heading text-3xl leading-snug md:text-4xl">To be the number one luxury gift partner all season round.</p>
      </div></div>
      <div className="brand-pattern-plum px-5 py-20 text-on-dark lg:px-[max(6vw,3rem)] lg:py-28"><div className="max-w-md" data-reveal>
        <p className="eyebrow text-gold">Our mission</p><div aria-hidden className="mt-4 h-px w-14 bg-gold" />
        <p className="mt-8 font-heading text-2xl leading-snug md:text-3xl">We exist for the love of gifting. We combine class and love to give our customers unique and thoughtful gift and packaging options, with a guaranteed “wow” experience for both the customer and the recipient.</p>
      </div></div>
    </section>

    {/* Track record */}
    <section className="brand-pattern-black py-20 text-on-dark lg:py-28">
      <div className={WRAP}>
        <Label dark center>Our track record</Label>
        <h2 className="mt-8 text-center text-3xl text-gold md:text-5xl">Over 5,000 boxes delivered to over 450 clients</h2>
        <div className="mt-16"><StatBadges brand={brand} /></div>
      </div>
    </section>

    {/* Services */}
    <section className="bg-paper py-20 lg:py-28">
      <div className={WRAP}>
        <Label>What we do</Label>
        <h2 className="mt-8 max-w-2xl text-3xl md:text-5xl">Seven ways we make a gift unforgettable</h2>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-reveal>
          {SERVICES.map(([t, d], i) => <li key={t} className={`tone-card ${TONES[i]}`}><span className="orb">{String(i + 1).padStart(2, "0")}</span><h3>{t}</h3><p>{d}</p></li>)}
          <li className="tone-card tone-nero justify-center"><h3 className="!mt-0">We are happy to work within your budget and timeframe.</h3><Link to="/corporate/quote" className="go mt-6">Get a quote <ArrowRight className="size-3.5" /></Link></li>
        </ul>
      </div>
    </section>

    {/* Clients */}
    <section className="bg-ivory py-20 lg:py-28">
      <div className={WRAP}>
        <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
          <div><Label>Trusted by</Label><h2 className="mt-8 text-3xl md:text-5xl">Happy clients</h2></div>
          <p className="max-w-lg text-lg leading-relaxed text-nero/75">With over 450 clients and countless 5-star reviews from satisfied customers who continue to return and recommend us, you can trust us to deliver an unbeatable experience.</p>
        </div>
        <div className="mt-12"><ClientWall brand={brand} /></div>
      </div>
    </section>

    {/* Reviews */}
    <section className="brand-pattern-black py-20 text-on-dark lg:py-28">
      <div className={WRAP}>
        <Label dark>In their words</Label>
        <h2 className="mt-8 mb-12 text-3xl md:text-5xl">What our clients say</h2>
        <Reviews brand={brand} />
      </div>
    </section>

    {/* Close */}
    <section className="bg-forest py-20 text-center text-on-dark lg:py-28">
      <div className={WRAP}>
        <img src="/brand/bow-gold.svg" alt="" className="mx-auto h-10 w-auto" />
        <h2 className="mt-8 text-4xl text-gold md:text-6xl">Let us make it memorable</h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-on-dark-muted">Get in touch for thoughtfully curated gifts, personalisation, elegant packaging and seamless delivery.</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/shop" className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-semibold text-nero transition hover:brightness-105">Shop gifts</Link>
          <Link to="/corporate" className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold px-8 text-sm font-semibold text-on-dark transition hover:bg-gold hover:text-nero">Corporate gifting</Link>
        </div>
      </div>
    </section>
  </main></SiteShell>;
}
