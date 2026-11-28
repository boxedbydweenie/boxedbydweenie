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
 */

interface LookProps {
  name: string;
  items: UpcomingItem[];
  people: Person[];
}

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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

/** Brand box colours: people in plum, public holidays in forest, other occasions in oxblood. */
const tone = (i: UpcomingItem) =>
  i.kind === "person" ? C.plum : i.publicHoliday ? C.forest : C.oxblood;
const AVATAR = [C.plum, C.forest, C.oxblood, C.navy, C.gold];

/* ================= A. Countdown ================= */
export function LookCountdown({ name, items, people }: LookProps) {
  const hero = items.find((i) => i.kind === "person") ?? items[0];
  const after = items.filter((i) => i !== hero).slice(0, 4);
  const peopleRow = people
    .map((p) => ({ p, next: items.find((i) => i.personId === p.id) }))
    .sort((a, b) => (a.next?.date ?? "9999").localeCompare(b.next?.date ?? "9999"))
    .slice(0, 8);
  return (
    <div
      style={{
        padding: "calc(env(safe-area-inset-top,0px) + 18px) 22px 32px",
        background:
          "radial-gradient(90% 420px at 50% 250px, rgba(231,185,59,.28) 0%, rgba(231,185,59,0) 70%), radial-gradient(70% 300px at 50% 0%, rgba(57,36,63,.10) 0%, rgba(57,36,63,0) 70%)",
      }}
    >
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
              background: C.gold,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.nero,
            }}
          >
            <IconPlus style={{ width: 20, height: 20, strokeWidth: 2.2 }} />
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
        {greeting()},{" "}
        <span className="a-scr" style={{ color: C.goldText, fontSize: 30, verticalAlign: "-4px" }}>
          {first(name)}
        </span>
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
                  background: C.plum,
                  borderRadius: "50%",
                  boxShadow: "0 0 0 5px #FFFFFF",
                }}
              >
                <span
                  className="a-dsp"
                  style={{ fontSize: hero.days > 99 ? 72 : 96, lineHeight: 0.9, color: C.gold }}
                >
                  {hero.days}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    letterSpacing: ".24em",
                    color: C.ivory,
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
                  alignItems: "flex-start",
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
                    top: 19,
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: tone(i),
                    boxShadow: `0 0 0 3px ${C.ivory}`,
                  }}
                />
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 11,
                    letterSpacing: ".12em",
                    color: "#FFFFFF",
                    background: tone(i),
                    borderRadius: 999,
                    padding: "4px 9px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    width: 74,
                    boxSizing: "border-box",
                    textAlign: "center",
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
            {peopleRow.map(({ p }, n) => (
              <Link
                key={p.id}
                to="/app/people/$personId"
                params={{ personId: p.id }}
                aria-label={p.name}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: AVATAR[n % AVATAR.length],
                  color: AVATAR[n % AVATAR.length] === C.gold ? C.nero : "#FFFFFF",
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
