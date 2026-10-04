import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { SearchPanel } from "@/components/shop/SearchOverlay";

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [
    { title: "Search — Boxed by Dweenie" },
    { name: "description", content: "Search luxury gifts, occasions and pages at Boxed by Dweenie." },
    { property: "og:title", content: "Search — Boxed by Dweenie" },
    { property: "og:description", content: "Find the right gift for every moment." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <SiteShell><main className="bg-paper"><div className="mx-auto max-w-3xl px-5 py-14"><h1 className="mb-8 text-3xl">Search</h1><SearchPanel /></div></main></SiteShell>,
});
