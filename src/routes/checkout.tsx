import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, CreditCard, Landmark, Lock, Smartphone } from "lucide-react";
import { useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { Button, EmptyState, FormField, LoadingButton } from "@/components/site/Brand";
import { CartLine, PromoField, SummaryRows } from "@/components/shop/CartParts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { STATES, deliveryFeeFor } from "@/config/delivery";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { cartSubtotal, clearCart } from "@/services/cart";
import { createOrder } from "@/services/orders";
import { useCart, useUser } from "@/hooks/use-shop";
import type { CartItem, Order } from "@/types/shop";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [
    { title: "Checkout — Boxed by Dweenie" },
    { name: "description", content: "Tell us where your gift is going and complete your order." },
    { property: "og:title", content: "Checkout — Boxed by Dweenie" },
    { property: "og:description", content: "Complete your Boxed by Dweenie order." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: CheckoutPage,
});

const PAYMENTS = [
  { slug: "card", name: "Card", icon: CreditCard },
  { slug: "transfer", name: "Bank transfer", icon: Landmark },
  { slug: "ussd", name: "USSD", icon: Smartphone },
] as const;

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return <section className="border-b border-border py-8" aria-labelledby={`step-${n}`}>
    <h2 id={`step-${n}`} className="flex items-center gap-4 text-lg"><span className="flex size-9 items-center justify-center rounded-full bg-nero font-sans text-sm text-on-dark">{n}</span>{title}</h2>
    <div className="mt-6">{children}</div>
  </section>;
}

function Summary({ items, fee, promo, setPromo }: { items: CartItem[]; fee: number | null; promo: number; setPromo: (n: number) => void }) {
  return <><ul>{items.map((i) => <CartLine key={i.key} item={i} compact />)}</ul><div className="mt-5"><SummaryRows items={items} discountPercent={promo} deliveryFee={fee} /></div><PromoField onApply={setPromo} /></>;
}

