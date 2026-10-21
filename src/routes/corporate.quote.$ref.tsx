import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, Download, Mail, MessageCircle, Package, Pencil, Phone, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import logo from "@/assets/brand/logo";
import { SiteShell } from "@/components/site/SiteShell";
import { BowLoader, Button, Eyebrow, GoldRule, LoadingButton } from "@/components/site/Brand";
import { BowTie } from "@/components/shop/BowTie";
import { BRANDING, DELIVERY_MODES, PURPOSES } from "@/config/quoteRules";
import { formatDayMonth, formatNaira } from "@/lib/format";
import { getProductById } from "@/services/products";
import { emailQuote, getQuote, saveDraft } from "@/services/quotes";
import type { Quote } from "@/types/quote";

export const Route = createFileRoute("/corporate/quote/$ref")({
  head: ({ params }) => ({ meta: [
    { title: `Quote ${params.ref} — Boxed by Dweenie` },
    { name: "description", content: "Your corporate gift estimate, ready to download, email or discuss with your consultant." },
    { property: "og:title", content: "Your corporate gift quote — Boxed by Dweenie" },
    { property: "og:description", content: "Your estimate is ready. A consultant will be in touch within one working day." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: QuoteResult,
});

const WHATSAPP = "https://wa.me/2348134907391";
const fmtRange = (r: { low: number; high: number }) => (r.low === r.high ? formatNaira(r.low) : `${formatNaira(r.low)} to ${formatNaira(r.high)}`);
const longDate = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

function itemsOf(q: Quote) {
  return q.request.selections.map((id) => (id === "curate" ? "Curated selection" : getProductById(id)?.name ?? id));
}

function QuoteTable({ q }: { q: Quote }) {
  return <table className="w-full text-sm">
    <thead><tr className="border-b border-nero text-left"><th className="py-2 font-semibold">Item</th><th className="py-2 text-right font-semibold">Estimate</th></tr></thead>
    <tbody>{q.estimate.lines.map((l) => <tr key={l.label} className="border-b border-border align-top"><td className="py-3"><span className="block">{l.label}</span>{l.detail && <span className="text-xs text-muted-foreground">{l.detail}</span>}</td><td className="py-3 text-right">{l.negative && l.high > 0 ? "−" : ""}{fmtRange(l)}</td></tr>)}</tbody>
    <tfoot><tr><td className="pt-4 font-semibold">Estimated total</td><td className="pt-4 text-right text-base font-bold">{fmtRange(q.estimate.total)}</td></tr></tfoot>
  </table>;
}

function Details({ q }: { q: Quote }) {
  const r = q.request;
  const rows: [string, string][] = [
    ["Purpose", PURPOSES.find((p) => p.slug === r.purpose)?.name ?? "Not given"],
    ["Quantity", `${r.quantity.toLocaleString("en-NG")} gifts`],
    ["Budget per recipient", formatNaira(r.budget)],
    ["Starting point", itemsOf(q).join(", ")],
    ["Branding", BRANDING.filter((b) => r.branding.includes(b.key)).map((b) => b.name).join(", ") || "None"],
    ["Delivery", `${DELIVERY_MODES.find((m) => m.slug === r.deliveryMode)?.name}, ${r.locations.join(", ")}`],
    ["Required by", r.requiredBy ? `${longDate(r.requiredBy)}${q.estimate.rush ? " (rush)" : ""}` : "Not given"],
  ];
  return <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">{rows.map(([k, v]) => <div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></div>)}</dl>;
}

function PrintView({ q }: { q: Quote }) {
  return <div id="quote-print" className="hidden print:block">
    <div className="relative min-h-[297mm] w-[210mm] overflow-hidden bg-paper font-sans text-nero">
      <div className="pattern-bow absolute inset-y-0 right-0 w-[28mm] opacity-[0.15]" />
      <div className="relative px-[18mm] pb-[50mm] pt-[16mm] pr-[40mm]">
        <div className="inline-block rounded-sm bg-nero px-4 py-3"><img src={logo.url} alt="Boxed by Dweenie" className="h-10 w-auto" /></div>
        <div className="mt-10"><p className="eyebrow text-muted-foreground">Corporate gift estimate</p><h1 className="mt-2 text-2xl">Quote {q.ref}</h1><div className="gold-rule mt-3 w-12" /></div>
        <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
          <div><p className="font-semibold">Prepared for</p><p>{q.request.contact.name}</p><p>{q.request.contact.role}{q.request.contact.role ? ", " : ""}{q.request.contact.company}</p><p>{q.request.contact.email}</p><p>{q.request.contact.phone}</p></div>
          <div><p><span className="font-semibold">Date:</span> {longDate(q.createdAt)}</p><p><span className="font-semibold">Valid until:</span> {longDate(q.validUntil)}</p><p><span className="font-semibold">Status:</span> {q.status}</p></div>
        </div>
        <div className="mt-8"><Details q={q} /></div>
        <div className="mt-8"><QuoteTable q={q} /></div>
        <p className="mt-6 text-xs text-muted-foreground">Estimate only. Your consultant confirms the final quote. Prices in Naira and include VAT where shown.</p>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[38mm] bg-nero [clip-path:polygon(0_35%,100%_0,100%_100%,0_100%)]">
        <div className="absolute bottom-[8mm] left-[18mm] right-[18mm] flex justify-between text-xs text-on-dark-muted"><span>0813 490 7391 · hello@boxedbydweenie.com · @boxedbydweenie</span><span>A product of The Plug Shop Limited</span></div>
      </div>
    </div>
  </div>;
}

function QuoteResult() {
  const { ref } = Route.useParams();
  const [quote, setQuote] = useState<Quote | null | undefined>(undefined);
  const [revealed, setRevealed] = useState(false);
  const [emailing, setEmailing] = useState(false);
  useEffect(() => {
    getQuote(ref).then(setQuote);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => setRevealed(true), reduce ? 0 : 1600);
    return () => clearTimeout(t);
  }, [ref]);

  if (quote === undefined || (quote && !revealed)) return <SiteShell><main className="brand-pattern-green text-on-dark flex min-h-[70vh] flex-col items-center justify-center gap-6 px-5 text-center">{quote ? <><BowTie className="h-28 w-40" /><p className="eyebrow text-gold">Boxing your quote</p></> : <BowLoader label="Loading your quote" />}</main></SiteShell>;
  if (!quote) return <SiteShell><main className="bg-paper px-5 py-24 text-center"><h1 className="text-3xl">We could not find that quote</h1><p className="mt-4 text-muted-foreground">Check the link you were given, or build a new one in two minutes.</p><Button asChild className="mt-8"><Link to="/corporate/quote">Build a quote</Link></Button></main></SiteShell>;

  const q = quote;
  const wa = `${WHATSAPP}?text=${encodeURIComponent(`Hello, I have a question about quote ${q.ref}.`)}`;
  const sample = `${WHATSAPP}?text=${encodeURIComponent(`Hello, I would like to request a sample box for quote ${q.ref}.`)}`;
  const book = `${WHATSAPP}?text=${encodeURIComponent(`Hello, I would like to book a call about quote ${q.ref}.`)}`;
  const edit = async () => { await saveDraft(0, q.request); };

  return <SiteShell><main className="bg-paper print:hidden">
    <section className="brand-pattern-navy text-on-dark"><div className="mx-auto max-w-5xl px-5 py-14 md:py-16">
      <div className="flex flex-wrap items-center gap-3"><Eyebrow dark>Your quote</Eyebrow><span className="rounded-sm bg-gold px-2 py-1 text-[10px] font-bold uppercase text-nero">{q.status}</span></div>
      <h1 className="mt-4 text-3xl text-on-dark md:text-5xl">Your quote <span className="text-gold">{q.ref}</span></h1>
      <p className="mt-3 text-on-dark-muted">Created {longDate(q.createdAt)} · Valid until {longDate(q.validUntil)}</p>
      <p className="mt-6 text-2xl font-bold text-on-dark">{fmtRange(q.estimate.total)}</p>
    </div></section>

    <div className="mx-auto grid max-w-5xl gap-10 px-5 py-10 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={() => window.print()}><Download />Download PDF quote</Button>
          <LoadingButton size="lg" variant="outline" loading={emailing} onClick={async () => { setEmailing(true); const r = await emailQuote(q.ref, q.request.contact.email); setEmailing(false); (r.ok ? toast.success : toast.error)(r.message); }}><Mail />Email me this quote</LoadingButton>
          <Button asChild size="lg" variant="outline"><a href={book} target="_blank" rel="noreferrer"><CalendarClock />Book a call</a></Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-1">
          <Button asChild variant="ghost" size="sm"><Link to="/corporate/quote" onClick={edit}><Pencil />Edit quote</Link></Button>
          <Button asChild variant="ghost" size="sm"><a href={wa} target="_blank" rel="noreferrer"><MessageCircle />Chat on WhatsApp</a></Button>
          <Button asChild variant="ghost" size="sm"><a href={sample} target="_blank" rel="noreferrer"><Package />Request a sample box</a></Button>
        </div>
        <section className="mt-10"><h2 className="text-xl">Your brief</h2><GoldRule className="mb-5 mt-3" /><Details q={q} /></section>
        <section className="mt-10"><h2 className="text-xl">Estimate</h2><GoldRule className="mb-5 mt-3" /><QuoteTable q={q} /><p className="mt-4 text-xs text-muted-foreground">Estimate only. Your consultant confirms the final quote. Valid until {formatDayMonth(q.validUntil)}.</p></section>
      </div>
      <aside className="space-y-6">
        <div className="rounded-md border border-border bg-ivory p-6">
          <div className="flex items-center gap-4"><div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-nero text-on-dark" role="img" aria-label="Consultant photo placeholder"><UserRound /></div><div><p className="font-semibold">Your gifting consultant</p><p className="text-xs text-muted-foreground">Boxed by Dweenie corporate team</p></div></div>
          <p className="mt-4 text-sm">Your gifting consultant will contact you within one working day.</p>
          <a href="tel:+2348134907391" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4"><Phone className="size-4" />0813 490 7391</a>
        </div>
        <div className="surface-dark rounded-md p-6">
          <h2 className="text-lg text-on-dark">What happens next</h2>
          <ol className="mt-5 space-y-5">{[["We confirm", "Your consultant checks stock, branding and dates, then sends the final quote."], ["You approve", "Approve the quote and sample, and pay the deposit."], ["We box and deliver", "We produce, quality-check and deliver on your date."]].map(([t, l], i) => <li key={t} className="flex gap-4"><span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-gold text-sm text-gold">{i + 1}</span><span><span className="block text-sm font-semibold text-on-dark">{t}</span><span className="text-sm text-on-dark-muted">{l}</span></span></li>)}</ol>
        </div>
      </aside>
    </div>
  </main><PrintView q={q} /></SiteShell>;
}
