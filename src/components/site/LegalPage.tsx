import { SiteShell } from "./SiteShell";

export function LegalPage({ title, sections }: { title: string; sections: string[] }) {
  return <SiteShell><main className="bg-paper">
    <div className="border-b border-border bg-ivory"><div className="mx-auto max-w-3xl px-5 py-14"><p className="eyebrow text-muted-foreground">Legal</p><div className="gold-rule mt-4 w-12" /><h1 className="mt-6 text-3xl md:text-4xl">{title}</h1></div></div>
    <div className="mx-auto max-w-3xl space-y-10 px-5 py-14">
      {sections.map((s) => <section key={s}><h2 className="text-lg md:text-xl">{s}</h2><p className="mt-3 text-muted-foreground">Content to be supplied.</p></section>)}
    </div>
  </main></SiteShell>;
}

export const legalHead = (title: string, description: string) => ({ meta: [
  { title: `${title} — Boxed by Dweenie` }, { name: "description", content: description },
  { property: "og:title", content: `${title} — Boxed by Dweenie` }, { property: "og:description", content: description },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
] });
