import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/site/Brand";
import { OccasionDetail } from "@/components/calendar/OccasionDetail";
import { getOccasion } from "@/services/calendar";

export const Route = createFileRoute("/calendar/$occasion")({
  loader: async ({ params }) => { const inst = await getOccasion(params.occasion); if (!inst) throw notFound(); return inst; },
  head: ({ loaderData }) => loaderData ? { meta: [
    { title: `${loaderData.occasion.name} gifts — Gift Calendar — Boxed by Dweenie` },
    { name: "description", content: `${loaderData.occasion.line} Order-by date, gifting notes and curated boxes for ${loaderData.occasion.name}.` },
    { property: "og:title", content: `${loaderData.occasion.name} — Boxed by Dweenie Gift Calendar` },
    { property: "og:description", content: loaderData.occasion.line },
    { property: "og:type", content: "article" },
    { name: "twitter:card", content: "summary_large_image" },
  ] } : { meta: [{ title: "Occasion not found — Boxed by Dweenie" }, { name: "robots", content: "noindex" }] },
  notFoundComponent: () => <SiteShell><main className="mx-auto max-w-xl px-5 py-24 text-center"><h1 className="text-2xl">Occasion not found</h1><Button asChild className="mt-6"><Link to="/calendar">Back to the Gift Calendar</Link></Button></main></SiteShell>,
  component: OccasionPage,
});

function OccasionPage() {
  const inst = Route.useLoaderData();
  return <SiteShell><main className="bg-paper"><div className="mx-auto max-w-5xl px-5 py-10 md:py-16">
    <Link to="/calendar" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><ArrowLeft className="size-4" /> Gift Calendar</Link>
    <div className="mt-6"><OccasionDetail inst={inst} /></div>
  </div></main></SiteShell>;
}
