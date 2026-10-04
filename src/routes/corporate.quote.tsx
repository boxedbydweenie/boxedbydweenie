import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { SiteShell } from "@/components/site/SiteShell";

const search = z.object({
  purpose: z.string().optional(),
  package: z.string().optional(),
});

export const Route = createFileRoute("/corporate/quote")({
  validateSearch: (s) => search.parse(s),
  head: () => ({
    meta: [
      { title: "Instant Corporate Quote — Boxed by Dweenie" },
      { name: "description", content: "Build a quote for staff, client and event gifts in minutes." },
      { property: "og:title", content: "Instant Corporate Quote — Boxed by Dweenie" },
      { property: "og:description", content: "Build a quote for staff, client and event gifts in minutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuotePage,
});

function QuotePage() {
  const { purpose, package: pkg } = Route.useSearch();
  return (
    <SiteShell>
      <main className="mx-auto max-w-2xl px-5 py-20 text-center">
        <p className="eyebrow text-muted-foreground">Instant quote</p>
        <h1 className="mt-4 text-3xl">The quote builder is on its way</h1>
        <p className="mt-4 text-muted-foreground">
          {purpose || pkg
            ? `We have noted your selection${purpose ? `: ${purpose.replace(/-/g, " ")}` : ""}${pkg ? `, ${pkg} package` : ""}.`
            : "This page will hold the instant quote builder."}
        </p>
        <Link to="/corporate" className="mt-8 inline-flex min-h-11 items-center rounded-md bg-gold px-6 font-semibold text-nero">
          Back to corporate gifting
        </Link>
      </main>
    </SiteShell>
  );
}
