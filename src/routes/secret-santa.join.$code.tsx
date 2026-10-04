import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { SantaShell } from "@/components/santa/SantaShell";
import { SantaTimeline, Sparkles } from "@/components/santa/SantaParts";
import { BowTie } from "@/components/shop/BowTie";
import { PlaceholderTile } from "@/components/site/PlaceholderTile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { MAX_WISHLIST } from "@/config/secretSanta";
import { checkCode, giftsWithinBudget, joinExchange, saveHelpYourSanta, type CodeCheck } from "@/services/secretSanta";
import { formatLong } from "@/services/calendar";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/secret-santa/join/$code")({
  head: ({ params }) => ({ meta: [
    { title: `Join Secret Santa ${params.code} — Boxed by Dweenie` },
    { name: "description", content: "You've been invited to a Secret Santa. Join, add your wishlist and we'll handle the rest." },
    { property: "og:title", content: "You're invited to a Secret Santa" },
    { property: "og:description", content: "Join, add your wishlist and let Boxed by Dweenie wrap and deliver the gifts." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: Join,
});

const REASONS = {
  invalid: ["We couldn't find that code", "Check the code with your organiser and try again."],
  closed: ["This exchange has closed", "Contact your organiser if you think this is a mistake."],
  expired: ["Joining has closed", "The join-by date has passed or names have been drawn. Contact your organiser."],
  full: ["This exchange is full", "Contact your organiser to ask about a space."],
} as const;

function Join() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [check, setCheck] = useState<CodeCheck | null>(null);
  const [step, setStep] = useState<"details" | "help" | "done">("details");
  const [me, setMe] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [wish, setWish] = useState<string[]>([]);
  const [notes, setNotes] = useState({ likes: "", dislikes: "", sizes: "", noAlcohol: false, address: "" });
  const [error, setError] = useState("");
  useEffect(() => { checkCode(code).then(setCheck); }, [code]);

  if (!check) return <SantaShell><p className="py-24 text-center text-on-dark-muted" role="status">Checking your code…</p></SantaShell>;
  if (!check.ok) { const [h, l] = REASONS[check.reason]; return <SantaShell><main className="mx-auto max-w-md px-5 py-20 text-center"><BowTie className="h-16 w-24 opacity-60" /><h1 className="mt-6 text-2xl text-on-dark">{h}</h1><p className="mt-3 text-on-dark-muted">{l}</p><Button asChild className="mt-8"><Link to="/secret-santa" hash="join">Try another code</Link></Button></main></SantaShell>; }
  const ex = check.exchange;
  const gifts = giftsWithinBudget(ex.budget);

  return <SantaShell title={ex.name}>
    <main className="mx-auto max-w-xl px-5 py-8 md:py-12">
      {step === "details" && <>
        <div className="relative rounded-md border border-line-dark p-6"><Sparkles />
          {ex.logo && <img src={ex.logo} alt={`${ex.organisation ?? ex.name} logo`} className="mb-4 h-10 w-auto rounded-sm bg-paper p-1" />}
          <p className="eyebrow text-gold">You're invited</p>
          <h1 className="mt-3 text-2xl text-on-dark">{ex.name}</h1>
          <p className="mt-2 text-sm text-on-dark-muted">Organised by {ex.organiserName}{ex.organisation ? `, ${ex.organisation}` : ""}</p>
          {ex.welcome && <p className="mt-4 text-on-dark">"{ex.welcome}"</p>}
          <p className="mt-5 text-sm text-on-dark">Budget per gift <strong className="text-gold">{formatNaira(ex.budget)}</strong></p>
          <div className="mt-6"><SantaTimeline dates={ex.dates} dark /></div>
        </div>
        <form className="mt-8 space-y-5 [&_label]:text-on-dark" onSubmit={async (e) => { e.preventDefault(); if (!name.trim() || !contact.trim()) return setError("Add your name and an email or phone number."); setError(""); setMe(await joinExchange(ex.id, { name: name.trim(), contact: contact.trim() })); setStep("help"); }}>
          <div><Label htmlFor="name">Your name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="mt-2 min-h-11 border-line-dark bg-nero-soft text-on-dark" /></div>
          <div><Label htmlFor="contact">Email or phone</Label><Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="email" className="mt-2 min-h-11 border-line-dark bg-nero-soft text-on-dark" /></div>
          {error && <p role="alert" className="text-sm text-gold">{error}</p>}
          <Button type="submit" size="lg" className="w-full">Join this Secret Santa</Button>
        </form>
      </>}

      {step === "help" && <form onSubmit={async (e) => { e.preventDefault(); if (ex.delivery === "each" && !notes.address.trim()) return setError("Add your delivery address so your gift can reach you."); await saveHelpYourSanta(me, { ...notes, wishlist: wish, ...(ex.delivery === "each" ? {} : { address: undefined as unknown as string }) }); setStep("done"); }} className="space-y-6 [&_label]:text-on-dark">
        <div><p className="eyebrow text-gold">Help your Santa</p><h1 className="mt-3 text-2xl text-on-dark">Pick up to {MAX_WISHLIST} gifts you'd love</h1><p className="mt-2 text-sm text-on-dark-muted">All within {formatNaira(ex.budget)}. {wish.length}/{MAX_WISHLIST} chosen.</p></div>
        {gifts.length === 0 ? <p className="rounded-md border border-line-dark p-4 text-sm text-on-dark-muted">We're curating gifts at this budget. Add your likes below and your Santa will choose for you.</p> :
          <ul className="grid grid-cols-2 gap-3">{gifts.map((g) => { const on = wish.includes(g.id); return <li key={g.id}><button type="button" aria-pressed={on} disabled={!on && wish.length >= MAX_WISHLIST} onClick={() => setWish(on ? wish.filter((x) => x !== g.id) : [...wish, g.id])} className={cn("relative block w-full rounded-md border p-2 text-left transition-colors disabled:opacity-40", on ? "border-gold" : "border-line-dark")}>
            <PlaceholderTile label={g.name} className="aspect-square w-full" />{on && <span className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-gold text-nero"><Check className="size-4" /></span>}
            <p className="mt-2 text-xs font-semibold text-on-dark">{g.name}</p><p className="text-xs text-on-dark-muted">{formatNaira(g.price)}</p></button></li>; })}</ul>}
        <div><Label htmlFor="likes">Likes</Label><Textarea id="likes" rows={2} value={notes.likes} onChange={(e) => setNotes({ ...notes, likes: e.target.value })} className="mt-2 border-line-dark bg-nero-soft text-on-dark" /></div>
        <div><Label htmlFor="dislikes">Dislikes</Label><Textarea id="dislikes" rows={2} value={notes.dislikes} onChange={(e) => setNotes({ ...notes, dislikes: e.target.value })} className="mt-2 border-line-dark bg-nero-soft text-on-dark" /></div>
        <div><Label htmlFor="sizes">Sizes</Label><Input id="sizes" value={notes.sizes} onChange={(e) => setNotes({ ...notes, sizes: e.target.value })} className="mt-2 min-h-11 border-line-dark bg-nero-soft text-on-dark" /></div>
        <label className="flex min-h-11 items-center justify-between rounded-md border border-line-dark px-4 text-sm">No alcohol, please<Switch checked={notes.noAlcohol} onCheckedChange={(v) => setNotes({ ...notes, noAlcohol: v })} /></label>
        {ex.delivery === "each" && <div><Label htmlFor="address">Delivery address</Label><Textarea id="address" rows={3} value={notes.address} onChange={(e) => setNotes({ ...notes, address: e.target.value })} autoComplete="street-address" className="mt-2 border-line-dark bg-nero-soft text-on-dark" /></div>}
        {error && <p role="alert" className="text-sm text-gold">{error}</p>}
        <Button type="submit" size="lg" className="w-full">Save and finish</Button>
      </form>}

      {step === "done" && <div className="relative py-10 text-center"><Sparkles /><BowTie className="h-20 w-32" />
        <h1 className="mt-6 text-3xl text-on-dark">You're in.</h1>
        <p className="mt-3 text-on-dark-muted">Names are drawn on {formatLong(ex.dates.draw)}.</p>
        <Button className="mt-8" onClick={() => navigate({ to: "/secret-santa/$id", params: { id: ex.id } })}>Go to my Secret Santa</Button>
      </div>}
    </main>
  </SantaShell>;
}
