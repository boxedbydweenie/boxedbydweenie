import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { SectionHeading } from "@/components/site/Brand";
import { getBrand } from "@/services/brand";
import { FounderNote, OurJourney, TrustedBy, WhatPeopleSay, WhatWeDo } from "@/components/brand/BrandSections";

export const Route = createFileRoute("/about")({
  loader: () => getBrand(),
  head: () => ({ meta: [
    { title: "About Boxed by Dweenie — Luxury Gifting Company, Lagos" },
    { name: "description", content: "Meet Boxed by Dweenie: a Lagos luxury gifting and packaging company. Our story, vision, services, journey and the people who trust us." },
    { property: "og:title", content: "About Boxed by Dweenie" },
    { property: "og:description", content: "Our story, vision, services and journey since 2021." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AboutPage,
});

function AboutPage() {
  const brand = Route.useLoaderData();
  return <SiteShell><main>
    <section className="grid lg:grid-cols-2">
      <div className="surface-dark flex min-h-[45vh] items-center px-5 py-16 lg:px-[max(6vw,3rem)]"><div><p className="eyebrow text-gold">Our story</p><h1 className="mt-5 text-4xl text-on-dark md:text-6xl">For the love of gifting</h1></div></div>
      <div className="flex items-center bg-ivory px-5 py-16 lg:px-[max(6vw,3rem)]"><div className="max-w-xl space-y-4 text-lg leading-relaxed"><p>Boxed by Dweenie, also known as BBD, is a luxury gifting and packaging company. We create gifts for every occasion and exquisite boxing and packaging for products and presents.</p><p className="text-base text-muted-foreground">BBD is a product of The Plug Shop Limited, incorporated in Lagos in June 2021.</p></div></div>
    </section>
    <TrustedBy brand={brand} />
    <section className="mx-auto grid max-w-7xl gap-px bg-border px-5 py-16 md:grid-cols-2"><article className="bg-paper p-8"><SectionHeading eyebrow="Vision" title="Your number one gift plug" /><p className="mt-5 text-muted-foreground">To be your number one luxury gift plug all season round.</p></article><article className="surface-dark p-8"><SectionHeading eyebrow="Mission" title="Class, love and care" dark /><p className="mt-5 text-on-dark-muted">We exist for the love of gifting. We combine class and love to give our customers unique, thoughtful gifts and packaging, with a guaranteed wow for both the customer and the recipient.</p></article></section>
    <WhatWeDo />
    <OurJourney brand={brand} />
    <FounderNote brand={brand} />
    <WhatPeopleSay brand={brand} />
  </main></SiteShell>;
}
