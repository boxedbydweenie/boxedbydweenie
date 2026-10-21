import { callAccount } from "@/lib/api";
import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, Stepper } from "@/components/site/Brand";
import { PlaceholderTile } from "@/components/site/PlaceholderTile";
import { Input } from "@/components/ui/input";
import { PACKAGING } from "@/config/shop";
import { formatNaira, formatDayMonth } from "@/lib/format";
import { applyPromo, cartSubtotal, removeFromCart, updateQuantity } from "@/services/cart";
import type { CartItem } from "@/types/shop";

export function CartLine({ item, compact }: { item: CartItem; compact?: boolean }) {
  const packaging = PACKAGING.find((p) => p.slug === item.packaging)?.name;
  return <li className="flex gap-4 border-b border-border py-5">
    <PlaceholderTile label={item.name} tone={item.packaging === "signature-black" ? "dark" : "ivory"} className={compact ? "aspect-[4/5] w-20 shrink-0" : "aspect-[4/5] w-24 shrink-0 sm:w-28"} />
    <div className="min-w-0 flex-1">
      <div className="flex justify-between gap-3">
        <h3 className="text-sm">{item.slug ? <Link to="/shop/$slug" params={{ slug: item.slug }} className="hover:text-muted-foreground">{item.name}</Link> : item.name}</h3>
        <span className="shrink-0 text-sm font-semibold">{formatNaira(item.price * item.quantity)}</span>
      </div>
      <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
        {packaging && <p>{packaging}{item.handwritten ? ", handwritten card" : ""}</p>}
        {item.giftCard && <p>For {item.giftCard.recipientName || "recipient"}{item.giftCard.sendOn ? `, sends ${formatDayMonth(item.giftCard.sendOn)}` : ", sends now"}</p>}
        {item.deliveryDate && <p>Delivery {formatDayMonth(item.deliveryDate)}</p>}
        {(item.note || item.giftCard?.message) && <p className="line-clamp-1 italic">“{item.note || item.giftCard?.message}”</p>}
      </div>
      <div className="mt-3 flex items-center justify-between">
        {item.kind === "product" ? <Stepper value={item.quantity} onChange={(q) => updateQuantity(item.key, q)} /> : <span className="text-xs text-muted-foreground">Qty 1</span>}
        <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.key)} aria-label={`Remove ${item.name}`}><Trash2 /> <span className="hidden sm:inline">Remove</span></Button>
      </div>
    </div>
  </li>;
}

export function PromoField({ onApply, onCode }: { onApply: (percent: number) => void; onCode?: (code: string) => void }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return <form className="mt-4" onSubmit={async (e) => { e.preventDefault(); if (!code.trim()) return; const r = await applyPromo(code); setMsg({ ok: r.ok, text: r.message }); onApply(r.percent); onCode?.(r.ok ? code.trim().toUpperCase() : ""); }}>
    <label htmlFor="promo" className="text-xs font-semibold uppercase tracking-wider">Promo code</label>
    <div className="mt-2 flex gap-2"><Input id="promo" value={code} onChange={(e) => setCode(e.target.value)} className="min-h-11 bg-paper" placeholder="Enter code" /><Button type="submit" variant="outline">Apply</Button></div>
    {msg && <p role="status" className={`mt-2 text-xs ${msg.ok ? "text-success" : "text-destructive"}`}>{msg.text}</p>}
  </form>;
}

export function SummaryRows({ items, discountPercent = 0, deliveryFee }: { items: CartItem[]; discountPercent?: number; deliveryFee?: number | null }) {
  const subtotal = cartSubtotal(items);
  const discount = Math.round((subtotal * discountPercent) / 100);
  return <dl className="space-y-3 text-sm">
    <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatNaira(subtotal)}</dd></div>
    {discount > 0 && <div className="flex justify-between text-success"><dt>Discount</dt><dd>−{formatNaira(discount)}</dd></div>}
    <div className="flex justify-between"><dt>Delivery</dt><dd className="text-muted-foreground">{deliveryFee == null ? "Calculated at checkout" : formatNaira(deliveryFee)}</dd></div>
    <div className="flex justify-between border-t border-border pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatNaira(subtotal - discount + (deliveryFee ?? 0))}</dd></div>
  </dl>;
}

/** Checks a gift card code and reports its balance so the checkout can apply it. */
export function GiftCardField({ onApply }: { onApply: (code: string, balance: number) => void }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const apply = async () => {
    if (!code.trim()) return;
    setBusy(true);
    try {
      const r = await callAccount<{ balance: number }>({ action: "gift-card", code });
      onApply(code.trim().toUpperCase(), r.balance); setMsg({ ok: true, text: `Gift card applied. Balance ${formatNaira(r.balance)}.` });
    } catch (e) { onApply("", 0); setMsg({ ok: false, text: e instanceof Error ? e.message : "We could not check that gift card." }); }
    finally { setBusy(false); }
  };
  return <div className="mt-4">
    <label htmlFor="giftcard" className="text-xs font-semibold uppercase tracking-wider">Gift card code</label>
    <div className="mt-2 flex gap-2"><Input id="giftcard" value={code} onChange={(e) => setCode(e.target.value)} className="min-h-11 bg-paper" placeholder="BBD-XXXX-XXXX-XXXX" /><Button type="button" variant="outline" disabled={busy} onClick={apply}>Apply</Button></div>
    {msg && <p role="status" className={`mt-2 text-xs ${msg.ok ? "text-success" : "text-destructive"}`}>{msg.text}</p>}
  </div>;
}
