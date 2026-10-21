import { Star } from "lucide-react";
import type { ReactNode } from "react";
import type { BrandProfile } from "@/types/brand";
import { formatStat } from "@/services/brand";
import { cn } from "@/lib/utils";

export const WRAP = "mx-auto w-full max-w-[1200px] px-5";

/** Wide-tracked small-caps label with a gold rule, as used across the company profile. */
export function Label({ children, dark, center, className }: { children: ReactNode; dark?: boolean; center?: boolean; className?: string }) {
  return <div className={cn(center && "text-center", className)}>
    <p className={cn("eyebrow", dark ? "text-gold" : "text-nero/70")}>{children}</p>
    <div aria-hidden className={cn("mt-4 h-px w-14 bg-gold", center && "mx-auto")} />
  </div>;
}

/** Three round badges joined by a thin gold line. */
export function StatBadges({ brand }: { brand: BrandProfile }) {
  const tones = ["stat-gold", "stat-ivory", "stat-sage"];
  return <div className="stat-line" data-reveal>
    {brand.stats.slice(0, 3).map((s, i) => <div key={s.label} className={cn("stat-orb", tones[i])}><b>{formatStat(s)}</b><span>{s.label}</span></div>)}
  </div>;
}

/** Every past client on a white panel. */
export function ClientWall({ brand, className }: { brand: BrandProfile; className?: string }) {
  return <ul aria-label="Our clients" className={cn("logo-wall", className)}>
    {brand.clients.map((c) => <li key={c.name}><img src={c.logo} alt={c.name} loading="lazy" decoding="async" /></li>)}
  </ul>;
}

export function Reviews({ brand }: { brand: BrandProfile }) {
  return <ul className="grid gap-4 md:grid-cols-2" data-reveal>
    {brand.reviews.map((r) => <li key={r.name} className="flex flex-col rounded-[2px] bg-white p-7 text-nero shadow-[0_24px_40px_-28px_rgba(0,0,0,.7)]">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-heading text-xl font-medium">{r.title}</h3>
        <span aria-label="5 stars" className="flex shrink-0 gap-0.5 text-gold">{Array.from({ length: 5 }, (_, i) => <Star key={i} className="size-3.5 fill-current" />)}</span>
      </div>
      <p className="mt-4 flex-1 text-[15px] leading-relaxed text-nero/80">{r.text}</p>
      <p className="mt-5 font-heading text-lg">{r.name}</p>
    </li>)}
  </ul>;
}
