import { createFileRoute } from "@tanstack/react-router";
import { AtSign, Clock, Mail, MessageCircle, Phone } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { Label as Eyebrow, WRAP } from "@/components/brand/ProfileSections";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useScrollReveal } from "@/components/home/Photo";
import { callLeads } from "@/lib/api";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [
    { title: "Contact Boxed by Dweenie — Let us make it memorable" },
    { name: "description", content: "Talk to Boxed by Dweenie about personal gifts, corporate gifting and packaging. Call, WhatsApp, email or send an enquiry. Open 9am to 6pm." },
    { property: "og:title", content: "Contact Boxed by Dweenie" },
    { property: "og:description", content: "Let's make your next gifting experience memorable." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ContactPage,
});

const faqs = [
  ["Where do you deliver?", "We deliver anywhere in Nigeria, to one address or many."],
  ["Can I personalise a gift?", "Yes. Add a name, a message card, or your company logo and message with our prints and customisation."],
  ["How quickly will you reply?", "We reply within one working day. For corporate quotes, send us two numbers: how many people and your budget per person, and we reply with three priced options within 24 hours."],
  ["Can you work within my budget and timeframe?", "Yes. We are happy to work within your budget and timeframe, especially during the Christmas season. Corporate orders confirmed by 20 November are delivered before Christmas."],
  ["Do you handle corporate orders?", "Yes. We have delivered over 5,000 boxes to over 450 clients. Visit our corporate page for an instant quote or to book a consultation."],
] as const;

const cards: { tone: string; icon: ReactNode; title: string; line: string; href: string }[] = [
  { tone: "tone-forest", icon: <MessageCircle />, title: "WhatsApp", line: "Chat with a gifting consultant", href: "https://wa.me/2348134907391" },
  { tone: "tone-navy", icon: <Phone />, title: "Call us", line: "0813 490 7391 · 0703 975 9508", href: "tel:+2348134907391" },
  { tone: "tone-oxblood", icon: <Mail />, title: "Email", line: "hello@boxedbydweenie.com", href: "mailto:hello@boxedbydweenie.com" },
  { tone: "tone-plum", icon: <AtSign />, title: "Instagram", line: "@boxedbydweenie", href: "https://instagram.com/boxedbydweenie" },
];

