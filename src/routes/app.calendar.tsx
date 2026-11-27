import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMoments, usePeople, useScheduledGifts } from "@/hooks/use-calendar";
import { addDays, daysUntil, getOccasionsForYear, isoDate, todayIso } from "@/services/calendar";
import type { OccasionInstance } from "@/types/calendar";
import {
  C,
  IconBack,
  PERSON_ORDER_LEAD_DAYS,
  Ring,
  avatarColour,
  followed,
  longDate,
  occasionTitle,
  shortDate,
  status,
  upcomingItems,
  whenText,
} from "@/components/app/kit";

export const Route = createFileRoute("/app/calendar")({
  component: AppCalendar,
});

type Filter = "all" | "people" | "festivals" | "work";
interface DayEvent {
  key: string;
  kind: "person" | "festival";
  name: string;
  title: string;
  date: string;
  orderBy: string | null;
  personId?: string;
  work: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");
const DOW = ["M", "T", "W", "T", "F", "S", "S"];

function AppCalendar() {
  const people = usePeople();
  const scheduled = useScheduledGifts();
  const moments = useMoments();
  const today = todayIso();
  const [cursor, setCursor] = useState(() => ({
    y: Number(today.slice(0, 4)),
    m: Number(today.slice(5, 7)),
  }));
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<"month" | "list">("month");
  const [picked, setPicked] = useState<string | null>(null);
  const [festivals, setFestivals] = useState<OccasionInstance[]>([]);

  useEffect(() => {
    void Promise.all([
      getOccasionsForYear(cursor.y - 1),
      getOccasionsForYear(cursor.y),
      getOccasionsForYear(cursor.y + 1),
    ]).then((a) => setFestivals(a.flat()));
  }, [cursor.y]);

  // Every event across the visible years, keyed by date.
  const byDate = useMemo(() => {
    const map = new Map<string, DayEvent[]>();
    const add = (e: DayEvent) => map.set(e.date, [...(map.get(e.date) ?? []), e]);
    for (const y of [cursor.y - 1, cursor.y, cursor.y + 1]) {
      for (const p of people) {
        for (const d of p.dates) {
          const date = `${y}-${pad(d.month)}-${pad(d.day)}`;
          add({
            key: `${p.id}-${d.id}-${y}`,
            kind: "person",
            name: p.name,
            title: occasionTitle(d.label, d.type, d.year, date),
            date,
            orderBy: addDays(date, -PERSON_ORDER_LEAD_DAYS),
            personId: p.id,
            work: p.relationship === "Colleague" || p.relationship === "Client",
          });
        }
      }
    }
    for (const f of followed(festivals, moments)) {
      if (!f.date) continue;
      add({
        key: `f-${f.occasion.slug}-${f.date}`,
        kind: "festival",
        name: f.occasion.name,
        title: "",
        date: f.date,
        orderBy: f.tbc ? null : f.orderBy,
        work: f.occasion.category === "workplace",
      });
    }
    return map;
  }, [people, festivals, moments, cursor.y]);

  const keep = (e: DayEvent) =>
    filter === "all"
      ? true
      : filter === "people"
        ? e.kind === "person"
        : filter === "work"
          ? e.work
          : e.kind === "festival" && !e.work;
  const eventsOn = (iso: string) => (byDate.get(iso) ?? []).filter(keep);
  const orderDays = useMemo(() => {
    const s = new Set<string>();
    for (const list of byDate.values())
      for (const e of list) if (keep(e) && e.orderBy && e.orderBy >= today) s.add(e.orderBy);
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byDate, filter, today]);

  // Month grid, Monday first.
  const first = new Date(cursor.y, cursor.m - 1, 1);
  const lead = (first.getDay() + 6) % 7;
  const start = new Date(cursor.y, cursor.m - 1, 1 - lead);
  const cells = Array.from({ length: 42 }, (_, i) =>
    isoDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)),
  );
  const grid = cells[35]!.slice(5, 7) === pad(cursor.m) ? cells : cells.slice(0, 35);
  const monthName = first.toLocaleDateString("en-GB", { month: "long" });

  // The day shown in the bottom card: the tapped day, else the next day with something on it this month.
  const monthKey = `${cursor.y}-${pad(cursor.m)}`;
  const nextInMonth =
    grid.find((d) => d.startsWith(monthKey) && d >= today && eventsOn(d).length) ??
    grid.find((d) => d.startsWith(monthKey) && eventsOn(d).length);
  const isThisMonth = monthKey === today.slice(0, 7);
  const nextOverall = [...byDate.keys()].filter((d) => d >= today && eventsOn(d).length).sort()[0];
  const sheetDay = picked ?? (isThisMonth ? nextOverall : nextInMonth) ?? null;
  const sheetEvents = sheetDay ? eventsOn(sheetDay) : [];

  const move = (delta: number) => {
    setPicked(null);
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
          : false,
  );

  return (
    <div
      className="a-top-pattern"
      style={{ display: "flex", flexDirection: "column", minHeight: "calc(100dvh - 112px)" }}
    >
      <div style={{ padding: "54px 22px 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 12,
          }}
        >
          <div>
            <div className="a-eye">Gift Calendar</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
              <h1 className="a-dsp" style={{ fontSize: 40 }}>
                {view === "month" ? (
                  <>
                    {monthName} <span style={{ color: C.muted }}>{cursor.y}</span>
                  </>
                ) : (
                  "Coming up"
                )}
              </h1>
            </div>
          </div>
          <div
            role="group"
            aria-label="View"
            style={{
              display: "flex",
              background: C.line,
              borderRadius: 999,
              padding: 3,
              fontSize: 13,
              flexShrink: 0,
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
                  font: "inherit",
                }}
              >
                {v === "month" ? "Month" : "List"}
              </button>
            ))}
          </div>
        </div>
        <div className="a-hscroll" style={{ gap: 8, marginTop: 16 }}>
          {(
            [
              ["all", "All", null],
              ["people", "My people", C.coral],
              ["festivals", "Festivals", C.gold],
              ["work", "Work", null],
            ] as const
          ).map(([id, label, dot]) => {
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
      </div>

      {view === "month" ? (
        <>
          <div
            style={{
              margin: "16px 14px 0",
              background: "#FFFFFF",
              borderRadius: 24,
              padding: "10px 10px 10px",
              border: `1.5px solid ${C.line}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0 4px 8px",
              }}
            >
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="Previous month"
                style={navBtn}
              >
                <IconBack style={{ width: 18, height: 18 }} />
              </button>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {monthName} {cursor.y}
              </span>
              <button type="button" onClick={() => move(1)} aria-label="Next month" style={navBtn}>
                <IconBack style={{ width: 18, height: 18, transform: "rotate(180deg)" }} />
              </button>
            </div>
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", rowGap: 2 }}
            >
              {DOW.map((d, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 11,
                    textAlign: "center",
                    color: C.goldText,
                    fontWeight: 600,
                    paddingBottom: 6,
                    letterSpacing: ".1em",
                  }}
                >
                  {d}
                </div>
              ))}
              {grid.map((iso) => {
                const inMonth = iso.startsWith(monthKey);
                const ev = eventsOn(iso);
                const isToday = iso === today;
                const isPicked = iso === sheetDay;
                const isFestival =
                  ev.some((e) => e.kind === "festival") && !ev.some((e) => e.kind === "person");
                const bg = isToday
                  ? C.nero
                  : isPicked
                    ? isFestival
                      ? C.gold
                      : C.ivory
                    : "transparent";
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setPicked(iso)}
                    aria-label={`${longDate(iso)}${ev.length ? `, ${ev.map((e) => e.name).join(", ")}` : ""}`}
                    aria-pressed={isPicked}
                    style={{
                      height: 46,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 3,
                      fontSize: 15,
                      fontVariantNumeric: "tabular-nums",
                      borderRadius: 14,
                      border: 0,
                      cursor: "pointer",
                      background: bg,
                      color: isToday ? "#FFFFFF" : inMonth ? C.nero : C.muted,
                      opacity: inMonth ? 1 : 0.55,
                      fontWeight: isToday || isPicked ? 700 : 400,
                      boxShadow:
                        orderDays.has(iso) && !isToday
                          ? `inset 0 0 0 1.5px ${C.oxblood}`
                          : isPicked && !isToday
                            ? `inset 0 0 0 1.5px ${C.nero}`
                            : "none",
                    }}
                  >
                    {Number(iso.slice(8, 10))}
                    <span style={{ display: "flex", gap: 3, height: 6 }}>
                      {ev.slice(0, 3).map((e) => (
                        <i
                          key={e.key}
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            display: "block",
                            background:
                              e.kind === "person"
                                ? C.coral
                                : isToday
                                  ? C.gold
                                  : isPicked && isFestival
                                    ? C.nero
                                    : C.gold,
                          }}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
            <div
              style={{
                display: "flex",
                gap: 14,
                fontSize: 11,
                padding: "10px 8px 2px",
                color: C.muted,
                flexWrap: "wrap",
              }}
            >
              <span style={legend}>
                <i
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: C.coral,
                    display: "block",
                  }}
                />
                Your people
              </span>
              <span style={legend}>
                <i
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: C.gold,
                    display: "block",
                  }}
                />
                Festivals
              </span>
              <span style={legend}>
                <i
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    border: `1.5px solid ${C.oxblood}`,
                    boxSizing: "border-box",
                    display: "block",
                  }}
                />
                Last order day
              </span>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 16 }} />
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "28px 28px 0 0",
              boxShadow: "0 -10px 30px rgba(41,40,40,.1)",
              padding: "10px 20px 18px",
              marginTop: 16,
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                background: C.line,
                margin: "0 auto 14px",
              }}
            />
            {sheetDay && sheetEvents.length ? (
              <>
                <div className="a-eye">{longDate(sheetDay)}</div>
                {sheetEvents.map((e) => (
                  <SheetEvent key={e.key} e={e} today={today} />
                ))}
              </>
            ) : (
              <>
                <div className="a-eye">
                  {sheetDay ? longDate(sheetDay) : `${monthName} ${cursor.y}`}
                </div>
                <p style={{ fontSize: 14, color: C.muted, margin: "10px 0 14px" }}>
                  Nothing on this day yet.
                </p>
                <Link to="/app/people" search={{ add: true }} className="a-abtn a-ink">
                  Add a date
                </Link>
              </>
            )}
          </div>
        </>
      ) : (
        <div
          style={{
            margin: "16px 16px 0",
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
          {list.slice(0, 40).map((i, n) => {
            const s = status(i);
            const av = i.personId
              ? avatarColour(i.personId)
              : { background: C.nero, color: C.gold };
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
              <div key={i.key} style={style}>
                {row}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SheetEvent({ e, today }: { e: DayEvent; today: string }) {
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
          </div>
        </div>
      </div>
      {!past && (
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {isPerson ? (
            <>
              <Link
                to="/app/send/$personId"
                params={{ personId: e.personId! }}
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
              <a href="/shop" className="a-abtn a-ink" style={{ flex: 1 }}>
                Shop gifts
              </a>
              <Link to="/app/vouchers" className="a-abtn a-line" style={{ flex: 1 }}>
                Send a voucher
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const navBtn = {
  width: 34,
  height: 34,
  borderRadius: "50%",
  border: `1.5px solid ${C.line}`,
  background: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: C.nero,
} as const;
const legend = { display: "flex", gap: 6, alignItems: "center" } as const;
