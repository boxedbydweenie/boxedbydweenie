import { Link } from "@tanstack/react-router";
import { BellRing, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { Button, Eyebrow, GoldRule, ProductCard } from "@/components/site/Brand";
import { curatedProducts, daysUntil, downloadIcs, formatLong } from "@/services/calendar";
import type { OccasionInstance } from "@/types/calendar";
import { cn } from "@/lib/utils";

export function Countdown({ inst, className }: { inst: OccasionInstance; className?: string }) {
  if (!inst.date) return <span className={className}>Any time of year</span>;
  if (inst.tbc) return <span className={className}>Date to be confirmed</span>;
  const d = daysUntil(inst.date);
  return <span className={className}>{d === 0 ? "Today" : d === 1 ? "Tomorrow" : `${d} days to go`}</span>;
}

export function DateLabel({ inst }: { inst: OccasionInstance }) {
  if (!inst.date) return <>All year</>;
  if (inst.tbc) return <>Date to be confirmed</>;
  return <>{formatLong(inst.date)}</>;
}

export function AddToCalendarButton({ inst, size = "sm", className }: { inst: OccasionInstance; size?: "sm" | "default"; className?: string }) {
  if (!inst.date || inst.tbc) return null;
  return <Button size={size} variant="outline" className={className} onClick={() => downloadIcs(inst.occasion.name, inst.date!, inst.occasion.line)}><CalendarPlus /> Add to my calendar</Button>;
}

export function OccasionDetail({ inst, compact }: { inst: OccasionInstance; compact?: boolean }) {
  const o = inst.occasion;
  const products = curatedProducts(o, 6);
  return <div>
    <Eyebrow>{o.category === "workplace" ? "Workplace moment" : o.category}</Eyebrow>
    <GoldRule className="mt-4" />
    <h2 className={cn("mt-4", compact ? "text-2xl" : "text-3xl md:text-4xl")}>{o.name}</h2>
    <p className="mt-2 text-muted-foreground">{o.line}</p>
    <dl className="mt-6 grid grid-cols-2 gap-px border border-border bg-border text-sm">
      <div className="bg-paper p-4"><dt className="eyebrow text-muted-foreground">Date</dt><dd className="mt-2 font-semibold"><DateLabel inst={inst} /></dd><dd className="mt-1 text-muted-foreground"><Countdown inst={inst} /></dd></div>
      <div className="bg-paper p-4"><dt className="eyebrow text-muted-foreground">Order by</dt><dd className="mt-2 font-semibold">{inst.orderBy ? formatLong(inst.orderBy) : inst.tbc ? "Once the date is confirmed" : `${o.orderByOffsetDays} days before`}</dd></div>
    </dl>
    <p className="mt-6 leading-relaxed">{o.note}</p>
    <div className="mt-6 flex flex-wrap gap-3">
      <Button asChild><Link to="/shop" search={o.shop}>See all gifts for this occasion</Link></Button>
      <Button variant="outline" onClick={() => toast(`We will remind you before ${o.name}.`, { description: "Reminders are a preview for now." })}><BellRing /> Remind me</Button>
      <AddToCalendarButton inst={inst} size="default" />
      {o.category === "workplace" && <Button asChild variant="outline"><Link to="/corporate/quote">Get a corporate quote</Link></Button>}
    </div>
    <h3 className="mt-10 text-sm">Curated for {o.name}</h3>
    <div className={cn("mt-5 grid grid-cols-2 gap-x-4 gap-y-8", !compact && "md:grid-cols-3")}>
      {products.map((p) => <ProductCard key={p.id} product={{ id: p.id, slug: p.slug, name: p.name, line: p.line, price: p.price, inStock: p.inStock, ...(p.badges[0] ? { badge: p.badges[0] } : {}) }} />)}
    </div>
  </div>;
}