function ContactPage() {
  useScrollReveal();
  return <SiteShell><main data-feature="about">
    <section className="brand-pattern-plum relative overflow-hidden text-on-dark">
      <div className={`${WRAP} py-20 md:py-28`}>
        <p className="eyebrow text-gold">Contact us</p><div aria-hidden className="mt-4 h-px w-14 bg-gold" />
        <h1 className="mt-8 max-w-4xl text-5xl leading-[1.02] md:text-7xl">
          <span className="rise" style={{ "--d": 0 } as React.CSSProperties}><span>Let us make it</span></span>
          <span className="rise text-gold" style={{ "--d": 1 } as React.CSSProperties}><span>memorable.</span></span>
        </h1>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-on-dark-muted">Let's make your next gifting experience memorable. Get in touch with our team for thoughtfully curated gifts, personalisation, elegant packaging and seamless delivery.</p>
        <p className="mt-6 inline-flex items-center gap-2 text-sm text-on-dark-muted"><Clock className="size-4 text-gold" /> Open 9am to 6pm</p>
      </div>
    </section>

    <section className="bg-ivory py-16 lg:py-24">
      <div className={WRAP}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-reveal>
          {cards.map((c) => <li key={c.title} className="contents"><a href={c.href} className={`tone-card ${c.tone} !min-h-[13rem]`} {...(c.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
            <span className="orb [&_svg]:size-5">{c.icon}</span><h3>{c.title}</h3><p>{c.line}</p>
          </a></li>)}
        </ul>
      </div>
    </section>

    <section className="relative overflow-hidden bg-paper py-20 lg:py-28">
      <div aria-hidden className="bow-watermark -right-32 top-10 size-[36rem]" />
      <div className={`${WRAP} relative grid gap-14 lg:grid-cols-[.8fr_1.2fr]`}>
        <div>
          <Eyebrow>Send an enquiry</Eyebrow>
          <h2 className="mt-8 text-4xl leading-tight md:text-5xl">Tell us what you have in mind</h2>
          <p className="mt-6 max-w-md leading-relaxed text-nero/70">A personal gift, a company-wide moment, or exquisite packaging. Share a few details and we will reply within one working day.</p>
          <div className="mt-10 flex flex-wrap gap-2.5"><span className="pill pill-gold">Personal and corporate</span><span className="pill pill-coral">Nationwide delivery</span><span className="pill pill-sage">Nigeria and the UK</span></div>
        </div>
        <div className="rounded-[2px] bg-ivory p-6 shadow-[0_30px_60px_-34px_rgba(41,40,40,.5)] md:p-10"><ContactForm /></div>
      </div>
    </section>

    <section className="brand-pattern-green py-20 text-on-dark lg:py-28">
      <div className="mx-auto max-w-3xl px-5">
        <Eyebrow dark center>Helpful answers</Eyebrow>
        <h2 className="mt-8 text-center text-3xl md:text-5xl">Good to know</h2>
        <Accordion type="single" collapsible className="mt-10">{faqs.map(([q, a], i) => <AccordionItem value={`q${i}`} key={q} className="border-white/20"><AccordionTrigger className="min-h-12 text-left font-heading text-lg font-medium hover:no-underline">{q}</AccordionTrigger><AccordionContent className="text-[15px] leading-relaxed text-on-dark-muted">{a}</AccordionContent></AccordionItem>)}</Accordion>
        <p className="mt-14 text-center font-heading text-4xl text-gold">Happiness In a Box</p>
      </div>
    </section>
  </main></SiteShell>;
}

function Field({ label, className, ...p }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <div className={className}><Label htmlFor={p.name}>{label}</Label><Input id={p.name} {...p} className="mt-2 min-h-12 bg-white" /></div>;
}

function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [ref, setRef] = useState("");
  const [type, setType] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setStatus("sending");
    const d = Object.fromEntries(new FormData(e.currentTarget).entries());
    try { const r = await callLeads<{ reference: string }>({ kind: "contact", ...d, enquiryType: type }); setRef(r.reference); setStatus("done"); }
    catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); setStatus("idle"); }
  }
  if (status === "done") return <div role="status" className="py-10 text-center">
    <div className="foil mx-auto flex size-16 items-center justify-center rounded-full text-2xl">✓</div>
    <p className="eyebrow mt-6 text-nero/60">Your reference</p><p className="mt-2 font-heading text-3xl">{ref}</p>
    <p className="mt-4 text-nero/70">Thank you. We will reply within one working day. We are open 9am to 6pm.</p>
  </div>;
  return <form className="grid gap-5 sm:grid-cols-2" onSubmit={submit}>
    <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
    <Field name="name" label="Name" required autoComplete="name" /><Field name="email" type="email" label="Email" required autoComplete="email" />
    <Field name="phone" type="tel" label="Phone" autoComplete="tel" />
    <div><Label>Enquiry type</Label><Select value={type} onValueChange={setType}><SelectTrigger className="mt-2 min-h-12 bg-white"><SelectValue placeholder="Choose one" /></SelectTrigger><SelectContent>{["Personal order", "Corporate", "Packaging", "Other"].map((x) => <SelectItem value={x} key={x}>{x}</SelectItem>)}</SelectContent></Select></div>
    <div className="sm:col-span-2"><Label htmlFor="message">Message</Label><Textarea id="message" name="message" required rows={6} className="mt-2 bg-white" /></div>
    {error && <p role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p>}
    <button type="submit" disabled={status === "sending"} className="inline-flex min-h-14 items-center justify-center rounded-full bg-nero px-9 text-[15px] font-semibold text-white transition hover:-translate-y-0.5 hover:bg-nero/90 disabled:opacity-60 sm:col-span-2 sm:w-fit">{status === "sending" ? "Sending…" : "Send enquiry"}</button>
  </form>;
}
