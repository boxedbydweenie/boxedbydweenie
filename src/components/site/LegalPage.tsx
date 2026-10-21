import { SiteShell } from "./SiteShell";

export type LegalSection = { title: string; body: string[] };

export function LegalPage({ title, updated = "21 October 2026", sections }: { title: string; updated?: string; sections: LegalSection[] }) {
  return <SiteShell><main className="bg-paper">
    <div className="border-b border-border bg-ivory"><div className="mx-auto max-w-3xl px-5 py-14"><p className="eyebrow text-muted-foreground">Legal</p><div className="gold-rule mt-4 w-12" /><h1 className="mt-6 text-3xl md:text-4xl">{title}</h1><p className="mt-3 text-sm text-muted-foreground">Last updated {updated}</p></div></div>
    <div className="mx-auto max-w-3xl space-y-10 px-5 py-14">
      {sections.map((s) => <section key={s.title}><h2 className="text-lg md:text-xl">{s.title}</h2>{s.body.map((p) => <p key={p} className="mt-3 text-muted-foreground">{p}</p>)}</section>)}
      <p className="border-t border-border pt-6 text-sm text-muted-foreground">Questions? Email <a className="underline" href="mailto:hello@boxedbydweenie.com">hello@boxedbydweenie.com</a> or message us on WhatsApp.</p>
    </div>
  </main></SiteShell>;
}

export const legalHead = (title: string, description: string) => ({ meta: [
  { title: `${title} — Boxed by Dweenie` }, { name: "description", content: description },
  { property: "og:title", content: `${title} — Boxed by Dweenie` }, { property: "og:description", content: description },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
] });
