import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Trash2 } from "lucide-react";
import { usePeople } from "@/hooks/use-calendar";
import {
  daysUntil,
  formatLong,
  giftIdeas,
  initials,
  nextOccurrence,
  removePerson,
} from "@/services/calendar";
import { formatNaira } from "@/lib/format";

export const Route = createFileRoute("/app/people/$personId")({
  component: AppPerson,
});

function AppPerson() {
  const { personId } = Route.useParams();
  const person = usePeople().find((p) => p.id === personId);
  const navigate = useNavigate();

  if (!person) {
    return (
      <section className="px-5 pt-10 text-center">
        <h1 className="font-display text-3xl">Person not found</h1>
        <Link to="/app/people" className="mt-6 inline-block text-sm font-semibold underline">
          Back to people
        </Link>
      </section>
    );
  }

  const dates = person.dates
    .map((d) => ({ d, on: nextOccurrence(d) }))
    .sort((a, b) => a.on.localeCompare(b.on));
  const ideas = giftIdeas(person, 4);

  return (
    <section className="px-5 pt-8">
      <div className="flex items-center justify-between">
        <Link
          to="/app/people"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> People
        </Link>
        <button
          type="button"
          aria-label={`Remove ${person.name}`}
          onClick={async () => {
            await removePerson(person.id);
            void navigate({ to: "/app/people" });
          }}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#292828] font-display text-2xl text-[#E7B93B]">
          {initials(person.name)}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8E6A10]">
            {person.relationship}
          </p>
          <h1 className="truncate font-display text-4xl">{person.name}</h1>
        </div>
      </div>

      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
        {dates.map(({ d, on }) => (
          <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{d.label}</p>
              <p className="text-xs text-muted-foreground">{formatLong(on)}</p>
            </div>
            <span className="shrink-0 text-xs font-semibold">{daysUntil(on)} days</span>
          </li>
        ))}
      </ul>

      {ideas.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8E6A10]">
            Gift ideas for {person.name.split(" ")[0]}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {ideas.map((p) => (
              <a
                key={p.id}
                href={`/shop/${p.slug}`}
                className="rounded-2xl border border-border bg-card p-3"
              >
                <p className="font-display text-lg leading-tight">{p.name}</p>
                <p className="mt-1 text-sm font-semibold">{formatNaira(p.price)}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      <Link
        to="/app/vouchers"
        className="mt-8 flex h-12 items-center justify-center rounded-lg bg-[#E7B93B] text-sm font-semibold text-[#292828]"
      >
        Send a voucher instead
      </Link>
    </section>
  );
}
