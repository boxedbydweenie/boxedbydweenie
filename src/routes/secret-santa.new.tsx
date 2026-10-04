import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Copy, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { SantaShell } from "@/components/santa/SantaShell";
import { SantaTimeline, Sparkles } from "@/components/santa/SantaParts";
import { BowTie } from "@/components/shop/BowTie";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SANTA_BUDGETS } from "@/config/secretSanta";
import { createExchange, dateWarnings } from "@/services/secretSanta";
import { addDays, todayIso } from "@/services/calendar";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DeliveryMode, Exchange, ExchangeType, Payer } from "@/types/secretSanta";

export const Route = createFileRoute("/secret-santa/new")({
  head: () => ({ meta: [
    { title: "Start a Secret Santa — Boxed by Dweenie" },
    { name: "description", content: "Set up your Secret Santa in four short steps: basics, rules, dates and delivery." },
    { property: "og:title", content: "Start a Secret Santa — Boxed by Dweenie" },
    { property: "og:description", content: "Set up your gift exchange in minutes." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: CreateExchange,
});

const TYPES: [ExchangeType, string][] = [["office", "Office or institution"], ["family", "Family"], ["friends", "Friends"]];
const STEP_NAMES = ["Basics", "Rules", "Dates", "Delivery"];

function Choice({ active, onClick, children, sub }: { active: boolean; onClick: () => void; children: string; sub?: string }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={cn("min-h-11 w-full rounded-md border px-4 py-3 text-left text-sm transition-colors", active ? "border-gold bg-nero-soft text-on-dark" : "border-line-dark text-on-dark-muted hover:border-on-dark-muted")}>
    <span className="font-semibold text-on-dark">{children}</span>{sub && <span className="mt-1 block text-xs">{sub}</span>}
  </button>;
}

function CreateExchange() {
  const t = todayIso();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Exchange | null>(null);
  const [f, setF] = useState({
    name: "", organiserName: "", type: "office" as ExchangeType, organisation: "", logo: "", welcome: "",
    budget: 15000, custom: "", payer: "each" as Payer, organiserTakesPart: true,
    dates: { joinBy: addDays(t, 14), draw: addDays(t, 17), orderBy: addDays(t, 28), exchange: addDays(t, 40) },
    delivery: "one-address" as DeliveryMode, address: "",
  });
  const set = (p: Partial<typeof f>) => setF({ ...f, ...p });
  const warnings = dateWarnings(f.dates);
  const budget = f.custom ? Number(f.custom) : f.budget;

  const next = async () => {
    if (step === 0 && (!f.name.trim() || !f.organiserName.trim())) return setError("Add an exchange name and your name.");
    if (step === 1 && (!budget || budget < 1000)) return setError("Choose a budget of at least ₦1,000.");
    if (step === 2 && Object.values(f.dates).some((d) => !d)) return setError("Fill in all four dates.");
    if (step === 3 && f.delivery === "one-address" && !f.address.trim()) return setError("Add the delivery address for exchange day.");
    setError("");
    if (step < 3) return setStep(step + 1);
    const ex = await createExchange({
      name: f.name.trim(), organiserName: f.organiserName.trim(), type: f.type, ...(f.type === "office" && f.organisation ? { organisation: f.organisation } : {}), ...(f.logo ? { logo: f.logo } : {}),
      welcome: f.welcome.trim(), budget, payer: f.payer, organiserTakesPart: f.organiserTakesPart, dates: f.dates, delivery: f.delivery, ...(f.delivery === "one-address" ? { address: f.address.trim() } : {}),
    });
    setCreated(ex);
  };

  if (created) return <Success exchange={created} />;

  return <SantaShell title="New Secret Santa">
    <main className="mx-auto max-w-xl px-5 py-8 md:py-12">
      <p className="eyebrow text-gold">Step {step + 1} of 4 · {STEP_NAMES[step]}</p>
      <div className="mt-3 flex gap-1" aria-hidden>{STEP_NAMES.map((_, i) => <span key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-gold" : "bg-line-dark")} />)}</div>
      <div className="mt-8 space-y-6 [&_label]:text-on-dark">
        {step === 0 && <>
          <h1 className="text-2xl text-on-dark">The basics</h1>
          <div><Label htmlFor="ex-name">Exchange name</Label><Input id="ex-name" value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="Finance team Christmas 2026" className="mt-2 min-h-11 border-line-dark bg-nero-soft text-on-dark" /></div>
          <div><Label htmlFor="org-name">Your name</Label><Input id="org-name" value={f.organiserName} onChange={(e) => set({ organiserName: e.target.value })} autoComplete="name" className="mt-2 min-h-11 border-line-dark bg-nero-soft text-on-dark" /></div>
          <fieldset><legend className="text-sm font-medium text-on-dark">Type</legend><div className="mt-2 grid gap-2 sm:grid-cols-3">{TYPES.map(([v, l]) => <Choice key={v} active={f.type === v} onClick={() => set({ type: v })}>{l}</Choice>)}</div></fieldset>
          {f.type === "office" && <>
            <div><Label htmlFor="org">Organisation name</Label><Input id="org" value={f.organisation} onChange={(e) => set({ organisation: e.target.value })} autoComplete="organization" className="mt-2 min-h-11 border-line-dark bg-nero-soft text-on-dark" /></div>
            <div><Label htmlFor="logo">Logo (optional)</Label><input id="logo" type="file" accept="image/*" className="mt-2 block w-full text-sm text-on-dark-muted" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const r = new FileReader(); r.onload = () => set({ logo: String(r.result) }); r.readAsDataURL(file); }} />{f.logo && <img src={f.logo} alt="Uploaded logo" className="mt-3 h-12 w-auto rounded-sm bg-paper p-1" />}</div>
          </>}
          <div><Label htmlFor="welcome">Welcome message</Label><Textarea id="welcome" rows={3} value={f.welcome} onChange={(e) => set({ welcome: e.target.value })} placeholder="Keep it thoughtful, keep it secret." className="mt-2 border-line-dark bg-nero-soft text-on-dark" /></div>
        </>}

        {step === 1 && <>
          <h1 className="text-2xl text-on-dark">The rules</h1>
          <fieldset><legend className="text-sm font-medium text-on-dark">Budget per gift</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">{SANTA_BUDGETS.map((b) => <Choice key={b} active={!f.custom && f.budget === b} onClick={() => set({ budget: b, custom: "" })}>{formatNaira(b)}</Choice>)}
              <Input aria-label="Custom budget in naira" type="number" min={1000} step={500} placeholder="Custom ₦" value={f.custom} onChange={(e) => set({ custom: e.target.value })} className={cn("min-h-11 h-full border-line-dark bg-nero-soft text-on-dark", f.custom && "border-gold")} /></div></fieldset>
          <fieldset><legend className="text-sm font-medium text-on-dark">Who pays?</legend><div className="mt-2 grid gap-2">
            <Choice active={f.payer === "each"} onClick={() => set({ payer: "each" })} sub="Everyone buys the gift they give.">Each person pays for the gift they give</Choice>
            <Choice active={f.payer === "company"} onClick={() => set({ payer: "company" })} sub="We send one formal quote for all gifts.">The company pays for all gifts</Choice>
          </div></fieldset>
          <label className="flex min-h-11 items-center justify-between gap-4 rounded-md border border-line-dark px-4 text-sm">I am taking part too<Switch checked={f.organiserTakesPart} onCheckedChange={(v) => set({ organiserTakesPart: v })} /></label>
        </>}

        {step === 2 && <>
          <h1 className="text-2xl text-on-dark">The dates</h1>
          <div className="grid grid-cols-2 gap-4">{([["joinBy", "Join by"], ["draw", "Draw date"], ["orderBy", "Order by"], ["exchange", "Exchange day"]] as const).map(([k, l]) => <div key={k}><Label htmlFor={k}>{l}</Label><Input id={k} type="date" min={t} value={f.dates[k]} onChange={(e) => set({ dates: { ...f.dates, [k]: e.target.value } })} className="mt-2 min-h-11 border-line-dark bg-nero-soft text-on-dark [color-scheme:dark]" /></div>)}</div>
          <div className="rounded-md border border-line-dark p-4"><SantaTimeline dates={f.dates} dark /></div>
          {warnings.length > 0 && <ul role="alert" className="space-y-2 rounded-md border border-gold p-4 text-sm text-on-dark">{warnings.map((w) => <li key={w} className="flex gap-2"><AlertTriangle className="size-4 shrink-0 text-gold" />{w}</li>)}</ul>}
        </>}

        {step === 3 && <>
          <h1 className="text-2xl text-on-dark">Delivery</h1>
          <div className="grid gap-2">
            <Choice active={f.delivery === "one-address"} onClick={() => set({ delivery: "one-address" })} sub="Perfect for an office party or family gathering.">All gifts to one address for exchange day</Choice>
            <Choice active={f.delivery === "each"} onClick={() => set({ delivery: "each" })} sub="Each person adds their address when they join.">Each gift to the recipient's own address</Choice>
          </div>
          {f.delivery === "one-address" && <div><Label htmlFor="addr">Delivery address</Label><Textarea id="addr" rows={3} value={f.address} onChange={(e) => set({ address: e.target.value })} autoComplete="street-address" className="mt-2 border-line-dark bg-nero-soft text-on-dark" /></div>}
        </>}
        {error && <p role="alert" className="text-sm text-gold">{error}</p>}
      </div>
      <div className="mt-10 flex justify-between gap-3 border-t border-line-dark pt-5">
        {step ? <Button variant="ghost" className="text-on-dark" onClick={() => setStep(step - 1)}>Back</Button> : <Button asChild variant="ghost" className="text-on-dark"><Link to="/secret-santa">Cancel</Link></Button>}
        <Button onClick={next}>{step < 3 ? "Continue" : "Create my Secret Santa"}</Button>
      </div>
    </main>
  </SantaShell>;
}

function Success({ exchange }: { exchange: Exchange }) {
  const link = typeof window !== "undefined" ? `${window.location.origin}/secret-santa/join/${exchange.code}` : "";
  const text = `You're invited to "${exchange.name}" Secret Santa. Join here: ${link} (code ${exchange.code})`;
  return <SantaShell title={exchange.name}>
    <main className="relative mx-auto max-w-xl px-5 py-12 text-center">
      <Sparkles />
      <BowTie className="h-20 w-32" />
      <h1 className="mt-6 text-3xl text-on-dark">Your Secret Santa is ready</h1>
      <p className="mt-3 text-on-dark-muted">Share the link or code. People can join until {new Date(`${exchange.dates.joinBy}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}.</p>
      <div className="mt-8 rounded-md border border-line-dark p-6">
        <p className="eyebrow text-on-dark-muted">Join code</p>
        <p className="mt-2 font-heading text-4xl tracking-[0.3em] text-gold">{exchange.code}</p>
        <p className="mt-4 break-all text-sm text-on-dark-muted">{link}</p>
        <div className="mx-auto mt-6 flex size-28 items-center justify-center border border-dashed border-line-dark text-[10px] uppercase tracking-[0.2em] text-on-dark-muted">QR code</div>
      </div>
      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        <Button asChild><a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer"><MessageCircle /> Share on WhatsApp</a></Button>
        <Button variant="outline" className="text-on-dark" onClick={() => { navigator.clipboard?.writeText(link); toast("Link copied"); }}><Copy /> Copy link</Button>
        <Button asChild variant="outline" className="text-on-dark"><a href={`mailto:?subject=${encodeURIComponent(`Join our Secret Santa: ${exchange.name}`)}&body=${encodeURIComponent(text)}`}><Mail /> Email invites</a></Button>
      </div>
      <Button asChild variant="link" className="mt-6 text-on-dark"><Link to="/secret-santa/$id/manage" params={{ id: exchange.id }}>Go to my dashboard</Link></Button>
    </main>
  </SantaShell>;
}
