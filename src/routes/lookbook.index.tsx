import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { EditionCover } from "@/components/lookbook/LookbookPages";
import { getEditions } from "@/services/lookbook";

export const Route = createFileRoute("/lookbook/")({
  head: () => ({
    meta: [
      { title: "The Look Book — Boxed by Dweenie" },
      { name: "description", content: "Browse Boxed by Dweenie's editorial gift catalogues, page by page. Every box is shoppable." },
      { property: "og:title", content: "The Look Book — Boxed by Dweenie" },
      { property: "og:description", content: "This season's boxes, page by page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => getEditions(),
  component: Library,
});

function Library() {
  const editions = Route.useLoaderData();
  return <SiteShell><main>
    <section className="surface-dark relative overflow-hidden py-20 md:py-28">
      <div className="pattern-leaf pointer-events-none absolute inset-0 opacity-[0.06]" />
      <div className="relative mx-auto max-w-7xl px-5 text-center">
        <p className="eyebrow text-gold">Digital catalogue</p>
        <div className="foil mx-auto mt-5 h-px w-16" />
        <h1 className="mt-6 font-display text-4xl text-on-dark md:text-6xl">The Look Book</h1>
        <p className="mt-5 text-on-dark-muted">This season's boxes, page by page.</p>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-5 py-16 md:py-20">
      <ul className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-5">
        {editions.map((e) => <li key={e.slug}>
          <Link to="/lookbook/$edition" params={{ edition: e.slug }} className="group block rounded-md focus-visible:outline-2">
            <div className="relative transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-soft">
              <EditionCover title={e.title} season={e.season} tone={e.tone} />
              <span className="absolute inset-0 flex items-center justify-center rounded-md bg-nero/60 font-heading text-sm uppercase tracking-[0.3em] text-on-dark opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">Open</span>
            </div>
            <h2 className="mt-4 text-sm">{e.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{e.season} · {e.pageCount} pages</p>
          </Link>
        </li>)}
      </ul>
    </section>
  </main></SiteShell>;
}
