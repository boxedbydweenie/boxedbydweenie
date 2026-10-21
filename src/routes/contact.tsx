import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { FormField, LoadingButton, SectionHeading } from "@/components/site/Brand";
import { useState, type FormEvent } from "react";
import { callLeads } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
export const Route=createFileRoute("/contact")({head:()=>({meta:[{title:"Contact Boxed by Dweenie"},{name:"description",content:"Talk to Boxed by Dweenie about personal gifts, corporate gifting and packaging."},{property:"og:title",content:"Contact Boxed by Dweenie"},{property:"og:description",content:"We are here to help with your next gifting moment."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:ContactPage});
const faqs=[["Where do you deliver?","We deliver across Lagos, Abuja and throughout Nigeria."],["Can I personalise a gift?","Yes. Add a name, message card or select available branding options."],["How quickly can you deliver?","Timing depends on the gift, destination and level of personalisation."],["How do I pay?","Our team will confirm the available payment options with your order."],["Can I return a gift?","Contact us promptly. Returns depend on the item and whether it was personalised."],["Do you handle corporate orders?","Yes. We curate, brand and deliver orders from 25 to 1,000+ gifts."]] as const;
function ContactPage(){return <SiteShell><main><section className="surface-dark py-20"><div className="mx-auto max-w-7xl px-5"><SectionHeading eyebrow="Contact" title="Tell us what you have in mind" intro="Personal gift, company-wide moment or exquisite packaging. We are ready to help." dark/></div></section><section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[1.2fr_.8fr]"><ContactForm/><aside className="space-y-4"><ContactCard icon={<MessageCircle className="text-gold"/>} title="WhatsApp" line="Chat with a gifting consultant" href="https://wa.me/2348134907391"/><ContactCard icon={<Phone className="text-gold"/>} title="Phone" line="0813 490 7391" href="tel:+2348134907391"/><ContactCard icon={<Mail className="text-gold"/>} title="Email" line="hello@boxedbydweenie.com" href="mailto:hello@boxedbydweenie.com"/><div className="border border-border p-5"><strong>Opening hours</strong><p className="mt-2 text-sm text-muted-foreground">9am to 6pm</p></div></aside></section><section className="bg-ivory py-20"><div className="mx-auto max-w-3xl px-5"><SectionHeading eyebrow="Helpful answers" title="Frequently asked questions"/><Accordion type="single" collapsible className="mt-8">{faqs.map(([q,a],i)=><AccordionItem value={`q${i}`} key={q}><AccordionTrigger>{q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{a}</AccordionContent></AccordionItem>)}</Accordion></div></section></main></SiteShell>}
function ContactCard({icon,title,line,href}:{icon:ReactNode;title:string;line:string;href:string}){return <a href={href} className="flex gap-4 border border-border bg-ivory p-5">{icon}<span><strong className="block">{title}</strong><span className="text-sm text-muted-foreground">{line}</span></span></a>}
function ContactForm(){
  const [status,setStatus]=useState<"idle"|"sending"|"done">("idle");
  const [error,setError]=useState("");
  const [ref,setRef]=useState("");
  const [type,setType]=useState("");
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault(); setError(""); setStatus("sending");
    const d=Object.fromEntries(new FormData(e.currentTarget).entries());
    try{ const r=await callLeads<{reference:string}>({kind:"contact",...d,enquiryType:type}); setRef(r.reference); setStatus("done"); }
    catch(err){ setError(err instanceof Error?err.message:"Something went wrong."); setStatus("idle"); }
  }
  if(status==="done") return <div role="status" className="border border-gold p-10 text-center sm:col-span-2"><p className="eyebrow text-muted-foreground">Your reference</p><p className="mt-2 font-heading text-3xl">{ref}</p><p className="mt-4 text-muted-foreground">Thank you. We will reply within one working day. We are open 9am to 6pm.</p></div>;
  return <form className="grid gap-5 sm:grid-cols-2" onSubmit={submit}>
    <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden"/>
    <FormField name="name" label="Name" required/><FormField name="email" type="email" label="Email" required/><FormField name="phone" type="tel" label="Phone"/>
    <div><Label>Enquiry type</Label><Select value={type} onValueChange={setType}><SelectTrigger className="mt-2 min-h-11"><SelectValue placeholder="Choose one"/></SelectTrigger><SelectContent>{["Personal order","Corporate","Packaging","Other"].map(x=><SelectItem value={x} key={x}>{x}</SelectItem>)}</SelectContent></Select></div>
    <div className="sm:col-span-2"><Label htmlFor="message">Message</Label><Textarea id="message" name="message" required rows={6} className="mt-2"/></div>
    {error&&<p role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p>}
    <LoadingButton type="submit" loading={status==="sending"} className="sm:col-span-2 sm:w-fit">Send enquiry</LoadingButton>
  </form>;
}