function CheckoutPage() {
  const items = useCart();
  const user = useUser();
  const navigate = useNavigate();
  const [sendTo, setSendTo] = useState<"someone" | "me">("someone");
  const [state, setState] = useState("");
  const [surprise, setSurprise] = useState(true);
  const [payment, setPayment] = useState<Order["payment"]>("card");
  const [promo, setPromo] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fee = state ? deliveryFeeFor(state) : null;
  const subtotal = cartSubtotal(items);
  const discount = Math.round((subtotal * promo) / 100);
  const total = subtotal - discount + (fee ?? 0);

  if (items.length === 0) return <SiteShell><main className="bg-paper px-5 py-16"><div className="mx-auto max-w-xl"><EmptyState line="Your bag is empty, so there is nothing to check out yet." action={<Button asChild><Link to="/shop">Shop gifts</Link></Button>} /></div></main></SiteShell>;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => String(fd.get(k) ?? "").trim();
    const required = ["r_name", "r_phone", "address", "area", "date", "c_name", "c_email", "c_phone"];
    if (!state || required.some((k) => !v(k))) { setError("Please complete every required field, including the state."); return; }
    setError(""); setBusy(true);
    const order = await createOrder({
      items, subtotal, discount, deliveryFee: fee ?? 0, total, sendTo, payment,
      recipient: { name: v("r_name"), phone: v("r_phone"), address: v("address"), state, area: v("area"), deliveryDate: v("date"), notes: v("notes"), surprise },
      customer: { name: v("c_name"), email: v("c_email"), phone: v("c_phone") },
    });
    await clearCart();
    navigate({ to: "/order/$id", params: { id: order.id } });
  };

  return <SiteShell><main className="bg-paper">
    <div className="border-b border-border bg-ivory"><div className="mx-auto max-w-7xl px-5 py-8"><h1 className="text-3xl">Checkout</h1></div></div>
    <Collapsible className="border-b border-border bg-ivory lg:hidden">
      <CollapsibleTrigger className="flex min-h-14 w-full items-center justify-between px-5 text-sm font-semibold">Order summary <span className="flex items-center gap-2">{formatNaira(total)}<ChevronDown className="size-4" /></span></CollapsibleTrigger>
      <CollapsibleContent className="px-5 pb-6"><Summary items={items} fee={fee} promo={promo} setPromo={setPromo} /></CollapsibleContent>
    </Collapsible>
    <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[1fr_400px]">
      <form onSubmit={submit} noValidate>
        <Step n={1} title="Who is it going to?">
          <div className="grid grid-cols-2 gap-3">{(["someone", "me"] as const).map((s) => <label key={s} className={cn("flex min-h-12 cursor-pointer items-center gap-3 rounded-md border px-4 text-sm", sendTo === s ? "border-nero bg-ivory" : "border-border")}><input type="radio" name="sendTo" checked={sendTo === s} onChange={() => setSendTo(s)} className="size-4 accent-[var(--color-nero)]" />{s === "someone" ? "Send to someone else" : "Send to me"}</label>)}</div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <FormField label="Recipient name" name="r_name" required autoComplete={sendTo === "me" ? "name" : "off"} defaultValue={sendTo === "me" ? user?.name ?? "" : ""} key={`n-${sendTo}`} />
            <FormField label="Recipient phone" name="r_phone" type="tel" required />
            <FormField label="Address" name="address" required className="sm:col-span-2" />
            <div><Label htmlFor="state">State</Label><Select value={state} onValueChange={setState}><SelectTrigger id="state" className="mt-2 min-h-11 bg-paper"><SelectValue placeholder="Choose a state" /></SelectTrigger><SelectContent>{STATES.map((s) => <SelectItem key={s} value={s}>{s} · {formatNaira(deliveryFeeFor(s))}</SelectItem>)}</SelectContent></Select></div>
            <FormField label="City or area" name="area" required />
            <FormField label="Delivery date" name="date" type="date" required min={new Date().toISOString().slice(0, 10)} />
            <div className="sm:col-span-2"><Label htmlFor="notes">Delivery notes</Label><Textarea id="notes" name="notes" className="mt-2 bg-paper" placeholder="Gate code, landmark, best time" /></div>
          </div>
          {sendTo === "someone" && <label className="mt-5 flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-md border border-border p-4 text-sm"><span><span className="block font-semibold">Keep it a surprise</span><span className="text-muted-foreground">We will not call the recipient before delivery.</span></span><Switch checked={surprise} onCheckedChange={setSurprise} /></label>}
        </Step>
        <Step n={2} title="Your details">
          {user ? <p className="mb-5 text-sm text-muted-foreground">Signed in as {user.email}.</p> : <p className="mb-5 text-sm text-muted-foreground">Checking out as a guest. <Link to="/account" className="font-semibold text-nero underline underline-offset-4">Sign in</Link> to save your details.</p>}
          <div className="grid gap-4 sm:grid-cols-2" key={user?.email ?? "guest"}>
            <FormField label="Your name" name="c_name" required autoComplete="name" defaultValue={user?.name ?? ""} />
            <FormField label="Email" name="c_email" type="email" required autoComplete="email" defaultValue={user?.email ?? ""} />
            <FormField label="Phone" name="c_phone" type="tel" required autoComplete="tel" defaultValue={user?.phone ?? ""} />
          </div>
        </Step>
        <Step n={3} title="Payment">
          <div className="grid gap-3 sm:grid-cols-3">{PAYMENTS.map(({ slug, name, icon: Icon }) => <label key={slug} className={cn("flex min-h-14 cursor-pointer items-center gap-3 rounded-md border px-4 text-sm", payment === slug ? "border-nero bg-ivory" : "border-border")}><input type="radio" name="payment" checked={payment === slug} onChange={() => setPayment(slug)} className="size-4 accent-[var(--color-nero)]" /><Icon className="size-5" />{name}</label>)}</div>
          <div className="mt-5 flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-ivory px-6 py-10 text-center text-sm text-muted-foreground"><Lock className="size-5" />The secure payment form will appear here.</div>
        </Step>
        {error && <p role="alert" className="mt-6 text-sm text-destructive">{error}</p>}
        <div className="py-8"><LoadingButton type="submit" size="lg" loading={busy} className="w-full">Place order, {formatNaira(total)}</LoadingButton></div>
      </form>
      <aside className="hidden py-8 lg:block"><div className="sticky top-24 rounded-md border border-border bg-ivory p-6"><h2 className="text-lg">Order summary</h2><Summary items={items} fee={fee} promo={promo} setPromo={setPromo} /></div></aside>
    </div>
  </main></SiteShell>;
}
