import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { usePeople, useScheduledGifts } from "@/hooks/use-calendar";
import { addDays, daysUntil, giftsFor, nextOccurrence, todayIso } from "@/services/calendar";
import { getProductById } from "@/services/products";
import {
  C,
  CalTile,
  IconBack,
  Ring,
  isMilestone,
  leadLabel,
  longDate,
  occasionTitle,
  shortDate,
  PERSON_ORDER_LEAD_DAYS,
} from "@/components/app/kit";

export const Route = createFileRoute("/app/people/$personId")({
  component: AppPerson,
});

const REL: Record<string, string> = {
  Parent: "parent",
  Partner: "partner",
  Sibling: "sibling",
  Child: "child",
  Friend: "friend",
  Colleague: "colleague",
  Client: "client",
  Other: "",
};

function AppPerson() {
  const { personId } = Route.useParams();
  const person = usePeople().find((p) => p.id === personId);
  const scheduled = useScheduledGifts();
  const router = useRouter();
  const today = todayIso();

  if (!person) {
    return (
      <section style={{ padding: "64px 22px 0", textAlign: "center" }}>
        <h1 className="a-dsp" style={{ fontSize: 32 }}>
          Person not found
        </h1>
        <p style={{ fontSize: 14, color: C.muted, marginTop: 10 }}>They may have been removed.</p>
        <Link to="/app/people" className="a-abtn a-ink" style={{ marginTop: 22 }}>
          Back to people
        </Link>
      </section>
    );
  }

  const first = person.name.split(" ")[0] ?? person.name;
  const dates = person.dates
    .map((d) => {
      const on = nextOccurrence(d, today);
      return {
        d,
        on,
        days: daysUntil(on, today),
        title: occasionTitle(d.label, d.type, d.year, on),
      };
    })
    .sort((a, b) => a.on.localeCompare(b.on));
  const next = dates[0];
  const milestone = next && isMilestone(next.title) ? next.title.split(" ")[0] : null;
  const gifts = giftsFor(person.id, scheduled);
  const sortedFor = (on: string) =>
    scheduled.some(
      (g) => g.personId === person.id && g.deliveryDate <= on && g.deliveryDate >= today,
    );
  const likes = person.notes.likes
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const rel = REL[person.relationship] ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        className="a-pat-sage"
        style={{ padding: "calc(env(safe-area-inset-top,0px) + 28px) 22px 78px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            type="button"
            onClick={() =>
              window.history.length > 1
                ? router.history.back()
                : void router.navigate({ to: "/app/people" })
            }
            aria-label="Back"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#FFFFFF",
              border: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: C.nero,
            }}
          >
            <IconBack style={{ width: 20, height: 20 }} />
          </button>
          <Link
            to="/app/people/new"
            search={{ edit: person.id }}
            style={{
              fontSize: 14,
              fontWeight: 600,
              padding: "12px 16px",
              borderRadius: 999,
              background: "#FFFFFF",
            }}
          >
            Edit
          </Link>
        </div>
      </div>

      <div
        style={{
          margin: "-58px 16px 0",
          background: "#FFFFFF",
          borderRadius: 24,
          padding: "0 18px 18px",
          position: "relative",
          boxShadow: "0 18px 40px -30px rgba(41,40,40,.6)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ marginTop: -48, background: "#FFFFFF", borderRadius: "50%" }}>
            <Ring size={104} days={next?.days ?? 60}>
              {person.photo ? (
                <img
                  src={person.photo}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span
                  style={{
                    width: "100%",
                    height: "100%",
                    background: C.nero,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'EB Garamond',Georgia,serif",
                    fontWeight: 500,
                    fontSize: 40,
                    color: C.gold,
                  }}
                >
                  {first.slice(0, 1).toUpperCase()}
                </span>
              )}
            </Ring>
          </div>
          {milestone && (
            <span className="a-pill" style={{ marginBottom: 8, background: C.gold }}>
              Milestone · {milestone}
            </span>
          )}
        </div>
        <h1 className="a-dsp" style={{ fontSize: 38, marginTop: 12 }}>
          {person.name}
        </h1>
        {next && (
          <div style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>
            {rel ? `Your ${rel} · ` : ""}
            {next.d.label.toLowerCase()} {next.days === 0 ? "is " : "in "}
            <strong style={{ color: C.nero }}>
              {next.days === 0 ? "today" : next.days === 1 ? "tomorrow" : `${next.days} days`}
            </strong>
          </div>
        )}
        {(likes.length > 0 || person.notes.noAlcohol) && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            {likes.map((l) => (
              <span key={l} className="a-pill" style={{ background: C.coral, minHeight: 28 }}>
                {l}
              </span>
            ))}
            {person.notes.noAlcohol && (
              <span
                className="a-pill"
                style={{ background: C.ivory, border: `1.5px solid ${C.line}`, minHeight: 28 }}
              >
                No alcohol
              </span>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          margin: "16px 16px 0",
          background: "#FFFFFF",
          borderRadius: 20,
          border: `1.5px solid ${C.line}`,
          padding: "6px 18px 4px",
        }}
      >
        {dates.map(({ d, on, days, title }, n) => {
          const sorted = sortedFor(on);
          const orderBy = addDays(on, -PERSON_ORDER_LEAD_DAYS);
          return (
            <div
              key={d.id}
              style={{
                display: "flex",
                gap: 14,
                alignItems: "center",
                padding: "14px 0",
                borderTop: n ? `1px solid ${C.line}` : 0,
              }}
            >
              <CalTile iso={on} tone={n === 0 ? C.oxblood : C.forest} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: 15 }}>
                  {title.charAt(0).toUpperCase() + title.slice(1)}
                </strong>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {days <= 1 ? (days === 0 ? "Today" : "Tomorrow") : `${longDate(on)}`}
                  {!sorted && orderBy >= today ? ` · order by ${shortDate(orderBy)}` : ""}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  Reminders{" "}
                  {(d.daysBefore?.length ? d.daysBefore : person.reminder.daysBefore)
                    .slice()
                    .sort((a, b) => b - a)
                    .map(leadLabel)
                    .join(", ")}{" "}
                  before
                </div>
              </div>
              {sorted ? (
                <span className="a-pill" style={{ background: C.sage }}>
                  Sorted
                </span>
              ) : n === 0 ? (
                <span className="a-pill" style={{ background: C.oxblood, color: "#FFFFFF" }}>
                  No gift yet
                </span>
              ) : (
                <span
                  className="a-pill"
                  style={{ background: C.ivory, border: `1.5px solid ${C.line}` }}
                >
                  {days} days
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: "12px 16px 0" }}>
        <Link
          to="/app/people/new"
          search={{ edit: person.id, add: true }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 52,
            borderRadius: 16,
            border: `1.5px dashed ${C.goldText}`,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          + Add an occasion for {first}
        </Link>
      </div>

      <div style={{ padding: "20px 22px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="a-eye">Gifts for {first}</div>
        {gifts.length === 0 ? (
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
            No gifts yet. Your first one will appear here.
          </p>
        ) : (
          gifts.map((g) => {
            const p = getProductById(g.productId);
            const sent = g.deliveryDate < today;
            return (
              <div
                key={g.id}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  background: "#FFFFFF",
                  borderRadius: 18,
                  border: `1.5px solid ${C.line}`,
                  padding: 10,
                }}
              >
                {p?.images[0] ? (
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    style={{
                      width: 60,
                      height: 72,
                      borderRadius: 12,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <span
                    style={{
                      width: 60,
                      height: 72,
                      borderRadius: 12,
                      background: C.ivory,
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong className="a-dsp" style={{ fontSize: 19 }}>
                    {p?.name ?? "Gift"}
                  </strong>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    {g.occasionLabel} ·{" "}
                    {sent ? "delivered" : `arrives ${shortDate(g.deliveryDate)}`}
                  </div>
                </div>
                <span className="a-pill" style={{ background: sent ? C.sage : C.gold }}>
                  {sent ? "Sent" : "Scheduled"}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div style={{ padding: "22px 22px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
        <Link to="/app/shop" search={{ for: person.id }} className="a-abtn a-lg a-ink">
          Choose a gift{milestone ? ` for the ${milestone}` : ""}
        </Link>
        <Link to="/app/vouchers" search={{ for: person.id }} className="a-abtn a-lg a-line">
          Send a voucher instead
        </Link>
      </div>
    </div>
  );
}
