import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { FlipBook } from "@/components/brand/FlipBook";
import { WRAP } from "@/components/brand/ProfileSections";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [
    { title: "Company Profile — Boxed by Dweenie" },
    { name: "description", content: "Read the Boxed by Dweenie company profile online. Our story, services, boxes, clients and how we work with you." },
    { property: "og:title", content: "Boxed by Dweenie Company Profile" },
    { property: "og:description", content: "Happiness In a Box. Turn the pages online." },
    { property: "og:image", content: "/profile/p01.webp" },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <SiteShell><main data-feature="corporate" className="brand-pattern-green text-on-dark">
    <div className={`${WRAP} py-14 md:py-20`}>
      <div className="mb-10 text-center">
        <p className="eyebrow text-gold">Company profile</p><div aria-hidden className="mx-auto mt-4 h-px w-14 bg-gold" />
        <h1 className="mt-6 text-4xl md:text-6xl">Happiness <span className="text-gold">In a Box</span></h1>
        <p className="mx-auto mt-4 max-w-md text-on-dark-muted">Turn the pages. Tap the sides, swipe, or use the arrow keys.</p>
      </div>
      <FlipBook />
      <div className="mt-14 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link to="/corporate/quote" className="inline-flex min-h-14 items-center gap-3 rounded-full bg-gold px-9 text-[15px] font-semibold text-nero transition hover:brightness-105">Get an instant quote <ArrowRight className="size-4" /></Link>
        <Link to="/corporate" hash="consultation" className="inline-flex min-h-14 items-center rounded-full border border-on-dark/70 px-9 text-[15px] font-semibold transition hover:border-gold hover:bg-gold hover:text-nero">Book a consultation</Link>
      </div>
    </div>
  </main></SiteShell>,
});
