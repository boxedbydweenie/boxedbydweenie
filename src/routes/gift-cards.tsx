import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { Button, Eyebrow, FormField, GoldRule } from "@/components/site/Brand";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GIFT_CARD_AMOUNTS, GIFT_CARD_MAX, GIFT_CARD_MIN, GIFT_NOTE_LIMIT } from "@/config/shop";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { addToCart } from "@/services/cart";
import { openCart } from "@/hooks/use-shop";
import type { GiftCardDetails } from "@/types/shop";

export const Route = createFileRoute("/gift-cards")({
  head: () => ({ meta: [
    { title: "Gift Cards — Boxed by Dweenie" },
    { name: "description", content: "Send a Boxed by Dweenie gift card from ₦10,000. Choose a design, add a message and send now or on the day." },
    { property: "og:title", content: "Gift Cards — Boxed by Dweenie" },
    { property: "og:description", content: "Let them choose their wow. Gift cards from ₦10,000." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: GiftCardsPage,
});

const DESIGNS: { slug: GiftCardDetails["design"]; name: string }[] = [
  { slug: "white-ribbon", name: "White with gold ribbon" },
  { slug: "black-leaf", name: "Black with gold leaf" },
  { slug: "ivory-bow", name: "Ivory with bow pattern" },
];

function CardPreview({ design, amount, to, message }: { design: GiftCardDetails["design"]; amount: number; to: string; message: string }) {
  const dark = design === "black-leaf";
  return <div role="img" aria-label={`Gift card preview, ${formatNaira(amount)}`} className={cn("relative aspect-[1.6/1] w-full overflow-hidden rounded-lg border p-6 shadow-soft transition-colors duration-500 sm:p-8", dark ? "surface-dark border-line-dark" : design === "ivory-bow" ? "border-border bg-ivory" : "border-border bg-paper")}>
    {dark && <div className="pattern-leaf absolute inset-0 opacity-[0.12]" />}
    {design === "ivory-bow" && <div className="pattern-bow absolute inset-0 opacity-[0.08]" />}
    {design === "white-ribbon" && <><div className="foil absolute inset-y-0 right-14 w-3" /><div className="foil absolute inset-x-0 top-1/2 h-3 -translate-y-1/2" /></>}
    <div className="relative flex h-full flex-col justify-between">
      <div><p className={cn("eyebrow", dark ? "text-gold" : "text-nero")}>Gift card</p><p className={cn("mt-1 font-heading text-sm uppercase tracking-[0.2em]", dark ? "text-on-dark" : "text-nero")}>Boxed by Dweenie</p></div>
      <div className="max-w-[70%]">
        {to && <p className={cn("text-sm", dark ? "text-on-dark-muted" : "text-muted-foreground")}>For {to}</p>}
        {message && <p className={cn("mt-1 line-clamp-2 text-xs italic", dark ? "text-on-dark-muted" : "text-muted-foreground")}>“{message}”</p>}
        <p className={cn("mt-2 font-heading text-2xl sm:text-3xl", dark ? "text-on-dark" : "text-nero")}>{formatNaira(amount || 0)}</p>
      </div>
    </div>
  </div>;
}

function GiftCardsPage() {
  const [amount, setAmount] = useState(25000);
  const [custom, setCustom] = useState("");
  const [design, setDesign] = useState<GiftCardDetails["design"]>("black-leaf");
  const [to, setTo] = useState(""); const [contact, setContact] = useState(""); const [message, setMessage] = useState("");
  const [when, setWhen] = useState<"now" | "later">("now"); const [sendOn, setSendOn] = useState("");
  const [error, setError] = useState("");
  const value = custom ? Number(custom) : amount;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || value < GIFT_CARD_MIN || value > GIFT_CARD_MAX) return setError(`Choose an amount between ${formatNaira(GIFT_CARD_MIN)} and ${formatNaira(GIFT_CARD_MAX)}.`);
    if (!to.trim() || !contact.trim()) return setError("Add the recipient's name and email or phone.");
    if (when === "later" && !sendOn) return setError("Choose the date to send.");
    setError("");
    await addToCart({ kind: "gift-card", productId: "gift-card", name: `BBD Gift Card, ${formatNaira(value)}`, price: value, quantity: 1, giftCard: { design, recipientName: to.trim(), recipientContact: contact.trim(), message: message.trim(), sendOn: when === "later" ? sendOn : null } });
    openCart();
  };
  return <SiteShell><main className="bg-paper">
    <div className="border-b border-border bg-ivory"><div className="mx-auto max-w-7xl px-5 py-12"><Eyebrow>Gift cards</Eyebrow><h1 className="mt-3 text-3xl md:text-5xl">Let them choose their wow</h1><p className="mt-3 max-w-xl text-muted-foreground">Delivered by email or SMS, valid for 12 months across the shop.</p></div></div>
    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-2 lg:gap-16">
      <div className="lg:sticky lg:top-24 lg:h-fit"><CardPreview design={design} amount={value} to={to} message={message} /><p className="mt-3 text-center text-xs text-muted-foreground">Live preview</p></div>
      <form onSubmit={submit} className="space-y-8" noValidate>
        <fieldset><legend className="eyebrow text-nero">Amount</legend>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{GIFT_CARD_AMOUNTS.map((a) => <button key={a} type="button" onClick={() => { setAmount(a); setCustom(""); }} aria-pressed={!custom && amount === a} className={cn("min-h-12 rounded-md border text-sm font-semibold transition-colors", !custom && amount === a ? "border-nero bg-gold text-nero" : "border-border hover:border-nero")}>{formatNaira(a)}</button>)}</div>
          <label htmlFor="custom" className="mt-4 block text-sm">Or a custom amount</label>
          <Input id="custom" inputMode="numeric" value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, ""))} placeholder={`From ${formatNaira(GIFT_CARD_MIN)}`} className="mt-2 min-h-11 bg-paper" />
        </fieldset>
        <fieldset><legend className="eyebrow text-nero">Design</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">{DESIGNS.map((d) => <label key={d.slug} className={cn("flex min-h-11 cursor-pointer items-center gap-3 rounded-md border p-3 text-sm", design === d.slug ? "border-nero bg-ivory" : "border-border")}><input type="radio" name="design" checked={design === d.slug} onChange={() => setDesign(d.slug)} className="size-4 accent-[var(--color-nero)]" />{d.name}</label>)}</div>
        </fieldset>
        <GoldRule />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Recipient name" name="to" value={to} onChange={(e) => setTo(e.target.value)} />
          <FormField label="Recipient email or phone" name="contact" value={contact} onChange={(e) => setContact(e.target.value)} />
        </div>
        <div><label htmlFor="message" className="text-sm font-medium">Message</label><Textarea id="message" maxLength={GIFT_NOTE_LIMIT} value={message} onChange={(e) => setMessage(e.target.value)} className="mt-2 bg-paper" /><p className="mt-1 text-right text-xs text-muted-foreground">{message.length}/{GIFT_NOTE_LIMIT}</p></div>
        <fieldset><legend className="eyebrow text-nero">When to send</legend>
          <div className="mt-3 flex flex-wrap gap-3">{(["now", "later"] as const).map((w) => <label key={w} className={cn("flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-4 text-sm", when === w ? "border-nero bg-ivory" : "border-border")}><input type="radio" name="when" checked={when === w} onChange={() => setWhen(w)} className="size-4 accent-[var(--color-nero)]" />{w === "now" ? "Send now" : "Schedule a date"}</label>)}</div>
          {when === "later" && <Input type="date" aria-label="Send date" value={sendOn} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setSendOn(e.target.value)} className="mt-3 min-h-11 w-auto bg-paper" />}
        </fieldset>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="w-full sm:w-auto">Add to bag, {formatNaira(value || 0)}</Button>
      </form>
    </div>
  </main></SiteShell>;
}
