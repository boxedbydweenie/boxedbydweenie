import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  Gift, Award, Briefcase, Handshake, Crown, PartyPopper, Shirt, CreditCard,
  Package, Layers, Ribbon, MessageSquareText, Tag, ArrowRight, MessageCircle, FileDown, Check, X,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PlaceholderTile } from "@/components/site/PlaceholderTile";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  CORPORATE_PACKAGES, YEAR_END_DEADLINES, CONSULTATION_QUANTITIES, WHATSAPP_URL,
} from "@/config/corporate";
import { submitConsultation } from "@/services/corporate";
import { formatNaira, formatDayMonth } from "@/lib/format";
import type { ConsultationRequest, CorporatePurpose } from "@/types/corporate";

export const Route = createFileRoute("/corporate/")({
  head: () => ({
    meta: [
      { title: "Corporate Gifting in Nigeria — Boxed by Dweenie" },
      { name: "description", content: "Staff rewards, client gifts and event souvenirs, curated, branded and delivered anywhere in Nigeria." },
      { property: "og:title", content: "Corporate Gifting — Boxed by Dweenie" },
      { property: "og:description", content: "Curated, branded corporate gifts delivered anywhere in Nigeria. Get an instant quote." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CorporatePage,
});

const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-gold px-6 text-sm font-semibold text-nero transition-all duration-300 hover:brightness-105 hover:shadow-soft";
const btnOutlineDark =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-gold px-6 text-sm font-semibold text-on-dark transition-colors duration-300 hover:bg-gold hover:text-nero";
const btnOutlineLight =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-nero px-6 text-sm font-semibold text-nero transition-colors duration-300 hover:bg-nero hover:text-on-dark";

const SERVICES: { purpose: CorporatePurpose; icon: typeof Gift; title: string; line: string }[] = [
  { purpose: "year-end", icon: Gift, title: "Year-end and festive gifts", line: "Close the year with a box your team will remember." },
  { purpose: "employee-rewards", icon: Award, title: "Employee rewards and recognition", line: "Mark milestones, anniversaries and wins with care." },
  { purpose: "onboarding", icon: Briefcase, title: "Onboarding kits", line: "A warm welcome on day one, ready on every desk." },
  { purpose: "client-appreciation", icon: Handshake, title: "Client appreciation", line: "Thank the partners who keep your business moving." },
  { purpose: "executive", icon: Crown, title: "Executive gifts", line: "Refined pieces for boards, leaders and VIP guests." },
  { purpose: "event-souvenirs", icon: PartyPopper, title: "Event souvenirs and party favours", line: "Launches, retreats and dinners, beautifully finished." },
  { purpose: "branded-merchandise", icon: Shirt, title: "Branded merchandise", line: "Quality items carrying your logo with restraint." },
  { purpose: "gift-cards", icon: CreditCard, title: "Gift cards for staff", line: "Let every recipient choose their own favourite." },
];

const BRANDING = [
  { icon: Package, title: "Logo on the box lid", line: "Foil, emboss or print on our rigid keepsake boxes." },
  { icon: Layers, title: "Custom sleeve", line: "A printed band in your colours wrapped around each box." },
  { icon: Ribbon, title: "Branded ribbon", line: "Satin ribbon printed with your name or message." },
  { icon: MessageSquareText, title: "Printed message card", line: "A note from your CEO or team, on heavy card stock." },
  { icon: Tag, title: "Individual names", line: "Each recipient's name on their own box." },
];

const STEPS = [
  { title: "Brief", line: "Tell us the occasion, quantity, budget and date." },
  { title: "Curate", line: "We propose boxes matched to your people and brand." },
  { title: "Sample", line: "Approve a physical or photo sample before production." },
  { title: "Brand", line: "Your logo and message applied with care." },
  { title: "Box", line: "Every gift packed and checked by hand." },
  { title: "Deliver", line: "On time, tracked, to every address you need." },
];

const WORK = [
  "Year-end hamper, banking client",
  "Onboarding kit, tech firm",
  "Executive box, law firm",
  "Client gift, energy company",
  "Event favours, product launch",
  "Staff reward, FMCG team",
];

const TESTIMONIALS = [
  { quote: "REPLACE: Every one of our 300 staff boxes arrived on time and looked exactly like the sample.", name: "REPLACE Name", title: "HR Manager", company: "REPLACE Company" },
  { quote: "REPLACE: Our clients still mention the year-end gift. The branding was subtle and very classy.", name: "REPLACE Name", title: "Head of Marketing", company: "REPLACE Company" },
  { quote: "REPLACE: A formal quote within hours and invoicing that made procurement easy.", name: "REPLACE Name", title: "Procurement Lead", company: "REPLACE Company" },
];

const FAQS = [
  { q: "What is the minimum order quantity?", a: "Corporate orders start from 25 gifts. Smaller orders are welcome through our online shop." },
  { q: "How much lead time do you need?", a: "Allow three to four weeks for branded orders and one to two weeks for unbranded boxes. Rush orders may be possible with a surcharge." },
  { q: "What are your payment terms and how do you invoice?", a: "We issue a formal quote and invoice. A deposit confirms production, with the balance due before dispatch." },
  { q: "Do you charge VAT and handle withholding tax?", a: "Our invoices show VAT clearly. We can accommodate withholding tax deductions and provide the receipts you need." },
  { q: "Can you provide vendor registration documents?", a: "Yes. We can share our CAC certificate, TIN and other documents your procurement team requires." },
  { q: "Do you deliver outside Lagos?", a: "Yes. We deliver to Abuja and across Nigeria, to one office, several branches or individual home addresses." },
  { q: "Can we see a sample first?", a: "Yes. We provide a photo or physical sample for approval before full production begins." },
  { q: "Can you store gifts and send them through the year?", a: "Yes. We can hold boxes and dispatch them for birthdays, anniversaries and onboarding as they come up." },
];

function CorporatePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Hero />
        <TrustStrip />
        <WhatWeDo />
        <Packages />
        <MakeItYours />
        <HowItWorks />
        <KeyDates />
        <SelectedWork />
        <Testimonials />
        <Faq />
        <Consultation />
      </main>
      <SiteFooter />
      <StickyCta />
    </div>
  );
}

function SectionHead({ eyebrow, title, dark, center }: { eyebrow: string; title: string; dark?: boolean; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className={`eyebrow ${dark ? "text-gold" : "text-muted-foreground"}`}>{eyebrow}</p>
      <div className={`gold-rule mt-4 w-12 ${center ? "mx-auto" : ""}`} />
      <h2 className="mt-5 text-2xl md:text-3xl">{title}</h2>
    </div>
  );
}

function Hero() {
  return (
    <section className="surface-dark relative overflow-hidden">
      <div className="pattern-leaf pointer-events-none absolute inset-0 opacity-[0.07]" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 md:py-24 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="eyebrow text-gold">Corporate gifting</p>
          <div className="foil mt-5 h-px w-20" />
          <h1 className="mt-6 text-3xl leading-tight md:text-5xl">Gifts that say what your brand means</h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-on-dark-muted md:text-lg">
            Staff rewards, client gifts and event souvenirs, curated, branded and delivered anywhere in Nigeria.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/corporate/quote" className={btnPrimary}>Get an instant quote <ArrowRight className="size-4" /></Link>
            <a href="#consultation" className={btnOutlineDark}>Book a consultation</a>
          </div>
          <a href="#selected-work" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-on-dark underline decoration-gold underline-offset-4 hover:text-gold">
            <FileDown className="size-4 text-gold" /> Download the corporate look book
          </a>
        </div>
        <PlaceholderTile tone="dark" label="Stack of branded gift boxes" className="aspect-[4/3] w-full" />
      </div>
    </section>
  );
}

function TrustStrip() {
  const proofs = [
    { value: "REPLACE", label: "Gifts delivered" },
    { value: "REPLACE", label: "Companies served" },
    { value: "REPLACE", label: "On-time delivery rate" },
  ];
  return (
    <section className="bg-ivory py-12">
      <div className="mx-auto max-w-7xl px-5">
        <p className="eyebrow text-center text-muted-foreground">Trusted by teams across Nigeria</p>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="flex h-16 items-center justify-center rounded-md border border-dashed border-input text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Client logo
            </li>
          ))}
        </ul>
        <dl className="mt-10 grid gap-6 border-t border-border pt-8 sm:grid-cols-3">
          {proofs.map((p) => (
            <div key={p.label} className="text-center">
              <dt className="eyebrow text-muted-foreground">{p.label}</dt>
              <dd className="mt-2 font-heading text-2xl text-nero">{p.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function WhatWeDo() {
  return (
    <section className="surface-dark py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHead dark eyebrow="What we do" title="Every occasion, one gifting partner" />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map(({ purpose, icon: Icon, title, line }) => (
            <li key={purpose}>
              <Link
                to="/corporate/quote"
                search={{ purpose }}
                className="group flex h-full flex-col rounded-md border border-line-dark bg-nero-soft p-6 transition-colors duration-300 hover:border-gold"
              >
                <Icon className="size-6 text-gold" strokeWidth={1.4} aria-hidden />
                <h3 className="mt-5 text-sm leading-snug">{title}</h3>
                <p className="mt-2 flex-1 text-sm text-on-dark-muted">{line}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                  Quote <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Packages() {
  return (
    <section className="bg-paper py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHead center eyebrow="Packages by budget" title="Choose a starting point" />
        <ul className="mt-12 grid gap-6 md:grid-cols-3 md:items-stretch">
          {CORPORATE_PACKAGES.map((p) => (
            <li
              key={p.id}
              className={`relative flex flex-col rounded-md bg-paper p-8 shadow-soft ${p.highlighted ? "border-2 border-gold md:-translate-y-3" : "border border-border"}`}
            >
              {p.highlighted && (
                <span className="absolute -top-3 left-8 rounded-sm bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-nero">Most chosen</span>
              )}
              <h3 className="text-xl">{p.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.summary}</p>
              <p className="mt-6 text-sm text-muted-foreground">
                from <span className="text-3xl font-bold text-nero">{formatNaira(p.fromPrice)}</span> per recipient
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {p.includes.map((i) => (
                  <li key={i} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-nero" aria-hidden />{i}</li>
                ))}
              </ul>
              <Link to="/corporate/quote" search={{ package: p.id }} className={`mt-8 ${p.highlighted ? btnPrimary : btnOutlineLight}`}>
                Build a quote
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center text-xs text-muted-foreground">Indicative prices. Your final quote depends on items, branding and delivery.</p>
      </div>
    </section>
  );
}

function MakeItYours() {
  return (
    <section className="grid lg:grid-cols-[2fr_3fr]">
      <div className="surface-dark relative flex items-center overflow-hidden px-5 py-16 md:px-12">
        <div className="pattern-bow-light pointer-events-none absolute inset-0 opacity-[0.06]" />
        <div className="relative">
          <SectionHead dark eyebrow="Make it yours" title="Your brand, beautifully finished" />
          <p className="mt-5 max-w-sm text-on-dark-muted">Branding that feels like a gift, not an advert. Mix and match any of these.</p>
        </div>
      </div>
      <ul className="grid gap-px bg-border sm:grid-cols-2">
        {BRANDING.map(({ icon: Icon, title, line }) => (
          <li key={title} className="flex gap-5 bg-ivory p-8">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-md border border-gold bg-paper">
              <Icon className="size-6 text-nero" strokeWidth={1.4} aria-hidden />
            </div>
            <div>
              <h3 className="text-sm">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{line}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="surface-dark py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHead dark eyebrow="How it works" title="From brief to doorstep in six steps" />
        <ol className="relative mt-12 grid gap-8 lg:grid-cols-6 lg:gap-4">
          <div className="absolute left-5 top-0 h-full w-px bg-gold/40 lg:left-0 lg:top-5 lg:h-px lg:w-full" aria-hidden />
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative flex gap-5 lg:flex-col lg:gap-4">
              <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border border-gold bg-nero font-heading text-sm text-gold">
                {i + 1}
              </span>
              <div>
                <h3 className="text-sm">{s.title}</h3>
                <p className="mt-1 text-sm text-on-dark-muted">{s.line}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-12 border-t border-line-dark pt-6 text-sm text-on-dark-muted">
          Deliver to one office, several branches, or each recipient's home address.
        </p>
      </div>
    </section>
  );
}

function KeyDates() {
  return (
    <section className="bg-ivory">
      <div className="foil h-px" />
      <div className="mx-auto max-w-7xl px-5 py-16">
        <SectionHead center eyebrow="Plan ahead" title="Year-end 2026 deadlines" />
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {YEAR_END_DEADLINES.map((d) => (
            <li key={d.date} className="rounded-md border border-border bg-paper p-6 text-center shadow-soft">
              <time dateTime={d.date} className="font-heading text-2xl text-nero">{formatDayMonth(d.date)}</time>
              <div className="gold-rule mx-auto my-4 w-8" />
              <p className="text-sm">{d.label}</p>
              {d.note && <p className="mt-1 text-xs text-muted-foreground">{d.note}</p>}
            </li>
          ))}
        </ul>
      </div>
      <div className="foil h-px" />
    </section>
  );
}

function SelectedWork() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="selected-work" className="surface-dark scroll-mt-16 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHead dark eyebrow="Selected work" title="Boxes we are proud of" />
          <a href="#selected-work" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-gold hover:underline">
            View the Look Book <ArrowRight className="size-4" />
          </a>
        </div>
        <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {WORK.map((w, i) => (
            <li key={w}>
              <button onClick={() => setOpen(i)} className="block w-full rounded-md transition-transform duration-300 hover:-translate-y-1" aria-label={`View ${w}`}>
                <PlaceholderTile label={w} tone={i % 2 ? "dark" : "ivory"} className="aspect-square w-full" />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">{open !== null ? WORK[open] : ""}</DialogTitle>
          {open !== null && (
            <div className="relative">
              <PlaceholderTile label={WORK[open] ?? ""} tone="ivory" className="aspect-[4/3] w-full" />
              <button onClick={() => setOpen(null)} aria-label="Close" className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full bg-nero text-on-dark">
                <X className="size-5" />
              </button>
              <div className="absolute inset-x-3 bottom-3 flex justify-between">
                <button onClick={() => setOpen((open + WORK.length - 1) % WORK.length)} className="min-h-11 rounded-md bg-nero px-4 text-sm text-on-dark">Previous</button>
                <button onClick={() => setOpen((open + 1) % WORK.length)} className="min-h-11 rounded-md bg-nero px-4 text-sm text-on-dark">Next</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="bg-paper py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHead center eyebrow="What clients say" title="Trusted with the moments that matter" />
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <li key={i}>
              <figure className="flex h-full flex-col rounded-md border-t-2 border-gold bg-ivory p-8">
                <blockquote className="flex-1 leading-relaxed">“{t.quote}”</blockquote>
                <figcaption className="mt-6 text-sm">
                  <span className="font-semibold">{t.name}</span>
                  <span className="block text-muted-foreground">{t.title}, {t.company}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="bg-ivory py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-5">
        <SectionHead center eyebrow="Questions" title="Good to know" />
        <Accordion type="single" collapsible className="mt-10">
          {FAQS.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="min-h-11 text-left text-base font-semibold">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {f.a}
                <span className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.2em]">To be confirmed</span>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

const fieldCls =
  "mt-2 block min-h-11 w-full rounded-md border border-input bg-paper px-3 py-2 text-sm text-nero focus:border-nero focus:outline-none focus-visible:outline-2 focus-visible:outline-gold";

function Consultation() {
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [reference, setReference] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries()) as unknown as ConsultationRequest;
    setStatus("sending");
    const res = await submitConsultation(data);
    setReference(res.reference);
    setStatus("done");
  }

  return (
    <section id="consultation" className="scroll-mt-16 bg-ivory pb-16 md:pb-24">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-[3fr_2fr]">
        <div className="rounded-md border border-border bg-paper p-6 shadow-soft md:p-10">
          <SectionHead eyebrow="Book a consultation" title="Tell us about your gifting" />
          {status === "done" ? (
            <div className="mt-8 rounded-md border border-gold p-8 text-center" role="status">
              <div className="foil mx-auto flex size-14 items-center justify-center rounded-full"><Check className="size-6 text-nero" /></div>
              <p className="mt-5 eyebrow text-muted-foreground">Your reference</p>
              <p className="mt-2 font-heading text-2xl">{reference}</p>
              <p className="mt-4 text-muted-foreground">We will be in touch within one working day.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-8 grid gap-5 sm:grid-cols-2">
              <Field label="Full name" name="name" required autoComplete="name" />
              <Field label="Company" name="company" required autoComplete="organization" />
              <Field label="Work email" name="email" type="email" required autoComplete="email" />
              <Field label="Phone" name="phone" type="tel" required autoComplete="tel" />
              <Field label="Role" name="role" autoComplete="organization-title" />
              <label className="text-sm font-medium">
                Estimated quantity
                <select name="quantity" required defaultValue="" className={fieldCls}>
                  <option value="" disabled>Select a range</option>
                  {CONSULTATION_QUANTITIES.map((q) => <option key={q}>{q}</option>)}
                </select>
              </label>
              <Field label="Required by" name="requiredBy" type="date" />
              <label className="text-sm font-medium sm:col-span-2">
                Message
                <textarea name="message" rows={4} className={fieldCls} placeholder="Occasion, budget per recipient, branding ideas" />
              </label>
              <div className="sm:col-span-2">
                <button type="submit" disabled={status === "sending"} className={`${btnPrimary} w-full sm:w-auto disabled:opacity-60`}>
                  {status === "sending" ? "Sending" : "Request a consultation"}
                </button>
              </div>
            </form>
          )}
        </div>
        <aside className="surface-dark relative flex flex-col gap-6 overflow-hidden rounded-md p-8 md:p-10">
          <div className="pattern-leaf pointer-events-none absolute inset-0 opacity-[0.06]" />
          <div className="relative">
            <MessageCircle className="size-7 text-gold" strokeWidth={1.4} aria-hidden />
            <h3 className="mt-4 text-lg">Prefer to talk?</h3>
            <p className="mt-2 text-on-dark-muted">Chat with a gifting consultant on WhatsApp.</p>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className={`mt-5 ${btnPrimary}`}>Chat on WhatsApp</a>
          </div>
          <div className="gold-rule relative opacity-40" />
          <div className="relative">
            <FileDown className="size-7 text-gold" strokeWidth={1.4} aria-hidden />
            <h3 className="mt-4 text-lg">Company profile</h3>
            <p className="mt-2 text-on-dark-muted">Everything procurement needs, in one document.</p>
            <a href="#consultation" className={`mt-5 ${btnOutlineDark}`}>Download our company profile (PDF)</a>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input {...props} className={fieldCls} />
    </label>
  );
}

function StickyCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      className={`fixed z-50 transition-all duration-500 ease-out inset-x-0 bottom-0 md:inset-x-auto md:bottom-auto md:right-6 md:top-20 ${show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0 md:-translate-y-4"}`}
    >
      <div className="surface-dark border-t border-gold/40 p-3 md:rounded-full md:border md:p-1.5 md:shadow-soft">
        <Link to="/corporate/quote" tabIndex={show ? 0 : -1} className={`${btnPrimary} w-full md:rounded-full`}>
          Get an instant quote <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
