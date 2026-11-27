import { createFileRoute, Link } from "@tanstack/react-router";
import { usePeople } from "@/hooks/use-calendar";
import { daysUntil, formatLong, initials, nextDateFor } from "@/services/calendar";

export const Route = createFileRoute("/app/people")({
  component: AppPeople,
});

function AppPeople() {
  const people = usePeople();
  return (
    <section className="px-4 pt-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8E6A10]">People</p>
      <h1 className="mt-1 font-display text-4xl">Everyone <span className="text-[#8E6A10]">you remember.</span></h1>
      {people.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No one yet. Add the first birthday or anniversary below.</p>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
          {people.map((p) => {
            const n = nextDateFor(p);
            return (
              <li key={p.id}>
                <Link to="/calendar/my-dates/$personId" params={{ personId: p.id }} className="flex items-center gap-4 px-4 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#86BAA3] font-semibold">{initials(p.name)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{n ? `${n.date.label}, ${formatLong(n.on)}` : p.relationship}</p>
                  </div>
                  {n && <span className="shrink-0 text-xs font-semibold">{daysUntil(n.on)} days</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <Link to="/calendar/my-dates" search={{ add: true }} className="mt-6 flex h-12 items-center justify-center rounded-lg bg-[#292828] text-sm font-semibold text-white">
        Add a person
      </Link>
    </section>
  );
}
