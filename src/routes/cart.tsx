import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { Button, EmptyState } from "@/components/site/Brand";
import { CartLine, PromoField, SummaryRows } from "@/components/shop/CartParts";
import { useCart } from "@/hooks/use-shop";
import { cartCount } from "@/services/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [
    { title: "Your Bag — Boxed by Dweenie" },
    { name: "description", content: "Review your gifts, packaging and notes before checkout." },
    { property: "og:title", content: "Your Bag — Boxed by Dweenie" },
    { property: "og:description", content: "Review your gifts before checkout." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: CartPage,
});

function CartPage() {
  const items = useCart();
  const [promo, setPromo] = useState(0);
  return <SiteShell><main className="bg-paper">
    <div className="border-b border-border bg-ivory"><div className="mx-auto max-w-7xl px-5 py-10"><h1 className="text-3xl md:text-4xl">Your bag</h1><p className="mt-2 text-sm text-muted-foreground">{cartCount(items)} {cartCount(items) === 1 ? "item" : "items"}</p></div></div>
    <div className="mx-auto max-w-7xl px-5 py-10">
      {items.length === 0
        ? <EmptyState line="Your bag is empty. Let us find something worth a wow." action={<div className="flex flex-wrap justify-center gap-3"><Button asChild><Link to="/shop">Shop gifts</Link></Button><Button asChild variant="outline"><Link to="/dispenser">Try the Gift Dispenser</Link></Button></div>} />
        : <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <ul className="border-t border-border">{items.map((i) => <CartLine key={i.key} item={i} />)}</ul>
          <aside className="h-fit rounded-md border border-border bg-ivory p-6 lg:sticky lg:top-24">
            <h2 className="text-lg">Order summary</h2>
            <div className="mt-5"><SummaryRows items={items} discountPercent={promo} /></div>
            <PromoField onApply={setPromo} />
            <div className="mt-6 grid gap-2"><Button asChild size="lg"><Link to="/checkout">Checkout</Link></Button><Button asChild variant="ghost"><Link to="/shop">Keep shopping</Link></Button></div>
          </aside>
        </div>}
    </div>
  </main></SiteShell>;
}
