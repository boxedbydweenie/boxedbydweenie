import { usePeople } from "@/hooks/use-calendar";
import { PersonAvatar } from "@/components/calendar/PersonAvatar";
import { daysUntil, formatLong as calLong, nextDateFor } from "@/services/calendar";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { Button, EmptyState, Eyebrow, FormField, ProductCard } from "@/components/site/Brand";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ORDER_STEPS } from "@/config/shop";
import { formatDayMonth, formatNaira } from "@/lib/format";
import { removeRecipient, saveRecipient, signIn, signOut, updateDetails } from "@/services/account";
import { addToCart } from "@/services/cart";
import { getProductById } from "@/services/products";
import { openCart, useOrders, useRecipients, useUser, useWishlist } from "@/hooks/use-shop";
import type { Order } from "@/types/shop";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [
    { title: "Your Account — Boxed by Dweenie" },
    { name: "description", content: "Your orders, saved recipients, wishlist and important dates." },
    { property: "og:title", content: "Your Account — Boxed by Dweenie" },
    { property: "og:description", content: "Orders, recipients, wishlist and dates in one place." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: AccountPage,
});

function SignIn() {
  const [email, setEmail] = useState("");
  return <form className="mx-auto max-w-md rounded-md border border-border bg-ivory p-8" onSubmit={(e) => { e.preventDefault(); if (email.includes("@")) signIn(email); }}>
    <h2 className="text-xl">Sign in</h2><p className="mt-2 text-sm text-muted-foreground">Enter your email to see your orders and saved recipients.</p>
    <FormField className="mt-6" label="Email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
    <Button type="submit" className="mt-6 w-full">Continue</Button>
  </form>;
}

const reorder = async (o: Order) => { for (const { key: _k, ...i } of o.items) await addToCart(i); openCart(); };

