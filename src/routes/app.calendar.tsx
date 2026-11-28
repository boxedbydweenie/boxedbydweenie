import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCustomMoments, useMoments, usePeople, useScheduledGifts } from "@/hooks/use-calendar";
import { daysUntil, getUpcomingOccasions, todayIso } from "@/services/calendar";
import { useEffect } from "react";
import type { OccasionInstance } from "@/types/calendar";
import {
  C,
  Ring,
  avatarColour,
  followed,
  longDate,
  shortDate,
  status,
  upcomingItems,
  useWide,
  whenText,
} from "@/components/app/kit";
import {
  MonthGrid,
  keepFor,
  useCalendarEvents,
  type DayEvent,
  type Filter,
} from "@/components/app/MonthCalendar";

export const Route = createFileRoute("/app/calendar")({
  component: AppCalendar,
});

const FILTERS: [Filter, string, string | null][] = [
  ["all", "All", null],
  ["people", "My people", C.coral],
  ["festivals", "Festivals", C.gold],
  ["work", "Work", null],
];

function AppCalendar() {
  const today = todayIso();
  const wide = useWide();
  const people = usePeople();
  const scheduled = useScheduledGifts();
  const moments = useMoments();
  const [cursor, setCursor] = useState(() => ({
    y: Number(today.slice(0, 4)),
    m: Number(today.slice(5, 7)),
  }));
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<"month" | "list">("month");
  const [picked, setPicked] = useState<string | null>(null);
  const [festivals, setFestivals] = useState<OccasionInstance[]>([]);
  const byDate = useCalendarEvents(cursor.y);
  const custom = useCustomMoments();
  useEffect(() => {
    void getUpcomingOccasions(40).then(setFestivals);
  }, [custom]);

  const keep = keepFor(filter);
  const eventsOn = (iso: string) => (byDate.get(iso) ?? []).filter(keep);
  const monthKey = `${cursor.y}-${String(cursor.m).padStart(2, "0")}`;
  const isThisMonth = monthKey === today.slice(0, 7);
  const dates = [...byDate.keys()].sort();
  const nextOverall = dates.find((d) => d >= today && eventsOn(d).length);
  const nextInMonth =
    dates.find((d) => d.startsWith(monthKey) && d >= today && eventsOn(d).length) ??
    dates.find((d) => d.startsWith(monthKey) && eventsOn(d).length);
  const sheetDay = picked ?? (isThisMonth ? nextOverall : nextInMonth) ?? null;
  const sheetEvents = sheetDay ? eventsOn(sheetDay) : [];

  const move = (delta: number | "today") => {
    setPicked(null);
    if (delta === "today")
      return setCursor({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) });
    setCursor((c) => {
      const m = c.m + delta;
      return m < 1 ? { y: c.y - 1, m: 12 } : m > 12 ? { y: c.y + 1, m: 1 } : { y: c.y, m };
    });
  };

  const list = upcomingItems(people, scheduled, followed(festivals, moments)).filter((i) =>
    filter === "all"
      ? true
      : filter === "people"
        ? i.kind === "person"
        : filter === "festivals"
          ? i.kind === "festival"
          : i.kind === "festival" &&
            i.occasionSlug !== undefined &&
            /staff|boss|customer|employee/.test(i.occasionSlug),
  );

  const header = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div>
        <div className="a-eye">Gift Calendar</div>
        <h1 className="a-dsp" style={{ fontSize: 40, marginTop: 6 }}>
          {view === "list" && !wide ? (
            "Coming up"
          ) : (
            <>
              {new Date(cursor.y, cursor.m - 1, 1).toLocaleDateString("en-GB", { month: "long" })}{" "}
              <span style={{ color: C.muted }}>{cursor.y}</span>
            </>
          )}
        </h1>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {!wide && (
          <div
            role="group"
            aria-label="View"
            style={{
              display: "flex",
              background: C.line,
              borderRadius: 999,
              padding: 3,
              fontSize: 13,
            }}
          >
            {(["month", "list"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: 0,
                  cursor: "pointer",
                  background: view === v ? "#FFFFFF" : "transparent",
                  fontWeight: view === v ? 700 : 400,
                  color: view === v ? C.nero : C.muted,
                  fontFamily: "inherit",
                  fontSize: 13,
                }}
              >
                {v === "month" ? "Month" : "List"}
              </button>
            ))}
          </div>
        )}
        <Link to="/app/people/new" className="a-abtn a-ink" style={{ minHeight: 40 }}>
          + Add a date
        </Link>
      </div>
    </div>
  );

  const filters = (
    <div className="a-hscroll" style={{ gap: 8, marginTop: 16 }}>
      {FILTERS.map(([id, label, dot]) => {
        const on = filter === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={on}
            onClick={() => setFilter(id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              minHeight: 40,
              padding: "0 14px",
              borderRadius: 999,
              border: `1.5px solid ${on ? C.nero : C.line}`,
              fontSize: 13,
              whiteSpace: "nowrap",
              background: on ? C.nero : "#FFFFFF",
              color: on ? "#FFFFFF" : C.nero,
              fontWeight: on ? 600 : 400,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {dot && (
              <i
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: dot,
                  display: "block",
                }}
              />
            )}
            {label}
          </button>
        );
      })}
    </div>
  );

  const dayPanel = (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: wide ? 24 : "28px 28px 0 0",
        border: wide ? `1.5px solid ${C.line}` : 0,
        boxShadow: wide ? "none" : "0 -10px 30px rgba(41,40,40,.1)",
        padding: wide ? 18 : "10px 20px 18px",
      }}
    >
      {!wide && (
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: C.line,
            margin: "0 auto 14px",
          }}
        />
      )}
      {sheetDay && sheetEvents.length ? (
        <>
          <div className="a-eye">{longDate(sheetDay)}</div>
          {sheetEvents.map((e) => (
            <DayCard key={e.key} e={e} today={today} />
          ))}
        </>
      ) : (
        <>
          <div className="a-eye">{sheetDay ? longDate(sheetDay) : "This month"}</div>
          <p style={{ fontSize: 14, color: C.muted, margin: "10px 0 14px" }}>
            Nothing on this day yet.
          </p>
          <Link to="/app/people/new" className="a-abtn a-ink">
            Add a date
          </Link>
        </>
      )}
    </div>
  );

  const upcoming = (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 20,
        border: `1.5px solid ${C.line}`,
        padding: "4px 16px",
      }}
    >
      {list.length === 0 && (
        <p style={{ fontSize: 14, color: C.muted, padding: "14px 0" }}>
          Nothing coming up for this filter.
        </p>
      )}
      {list.slice(0, wide ? 8 : 40).map((i, n) => {
        const s = status(i);
        const av = i.personId ? avatarColour(i.personId) : { background: C.nero, color: C.gold };
        const row = (
          <>
            <span
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                ...av,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: i.kind === "person" ? 14 : 16,
                fontFamily: i.kind === "person" ? undefined : "'EB Garamond',Georgia,serif",
                flexShrink: 0,
              }}
            >
              {i.initial}
            </span>
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
                {i.kind === "person" ? `${i.name.split(" ")[0]}'s ${i.title}` : i.name}
              </strong>
              <span style={{ fontSize: 12, color: C.muted }}>
                {shortDate(i.date)} · {whenText(i.days).toLowerCase()}
              </span>
            </span>
            {s.label && (
              <span className="a-pill" style={{ background: s.bg, color: s.fg }}>
                {s.label}
              </span>
            )}
          </>
        );
        const style = {
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 0",
          borderTop: n ? `1px solid ${C.line}` : 0,
        } as const;
        return i.personId ? (
          <Link
            key={i.key}
            to="/app/people/$personId"
            params={{ personId: i.personId }}
            style={style}
          >
            {row}
          </Link>
        ) : (
          <Link
            key={i.key}
            to="/app/occasion/$slug"
            params={{ slug: i.occasionSlug ?? "" }}
            style={style}
          >
            {row}
          </Link>
        );
      })}
    </div>
  );

  if (wide) {
    return (
      <div style={{ padding: "0 40px 32px" }}>
        <div className="a-wide">
          <div className="a-dark-head a-bleed a-pat-green">{header}</div>
          {filters}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) 340px",
              gap: 22,
              marginTop: 18,
              alignItems: "start",
            }}
          >
            <MonthGrid
              large
              y={cursor.y}
              m={cursor.m}
              byDate={byDate}
              filter={filter}
              today={today}
              picked={sheetDay}
              onPick={setPicked}
              onMove={move}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                position: "sticky",
                top: 24,
              }}
            >
              {dayPanel}
              <div className="a-eye" style={{ padding: "0 6px" }}>
                Coming up
              </div>
              {upcoming}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={{ padding: "0 22px 0" }}>
        <div className="a-dark-head a-bleed a-pat-green" style={{ ["--bleed" as string]: "22px" }}>
          {header}
        </div>
        {filters}
      </div>
      {view === "month" ? (
        <>
          <div style={{ margin: "16px 14px 0" }}>
            <MonthGrid
              y={cursor.y}
              m={cursor.m}
              byDate={byDate}
              filter={filter}
              today={today}
              picked={sheetDay}
              onPick={setPicked}
              onMove={move}
            />
          </div>
          <div style={{ flex: 1, minHeight: 16 }} />
          <div style={{ marginTop: 16 }}>{dayPanel}</div>
        </>
      ) : (
        <div style={{ margin: "16px 16px 16px" }}>{upcoming}</div>
      )}
    </div>
  );
}

