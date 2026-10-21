import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { BowLoader, Button, Eyebrow, GoldRule } from "@/components/site/Brand";
import { ORDER_STEPS } from "@/config/shop";
import { formatDayMonth, formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BowTie } from "@/components/shop/BowTie";
import { getOrder, lookupOrder, verifyPayment, type ServerOrder } from "@/services/orders";
import { clearCart } from "@/services/cart";
import { FormField, LoadingButton } from "@/components/site/Brand";
import type { Order } from "@/types/shop";

export const Route = createFileRoute("/order/$id")({
  validateSearch: (s: Record<string, unknown>): { verify?: 1 } => (s["verify"] ? { verify: 1 } : {}),
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

function OrderPage() {
  const { id } = Route.useParams();
  const { verify } = Route.useSearch();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [pay, setPay] = useState<ServerOrder["status"] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    (async () => {
      if (verify) {
        try {
          const o = await verifyPayment(id);
          if (!live) return;
          setPay(o.payment_status); setOrder(o);
          if (o.payment_status === "paid") await clearCart();
        } catch (e) { if (live) { setError(e instanceof Error ? e.message : "We could not check your payment."); setOrder(await getOrder(id)); } }
      } else setOrder(await getOrder(id));
    })();
    return () => { live = false; };
  }, [id, verify]);
  const track = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!email) return;
    setBusy(true); setError("");
    try { const o = await lookupOrder(id, email); setPay(o.payment_status); setOrder(o); }
    catch (err) { setError(err instanceof Error ? err.message : "We could not find that order."); }
    finally { setBusy(false); }
  };
  if (order === undefined) return <SiteShell><main className="flex min-h-[60vh] items-center justify-center bg-paper"><BowLoader label={verify ? "Confirming your payment" : "Loading your order"} /></main></SiteShell>;
  if (!order) return <SiteShell><main className="bg-paper px-5 py-24"><div className="mx-auto max-w-md text-center"><h1 className="text-3xl">Track order {id}</h1><p className="mt-4 text-muted-foreground">Enter the email you used at checkout to see this order.</p>
    <form onSubmit={track} className="mt-8 grid gap-4 text-left" noValidate><FormField label="Email" name="email" type="email" required autoComplete="email" />{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<LoadingButton type="submit" loading={busy}>Find my order</LoadingButton></form>
    <Button asChild variant="ghost" className="mt-6"><Link to="/shop">Continue shopping</Link></Button></div></main></SiteShell>;
  const unpaid = pay === "pending_payment" || pay === "payment_failed";
  if (unpaid) return <SiteShell><main className="bg-paper px-5 py-24 text-center"><div className="mx-auto max-w-lg"><BowTie /><h1 className="mt-6 text-3xl">Your payment did not go through</h1><p className="mt-4 text-muted-foreground">Order {order.id} is saved, but Paystack has not confirmed a payment. Nothing has been charged. Your bag is still here, so you can try again.</p>{error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}<div className="mt-8 flex flex-wrap justify-center gap-3"><Button asChild><Link to="/checkout">Try again</Link></Button><Button asChild variant="outline"><a href={`https://wa.me/2348134907391?text=${encodeURIComponent(`Hello, I need help paying for order ${order.id}.`)}`} target="_blank" rel="noreferrer">Ask us on WhatsApp</a></Button></div></div></main></SiteShell>;
  const wa = `https://wa.me/2348134907391?text=${encodeURIComponent(`Hello, I would like to track order ${order.id}.`)}`;
  return <SiteShell><main className="bg-paper">
    <section className="surface-dark py-16 text-center"><div className="mx-auto max-w-2xl px-5">
      <BowTie />
      <Eyebrow dark className="mt-6">Order confirmed</Eyebrow>
      <h1 className="mt-4 text-3xl text-on-dark md:text-5xl">Your moment is being boxed</h1>
      <p className="mt-4 text-on-dark-muted">Order number <span className="font-semibold text-on-dark">{order.id}</span>.{pay === "paid" ? " Payment received." : ""}{order.customer.email ? ` We will keep you updated at ${order.customer.email}.` : ""}</p>
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
        <div><h2 className="text-lg">Delivering to</h2><p className="mt-4 text-sm">{order.recipient.name}<br />{[order.recipient.address, order.recipient.area, order.recipient.state].filter(Boolean).join(", ")}</p><p className="mt-2 text-sm text-muted-foreground">On {formatDayMonth(order.recipient.deliveryDate)}{order.recipient.surprise ? ". Kept as a surprise." : "."}</p></div>
      </div>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button asChild><a href={wa} target="_blank" rel="noreferrer">Track on WhatsApp</a></Button>
        <Button asChild variant="outline"><Link to="/calendar/my-dates" search={{ add: true, name: order.recipient.name, day: Number(order.recipient.deliveryDate.slice(8, 10)), month: Number(order.recipient.deliveryDate.slice(5, 7)), label: "Gift delivered" }}>Save this date in my Gift Calendar</Link></Button>
        <Button asChild variant="ghost"><Link to="/shop">Continue shopping</Link></Button>
      </div>
    </div>
  </main></SiteShell>;
}
