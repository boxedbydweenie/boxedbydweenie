import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { OccasionInstance } from "@/types/calendar";
import { formatLong, daysUntil, getUpcomingOccasions } from "@/services/calendar";

export const Route = createFileRoute("/app/calendar")({
  component: AppCalendar,
});

function AppCalendar() {
  const [items, setItems] = useState<OccasionInstance[]>([]);
  useEffect(() => {
    void getUpcomingOccasions(24).then(setItems);
  }, []);
  return (
    <section className="px-4 pt-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8E6A10]">
        Gift Calendar
      </p>
      <h1 className="mt-1 font-display text-4xl">
        Your year, <span className="text-[#8E6A10]">ahead.</span>
      </h1>
      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
        {items.map((o) => (
          <li
            key={`${o.occasion.slug}-${o.date ?? "any"}`}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{o.occasion.name}</p>
              <p className="text-xs text-muted-foreground">
                {o.date ? `${formatLong(o.date)}${o.tbc ? " (estimated)" : ""}` : "Anytime"}
              </p>
            </div>
            {o.date && !o.tbc && (
              <span className="shrink-0 text-xs font-semibold">{daysUntil(o.date)} days</span>
            )}
          </li>
        ))}
      </ul>
      <Link
        to="/app/people"
        search={{ add: true }}
        className="mt-6 flex h-12 items-center justify-center rounded-lg bg-[#292828] text-sm font-semibold text-white"
      >
        Add a date
      </Link>
    </section>
  );
}
