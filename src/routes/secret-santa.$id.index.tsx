import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift, Heart, MessageSquare, ShoppingBag, User } from "lucide-react";
import { toast } from "sonner";
import { SantaShell, type SantaTab } from "@/components/santa/SantaShell";
import { GiftBox, Sparkles } from "@/components/santa/SantaParts";
import { BowTie } from "@/components/shop/BowTie";
import { PlaceholderTile } from "@/components/site/PlaceholderTile";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MAX_WISHLIST, SANTA_NOTE } from "@/config/secretSanta";
import { useSanta } from "@/hooks/use-santa";
import { exchangeById, giftsWithinBudget, myMatch, orderBy, orderFor, orderSantaGift, revealMySanta, sendQuestion, sendThanks, toggleWishlistItem, updateDelivery, type SantaState } from "@/services/secretSanta";
import { getProductById } from "@/services/products";
import { daysUntil, formatLong } from "@/services/calendar";
import { formatNaira } from "@/lib/format";
import type { Exchange, Participant } from "@/types/secretSanta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/secret-santa/$id/")({
  head: () => ({ meta: [
    { title: "My Secret Santa — Boxed by Dweenie" },
    { name: "description", content: "See your match, shop within budget and message your giftee anonymously." },
    { property: "og:title", content: "My Secret Santa — Boxed by Dweenie" },
    { property: "og:description", content: "Your match, your wishlist and your gift, all in one place." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: ParticipantHome,
});

const TABS: SantaTab[] = [
  { id: "match", label: "My match", icon: <Gift className="size-5" /> },
  { id: "shop", label: "Shop", icon: <ShoppingBag className="size-5" /> },
  { id: "messages", label: "Messages", icon: <MessageSquare className="size-5" /> },
  { id: "me", label: "Me", icon: <User className="size-5" /> },
];

function ParticipantHome() {
  const { id } = Route.useParams();
  const s = useSanta();
  const [tab, setTab] = useState("match");
  const ex = exchangeById(s, id);
  const me = ex ? s.participants.find((p) => p.id === s.session[id]) : undefined;
  if (!ex) return <SantaShell><main className="mx-auto max-w-md px-5 py-20 text-center"><h1 className="text-2xl text-on-dark">Exchange not found</h1><Button asChild className="mt-6"><Link to="/secret-santa" hash="join">Join with a code</Link></Button></main></SantaShell>;
  if (!me) return <SantaShell title={ex.name}><main className="mx-auto max-w-md px-5 py-20 text-center"><h1 className="text-2xl text-on-dark">You haven't joined this exchange</h1><p className="mt-3 text-on-dark-muted">Use the link or code from your organiser.</p><Button asChild className="mt-6"><Link to="/secret-santa/join/$code" params={{ code: ex.code }}>Join now</Link></Button></main></SantaShell>;
  const match = myMatch(s, id, me.id);

  return <SantaShell title={ex.name} tabs={TABS} activeTab={tab} onTab={(t) => { setTab(t); window.scrollTo({ top: 0 }); }}>
    <main className="mx-auto max-w-3xl px-4 py-6 md:py-10">
      {tab === "match" && <MatchTab ex={ex} me={me} match={match} goShop={() => setTab("shop")} />}
      {tab === "shop" && <ShopTab ex={ex} me={me} match={match} s={s} />}
      {tab === "messages" && <MessagesTab ex={ex} me={me} match={match} s={s} />}
      {tab === "me" && <MeTab ex={ex} me={me} s={s} />}
    </main>
  </SantaShell>;
}

const orderPassed = (ex: Exchange) => daysUntil(ex.dates.orderBy) < 0;

function MatchTab({ ex, me, match, goShop }: { ex: Exchange; me: Participant; match: Participant | null; goShop: () => void }) {
  const [opened, setOpened] = useState(false);
  const [phase, setPhase] = useState<"closed" | "opening" | "open">("closed");
  const s = useSanta();
  const ordered = orderBy(s, ex.id, me.id);
  if (!match) {
    const d = daysUntil(ex.dates.draw);
    return <div className="relative py-10 text-center"><Sparkles /><GiftBox lid="static" bow="static" />
      <p className="eyebrow mt-8 text-gold">Names are drawn in</p>
      <p className="mt-3 text-5xl font-light tabular-nums text-on-dark">{Math.max(0, d)}<span className="ml-2 text-sm uppercase tracking-[0.3em] text-on-dark-muted">{d === 1 ? "day" : "days"}</span></p>
      <p className="mt-3 text-on-dark-muted">{formatLong(ex.dates.draw)}. Add to your wishlist while you wait.</p>
    </div>;
  }
  const revealed = opened || phase === "open";
  return <div>
    {!revealed && <div className="relative py-8 text-center"><Sparkles />
      <GiftBox lid={phase === "opening" ? "lift" : "static"} bow={phase === "opening" ? "untie" : "static"} />
      {phase === "closed" && <Button size="lg" className="mt-10" onClick={() => { const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; setPhase("opening"); setTimeout(() => { setPhase("open"); setOpened(true); }, reduce ? 50 : 1700); }}>Untie to reveal</Button>}
    </div>}
    {revealed && <div className="animate-rise-in">
      <div className="relative rounded-md border border-gold p-6 text-center"><Sparkles /><BowTie className="h-12 w-20" /><p className="mt-4 eyebrow text-gold">You're gifting</p><h1 className="mt-3 text-3xl text-on-dark">{match.name}</h1></div>
      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line-dark bg-line-dark text-sm">
        <div className="surface-dark p-4"><dt className="eyebrow text-on-dark-muted">Budget</dt><dd className="mt-2 text-lg text-gold">{formatNaira(ex.budget)}</dd></div>
        <div className="surface-dark p-4"><dt className="eyebrow text-on-dark-muted">Order by</dt><dd className="mt-2 text-on-dark">{formatLong(ex.dates.orderBy)}</dd><dd className="text-xs text-on-dark-muted">{orderPassed(ex) ? "Passed" : `${daysUntil(ex.dates.orderBy)} days to go`}</dd></div>
      </dl>
      {ordered ? <p className="mt-6 rounded-md border border-gold p-4 text-sm text-on-dark">You've ordered {getProductById(ordered.productId)?.name}. {ordered.status === "delivered" ? "It has been delivered." : "Wrapped, sealed and on its way."}</p>
        : orderPassed(ex) ? <p className="mt-6 rounded-md border border-gold p-4 text-sm text-on-dark">The order-by date has passed. Contact your organiser.</p>
        : <Button size="lg" className="mt-6 w-full" onClick={goShop}>Choose their gift</Button>}
      <h2 className="mt-10 text-sm text-on-dark">{match.name.split(" ")[0]}'s wishlist</h2>
      {match.wishlist.length === 0 ? <p className="mt-3 text-sm text-on-dark-muted">No wishlist yet. Go by their notes below, or ask them a question anonymously.</p>
        : <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{match.wishlist.map((w) => { const p = getProductById(w.productId); return p && <li key={w.productId}><PlaceholderTile label={p.name} className="aspect-square" /><p className="mt-2 text-xs font-semibold text-on-dark">{p.name}</p><p className="text-xs text-on-dark-muted">{formatNaira(p.price)}</p></li>; })}</ul>}
      <h2 className="mt-8 text-sm text-on-dark">Notes</h2>
      <dl className="mt-3 space-y-1 text-sm text-on-dark-muted">
        <div><dt className="inline text-on-dark">Likes: </dt><dd className="inline">{match.likes || "Not added"}</dd></div>
        <div><dt className="inline text-on-dark">Dislikes: </dt><dd className="inline">{match.dislikes || "Not added"}</dd></div>
        {match.sizes && <div><dt className="inline text-on-dark">Sizes: </dt><dd className="inline">{match.sizes}</dd></div>}
        {match.noAlcohol && <div className="text-gold">No alcohol, please</div>}
      </dl>
    </div>}
  </div>;
}

function ShopTab({ ex, me, match, s }: { ex: Exchange; me: Participant; match: Participant | null; s: SantaState }) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const wishIds = match?.wishlist.map((w) => w.productId) ?? [];
  const alcohol = /wine|champagne|spirit|whisky|gin|prosecco/i;
  const gifts = giftsWithinBudget(ex.budget, wishIds).filter((p) => !(match?.noAlcohol && p.inside.some((i) => alcohol.test(i))));
  const ordered = orderBy(s, ex.id, me.id);
  const product = chosen ? getProductById(chosen) : null;
  const deliveryTo = ex.delivery === "one-address" ? ex.address : match?.address;

  if (done || ordered) return <div className="relative py-12 text-center"><Sparkles /><BowTie className="h-20 w-32" /><h1 className="mt-6 text-2xl text-on-dark">Wrapped, sealed and on its way.</h1><p className="mt-3 text-on-dark-muted">Your secret is safe.</p>{ordered && <p className="mt-6 text-sm text-on-dark">{getProductById(ordered.productId)?.name} for {match?.name}</p>}</div>;
  return <div>
    <p className="eyebrow text-gold">Within {formatNaira(ex.budget)}</p>
    <h1 className="mt-2 text-2xl text-on-dark">{match ? `Gifts for ${match.name.split(" ")[0]}` : "Gifts within budget"}</h1>
    {!match && <p className="mt-2 text-sm text-on-dark-muted">You can browse now and buy after names are drawn on {formatLong(ex.dates.draw)}. Tap the heart to add to your own wishlist.</p>}
    {match && orderPassed(ex) && <p className="mt-4 rounded-md border border-gold p-4 text-sm text-on-dark">The order-by date has passed. Contact your organiser.</p>}
    {gifts.length === 0 && <p className="mt-6 text-sm text-on-dark-muted">We're curating gifts at this budget. Ask our team on WhatsApp for options.</p>}
    <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3">{gifts.map((p) => { const onWish = wishIds.includes(p.id); const mine = me.wishlist.some((w) => w.productId === p.id); return <li key={p.id} className="relative">
      <PlaceholderTile label={p.name} className="aspect-[4/5] w-full" />
      <span className="absolute left-2 top-2 rounded-sm bg-gold px-2 py-1 text-[10px] font-bold uppercase text-nero">Within budget</span>
      {onWish && <span className="absolute bottom-[5.5rem] left-2 rounded-sm bg-nero px-2 py-1 text-[10px] font-bold uppercase text-gold">On their wishlist</span>}
      {!match && <Button size="icon" variant="ghost" aria-pressed={mine} aria-label={mine ? `Remove ${p.name} from my wishlist` : `Add ${p.name} to my wishlist`} className="absolute right-2 top-2 bg-paper/90 text-nero" onClick={async () => { if (!(await toggleWishlistItem(me.id, p.id))) toast(`You can choose up to ${MAX_WISHLIST} gifts.`); }}><Heart className={mine ? "fill-current" : ""} /></Button>}
      <p className="mt-3 text-sm font-semibold text-on-dark">{p.name}</p><p className="text-xs text-on-dark-muted">{p.line}</p>
      <div className="mt-2 flex items-center justify-between gap-2"><span className="text-sm font-semibold text-on-dark">{formatNaira(p.price)}</span>{match && !orderPassed(ex) && <Button size="sm" onClick={() => setChosen(p.id)}>Choose</Button>}</div>
    </li>; })}</ul>

    <Sheet open={!!chosen} onOpenChange={(o) => !o && setChosen(null)}>
      <SheetContent side="bottom" className="mx-auto max-w-xl rounded-t-lg bg-paper">
        <SheetTitle>Confirm your gift</SheetTitle>
        <SheetDescription>Delivery details are set by your exchange.</SheetDescription>
        {product && match && <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-3"><span>{product.name}</span><strong>{formatNaira(product.price)}</strong></div>
          <div className="flex justify-between gap-3"><span>To</span><span className="text-right">{match.name}</span></div>
          <div className="flex justify-between gap-3"><span>Delivered</span><span className="text-right text-muted-foreground">{deliveryTo || "Recipient will confirm their address"}{ex.delivery === "one-address" ? ` for ${formatLong(ex.dates.exchange)}` : ""}</span></div>
          <div className="flex justify-between gap-3"><span>Gift note</span><span className="italic">{SANTA_NOTE}</span></div>
          <p className="rounded-sm bg-ivory p-3 text-xs">{ex.payer === "company" ? "Covered by your company. No payment needed." : "Payment is a placeholder in this preview."}</p>
          <Button className="w-full" size="lg" disabled={busy} onClick={async () => { setBusy(true); await orderSantaGift(ex.id, me.id, product.id); setBusy(false); setChosen(null); setDone(true); }}>{ex.payer === "company" ? "Place order" : `Pay ${formatNaira(product.price)}`}</Button>
        </div>}
      </SheetContent>
    </Sheet>
  </div>;
}

function MessagesTab({ ex, me, match, s }: { ex: Exchange; me: Participant; match: Participant | null; s: SantaState }) {
  const [to, setTo] = useState<"recipient" | "santa">("recipient");
  const [body, setBody] = useState("");
  const hasSanta = s.matches.some((m) => m.exchangeId === ex.id && m.receiverId === me.id);
  const announcements = s.messages.filter((m) => m.exchangeId === ex.id && m.kind === "announcement").reverse();
  const mine = s.messages.filter((m) => m.exchangeId === ex.id && m.kind !== "announcement" && (m.fromId === me.id || m.toId === me.id));
  const santaId = s.matches.find((m) => m.exchangeId === ex.id && m.receiverId === me.id)?.giverId;
  const label = (fromId: string, toId?: string) => fromId === me.id ? (toId === santaId ? "You to your Santa" : `You to ${match?.name ?? "your giftee"}`) : fromId === santaId ? "Your Secret Santa" : match && fromId === match.id ? match.name : "Someone";
  return <div className="space-y-8">
    <section><h1 className="text-xl text-on-dark">From the organiser</h1>
      {announcements.length === 0 ? <p className="mt-3 text-sm text-on-dark-muted">No announcements yet.</p> : <ul className="mt-4 space-y-3">{announcements.map((m) => <li key={m.id} className="rounded-md border border-line-dark p-4 text-sm text-on-dark">{m.body}<span className="mt-2 block text-xs text-on-dark-muted">{ex.organiserName} · {new Date(m.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span></li>)}</ul>}
    </section>
    <section><h2 className="text-xl text-on-dark">Anonymous questions</h2>
      <p className="mt-2 text-sm text-on-dark-muted">Ask a question without revealing who you are.</p>
      {!match && !hasSanta ? <p className="mt-4 text-sm text-on-dark-muted">Available after names are drawn.</p> : <form className="mt-4 space-y-3" onSubmit={async (e) => { e.preventDefault(); if (!body.trim()) return; await sendQuestion(ex.id, me.id, to, body.trim()); setBody(""); toast("Sent anonymously."); }}>
        <Select value={to} onValueChange={(v) => setTo(v as typeof to)}><SelectTrigger className="min-h-11 border-line-dark bg-nero-soft text-on-dark" aria-label="Send to"><SelectValue /></SelectTrigger><SelectContent>{match && <SelectItem value="recipient">To {match.name} (as their Santa)</SelectItem>}{hasSanta && <SelectItem value="santa">To my Secret Santa</SelectItem>}</SelectContent></Select>
        <Textarea aria-label="Your question" rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What's your favourite scent?" className="border-line-dark bg-nero-soft text-on-dark" />
        <Button type="submit">Send anonymously</Button>
      </form>}
      {mine.length > 0 && <ul className="mt-6 space-y-3">{mine.map((m) => <li key={m.id} className={cn("max-w-[85%] rounded-md p-3 text-sm", m.fromId === me.id ? "ml-auto bg-nero-soft text-on-dark" : "border border-gold text-on-dark")}><span className="block text-[11px] font-semibold uppercase tracking-wider text-on-dark-muted">{m.kind === "thanks" ? "Thank-you note · " : ""}{label(m.fromId, m.toId)}</span>{m.body}</li>)}</ul>}
    </section>
  </div>;
}

function MeTab({ ex, me, s }: { ex: Exchange; me: Participant; s: SantaState }) {
  const [address, setAddress] = useState(me.address ?? "");
  const [thanks, setThanks] = useState("");
  const [showSanta, setShowSanta] = useState(false);
  const incoming = orderFor(s, ex.id, me.id);
  const santa = revealMySanta(s, ex.id, me.id);
  return <div className="space-y-8">
    <section className="rounded-md border border-line-dark p-5">
      <h1 className="text-sm text-on-dark">Your gift</h1>
      <p className="mt-3 text-lg text-on-dark">{!incoming ? "Your Santa hasn't ordered yet." : incoming.status === "delivered" ? "Your gift has been delivered." : "Your gift has been ordered."}</p>
      {incoming && <p className="mt-1 text-sm text-on-dark-muted">{SANTA_NOTE}</p>}
      {santa && <div className="mt-5 border-t border-line-dark pt-5">
        {!showSanta ? <Button onClick={() => setShowSanta(true)}>Who was my Santa?</Button> : <div className="animate-rise-in"><p className="eyebrow text-gold">Your Secret Santa was</p><p className="mt-2 text-2xl text-on-dark">{santa.name}</p>
          <form className="mt-4 space-y-2" onSubmit={async (e) => { e.preventDefault(); if (!thanks.trim()) return; await sendThanks(ex.id, me.id, thanks.trim()); setThanks(""); toast("Thank-you note sent."); }}><Textarea aria-label="Thank-you note" rows={2} value={thanks} onChange={(e) => setThanks(e.target.value)} placeholder="Thank you, I love it." className="border-line-dark bg-nero-soft text-on-dark" /><Button type="submit" size="sm">Send a thank-you</Button></form></div>}
      </div>}
    </section>
    <section><h2 className="text-sm text-on-dark">My wishlist ({me.wishlist.length}/{MAX_WISHLIST})</h2>
      {me.wishlist.length === 0 ? <p className="mt-3 text-sm text-on-dark-muted">Your wishlist is empty. Add gifts from the Shop tab so your Santa has ideas.</p>
        : <ul className="mt-3 divide-y divide-line-dark">{me.wishlist.map((w) => { const p = getProductById(w.productId); return p && <li key={w.productId} className="flex items-center justify-between gap-3 py-3 text-sm text-on-dark"><span>{p.name} · {formatNaira(p.price)}</span>{s.exchanges.find((e) => e.id === ex.id)?.status === "open" && <Button size="sm" variant="ghost" className="text-on-dark-muted" onClick={() => toggleWishlistItem(me.id, p.id)}>Remove</Button>}</li>; })}</ul>}
    </section>
    <section><h2 className="text-sm text-on-dark">My notes</h2>
      <dl className="mt-3 space-y-1 text-sm text-on-dark-muted"><div>Likes: <span className="text-on-dark">{me.likes || "Not added"}</span></div><div>Dislikes: <span className="text-on-dark">{me.dislikes || "Not added"}</span></div><div>Sizes: <span className="text-on-dark">{me.sizes || "Not added"}</span></div>{me.noAlcohol && <div className="text-gold">No alcohol</div>}</dl>
    </section>
    <section><h2 className="text-sm text-on-dark">Delivery</h2>
      {ex.delivery === "one-address" ? <p className="mt-3 text-sm text-on-dark-muted">All gifts go to {ex.address} for {formatLong(ex.dates.exchange)}.</p>
        : <form className="mt-3 space-y-2" onSubmit={async (e) => { e.preventDefault(); await updateDelivery(me.id, address); toast("Delivery address saved."); }}><Textarea aria-label="Delivery address" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} className="border-line-dark bg-nero-soft text-on-dark" /><Button type="submit" size="sm">Save address</Button></form>}
    </section>
  </div>;
}
