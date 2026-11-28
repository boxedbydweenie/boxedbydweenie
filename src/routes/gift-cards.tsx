import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { Eyebrow } from "@/components/site/Brand";
import { GiftCardBuilder } from "@/components/shop/GiftCardBuilder";
export const Route = createFileRoute("/gift-cards")({
  head: () => ({
    meta: [
      { title: "Gift Cards — Boxed by Dweenie" },
      {
        name: "description",
        content:
          "Send a Boxed by Dweenie gift card from ₦10,000. Choose a design, add a message and send now or on the day.",
      },
      { property: "og:title", content: "Gift Cards — Boxed by Dweenie" },
      {
        property: "og:description",
        content: "Let them choose their wow. Gift cards from ₦10,000.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GiftCardsPage,
});

function GiftCardsPage() {
  return (
    <SiteShell>
      <main className="bg-paper">
        <div className="border-b border-border bg-ivory">
          <div className="mx-auto max-w-7xl px-5 py-12">
            <Eyebrow>Gift cards</Eyebrow>
            <h1 className="mt-3 text-3xl md:text-5xl">Let them choose their wow</h1>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Delivered by email, valid for 12 months across the shop.
            </p>
          </div>
        </div>
        <GiftCardBuilder />
      </main>
    </SiteShell>
  );
}
