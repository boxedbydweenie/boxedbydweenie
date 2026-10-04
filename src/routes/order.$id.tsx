import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { BowLoader, Button, Eyebrow, GoldRule } from "@/components/site/Brand";
import { ORDER_STEPS } from "@/config/shop";
import { formatDayMonth, formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getOrder } from "@/services/orders";
import type { Order } from "@/types/shop";

export const Route = createFileRoute("/order/$id")({
  head: ({ params }) => ({ meta: [
    { title: `Order ${params.id} — Boxed by Dweenie` },
    { name: "description", content: "Your order is confirmed. Track it from boxing to delivery." },
    { property: "og:title", content: "Order confirmed — Boxed by Dweenie" },
    { property: "og:description", content: "Your moment is being boxed." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: OrderPage,
});

export function BowTie() {
  return <svg viewBox="0 0 120 80" className="bow-tie mx-auto h-24 w-36 text-gold" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M60 40 C40 15, 12 18, 14 36 C16 52, 42 50, 60 40Z" />
    <path d="M60 40 C80 15, 108 18, 106 36 C104 52, 78 50, 60 40Z" />
    <path d="M56 44 L40 74 M64 44 L80 74" />
    <circle cx="60" cy="40" r="6" />
  </svg>;
}

function OrderPage() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  useEffect(() => { getOrder(id).then(setOrder); }, [id]);
  if (order === undefined) return <SiteShell><main className="flex min-h-[60vh] items-center justify-center bg-paper"><BowLoader label="Loading your order" /></main></SiteShell>;
  if (!order) return <SiteShell><main className="bg-paper px-5 py-24 text-center"><h1 className="text-3xl">We could not find that order</h1><p className="mt-4 text-muted-foreground">Check the order number, or message us on WhatsApp.</p><Button asChild className="mt-8"><Link to="/shop">Continue shopping</Link></Button></main></SiteShell>;
  const wa = `https://wa.me/2349092125960?text=${encodeURIComponent(`Hello, I would like to track order ${order.id}.`)}`;
  return <SiteShell><main className="bg-paper">
    <section className="surface-dark py-16 text-center"><div className="mx-auto max-w-2xl px-5">
      <BowTie />
      <Eyebrow dark className="mt-6">Order confirmed</Eyebrow>
      <h1 className="mt-4 text-3xl text-on-dark md:text-5xl">Your moment is being boxed</h1>
      <p className="mt-4 text-on-dark-muted">Order number <span className="font-semibold text-on-dark">{order.id}</span>. A confirmation is on its way to {order.customer.email}.</p>
    </div></section>
    <div className="mx-auto max-w-4xl px-5 py-12">
      <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">{ORDER_STEPS.map((s, i) => <li key={s} className="text-center" aria-current={i === order.status ? "step" : undefined}>
        <div className="relative flex items-center justify-center">{i > 0 && <span className={cn("absolute right-1/2 top-1/2 h-px w-full", i <= order.status ? "bg-nero" : "bg-border")} />}<span className={cn("relative z-10 flex size-10 items-center justify-center rounded-full border text-sm font-semibold", i <= order.status ? "border-nero bg-gold text-nero" : "border-border bg-paper text-muted-foreground")}>{i < order.status ? <Check className="size-4" /> : i + 1}</span></div>
        <p className={cn("mt-3 text-xs sm:text-sm", i <= order.status ? "font-semibold" : "text-muted-foreground")}>{s}</p>
      </li>)}</ol>
      <GoldRule className="mx-auto my-10" />
      <div className="grid gap-8 md:grid-cols-2">
        <div><h2 className="text-lg">Summary</h2><ul className="mt-4 space-y-2 text-sm">{order.items.map((i) => <li key={i.key} className="flex justify-between gap-4"><span>{i.quantity} × {i.name}</span><span>{formatNaira(i.price * i.quantity)}</span></li>)}</ul>
          <dl className="mt-4 space-y-1 border-t border-border pt-4 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{formatNaira(order.subtotal)}</dd></div>{order.discount > 0 && <div className="flex justify-between"><dt>Discount</dt><dd>−{formatNaira(order.discount)}</dd></div>}<div className="flex justify-between"><dt>Delivery</dt><dd>{formatNaira(order.deliveryFee)}</dd></div><div className="flex justify-between font-semibold"><dt>Total</dt><dd>{formatNaira(order.total)}</dd></div></dl></div>
        <div><h2 className="text-lg">Delivering to</h2><p className="mt-4 text-sm">{order.recipient.name}<br />{order.recipient.address}, {order.recipient.area}, {order.recipient.state}</p><p className="mt-2 text-sm text-muted-foreground">On {formatDayMonth(order.recipient.deliveryDate)}{order.recipient.surprise ? ". Kept as a surprise." : "."}</p></div>
      </div>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button asChild><a href={wa} target="_blank" rel="noreferrer">Track on WhatsApp</a></Button>
        <Button asChild variant="outline"><Link to="/gift-calendar">Save this date in my Gift Calendar</Link></Button>
        <Button asChild variant="ghost"><Link to="/shop">Continue shopping</Link></Button>
      </div>
    </div>
  </main></SiteShell>;
}
