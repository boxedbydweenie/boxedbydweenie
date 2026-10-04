import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, Gift, Send, Shuffle, Users, Settings2 } from "lucide-react";
import { SantaShell } from "@/components/santa/SantaShell";
import { GiftBox, Sparkles } from "@/components/santa/SantaParts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/secret-santa/")({
  head: () => ({
    meta: [
      { title: "Secret Santa, sorted — Boxed by Dweenie" },
      { name: "description", content: "Run your office, family or friends' Secret Santa. We draw the names, wrap the gifts and deliver them anonymously across Lagos and Abuja." },
      { property: "og:title", content: "Secret Santa, sorted — Boxed by Dweenie" },
      { property: "og:description", content: "We draw the names, wrap the gifts and deliver them. You enjoy the reveal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const STEPS = [
  [Settings2, "Set up", "Name your exchange, set a budget and choose the dates."],
  [Send, "Invite", "Share one link or code on WhatsApp or email."],
  [Shuffle, "Draw", "We draw the names fairly, with any exclusions you set."],
  [Gift, "Gift", "Each Santa picks a gift. We wrap and deliver it anonymously."],
] as const;
const FAQS = [
  ["Can the organiser see who drew whom?", "Only if they choose to before the draw. Otherwise matches stay secret, even from the organiser."],
  ["What if someone joins late?", "People can join until the join-by date. After the draw, the organiser can contact us to add someone."],
  ["Can couples avoid drawing each other?", "Yes. The organiser can set exclusions, such as couples or a manager and a direct report."],
  ["Who pays for the gifts?", "Either each person pays for the gift they give, or the company pays for everyone. For company-paid exchanges we send one formal quote."],
  ["Where are gifts delivered?", "To one address for exchange day, or to each recipient's own address. Every gift arrives wrapped and signed \"From your Secret Santa\"."],
];

function Landing() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const valid = /^[A-Z0-9]{6}$/.test(code);
  return <SantaShell>
    <section className="relative overflow-hidden">
      <Sparkles />
      <div className="relative mx-auto grid max-w-5xl gap-10 px-5 py-14 md:grid-cols-[1.2fr_.8fr] md:items-center md:py-20">
        <div>
          <p className="eyebrow text-gold">Secret Santa</p><div className="foil mt-4 h-px w-14" />
          <h1 className="mt-5 text-4xl leading-tight text-on-dark md:text-6xl">Secret Santa, sorted.</h1>
          <p className="mt-5 max-w-md text-on-dark-muted">We draw the names, wrap the gifts and deliver them. You enjoy the reveal.</p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-start">
            <Button asChild size="lg"><Link to="/secret-santa/new">Start a Secret Santa</Link></Button>
            <form id="join" className="scroll-mt-20" onSubmit={(e) => { e.preventDefault(); if (valid) navigate({ to: "/secret-santa/join/$code", params: { code } }); }}>
              <label htmlFor="join-code" className="sr-only">Six-character join code</label>
              <div className="flex gap-2">
                <Input id="join-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))} placeholder="CODE" maxLength={6} autoCapitalize="characters" autoComplete="off" className="min-h-11 w-32 border-line-dark bg-nero-soft text-center font-semibold tracking-[0.3em] text-on-dark" />
                <Button type="submit" variant="outline" size="lg" disabled={!valid} className="text-on-dark">Join with a code</Button>
              </div>
              <p className="mt-2 text-xs text-on-dark-muted">Try the demo code BOX26A.</p>
            </form>
          </div>
        </div>
        <GiftBox lid="static" bow="tie" className="hidden md:block" />
      </div>
    </section>

    <section className="bg-paper py-14 text-nero md:py-20"><div className="mx-auto max-w-5xl px-5">
      <p className="eyebrow text-muted-foreground">How it works</p><div className="gold-rule mt-4 w-12" />
      <h2 className="mt-5 text-2xl md:text-3xl">Four steps to the reveal</h2>
      <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{STEPS.map(([Icon, t, l], i) => <li key={t} className="border-t border-border pt-5"><Icon className="size-6" /><p className="mt-4 text-xs font-semibold text-muted-foreground">0{i + 1}</p><h3 className="mt-1 text-base">{t}</h3><p className="mt-2 text-sm text-muted-foreground">{l}</p></li>)}</ol>
      <div className="mt-14 grid gap-5 md:grid-cols-2">
        <article className="surface-dark rounded-md p-7"><Building2 className="text-gold" /><h3 className="mt-5 text-lg text-on-dark">For offices and institutions</h3><p className="mt-3 text-sm text-on-dark-muted">Upload your staff list, add your logo, set exclusions and let the company pay for everyone if you like. One link for the whole team.</p><Button asChild className="mt-6"><Link to="/secret-santa/new">Set up for my team</Link></Button></article>
        <article className="rounded-md border border-border bg-ivory p-7"><Users /><h3 className="mt-5 text-lg">For family and friends</h3><p className="mt-3 text-sm text-muted-foreground">Share the code in your group chat. Everyone adds a wishlist, nobody sees the matches and every gift arrives beautifully wrapped.</p><Button asChild variant="outline" className="mt-6"><Link to="/secret-santa/new">Start for my group</Link></Button></article>
      </div>
    </div></section>

    <section className="bg-ivory py-14 text-nero md:py-20"><div className="mx-auto max-w-3xl px-5">
      <h2 className="text-2xl">Questions</h2>
      <Accordion type="single" collapsible className="mt-6">{FAQS.map(([q, a], i) => <AccordionItem key={q} value={`q${i}`}><AccordionTrigger className="text-left">{q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{a}</AccordionContent></AccordionItem>)}</Accordion>
    </div></section>

    <section className="py-14"><div className="mx-auto flex max-w-5xl flex-col gap-5 px-5 md:flex-row md:items-center md:justify-between">
      <h2 className="text-xl text-on-dark md:text-2xl">Want the company to pay for everyone's gift?</h2>
      <Button asChild><Link to="/corporate/quote">Get a corporate quote</Link></Button>
    </div></section>
  </SantaShell>;
}
