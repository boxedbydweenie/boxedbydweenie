import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { usePeople, useScheduledGifts } from "@/hooks/use-calendar";
import { C, avatarColour, shortDate, status, upcomingItems, whenText } from "@/components/app/kit";

export const Route = createFileRoute("/app/people/")({
  validateSearch: z.object({ add: z.boolean().optional().catch(undefined) }),
  component: AppPeople,
});

function AppPeople() {
  const people = usePeople();
  const scheduled = useScheduledGifts();
  const { add } = Route.useSearch();
  const navigate = useNavigate();
  useEffect(() => {
    if (add) void navigate({ to: "/app/people/new", replace: true });
  }, [add, navigate]);

  // Each person's next date, soonest first.
  const items = upcomingItems(people, scheduled, []);
  const nextFor = new Map<string, (typeof items)[number]>();
  for (const i of items) if (i.personId && !nextFor.has(i.personId)) nextFor.set(i.personId, i);
  const sorted = [...people].sort((a, b) =>
    (nextFor.get(a.id)?.date ?? "9999").localeCompare(nextFor.get(b.id)?.date ?? "9999"),
  );

  return (
    <div style={{ padding: "0 16px 16px" }}>
      <div
        className="a-dark-head a-bleed a-pat-oxblood"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <div className="a-eye">People</div>
          <h1 className="a-dsp" style={{ fontSize: 38, marginTop: 6 }}>
            Everyone <span style={{ color: C.goldText }}>you remember.</span>
          </h1>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, margin: "16px 6px 0" }}>
        <Link to="/app/people/new" className="a-abtn a-ink" style={{ flex: 1 }}>
          Add a person
        </Link>
        <Link
          to="/app/welcome"
          search={{ step: "import", from: "people" }}
          className="a-abtn a-line"
          style={{ flex: 1 }}
        >
          Import a list
        </Link>
      </div>

      {people.length === 0 ? (
        <div
          style={{
            margin: "18px 6px 0",
            background: "#FFFFFF",
            borderRadius: 20,
            border: `1.5px solid ${C.line}`,
            padding: 20,
            textAlign: "center",
          }}
        >
          <img src="/brand/bow-gold.svg" alt="" style={{ width: 70, height: "auto" }} />
          <p className="a-dsp" style={{ fontSize: 22, marginTop: 10 }}>
            No one here yet.
          </p>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>
            Add the first birthday or anniversary and we'll remind you in good time.
          </p>
        </div>
      ) : (
        <div
          style={{
            marginTop: 16,
            background: "#FFFFFF",
            borderRadius: 20,
            border: `1.5px solid ${C.line}`,
            padding: "4px 16px",
          }}
        >
          {sorted.map((p, n) => {
            const i = nextFor.get(p.id);
            const s = i ? status(i) : null;
            return (
              <Link
                key={p.id}
                to="/app/people/$personId"
                params={{ personId: p.id }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 0",
                  borderTop: n ? `1px solid ${C.line}` : 0,
                }}
              >
                {p.photo ? (
                  <img
                    src={p.photo}
                    alt=""
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <span
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      ...avatarColour(p.id),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {p.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <strong
                    style={{
                      display: "block",
                      fontSize: 15,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.name}
                  </strong>
                  <span
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: C.muted,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {i
                      ? `${i.title.charAt(0).toUpperCase()}${i.title.slice(1)} · ${shortDate(i.date)}`
                      : p.relationship}
                  </span>
                </span>
                {i && s?.label && s.label !== "No gift yet" ? (
                  <span className="a-pill" style={{ background: s.bg, color: s.fg }}>
                    {s.label}
                  </span>
                ) : i ? (
                  <span style={{ fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                    {whenText(i.days).replace(" to go", "")}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