function AccountPage() {
  const user = useUser(), orders = useOrders(), recipients = useRecipients(), wishlist = useWishlist();
  const [adding, setAdding] = useState(false);
  return <SiteShell><main className="bg-paper">
    <div className="border-b border-border bg-ivory"><div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-5 py-10"><div><Eyebrow>Your account</Eyebrow><h1 className="mt-3 text-3xl md:text-4xl">{user ? `Welcome, ${user.name}` : "Your account"}</h1></div>{user && <Button variant="outline" onClick={() => signOut()}>Sign out</Button>}</div></div>
    <div className="mx-auto max-w-7xl px-5 py-10">
      {!user ? <SignIn /> : <Tabs defaultValue="orders">
        <TabsList className="h-auto w-full justify-start overflow-x-auto bg-ivory p-1">{["Orders", "Saved recipients", "Wishlist", "My dates", "Details"].map((t) => <TabsTrigger key={t} value={t.toLowerCase().replace(" ", "-")} className="min-h-11 px-4">{t}</TabsTrigger>)}</TabsList>

        <TabsContent value="orders" className="mt-8">{orders.length === 0 ? <EmptyState line="No orders yet." action={<Button asChild><Link to="/shop">Shop gifts</Link></Button>} /> : <ul className="divide-y divide-border border-y border-border">{orders.map((o) => <li key={o.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div><p className="font-semibold"><Link to="/order/$id" params={{ id: o.id }} className="underline-offset-4 hover:underline">{o.id}</Link></p><p className="text-sm text-muted-foreground">{formatDayMonth(o.createdAt.slice(0, 10))} · {o.items.length} {o.items.length === 1 ? "item" : "items"} · {formatNaira(o.total)}</p></div>
          <div className="flex items-center gap-3"><span className={`rounded-sm px-2 py-1 text-xs font-semibold ${o.status === 3 ? "bg-ivory text-nero" : "bg-gold text-nero"}`}>{ORDER_STEPS[o.status]}</span><Button size="sm" variant="outline" onClick={() => reorder(o)}>Reorder</Button></div>
        </li>)}</ul>}</TabsContent>

        <TabsContent value="saved-recipients" className="mt-8">
          <ul className="grid gap-4 md:grid-cols-2">{recipients.map((r) => <li key={r.id} className="flex justify-between gap-4 rounded-md border border-border p-5"><div className="text-sm"><p className="font-semibold">{r.name}</p><p className="mt-1 text-muted-foreground">{r.address}, {r.area}, {r.state}</p><p className="text-muted-foreground">{r.phone}</p></div><Button variant="ghost" size="icon" aria-label={`Remove ${r.name}`} onClick={() => removeRecipient(r.id)}><Trash2 /></Button></li>)}</ul>
          {adding ? <form className="mt-6 grid gap-4 rounded-md border border-border bg-ivory p-6 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const v = (k: string) => String(fd.get(k) ?? "").trim(); if (!v("name")) return; saveRecipient({ name: v("name"), phone: v("phone"), address: v("address"), state: v("state"), area: v("area") }); setAdding(false); }}>
            <FormField label="Name" name="name" required /><FormField label="Phone" name="phone" type="tel" /><FormField label="Address" name="address" className="sm:col-span-2" /><FormField label="State" name="state" /><FormField label="City or area" name="area" />
            <div className="flex gap-3 sm:col-span-2"><Button type="submit">Save recipient</Button><Button type="button" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button></div>
          </form> : <Button className="mt-6" variant="outline" onClick={() => setAdding(true)}>Add a recipient</Button>}
        </TabsContent>

        <TabsContent value="wishlist" className="mt-8">{wishlist.length === 0 ? <EmptyState line="Tap the heart on any gift to save it here." action={<Button asChild><Link to="/shop">Browse gifts</Link></Button>} /> : <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">{wishlist.map(getProductById).filter((p) => p !== null).map((p) => <ProductCard key={p.id} product={{ id: p.id, slug: p.slug, name: p.name, line: p.line, price: p.price, inStock: p.inStock }} />)}</div>}</TabsContent>

        <TabsContent value="my-dates" className="mt-8"><AccountDates /></TabsContent>

        <TabsContent value="details" className="mt-8"><form key={user.email} className="grid max-w-xl gap-4" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); updateDetails({ name: String(fd.get("name")), email: String(fd.get("email")), phone: String(fd.get("phone")) }); }}>
          <FormField label="Name" name="name" defaultValue={user.name} /><FormField label="Email" name="email" type="email" defaultValue={user.email} /><FormField label="Phone" name="phone" type="tel" defaultValue={user.phone} />
          <Button type="submit" className="w-fit">Save details</Button>
        </form></TabsContent>
      </Tabs>}
    </div>
  </main></SiteShell>;
}


function AccountDates() {
  const people = usePeople();
  if (people.length === 0) return <EmptyState line="Save birthdays and anniversaries and we will remind you in good time." action={<Button asChild><Link to="/calendar/my-dates" search={{ add: true }}>Add your first person</Link></Button>} />;
  return <div><ul className="divide-y divide-border border-y border-border">{people.map((p) => { const n = nextDateFor(p); return <li key={p.id}><Link to="/calendar/my-dates/$personId" params={{ personId: p.id }} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 py-4 hover:bg-ivory"><PersonAvatar person={p} /><div className="min-w-0"><p className="truncate font-semibold">{p.name}</p><p className="text-sm text-muted-foreground">{p.relationship}{n ? ` · ${n.date.label}, ${calLong(n.on)}` : ""}</p></div>{n && <span className="text-sm font-semibold">{daysUntil(n.on)} days</span>}</Link></li>; })}</ul>
    <div className="mt-6 flex flex-wrap gap-3"><Button asChild><Link to="/calendar/my-dates">Manage my dates</Link></Button><Button asChild variant="outline"><Link to="/calendar">Open the Gift Calendar</Link></Button></div></div>;
}
