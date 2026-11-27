import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useUser } from "@/hooks/use-shop";
import { usePeople } from "@/hooks/use-calendar";
import type { OccasionInstance } from "@/types/calendar";
import { daysUntil, getUpcomingOccasions, formatLong, nextDateFor } from "@/services/calendar";

export const Route = createFileRoute("/app/")({
  component: AppHome,
});

/** First screen for visitors: splash with sign-up and sign-in. Signed-in users see the dashboard. */
function AppHome() {
  const user = useUser();
  return user ? <Dashboard firstName={user.name.split(" ")[0] ?? ""} /> : <Splash />;
}

function Splash() {
  return (
    <section className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#263D35] px-6 pb-10 pt-14 text-white">
      <div
        className="absolute inset-0 opacity-30"
        style={{ backgroundImage: 'url("/brand/pattern-green.svg")', backgroundSize: "380px" }}
        aria-hidden="true"
      />
      <div className="relative flex flex-1 flex-col">
        <img
          src="/brand/logo-on-dark.svg"
          alt="Boxed by Dweenie"
          className="h-7 w-auto self-start"
        />
        <div className="mt-12 flex justify-center">
          <img src="/brand/bow-gold.svg" alt="" className="h-36 w-auto drop-shadow-2xl" />
        </div>
        <h1 className="mt-10 text-center font-display text-5xl leading-[1.02]">
          Every date that matters, <span className="text-[#E7B93B]">remembered.</span>
        </h1>
        <p className="mt-4 text-center text-[15px] leading-relaxed text-white/80">
          Birthdays, anniversaries and every festive season, with a box on its way before the day.
        </p>
        <div className="flex-1" />
        <Link
          to="/app/signin"
          className="mt-8 flex h-13 items-center justify-center rounded-lg bg-[#E7B93B] font-semibold text-[#292828]"
        >
          Create my calendar
        </Link>
        <Link
          to="/app/signin"
          className="mt-3 flex h-13 items-center justify-center rounded-lg border border-white font-semibold text-white"
        >
          I already have an account
        </Link>
        <p className="mt-6 text-center font-display text-lg text-[#E7B93B]">
          We exist for the love of gifting.
        </p>
      </div>
    </section>
  );
}

function Dashboard({ firstName }: { firstName: string }) {
  const people = usePeople();
  const [upcoming, setUpcoming] = useState<OccasionInstance[]>([]);
  useEffect(() => {
    void getUpcomingOccasions(4).then(setUpcoming);
  }, []);
  // Next up: the user's own people come first; festivals fill in when no one is saved yet.
  const personNext = people
    .map((p) => ({ p, n: nextDateFor(p) }))
    .filter(
      (x): x is { p: (typeof people)[number]; n: NonNullable<ReturnType<typeof nextDateFor>> } =>
        x.n !== null,
    )
    .sort((a, b) => a.n.on.localeCompare(b.n.on))[0];
  const festival = upcoming.find((o) => !o.tbc && o.date);
  const next = personNext
    ? {
        title: `${personNext.p.name}'s ${personNext.n.date.label.toLowerCase()}`,
        date: personNext.n.on,
        personId: personNext.p.id,
      }
    : festival
      ? { title: festival.occasion.name, date: festival.date!, personId: null }
      : null;
  const when = (d: number) => (d === 0 ? "Today" : d === 1 ? "Tomorrow" : `${d} days to go`);

  return (
    <section className="px-4 pt-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <Link
          to="/app/account"
          aria-label="Account"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#292828] text-sm font-semibold text-[#E7B93B]"
        >
          {firstName.slice(0, 1).toUpperCase() || "B"}
        </Link>
      </div>
      <h1 className="mt-1 font-display text-4xl">
        Hello, <span className="text-[#8E6A10]">{firstName || "friend"}.</span>
      </h1>

      {next && (
        <div className="relative mt-6 overflow-hidden rounded-3xl bg-[#263D35] p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E7B93B]">
            Next up
          </p>
          <p className="mt-3 font-display text-3xl">{next.title}</p>
          <p className="mt-2 text-sm text-white/80">
            {when(daysUntil(next.date))} · {formatLong(next.date)}
          </p>
          {next.personId ? (
            <Link
              to="/app/people/$personId"
              params={{ personId: next.personId }}
              className="mt-5 inline-flex h-11 items-center rounded-lg bg-[#E7B93B] px-5 text-sm font-semibold text-[#292828]"
            >
              Choose a gift
            </Link>
          ) : (
            <Link
              to="/app/calendar"
              className="mt-5 inline-flex h-11 items-center rounded-lg bg-[#E7B93B] px-5 text-sm font-semibold text-[#292828]"
            >
              See my calendar
            </Link>
          )}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <p className="text-sm">
          <strong>{people.length}</strong> {people.length === 1 ? "person" : "people"} in your
          calendar
        </p>
        <Link to="/app/people" className="mt-2 inline-block text-sm font-semibold underline">
          Manage people
        </Link>
      </div>

      {upcoming.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8E6A10]">
            Coming up
          </p>
          <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
            {upcoming.map((o) => (
              <li
                key={`${o.occasion.slug}-${o.date}`}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm font-semibold">{o.occasion.name}</span>
                <span className="text-xs text-muted-foreground">
                  {o.date ? formatLong(o.date) : "Anytime"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
