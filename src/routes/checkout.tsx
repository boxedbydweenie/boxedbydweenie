import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, CreditCard, Landmark, Lock, Smartphone } from "lucide-react";
import { useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { Button, EmptyState, FormField, LoadingButton } from "@/components/site/Brand";
import { CartLine, GiftCardField, PromoField, SummaryRows } from "@/components/shop/CartParts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { STATES, deliveryFeeFor } from "@/config/delivery";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { callAccount } from "@/lib/api";
import { cartSubtotal, clearCart } from "@/services/cart";
import { startCheckout } from "@/services/orders";
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

function Summary({ items, fee, promo, setPromo, setPromoCode, gift, setGift }: { items: CartItem[]; fee: number | null; promo: number; setPromo: (n: number) => void; setPromoCode: (c: string) => void; gift: { code: string; balance: number }; setGift: (g: { code: string; balance: number }) => void }) {
  const sub = items.reduce((t, i) => t + i.price * i.quantity, 0);
  const owed = sub - Math.round((sub * promo) / 100) + (fee ?? 0);
  const applied = Math.min(gift.balance, owed);
  const hasCard = items.some((i) => i.kind === "gift-card");
  return <><ul>{items.map((i) => <CartLine key={i.key} item={i} compact />)}</ul><div className="mt-5"><SummaryRows items={items} discountPercent={promo} deliveryFee={fee} /></div><PromoField onApply={setPromo} onCode={setPromoCode} />{!hasCard && <GiftCardField onApply={(code, balance) => setGift({ code, balance })} />}{applied > 0 && <p className="mt-3 flex justify-between text-sm font-semibold"><span>Gift card</span><span>−{formatNaira(applied)}</span></p>}</>;
}

function CheckoutPage() {
  const items = useCart();
  const user = useUser();
  const [sendTo, setSendTo] = useState<"someone" | "me">("someone");
  const [state, setState] = useState("");
  const [surprise, setSurprise] = useState(true);
  const [payment, setPayment] = useState<Order["payment"]>("card");
  const [promo, setPromo] = useState(0);
  const [promoCode, setPromoCode] = useState("");
  const [gift, setGift] = useState({ code: "", balance: 0 });
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
    try {
      if (fd.get("marketing") === "on") await callAccount({ action: "subscribe", email: v("c_email"), name: v("c_name"), source: "checkout" }).catch(() => undefined); // only when the box is ticked; never blocks the order
      const { authorizationUrl, ref } = await startCheckout({
        items, sendTo, promoCode: promo ? promoCode : "", giftCardCode: gift.code,
        recipient: { name: v("r_name"), phone: v("r_phone"), address: v("address"), state, area: v("area"), deliveryDate: v("date"), notes: v("notes"), surprise },
        customer: { name: v("c_name"), email: v("c_email"), phone: v("c_phone") },
      });
      if (authorizationUrl) window.location.assign(authorizationUrl);
      else { await clearCart(); window.location.assign(`/order/${encodeURIComponent(ref)}`); }
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "We could not start your payment. Please try again.");
    }
  };

  return <SiteShell><main className="bg-paper">
    <div className="brand-pattern-navy text-on-dark"><div className="mx-auto max-w-7xl px-5 py-12 md:py-16"><p className="eyebrow text-gold">Almost there</p><div aria-hidden className="mt-3 h-px w-14 bg-gold" /><h1 className="mt-5 text-4xl md:text-6xl">Check<span className="text-gold">out</span></h1></div></div>
    <Collapsible className="border-b border-border bg-ivory lg:hidden">
      <CollapsibleTrigger className="flex min-h-14 w-full items-center justify-between px-5 text-sm font-semibold">Order summary <span className="flex items-center gap-2">{formatNaira(total)}<ChevronDown className="size-4" /></span></CollapsibleTrigger>
      <CollapsibleContent className="px-5 pb-6"><Summary items={items} fee={fee} promo={promo} setPromo={setPromo} setPromoCode={setPromoCode} gift={gift} setGift={setGift} /></CollapsibleContent>
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
          <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-muted-foreground"><input type="checkbox" name="marketing" className="mt-1 size-4 shrink-0 accent-[var(--color-nero)]" /><span>Send me gift ideas, offers and news from Boxed by Dweenie. You can unsubscribe at any time. (Order updates are always sent.)</span></label>
        </Step>
        <Step n={3} title="Payment">
          <div className="mt-5 flex items-start gap-3 rounded-md border border-border bg-ivory px-5 py-4 text-sm text-muted-foreground"><Lock className="mt-0.5 size-4 shrink-0" /><span>Next, you will pay securely on Paystack with your card, a bank transfer or USSD. We never see your card details.</span></div>
        </Step>
        {error && <p role="alert" className="mt-6 text-sm text-destructive">{error}</p>}
        <div className="py-8"><LoadingButton type="submit" size="lg" loading={busy} className="w-full">Pay {formatNaira(total)} securely</LoadingButton></div>
      </form>
      <aside className="hidden py-8 lg:block"><div className="sticky top-24 rounded-md border border-border border-t-4 border-t-gold bg-ivory p-6 shadow-[0_24px_40px_-30px_rgba(41,40,40,.5)]"><h2 className="text-2xl">Order summary</h2><Summary items={items} fee={fee} promo={promo} setPromo={setPromo} setPromoCode={setPromoCode} gift={gift} setGift={setGift} /></div></aside>
    </div>
  </main></SiteShell>;
}
