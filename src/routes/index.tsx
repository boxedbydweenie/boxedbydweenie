import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { ConceptHome } from "@/components/home/ConceptHome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Luxury Gifts in Lagos | Boxed by Dweenie" },
      { name: "description", content: "Curated luxury gift boxes and hampers for loved ones, teams and clients, wrapped and delivered across Nigeria." },
      { property: "og:title", content: "Boxed by Dweenie | Moments, boxed." },
      { property: "og:description", content: "Curated luxury gift boxes and hampers for every occasion." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return <SiteShell><main><ConceptHome /></main></SiteShell>;
}
