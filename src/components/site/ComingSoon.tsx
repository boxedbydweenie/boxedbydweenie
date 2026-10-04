import { Link } from "@tanstack/react-router";
import { SiteShell } from "./SiteShell";
import { Button } from "@/components/ui/button";

export function ComingSoon({ eyebrow, title, line }: { eyebrow: string; title: string; line: string }) {
  return <SiteShell><main className="bg-ivory"><section className="relative flex min-h-[65vh] items-center overflow-hidden"><div className="pattern-bow absolute inset-0 opacity-[0.035]"/><div className="relative mx-auto w-full max-w-4xl px-5 py-20 text-center"><p className="eyebrow text-muted-foreground">{eyebrow}</p><div className="gold-rule mx-auto mt-5 w-16"/><h1 className="mt-7 text-3xl md:text-5xl">{title}</h1><p className="mx-auto mt-5 max-w-xl text-muted-foreground">{line}</p><Button asChild className="mt-8"><Link to="/">Back home</Link></Button></div></section></main></SiteShell>;
}