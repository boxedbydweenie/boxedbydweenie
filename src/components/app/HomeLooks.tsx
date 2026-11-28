import type { CSSProperties, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { OCCASIONS } from "@/data/occasions";
import { todayIso } from "@/services/calendar";
import type { Person } from "@/types/calendar";
import {
  C,
  IconPlus,
  Ring,
  greeting,
  longDate,
  shortDate,
  status,
  whenText,
  type UpcomingItem,
} from "@/components/app/kit";

/**
 * Two alternative Home designs, for choosing between.
 * A, "Countdown": ivory, editorial, one big number and a quiet timeline.
 * B, "Evening agenda": dark, a two-week strip and an agenda grouped by when.
 */

interface LookProps {
  name: string;
  items: UpcomingItem[];
  people: Person[];
}

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["S", "M", "T", "W", "T", "F", "S"];
const shopOcc = (slug?: string) =>
  slug ? OCCASIONS.find((o) => o.slug === slug)?.shop.occasion : undefined;
const first = (n: string) => n.trim().split(/\s+/)[0] ?? "";
const initialsOf = (n: string) =>
  n
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
const titleOf = (i: UpcomingItem) =>
  i.kind === "person" ? `${first(i.name)}'s ${i.title}` : i.name;
const detailOf = (i: UpcomingItem) => {
  if (i.tbc) return "Date to be confirmed";
  if (status(i).label === "Order today") return "Order today";
  if (i.orderBy && i.orderBy >= todayIso()) return `Order by ${shortDate(i.orderBy)}`;
  if (i.publicHoliday) return "Public holiday";
  return whenText(i.days);
};

function ItemLink({
  i,
  style,
  children,
}: {
  i: UpcomingItem;
  style: CSSProperties;
  children: ReactNode;
}) {
  if (i.kind === "person" && i.personId)
    return (
      <Link to="/app/people/$personId" params={{ personId: i.personId }} style={style}>
        {children}
      </Link>
    );
  const occ = shopOcc(i.occasionSlug);
  return (
    <Link to="/app/shop" search={occ ? { occasion: occ } : {}} style={style}>
      {children}
    </Link>
  );
}

function GiftButtons({ i, dark }: { i: UpcomingItem; dark?: boolean }) {
  const occ = shopOcc(i.occasionSlug);
  return (
    <>
      <Link
        to="/app/shop"
        search={i.personId ? { for: i.personId } : occ ? { occasion: occ } : {}}
        className="a-abtn"
        style={{
          background: dark ? C.gold : C.plum,
          color: dark ? C.nero : "#FFFFFF",
          flex: 1,
        }}
      >
        {i.kind === "person" ? "Choose a gift" : "See gift ideas"}
      </Link>
      <Link
        to="/app/vouchers"
        search={i.personId ? { for: i.personId } : {}}
        className="a-abtn"
        style={{
          flex: 1,
          background: "transparent",
          color: dark ? "#FFFFFF" : C.plum,
          border: `1.5px solid ${dark ? "rgba(255,255,255,.28)" : C.line}`,
        }}
      >
        Send a voucher
      </Link>
    </>
  );
}

/* ================= A. Countdown ================= */
export function LookCountdown({ name, items, people }: LookProps) {
  const hero = items.find((i) => i.kind === "person") ?? items[0];
  const after = items.filter((i) => i !== hero).slice(0, 4);
  const peopleRow = people
    .map((p) => ({ p, next: items.find((i) => i.personId === p.id) }))
    .sort((a, b) => (a.next?.date ?? "9999").localeCompare(b.next?.date ?? "9999"))
    .slice(0, 8);
  return (
    <div style={{ padding: "calc(env(safe-area-inset-top,0px) + 18px) 22px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <img
          src="/brand/logo-primary.svg"
          alt="Boxed by Dweenie"
          style={{ height: 22, width: "auto" }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            to="/app/people/new"
            aria-label="Add a date"
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              border: `1.5px solid ${C.line}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.plum,
            }}
          >
            <IconPlus style={{ width: 20, height: 20 }} />
          </Link>
          <Link
            to="/app/account"
            aria-label="Profile"
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: C.plum,
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {initialsOf(name) || "B"}
          </Link>
        </div>
      </div>

      <p style={{ margin: "26px 0 0", fontSize: 15, color: C.muted, textAlign: "center" }}>
        {greeting()}, {first(name)}
      </p>

      {hero ? (
        <section style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
            <Ring size={220} days={hero.days}>
              <span
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#FFFFFF",
                }}
              >
                <span
                  className="a-dsp"
                  style={{ fontSize: hero.days > 99 ? 72 : 96, lineHeight: 0.9, color: C.plum }}
                >
                  {hero.days}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    letterSpacing: ".24em",
                    color: C.goldText,
                    marginTop: 8,
                    fontWeight: 600,
                  }}
                >
                  {hero.days === 1 ? "DAY" : "DAYS"}
                </span>
              </span>
            </Ring>
          </div>
          <div style={{ fontSize: 12, letterSpacing: ".24em", color: C.muted, marginTop: 22 }}>
            UNTIL
          </div>
          <h1
            className="a-dsp"
            style={{ fontSize: 34, color: C.plum, marginTop: 6, lineHeight: 1.08 }}
          >
            {titleOf(hero)}
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: C.muted }}>
            {longDate(hero.date)}
            {hero.orderBy && !hero.sorted && hero.orderBy >= todayIso()
              ? ` · order by ${shortDate(hero.orderBy)}`
              : ""}
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <GiftButtons i={hero} />
          </div>
        </section>
      ) : (
        <EmptyNote />
      )}

      {after.length > 0 && (
        <section style={{ marginTop: 40 }}>
          <div className="a-eye" style={{ textAlign: "center" }}>
            After that
          </div>
          <div style={{ position: "relative", marginTop: 18, paddingLeft: 26 }}>
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                left: 6,
                top: 8,
                bottom: 8,
                width: 1.5,
                background: C.line,
              }}
            />
            {after.map((i) => (
              <ItemLink
                key={i.key}
                i={i}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 14,
                  padding: "12px 0",
                  position: "relative",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: -25,
                    top: 18,
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: i.days <= 7 ? C.gold : "#FFFFFF",
                    border: `1.5px solid ${i.days <= 7 ? C.gold : C.muted}`,
                  }}
                />
                <span
                  style={{
                    width: 52,
                    flexShrink: 0,
                    fontSize: 12,
                    letterSpacing: ".14em",
                    color: C.goldText,
                    fontWeight: 600,
                  }}
                >
                  {Number(i.date.slice(8, 10))} {MON[Number(i.date.slice(5, 7)) - 1]!.toUpperCase()}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    className="a-dsp"
                    style={{ display: "block", fontSize: 21, color: C.plum, lineHeight: 1.15 }}
                  >
                    {titleOf(i)}
                  </span>
                  <span style={{ fontSize: 13, color: C.muted }}>{detailOf(i)}</span>
                </span>
              </ItemLink>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <Link to="/app/calendar" style={{ fontSize: 14, fontWeight: 600, color: C.plum }}>
              See the full calendar
            </Link>
          </div>
        </section>
      )}

      {peopleRow.length > 0 && (
        <section style={{ marginTop: 40, textAlign: "center" }}>
          <div className="a-eye">Your people</div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 16,
            }}
          >
            {peopleRow.map(({ p }) => (
              <Link
                key={p.id}
                to="/app/people/$personId"
                params={{ personId: p.id }}
                aria-label={p.name}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "#E9E1EA",
                  color: C.plum,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'EB Garamond',Georgia,serif",
                  fontSize: 20,
                  overflow: "hidden",
                }}
              >
                {p.photo ? (
                  <img
                    src={p.photo}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  p.name.slice(0, 1).toUpperCase()
                )}
              </Link>
            ))}
            <Link
              to="/app/people/new"
              aria-label="Add someone"
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: `1.5px dashed ${C.muted}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.plum,
              }}
            >
              <IconPlus style={{ width: 18, height: 18 }} />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

/* ================= B. Evening agenda ================= */
const INK = "#1D191E";
const SOFT = "rgba(244,239,229,.62)";
const HAIR = "rgba(244,239,229,.1)";

export function LookAgenda({ name, items }: LookProps) {
  const today = todayIso();
  const hero = items.find((i) => i.kind === "person") ?? items[0];
  const rest = items.filter((i) => i !== hero).slice(0, 8);
  const groups: [string, UpcomingItem[]][] = [
    ["This week", rest.filter((i) => i.days <= 7)],
    ["This month", rest.filter((i) => i.days > 7 && i.days <= 31)],
    ["Later", rest.filter((i) => i.days > 31)],
  ];
  const dates = new Set(items.map((i) => i.date));
  const strip = Array.from({ length: 14 }, (_, n) => {
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() + n);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { iso, dow: DOW[d.getDay()]!, day: d.getDate(), has: dates.has(iso), today: n === 0 };
  });
  const todayText = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div
      style={{
        background: INK,
        color: C.ivory,
        minHeight: "100dvh",
        flex: 1,
        overflowX: "hidden",
        boxSizing: "border-box",
        padding: "calc(env(safe-area-inset-top,0px) + 20px) 0 32px",
      }}
    >
      <div
        style={{
          padding: "0 22px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ fontSize: 12, letterSpacing: ".2em", color: C.gold, fontWeight: 600 }}>
            {todayText.toUpperCase()}
          </div>
          <h1 className="a-dsp" style={{ fontSize: 32, marginTop: 8, color: "#FFFFFF" }}>
            {greeting()}, {first(name)}
          </h1>
        </div>
        <Link
          to="/app/people/new"
          aria-label="Add a date"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: C.gold,
            color: C.nero,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconPlus style={{ width: 22, height: 22, strokeWidth: 2.2 }} />
        </Link>
      </div>

      {/* Two-week strip */}
      <div className="a-hscroll" style={{ gap: 8, margin: 0, padding: "22px 22px 0" }}>
        {strip.map((d) => (
          <Link
            key={d.iso}
            to="/app/calendar"
            style={{
              flexShrink: 0,
              width: 44,
              padding: "10px 0 8px",
              borderRadius: 14,
              background: d.today ? C.gold : "rgba(244,239,229,.06)",
              color: d.today ? C.nero : C.ivory,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span style={{ fontSize: 11, opacity: d.today ? 0.8 : 0.55 }}>{d.dow}</span>
            <span className="a-dsp" style={{ fontSize: 20, lineHeight: 1 }}>
              {d.day}
            </span>
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: d.has ? (d.today ? C.nero : C.gold) : "transparent",
              }}
            />
          </Link>
        ))}
      </div>

      {hero ? (
        <section
          style={{
            margin: "24px 16px 0",
            background: C.plum,
            borderRadius: 24,
            padding: 20,
          }}
        >
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <div style={{ textAlign: "center", flexShrink: 0, width: 72 }}>
              <div className="a-dsp" style={{ fontSize: 58, lineHeight: 0.9, color: C.gold }}>
                {hero.days}
              </div>
              <div style={{ fontSize: 11, letterSpacing: ".18em", color: SOFT, marginTop: 6 }}>
                {hero.days === 1 ? "DAY" : "DAYS"}
              </div>
            </div>
            <div style={{ minWidth: 0, borderLeft: `1px solid ${HAIR}`, paddingLeft: 18 }}>
              <div style={{ fontSize: 11, letterSpacing: ".2em", color: C.gold, fontWeight: 600 }}>
                NEXT UP
              </div>
              <div
                className="a-dsp"
                style={{ fontSize: 26, color: "#FFFFFF", marginTop: 4, lineHeight: 1.1 }}
              >
                {titleOf(hero)}
              </div>
              <div style={{ fontSize: 13, color: SOFT, marginTop: 4 }}>{longDate(hero.date)}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <GiftButtons i={hero} dark />
          </div>
        </section>
      ) : (
        <div style={{ padding: "24px 22px 0" }}>
          <EmptyNote dark />
        </div>
      )}

      {groups.map(([label, list]) =>
        list.length ? (
          <section key={label} style={{ padding: "28px 22px 0" }}>
            <div style={{ fontSize: 12, letterSpacing: ".2em", color: SOFT, fontWeight: 600 }}>
              {label.toUpperCase()}
            </div>
            <div style={{ marginTop: 6 }}>
              {list.map((i, n) => (
                <ItemLink
                  key={i.key}
                  i={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 0",
                    borderTop: n ? `1px solid ${HAIR}` : 0,
                    color: C.ivory,
                  }}
                >
                  <span
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "rgba(244,239,229,.08)",
                      color: C.gold,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'EB Garamond',Georgia,serif",
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {i.initial}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#FFFFFF",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {titleOf(i)}
                    </span>
                    <span style={{ fontSize: 12.5, color: SOFT }}>{detailOf(i)}</span>
                  </span>
                  <span style={{ textAlign: "right", flexShrink: 0 }}>
                    <span
                      className="a-dsp"
                      style={{ display: "block", fontSize: 22, color: C.gold, lineHeight: 1 }}
                    >
                      {Number(i.date.slice(8, 10))}
                    </span>
                    <span style={{ fontSize: 10.5, letterSpacing: ".14em", color: SOFT }}>
                      {MON[Number(i.date.slice(5, 7)) - 1]!.toUpperCase()}
                    </span>
                  </span>
                </ItemLink>
              ))}
            </div>
          </section>
        ) : null,
      )}

      <div style={{ textAlign: "center", padding: "26px 22px 0" }}>
        <Link to="/app/calendar" style={{ fontSize: 14, fontWeight: 600, color: C.gold }}>
          Open the full calendar
        </Link>
      </div>
    </div>
  );
}

function EmptyNote({ dark }: { dark?: boolean }) {
  return (
    <div style={{ textAlign: "center", padding: "32px 8px" }}>
      <p className="a-dsp" style={{ fontSize: 26, margin: 0, color: dark ? "#FFFFFF" : C.plum }}>
        Add your first date
      </p>
      <Link
        to="/app/people/new"
        className="a-abtn"
        style={{ marginTop: 16, background: C.gold, color: C.nero, display: "inline-flex" }}
      >
        Add a birthday
      </Link>
    </div>
  );
}
