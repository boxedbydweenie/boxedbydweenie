import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Award, Briefcase, Check, CreditCard, Crown, Gift, Handshake, MessageCircle, PartyPopper, Shirt, ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Photo, useScrollReveal } from "@/components/home/Photo";
import { ClientWall, Label, Reviews, StatBadges, WRAP } from "@/components/brand/ProfileSections";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CONSULTATION_QUANTITIES, WHATSAPP_URL } from "@/config/corporate";
import { getBrand } from "@/services/brand";
import { submitConsultation } from "@/services/corporate";
import type { ConsultationRequest, CorporatePurpose } from "@/types/corporate";

export const Route = createFileRoute("/corporate/")({
  loader: () => getBrand(),
  head: () => ({ meta: [
    { title: "Corporate Gifting in Nigeria — Boxed by Dweenie" },
    { name: "description", content: "Over 5,000 boxes delivered to over 450 clients. Staff rewards, client gifts and event souvenirs, curated, branded and delivered anywhere in Nigeria." },
    { property: "og:title", content: "Corporate Gifting — Boxed by Dweenie" },
    { property: "og:description", content: "Curated, branded corporate gifts delivered anywhere in Nigeria. Get an instant quote or book a consultation." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: CorporatePage,
});

const btnGold = "group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-gold px-9 text-[15px] font-semibold text-nero shadow-[0_18px_40px_-16px_rgba(231,185,59,.7)] transition duration-300 hover:-translate-y-0.5 hover:brightness-105";
const btnLine = "inline-flex min-h-14 items-center justify-center gap-3 rounded-full border border-on-dark/70 px-9 text-[15px] font-semibold text-on-dark transition duration-300 hover:-translate-y-0.5 hover:border-gold hover:bg-gold hover:text-nero";

const SERVICES: { purpose: CorporatePurpose; icon: typeof Gift; title: string; line: string; tone: string }[] = [
  { purpose: "year-end", icon: Gift, title: "Year-end and festive gifts", line: "Close the year with a box your team will remember.", tone: "tone-forest" },
  { purpose: "employee-rewards", icon: Award, title: "Staff rewards and recognition", line: "Mark milestones, anniversaries and wins with care.", tone: "tone-navy" },
  { purpose: "onboarding", icon: Briefcase, title: "Welcomes and onboarding", line: "A warm welcome, ready on every desk on day one.", tone: "tone-plum" },
  { purpose: "client-appreciation", icon: Handshake, title: "Client appreciation", line: "Thank the partners who keep your business moving.", tone: "tone-oxblood" },
  { purpose: "executive", icon: Crown, title: "Executive and prestige gifts", line: "Refined pieces for boards, leaders and VIP guests.", tone: "tone-beige" },
  { purpose: "event-souvenirs", icon: PartyPopper, title: "Events and souvenirs", line: "Launches, retreats and dinners, beautifully finished.", tone: "tone-coral" },
  { purpose: "branded-merchandise", icon: Shirt, title: "Prints and branding", line: "Your logo and message, printed with restraint.", tone: "tone-sage" },
  { purpose: "gift-cards", icon: CreditCard, title: "Gift cards", line: "Let every recipient choose their own favourite.", tone: "tone-nero" },
];

const STEPS = [
  ["Share your brief", "Tell us your budget, quantity and timeline."],
  ["Recommend and design", "We propose gift options to suit your recipients."],
  ["Personalise", "We add your logo and your message."],
  ["Wrap", "Each gift is boxed, wrapped and finished."],
  ["Deliver", "We deliver anywhere in Nigeria."],
] as const;

const FAQS = [
  ["How quickly will I get a quote?", "Send us two numbers: how many people, and your budget per person. We reply with three priced options within 24 hours."],
  ["Can you work within our budget and timeframe?", "Yes. We are happy to work within your budget and timeframe, especially during the Christmas season. Confirm your order by 20 November for delivery before Christmas."],
  ["Can we see a sample first?", "Yes. We can bring a sample box to your office so you can judge the quality before you decide. It takes 15 minutes."],
  ["Can you add our logo and message?", "Yes. We offer prints and branding, gift wrapping and personalised messages, so every box carries your brand with care."],
  ["Where do you deliver?", "We deliver anywhere in Nigeria, to one office, several branches or individual addresses."],
] as const;

function CorporatePage() {
  const brand = Route.useLoaderData();
  useScrollReveal();
  return <SiteShell><main data-feature="corporate">
    {/* Hero: Royal Navy with the woven pattern */}
    <section className="brand-pattern-navy relative overflow-hidden text-on-dark">
      <div className={`${WRAP} grid gap-14 py-16 md:py-24 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-32`}>
        <div>
          <h1 className="text-[2.75rem] leading-[1.02] md:text-7xl">
            <span className="rise" style={{ "--d": 0 } as React.CSSProperties}><span>Welcome to the</span></span>
            <span className="rise text-gold" style={{ "--d": 1 } as React.CSSProperties}><span>premium way</span></span>
            <span className="rise" style={{ "--d": 2 } as React.CSSProperties}><span>to say thank you.</span></span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-on-dark-muted">Staff rewards, client gifts and event souvenirs. Curated, branded and delivered anywhere in Nigeria, for over 450 companies and counting.</p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link to="/corporate/quote" className={btnGold}>Get an instant quote <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link>
            <a href="#consultation" className={btnLine}>Book a consultation</a>
          </div>
          <Link to="/profile" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-on-dark underline decoration-gold underline-offset-4 hover:text-gold">Read our company profile online <ArrowRight className="size-4 text-gold" /></Link>
          <p className="mt-4 text-sm text-on-dark-muted">Confirm your order by <b className="text-on-dark">20 November</b> for delivery before Christmas.</p>
        </div>
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div aria-hidden className="absolute -inset-3 -translate-x-4 translate-y-4 border border-gold/60" />
          <Photo name="door-corporate" priority className="relative aspect-[4/5] w-full" sizes="(min-width: 1024px) 36vw, 90vw" />
          <div className="stat-orb stat-gold absolute -bottom-8 -left-4 !size-36 shadow-xl md:-left-10"><b className="!text-4xl">450+</b><span className="!text-[.6rem]">happy clients</span></div>
        </div>
      </div>
    </section>

    {/* Past clients: the proof, straight after the hero */}
    <section className="brand-pattern-black py-20 text-on-dark lg:py-28">
      <div className={WRAP}>
        <Label dark center>Trusted by</Label>
        <h2 className="mx-auto mt-8 max-w-3xl text-center text-3xl text-gold md:text-5xl">Over 5,000 boxes delivered to over 450 clients</h2>
        <p className="mx-auto mt-5 max-w-2xl text-center text-on-dark-muted">From banks and airports to hotels, power and public institutions, teams across Nigeria trust us with the gifts that carry their name.</p>
        <div className="mt-14"><StatBadges brand={brand} /></div>
        <div className="mt-16" data-reveal><ClientWall brand={brand} /></div>
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/corporate/quote" className={btnGold}>Get an instant quote <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link>
          <a href="#consultation" className={btnLine}>Book a consultation</a>
        </div>
      </div>
    </section>

    {/* What we do: every card carries a different brand colour */}
    <section className="bg-ivory py-20 lg:py-28">
      <div className={WRAP}>
        <Label>What we do</Label>
        <h2 className="mt-8 max-w-2xl text-3xl md:text-5xl">Every occasion, one gifting partner</h2>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-reveal>
          {SERVICES.map(({ purpose, icon: Icon, title, line, tone }, i) => <li key={purpose} className="contents">
            <Link to="/corporate/quote" search={{ purpose }} className={`tone-card ${tone}`}>
              <span className="flex items-center justify-between"><span className="orb">{String(i + 1).padStart(2, "0")}</span><Icon className="size-6 opacity-80" strokeWidth={1.4} aria-hidden /></span>
              <h3>{title}</h3><p>{line}</p>
              <span className="go">Quote this <ArrowRight className="size-3.5" /></span>
            </Link>
          </li>)}
        </ul>
      </div>
    </section>

    {/* How we work */}
    <section className="relative overflow-hidden bg-[#F4EFE5] py-20 lg:py-28">
      <div aria-hidden className="bow-watermark -left-20 -top-10 size-[30rem]" />
      <div className={`${WRAP} relative`}>
        <Label>From brief to delivery</Label>
        <h2 className="mt-8 text-3xl md:text-5xl">How we work with you</h2>
        <ol className="timeline mt-14" data-reveal>
          {STEPS.map(([t, d], i) => <li key={t}><span className={`orb ${i === 4 ? "!bg-gold !text-nero" : ""}`}>{String(i + 1).padStart(2, "0")}</span><h3 className="mt-5 font-heading text-xl font-medium">{t}</h3><p className="mt-2 max-w-[14rem] text-sm leading-relaxed text-nero/70">{d}</p></li>)}
          <li className="final hidden lg:block"><span className="orb"><img src="/brand/bow-gold.svg" alt="" className="h-7 w-auto" /></span></li>
        </ol>
        <p className="mt-14 max-w-3xl font-heading text-2xl leading-snug md:text-3xl">We are happy to work within your budget and timeframe, especially during the Christmas season.</p>
      </div>
    </section>

    {/* Three easy ways to start */}
    <section className="bg-paper py-20 lg:py-28">
      <div className={WRAP}>
        <Label>Year-end gifting 2026</Label>
        <h2 className="mt-8 text-3xl md:text-5xl">Three easy ways to start</h2>
        <ul className="mt-12 grid gap-4 md:grid-cols-3" data-reveal>
          {[
            ["See a sample box at your office", "We bring a box to you, so you can judge the quality before you decide. It takes 15 minutes.", "#consultation", "Book a consultation"],
            ["Get a quote within 24 hours", "Send us two numbers: how many people, and your budget per person. We reply with three priced options.", "/corporate/quote", "Get an instant quote"],
            ["Explore the corporate edit", "This season's boxes, branding options and price points in one place.", "/lookbook/the-corporate-edit", "Open the look book"],
          ].map(([t, d, href, cta], i) => <li key={t} className="tone-card tone-nero !min-h-[20rem]">
            <span className="orb">{String(i + 1).padStart(2, "0")}</span><h3>{t}</h3><p>{d}</p>
            {href!.startsWith("#") ? <a href={href} className="go">{cta} <ArrowRight className="size-3.5" /></a> : <Link to={href as "/corporate/quote"} className="go">{cta} <ArrowRight className="size-3.5" /></Link>}
          </li>)}
        </ul>
        <p className="mt-10 text-center font-heading text-2xl md:text-3xl">Confirm your order by 20 November for delivery before Christmas.</p>
      </div>
    </section>

    {/* Reviews */}
    <section className="brand-pattern-green py-20 text-on-dark lg:py-28">
      <div className={WRAP}>
        <Label dark>In their words</Label>
        <h2 className="mt-8 mb-12 text-3xl md:text-5xl">What our clients say</h2>
        <Reviews brand={brand} />
      </div>
    </section>

    <Faq />
    <Consultation />
  </main></SiteShell>;
}

function Faq() {
  return <section className="bg-ivory py-20 lg:py-28"><div className="mx-auto max-w-3xl px-5">
    <Label center>Questions</Label><h2 className="mt-8 text-center text-3xl md:text-5xl">Good to know</h2>
    <Accordion type="single" collapsible className="mt-10">
      {FAQS.map(([q, a]) => <AccordionItem key={q} value={q}><AccordionTrigger className="min-h-12 text-left font-heading text-lg font-medium">{q}</AccordionTrigger><AccordionContent className="text-[15px] leading-relaxed text-nero/75">{a}</AccordionContent></AccordionItem>)}
    </Accordion>
  </div></section>;
}

const fieldCls = "mt-2 block min-h-12 w-full rounded-[2px] border border-white/25 bg-white/10 px-4 py-2 text-base text-on-dark placeholder:text-on-dark-muted/70 focus:border-gold focus:outline-none focus-visible:outline-2 focus-visible:outline-gold";

function Consultation() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState("");
  const [reference, setReference] = useState("");
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries()) as unknown as ConsultationRequest;
    setStatus("sending");
    try { const res = await submitConsultation(data); setReference(res.reference); setStatus("done"); } catch (e2) { setErr(e2 instanceof Error ? e2.message : ""); setStatus("error"); }
  }
  return <section id="consultation" className="brand-pattern-plum scroll-mt-16 py-20 text-on-dark lg:py-28">
    <div className={`${WRAP} grid gap-12 lg:grid-cols-[.9fr_1.1fr]`}>
      <div>
        <Label dark>Book a consultation</Label>
        <h2 className="mt-8 text-4xl md:text-6xl">Let us make it <span className="text-gold">memorable</span></h2>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-on-dark-muted">Tell us about your gifting. We reply within one working day, with ideas matched to your people, your brand and your budget.</p>
        <ul className="mt-8 space-y-3 text-on-dark-muted">{["A sample box brought to your office", "Three priced options within 24 hours", "Branding and personalisation included in the plan"].map((t) => <li key={t} className="flex gap-3"><Check className="mt-1 size-4 shrink-0 text-gold" />{t}</li>)}</ul>
        <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className={`${btnLine} mt-10`}><MessageCircle className="size-4" /> Prefer WhatsApp?</a>
      </div>
      <div className="rounded-[2px] border border-white/15 bg-black/25 p-6 backdrop-blur-sm md:p-10">
        {status === "done" ? <div role="status" className="py-10 text-center">
          <div className="foil mx-auto flex size-16 items-center justify-center rounded-full"><Check className="size-7 text-nero" /></div>
          <p className="eyebrow mt-6 text-gold">Your reference</p><p className="mt-2 font-heading text-3xl">{reference}</p>
          <p className="mt-4 text-on-dark-muted">Thank you. We will be in touch within one working day.</p>
        </div> : <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
          <Field label="Full name" name="name" required autoComplete="name" />
          <Field label="Company" name="company" required autoComplete="organization" />
          <Field label="Work email" name="email" type="email" required autoComplete="email" />
          <Field label="Phone" name="phone" type="tel" required autoComplete="tel" />
          <Field label="Role" name="role" autoComplete="organization-title" />
          <label className="text-sm font-medium">Estimated quantity
            <select name="quantity" required defaultValue="" className={fieldCls}><option value="" disabled className="text-nero">Select a range</option>{CONSULTATION_QUANTITIES.map((q) => <option key={q} className="text-nero">{q}</option>)}</select>
          </label>
          <Field label="Required by" name="requiredBy" type="date" className="sm:col-span-2" />
          <label className="text-sm font-medium sm:col-span-2">Message<textarea name="message" rows={4} className={fieldCls} placeholder="Occasion, budget per person, branding ideas" /></label>
          {status === "error" && <p role="alert" className="text-sm text-coral sm:col-span-2">{err || "Something went wrong. Please try again or message us on WhatsApp."}</p>}
          <div className="sm:col-span-2"><button type="submit" disabled={status === "sending"} className={`${btnGold} w-full disabled:opacity-60 sm:w-auto`}>{status === "sending" ? "Sending…" : "Request a consultation"}</button></div>
        </form>}
      </div>
    </div>
  </section>;
}

function Field({ label, className, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className={`text-sm font-medium ${className ?? ""}`}>{label}<input {...props} className={fieldCls} /></label>;
}
