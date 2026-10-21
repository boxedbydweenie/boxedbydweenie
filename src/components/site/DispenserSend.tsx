import { useEffect, useState } from "react";
import { z } from "zod";
import { LoadingButton } from "@/components/site/Brand";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { STATES, deliveryFeeFor, earliestDelivery, toIso } from "@/config/delivery";
import { GIFT_NOTE_LIMIT, SAME_DAY_CUTOFF_HOUR } from "@/config/shop";
import { formatDayMonth, formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { startCheckout } from "@/services/orders";
import type { Order, ShopProduct } from "@/types/shop";

/* ---------- Express send ---------- */

const PAYMENTS: { slug: Order["payment"]; name: string }[] = [{ slug: "card", name: "Card" }, { slug: "transfer", name: "Bank transfer" }, { slug: "ussd", name: "USSD" }];

export function ExpressSheet({ product, initialNote = "", onClose, onDone }: { product: ShopProduct | null; initialNote?: string; onClose: () => void; onDone: (o: Order) => void }) {
  const mobile = useIsMobile();
  const [state, setState] = useState("Lagos");
  const [date, setDate] = useState("");
  const [payment, setPayment] = useState<Order["payment"]>("card");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const todayIso = toIso(new Date());
  const sameDayOk = !!product?.sameDay && state === "Lagos" && new Date().getHours() < SAME_DAY_CUTOFF_HOUR;
  const earliest = sameDayOk ? todayIso : earliestDelivery(false);
  useEffect(() => { if (product) { setDate(earliest); setError(""); setNote(initialNote); } }, [product, earliest, initialNote]);
  const fee = deliveryFeeFor(state);
  const total = (product?.price ?? 0) + fee;
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return toIso(d); })();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!product) return;
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => String(fd.get(k) ?? "").trim();
    if (["r_name", "r_phone", "address", "c_email", "c_phone"].some((k) => !v(k)) || !date) return setError("Please complete every field marked as required.");
    if (!z.string().email().safeParse(v("c_email")).success) return setError("Enter a valid email address.");
    if (date < earliest) return setError(`The earliest delivery is ${formatDayMonth(earliest)}.`);
    setError(""); setBusy(true);
    try {
      const { authorizationUrl } = await startCheckout({
        items: [{ key: `disp-${product.id}`, kind: "product", productId: product.id, slug: product.slug, name: product.name, price: product.price, quantity: 1, packaging: "signature-black", ...(note.trim() ? { note: note.trim() } : {}), deliveryDate: date }],
        sendTo: "someone",
        recipient: { name: v("r_name"), phone: v("r_phone"), address: v("address"), state, area: state, deliveryDate: date, notes: "", surprise: true },
        customer: { name: v("r_name"), email: v("c_email"), phone: v("c_phone") },
      });
      window.location.assign(authorizationUrl);
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "We could not start your payment. Please try again.");
    }
  };

  return <Sheet open={!!product} onOpenChange={(o) => !o && onClose()}>
    <SheetContent side={mobile ? "bottom" : "right"} className={cn("overflow-y-auto bg-paper p-5 sm:p-6", mobile ? "max-h-[92vh] rounded-t-lg" : "w-full sm:max-w-md")}>
      <SheetTitle>Send {product?.name}</SheetTitle>
      <SheetDescription>{product && `${formatNaira(product.price)} · Signature Black Box`}</SheetDescription>
      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <F label="Recipient name" name="r_name" />
          <F label="Recipient phone" name="r_phone" type="tel" />
        </div>
        <F label="Delivery address" name="address" />
        <div><Label htmlFor="d-state">State</Label><Select value={state} onValueChange={setState}><SelectTrigger id="d-state" className="mt-1.5 min-h-11 bg-paper"><SelectValue /></SelectTrigger><SelectContent>{STATES.map((s) => <SelectItem key={s} value={s}>{s} · {formatNaira(deliveryFeeFor(s))}</SelectItem>)}</SelectContent></Select></div>
        <div>
          <Label htmlFor="d-date">Delivery date</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <button type="button" disabled={!sameDayOk} onClick={() => setDate(todayIso)} aria-pressed={date === todayIso} className={cn("min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40", date === todayIso ? "border-nero bg-gold text-nero" : sameDayOk ? "border-gold" : "border-border")}>Today{sameDayOk ? "" : " (unavailable)"}</button>
            <button type="button" onClick={() => setDate(tomorrow)} aria-pressed={date === tomorrow} className={cn("min-h-11 rounded-full border px-4 text-sm font-semibold", date === tomorrow ? "border-nero bg-gold text-nero" : "border-border")}>Tomorrow</button>
            <Input id="d-date" type="date" min={earliest} value={date} onChange={(e) => setDate(e.target.value)} className="min-h-11 w-auto bg-paper" />
          </div>
        </div>
        <div><Label htmlFor="d-note">Gift note</Label><Textarea id="d-note" maxLength={GIFT_NOTE_LIMIT} value={note} onChange={(e) => setNote(e.target.value)} className="mt-1.5 min-h-16 bg-paper" /><p className="mt-1 text-right text-xs text-muted-foreground">{note.length}/{GIFT_NOTE_LIMIT}</p></div>
        <div className="grid grid-cols-2 gap-3"><F label="Your email" name="c_email" type="email" /><F label="Your phone" name="c_phone" type="tel" /></div>
        <fieldset><legend className="text-sm font-medium">Payment</legend><div className="mt-1.5 grid grid-cols-3 gap-2">{PAYMENTS.map((p) => <label key={p.slug} className={cn("flex min-h-11 cursor-pointer items-center justify-center rounded-md border px-2 text-center text-xs font-semibold", payment === p.slug ? "border-nero bg-ivory" : "border-border")}><input type="radio" name="pay" className="sr-only" checked={payment === p.slug} onChange={() => setPayment(p.slug)} />{p.name}</label>)}</div><p className="mt-2 text-xs text-muted-foreground">The secure payment step will appear here.</p></fieldset>
        <p className="text-sm text-muted-foreground">Gift {formatNaira(product?.price ?? 0)} + delivery {formatNaira(fee)}</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <LoadingButton type="submit" size="lg" loading={busy} className="w-full">Pay {formatNaira(total)} and send</LoadingButton>
      </form>
    </SheetContent>
  </Sheet>;
}

function F({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return <div><Label htmlFor={`d-${name}`}>{label}</Label><Input id={`d-${name}`} name={name} type={type} required maxLength={200} className="mt-1.5 min-h-11 bg-paper" /></div>;
}