function DayCard({ e, today }: { e: DayEvent; today: string }) {
  const days = daysUntil(e.date, today);
  const past = days < 0;
  const isPerson = e.kind === "person" && e.personId;
  const av = e.personId ? avatarColour(e.personId) : { background: C.gold, color: C.nero };
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <Ring size={58} days={Math.max(0, days)}>
          <span
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              ...av,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'EB Garamond',Georgia,serif",
              fontWeight: 500,
              fontSize: 22,
            }}
          >
            {e.name.trim().slice(0, 1).toUpperCase()}
          </span>
        </Ring>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="a-dsp" style={{ fontSize: 24 }}>
            {isPerson ? `${e.name.split(" ")[0]}'s ${e.title}` : e.name}
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
            {past ? "Passed" : days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`}
            {!past && e.orderBy && e.orderBy >= today ? ` · order by ${shortDate(e.orderBy)}` : ""}
            {e.tbc ? " · date to be confirmed" : ""}
          </div>
          {e.publicHoliday && (
            <span
              className="a-pill"
              style={{
                background: C.forest,
                color: "#FFFFFF",
                marginTop: 8,
                minHeight: 22,
                fontSize: 11,
              }}
            >
              Public holiday
            </span>
          )}
        </div>
      </div>
      {!past && (
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {isPerson ? (
            <>
              <Link
                to="/app/shop"
                search={{ for: e.personId! }}
                className="a-abtn a-ink"
                style={{ flex: 1 }}
              >
                Choose a gift
              </Link>
              <Link
                to="/app/people/$personId"
                params={{ personId: e.personId! }}
                className="a-abtn a-line"
                style={{ flex: 1 }}
              >
                View {e.name.split(" ")[0]}
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/app/shop"
                search={e.shopOccasion ? { occasion: e.shopOccasion } : {}}
                className="a-abtn a-ink"
                style={{ flex: 1 }}
              >
                Shop gifts
              </Link>
              <Link
                to="/app/occasion/$slug"
                params={{ slug: e.occasionSlug ?? "" }}
                className="a-abtn a-line"
                style={{ flex: 1 }}
              >
                What is it?
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
