import { useEffect, useMemo, useState } from "react";
import { useMoments, usePeople } from "@/hooks/use-calendar";
import { addDays, getOccasionsForYear, isoDate } from "@/services/calendar";
import type { OccasionInstance } from "@/types/calendar";
import { C, IconBack, PERSON_ORDER_LEAD_DAYS, followed, longDate, occasionTitle } from "./kit";

/** Everything that can appear on the calendar, for the phone and laptop month views. */

export type Filter = "all" | "people" | "festivals" | "work";
export interface DayEvent {
  key: string;
  kind: "person" | "festival";
  name: string;
  title: string;
  date: string;
  orderBy: string | null;
  personId?: string;
  occasionSlug?: string;
  shopOccasion?: string;
  work: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** People's dates and followed festivals for the year before, the year shown and the year after, keyed by date. */
export function useCalendarEvents(year: number) {
  const people = usePeople();
  const moments = useMoments();
  const [festivals, setFestivals] = useState<OccasionInstance[]>([]);
  useEffect(() => {
    void Promise.all([
      getOccasionsForYear(year - 1),
      getOccasionsForYear(year),
      getOccasionsForYear(year + 1),
    ]).then((a) => setFestivals(a.flat()));
  }, [year]);
  return useMemo(() => {
    const map = new Map<string, DayEvent[]>();
    const add = (e: DayEvent) => map.set(e.date, [...(map.get(e.date) ?? []), e]);
    for (const y of [year - 1, year, year + 1]) {
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
      const shop = f.occasion.shop;
      add({
        key: `f-${f.occasion.slug}-${f.date}`,
        kind: "festival",
        name: f.occasion.name,
        title: "",
        date: f.date,
        orderBy: f.tbc ? null : f.orderBy,
        occasionSlug: f.occasion.slug,
        ...(shop?.occasion ? { shopOccasion: shop.occasion } : {}),
        work: f.occasion.category === "workplace",
      });
    }
    return map;
  }, [people, festivals, moments, year]);
}

export const keepFor = (filter: Filter) => (e: DayEvent) =>
  filter === "all"
    ? true
    : filter === "people"
      ? e.kind === "person"
      : filter === "work"
        ? e.work
        : e.kind === "festival" && !e.work;

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Month grid. Phones: dots under each day. Laptops (large): the event names as pills, like canvas 3.1. */
export function MonthGrid({
  y,
  m,
  byDate,
  filter,
  today,
  picked,
  onPick,
  onMove,
  large,
}: {
  y: number;
  m: number;
  byDate: Map<string, DayEvent[]>;
  filter: Filter;
  today: string;
  picked: string | null;
  onPick: (iso: string) => void;
  onMove: (delta: number | "today") => void;
  large?: boolean;
}) {
  const keep = keepFor(filter);
  const eventsOn = (iso: string) => (byDate.get(iso) ?? []).filter(keep);
  const orderDays = new Set<string>();
  for (const list of byDate.values())
    for (const e of list) if (keep(e) && e.orderBy && e.orderBy >= today) orderDays.add(e.orderBy);
  const first = new Date(y, m - 1, 1);
  const lead = (first.getDay() + 6) % 7;
  const cells = Array.from({ length: 42 }, (_, i) => isoDate(new Date(y, m - 1, 1 - lead + i)));
  const monthKey = `${y}-${pad(m)}`;
  const grid = cells[35]!.startsWith(monthKey) ? cells : cells.slice(0, 35);
  const monthName = first.toLocaleDateString("en-GB", { month: "long" });

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 24,
        border: `1.5px solid ${C.line}`,
        padding: large ? "18px 18px 8px" : 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: large ? "0 6px 14px" : "0 4px 8px",
          gap: 10,
        }}
      >
        {large ? (
          <div className="a-dsp" style={{ fontSize: 30 }}>
            {monthName} <span style={{ color: C.muted }}>{y}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onMove(-1)}
            aria-label="Previous month"
            style={navBtn}
          >
            <IconBack style={{ width: 18, height: 18 }} />
          </button>
        )}
        {!large && (
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            {monthName} {y}
          </span>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          {large && (
            <button
              type="button"
              onClick={() => onMove(-1)}
              aria-label="Previous month"
              style={navBtn}
            >
              <IconBack style={{ width: 18, height: 18 }} />
            </button>
          )}
          {large && (
            <button
              type="button"
              onClick={() => onMove("today")}
              style={{
                ...navBtn,
                width: "auto",
                padding: "0 14px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Today
            </button>
          )}
          <button type="button" onClick={() => onMove(1)} aria-label="Next month" style={navBtn}>
            <IconBack style={{ width: 18, height: 18, transform: "rotate(180deg)" }} />
          </button>
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,minmax(0,1fr))",
          rowGap: large ? 0 : 2,
        }}
      >
        {DOW.map((d) => (
          <div
            key={d}
            style={{
              fontSize: 11,
              textAlign: large ? "left" : "center",
              color: C.goldText,
              fontWeight: 600,
              padding: large ? "0 8px 8px" : "0 0 6px",
              letterSpacing: ".18em",
            }}
          >
            {large ? d.toUpperCase() : d[0]}
          </div>
        ))}
        {grid.map((iso) => {
          const inMonth = iso.startsWith(monthKey);
          const ev = eventsOn(iso);
          const isToday = iso === today;
          const isPicked = iso === picked;
          const order = orderDays.has(iso) && !isToday;
          const label = `${longDate(iso)}${ev.length ? `, ${ev.map((e) => e.name).join(", ")}` : ""}${order ? ", last order day" : ""}`;
          if (large) {
            return (
              <button
                key={iso}
                type="button"
                onClick={() => onPick(iso)}
                aria-label={label}
                aria-pressed={isPicked}
                style={{
                  minHeight: 92,
                  borderTop: `1px solid ${C.line}`,
                  borderLeft: 0,
                  borderRight: 0,
                  borderBottom: 0,
                  padding: 8,
                  fontSize: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  fontVariantNumeric: "tabular-nums",
                  minWidth: 0,
                  textAlign: "left",
                  cursor: "pointer",
                  background: isPicked ? C.ivory : "transparent",
                  color: inMonth ? C.nero : C.muted,
                  opacity: inMonth ? 1 : 0.55,
                  boxShadow: order ? `inset 0 0 0 1.5px ${C.oxblood}` : "none",
                  borderRadius: order ? 10 : 0,
                }}
              >
                <span
                  style={
                    isToday
                      ? {
                          background: C.nero,
                          color: "#FFFFFF",
                          borderRadius: 999,
                          padding: "0 8px",
                          alignSelf: "flex-start",
                          fontWeight: 700,
                        }
                      : { fontWeight: isPicked ? 700 : 400 }
                  }
                >
                  {Number(iso.slice(8, 10))}
                </span>
                {ev.slice(0, 3).map((e) => (
                  <span
                    key={e.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "4px 8px",
                      borderRadius: 999,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "100%",
                      boxSizing: "border-box",
                      ...(e.kind === "person"
                        ? { background: C.coral, color: C.nero }
                        : e.work
                          ? { background: C.ivory, border: `1.5px solid ${C.gold}` }
                          : { background: C.gold, color: C.nero }),
                    }}
                  >
                    {e.kind === "person"
                      ? `${e.name.split(" ")[0]} · ${e.title.split(" ")[0]}`
                      : e.name}
                  </span>
                ))}
                {ev.length > 3 && (
                  <span style={{ fontSize: 11, color: C.muted }}>+{ev.length - 3} more</span>
                )}
              </button>
            );
          }
          const isFestival =
            ev.some((e) => e.kind === "festival") && !ev.some((e) => e.kind === "person");
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onPick(iso)}
              aria-label={label}
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
                background: isToday
                  ? C.nero
                  : isPicked
                    ? isFestival
                      ? C.gold
                      : C.ivory
                    : "transparent",
                color: isToday ? "#FFFFFF" : inMonth ? C.nero : C.muted,
                opacity: inMonth ? 1 : 0.55,
                fontWeight: isToday || isPicked ? 700 : 400,
                boxShadow: order
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
                        e.kind === "person" ? C.coral : isPicked && isFestival ? C.nero : C.gold,
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
          padding: "10px 8px 6px",
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
  );
}

const navBtn = {
  width: 36,
  height: 36,
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
