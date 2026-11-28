import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useUser } from "@/hooks/use-shop";
import { usePeople, useScheduledGifts } from "@/hooks/use-calendar";
import { getUpcomingOccasions, giftIdeas, todayIso } from "@/services/calendar";
import { OCCASIONS } from "@/data/occasions";
import { formatNaira } from "@/lib/format";
import type { OccasionInstance, Person } from "@/types/calendar";
import type { ShopProduct } from "@/types/shop";
import {
  BrandStrip,
  C,
  InstallHelp,
  Ring,
  IconBack,
  IconBell,
  IconPlus,
  avatarColour,
  dayMonth,
  greeting,
  longDate,
  shortDate,
  status,
  upcomingItems,
  useWide,
  whenText,
  type UpcomingItem,
} from "@/components/app/kit";
import { MonthGrid, useCalendarEvents } from "@/components/app/MonthCalendar";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/app/")({
  validateSearch: z.object({ from: z.string().max(40).optional().catch(undefined) }),
  component: AppHome,
});

/** Visitors see the splash; signed-in customers see Home. */
function AppHome() {
  const user = useUser();
  const { from } = Route.useSearch();
  return user ? <Home name={user.name} /> : <Splash from={from} />;
}

/* ---------- 1.1 Splash ---------- */
function Splash({ from }: { from?: string | undefined }) {
  return (
    <section
      className="a-pat-green"
      style={{
        minHeight: "100dvh",
        boxSizing: "border-box",
        color: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding:
          "calc(env(safe-area-inset-top,0px) + 40px) 24px calc(env(safe-area-inset-bottom,0px) + 28px)",
      }}
    >
      <div
        style={{ width: "100%", maxWidth: 440, flex: 1, display: "flex", flexDirection: "column" }}
      >
        <img
          src="/brand/logo-on-dark.svg"
          alt="Boxed by Dweenie"
          style={{ height: 26, width: "auto", alignSelf: "flex-start" }}
        />
        {from && (
          <div
            style={{
              marginTop: 22,
              alignSelf: "flex-start",
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(255,255,255,.1)",
              border: "1px solid rgba(255,255,255,.2)",
              borderRadius: 999,
              padding: "6px 14px 6px 6px",
              fontSize: 14,
            }}
          >
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: C.gold,
                color: C.nero,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {from.slice(0, 1).toUpperCase()}
            </span>
            <span>
              <strong>{from}</strong> invited you
            </span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "center", marginTop: from ? 26 : 44 }}>
          <img
            className="a-sway"
            src="/brand/bow-gold.svg"
            alt=""
            style={{
              width: from ? 140 : 170,
              height: "auto",
              filter: "drop-shadow(0 18px 24px rgba(0,0,0,.35))",
            }}
          />
        </div>
        <h1
          className="a-dsp"
          style={{ fontSize: 50, marginTop: from ? 28 : 40, textAlign: "center" }}
        >
          Every date that matters, <span style={{ color: C.gold }}>remembered.</span>
        </h1>
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.6,
            color: "rgba(255,255,255,.8)",
            textAlign: "center",
            margin: "16px 0 0",
          }}
        >
          {from
            ? `${from} uses the Gift Calendar to remember birthdays and anniversaries, and send a beautiful gift in time. It's free.`
            : "Birthdays, anniversaries and every festive season, with a box on its way before the day."}
        </p>
        {from && (
          <div style={{ marginTop: 22 }}>
            <InstallHelp dark />
          </div>
        )}
        <div style={{ flex: 1, minHeight: 28 }} />
        <Link to="/app/signin" search={{ mode: "up" }} className="a-abtn a-lg a-gold">
          Create my calendar
        </Link>
        <Link
          to="/app/signin"
          search={{ mode: "in" }}
          className="a-abtn a-lg a-white-line"
          style={{ marginTop: 10 }}
        >
          I already have an account
        </Link>
        <Link
          to="/app/shop"
          style={{
            textAlign: "center",
            fontSize: 14,
            fontWeight: 600,
            marginTop: 16,
            color: "#FFFFFF",
            textDecoration: "underline",
          }}
        >
          Just browsing? Visit the shop
        </Link>
        <div
          className="a-dsp"
          style={{ textAlign: "center", fontSize: 18, color: C.gold, marginTop: 18 }}
        >
          We exist for the love of gifting.
        </div>
      </div>
    </section>
  );
}

const shopOccasionFor = (slug?: string) =>
  slug ? OCCASIONS.find((o) => o.slug === slug)?.shop.occasion : undefined;

/* ---------- 2.1 Home ---------- */
function Home({ name }: { name: string }) {
  const wide = useWide();
  const people = usePeople();
  const scheduled = useScheduledGifts();
  const navigate = useNavigate();
  const [festivals, setFestivals] = useState<OccasionInstance[]>([]);
  const today = todayIso();
  const [cursor, setCursor] = useState(() => ({
    y: Number(today.slice(0, 4)),
    m: Number(today.slice(5, 7)),
  }));
  const byDate = useCalendarEvents(cursor.y);
  useEffect(() => {
    void getUpcomingOccasions(12).then(setFestivals);
  }, []);

  const first = name.trim().split(/\s+/)[0] ?? "";
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const items = upcomingItems(people, scheduled, festivals);
  const hero = items.find((i) => i.kind === "person") ?? items[0];
  const next30 = items.filter((i) => i.days <= 30);
  const rest = items.filter((i) => i !== hero).slice(0, 6);
  const heroPerson = hero?.personId ? people.find((p) => p.id === hero.personId) : undefined;
  const ideas = heroPerson ? giftIdeas(heroPerson, 4) : [];
  const todayText = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const urgent = next30.some((i) => status(i).label === "Order today");

  const greetingBlock = (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 13, color: wide ? "rgba(255,255,255,.72)" : C.muted }}>
        {todayText}
      </div>
      <h1 className="a-dsp" style={{ fontSize: wide ? 40 : 30, marginTop: 4 }}>
        {greeting()},{" "}
        <span className="a-scr" style={{ color: C.goldText, fontSize: wide ? 52 : 38 }}>
          {first}
        </span>
      </h1>
    </div>
  );

  if (wide) {
    const move = (d: number | "today") =>
      setCursor((c) => {
        if (d === "today") return { y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) };
        const m = c.m + d;
        return m < 1 ? { y: c.y - 1, m: 12 } : m > 12 ? { y: c.y + 1, m: 1 } : { y: c.y, m };
      });
    return (
      <div style={{ padding: "0 40px 32px" }}>
        <div className="a-wide" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            className="a-dark-head a-bleed a-pat-plum"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            {greetingBlock}
            <div style={{ display: "flex", gap: 10 }}>
              <Link
                to="/app/welcome"
                search={{ step: "import", from: "people" }}
                className="a-abtn a-white-line"
              >
                Import people
              </Link>
              <Link to="/app/people/new" className="a-abtn a-gold">
                + Add a date
              </Link>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) 340px",
              gap: 22,
              alignItems: "start",
            }}
          >
            <MonthGrid
              large
              y={cursor.y}
              m={cursor.m}
              byDate={byDate}
              filter="all"
              today={today}
              picked={null}
              onPick={(iso) => {
                const p = (byDate.get(iso) ?? []).find((e) => e.personId);
                if (p?.personId)
                  void navigate({ to: "/app/people/$personId", params: { personId: p.personId } });
                else void navigate({ to: "/app/calendar" });
              }}
              onMove={move}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {hero ? <NextUp item={hero} compact /> : <EmptyHome />}
              <Next30 items={next30} rows />
              <InviteCard />
            </div>
          </div>
          {heroPerson && ideas.length > 0 && (
            <Ideas person={heroPerson} hero={hero!} ideas={ideas} />
          )}
        </div>
      </div>
    );
  }

  const season = items.find(
    (i) => i.kind === "festival" && i !== hero && i.days <= 75 && i.publicHoliday,
  );
  const coming = items.filter((i) => i !== hero && i !== season).slice(0, 3);
  const peopleRow = people
    .map((p) => ({ p, next: items.find((i) => i.personId === p.id) }))
    .sort((a, b) => (a.next?.date ?? "9999").localeCompare(b.next?.date ?? "9999"))
    .slice(0, 10);
  const round = {
    width: 44,
    height: 44,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  } as const;

  const PEOPLE_ROW = (
    <section style={{ padding: "30px 16px 0" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          padding: "0 6px",
        }}
      >
        <div className="a-eye">Your people</div>
        <Link to="/app/people" style={{ fontSize: 13, fontWeight: 600 }}>
          See all
        </Link>
      </div>
      <div className="a-hscroll" style={{ gap: 14, marginTop: 12 }}>
        {peopleRow.map(({ p, next }) => (
          <Link
            key={p.id}
            to="/app/people/$personId"
            params={{ personId: p.id }}
            style={{
              flexShrink: 0,
              width: 68,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Ring size={64} days={next?.days ?? 60}>
              {p.photo ? (
                <img
                  src={p.photo}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "#E9E1EA",
                    color: C.plum,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'EB Garamond',Georgia,serif",
                    fontSize: 22,
                    fontWeight: 500,
                  }}
                >
                  {p.name.slice(0, 1).toUpperCase()}
                </span>
              )}
            </Ring>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                maxWidth: 68,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {p.name.split(" ")[0]}
            </span>
            {next && (
              <span
                style={{
                  fontSize: 11,
                  color: next.days <= 7 ? C.plum : C.muted,
                  fontWeight: next.days <= 7 ? 700 : 400,
                  marginTop: -4,
                }}
              >
                {next.days === 0 ? "Today" : `${next.days}d`}
              </span>
            )}
          </Link>
        ))}
        <Link
          to="/app/people/new"
          style={{
            flexShrink: 0,
            width: 68,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              border: `1.5px dashed ${C.muted}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.nero,
            }}
          >
            <IconPlus style={{ width: 22, height: 22 }} />
          </span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Add</span>
        </Link>
      </div>
    </section>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", paddingBottom: 8 }}>
      {/* Plum header, from the guide's Plum pattern and the LinkedIn banner treatment */}
      <header
        style={{
          background: C.plum,
          color: "#FFFFFF",
          padding: "calc(env(safe-area-inset-top,0px) + 20px) 22px 30px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <img
            src="/brand/logo-on-dark.svg"
            alt="Boxed by Dweenie"
            style={{ height: 22, width: "auto" }}
          />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link
              to="/app/people/new"
              aria-label="Add a date"
              style={{ ...round, background: C.gold, color: C.nero }}
            >
              <IconPlus style={{ width: 22, height: 22, strokeWidth: 2.2 }} />
            </Link>
            <Link
              to="/app/account"
              aria-label="Profile"
              style={{
                ...round,
                background: C.ivory,
                color: C.plum,
                fontWeight: 700,
                fontSize: 14,
                boxShadow: `0 0 0 2px ${C.gold}`,
              }}
            >
              {initials || "B"}
            </Link>
          </div>
        </div>
        <h1 className="a-dsp" style={{ fontSize: 34, marginTop: 22 }}>
          {greeting()},{" "}
          <span className="a-scr" style={{ color: C.gold, fontSize: 46 }}>
            {first}
          </span>
        </h1>
      </header>

      <div style={{ margin: "20px 16px 0" }}>
        {hero ? <NextUp item={hero} light /> : <EmptyHome />}
      </div>

      {coming.length > 0 && (
        <section style={{ padding: "30px 16px 0" }}>
          <SectionHead
            title="Coming up"
            link={{ to: "/app/calendar", label: "Full calendar" }}
            note={
              next30.length
                ? `${next30.filter((i) => i.sorted).length} of ${next30.length} sorted this month`
                : undefined
            }
          />
          <ComingList items={coming} />
        </section>
      )}

      {peopleRow.length > 0 && PEOPLE_ROW}

      {season && (
        <div style={{ padding: "30px 16px 0" }}>
          <SeasonCard item={season} />
        </div>
      )}

      {heroPerson && hero && ideas.length > 0 && (
        <div style={{ padding: "30px 16px 0" }}>
          <Ideas person={heroPerson} hero={hero} ideas={ideas} />
        </div>
      )}
      <div style={{ padding: "30px 16px 28px" }}>
        <InviteCard />
      </div>
    </div>
  );
}

function SectionHead({
  title,
  note,
  link,
}: {
  title: string;
  note?: string | undefined;
  link?: { to: "/app/calendar" | "/app/people"; label: string };
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 12,
        padding: "0 6px",
      }}
    >
      <div>
        <div className="a-eye">{title}</div>
        {note && <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>{note}</div>}
      </div>
      {link && (
        <Link to={link.to} style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
          {link.label}
        </Link>
      )}
    </div>
  );
}

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** One calm list of what's next: a date tile, the name, one line of detail. */
function ComingList({ items }: { items: UpcomingItem[] }) {
  return (
    <div
      style={{
        marginTop: 12,
        background: "#FFFFFF",
        border: `1.5px solid ${C.line}`,
        borderRadius: 22,
        overflow: "hidden",
      }}
    >
      {items.map((i, n) => {
        const s = status(i);
        const urgent = s.label === "Order today";
        const isPerson = i.kind === "person" && i.personId;
        const shopOcc = shopOccasionFor(i.occasionSlug);
        const detail = isPerson
          ? `${i.title.charAt(0).toUpperCase()}${i.title.slice(1)}${i.days <= 30 ? ` · ${whenText(i.days).toLowerCase()}` : ""}`
          : i.tbc
            ? "Date to be confirmed"
            : i.orderBy && i.orderBy >= todayIso() && !urgent
              ? `Order by ${shortDate(i.orderBy)}`
              : i.publicHoliday
                ? "Public holiday"
                : whenText(i.days);
        const row = (
          <>
            <span
              style={{
                width: 48,
                height: 52,
                borderRadius: 14,
                background: "#F4EFE5",
                color: C.plum,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span className="a-dsp" style={{ fontSize: 22, lineHeight: 1, color: C.plum }}>
                {Number(i.date.slice(8, 10))}
              </span>
              <span style={{ fontSize: 10.5, letterSpacing: ".12em", marginTop: 3 }}>
                {MON[Number(i.date.slice(5, 7)) - 1]!.toUpperCase()}
              </span>
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
                {isPerson ? `${i.name}` : i.name}
              </strong>
              <span
                style={{
                  fontSize: 12.5,
                  color: urgent ? C.plum : C.muted,
                  fontWeight: urgent ? 700 : 400,
                }}
              >
                {urgent ? "Order today" : detail}
              </span>
            </span>
            <IconBack
              style={{
                width: 18,
                height: 18,
                color: C.muted,
                flexShrink: 0,
                transform: "scaleX(-1)",
              }}
            />
          </>
        );
        const style = {
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "12px 16px",
          borderTop: n ? `1px solid ${C.line}` : 0,
        } as const;
        return isPerson ? (
          <Link
            key={i.key}
            to="/app/people/$personId"
            params={{ personId: i.personId! }}
            style={style}
          >
            {row}
          </Link>
        ) : (
          <Link
            key={i.key}
            to="/app/shop"
            search={shopOcc ? { occasion: shopOcc } : {}}
            style={style}
          >
            {row}
          </Link>
        );
      })}
    </div>
  );
}

/** The next big holiday, on the guide's Oxblood pattern. */
function SeasonCard({ item }: { item: UpcomingItem }) {
  const shopOcc = shopOccasionFor(item.occasionSlug);
  return (
    <div
      style={{
        background: C.plum,
        borderRadius: 24,
        padding: 20,
        color: "#FFFFFF",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="a-eye" style={{ color: C.gold }}>
          The season
        </span>
        {item.publicHoliday && (
          <span
            className="a-pill"
            style={{
              background: "rgba(255,255,255,.14)",
              color: "#FFFFFF",
              minHeight: 22,
              fontSize: 11,
            }}
          >
            Public holiday
          </span>
        )}
      </div>
      <div className="a-dsp" style={{ fontSize: 32, marginTop: 10, maxWidth: 240 }}>
        {item.name}
      </div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,.82)", marginTop: 6 }}>
        {longDate(item.date)}
        {item.tbc ? " · date to be confirmed" : ""}
        {item.orderBy && !item.tbc && item.orderBy >= todayIso()
          ? ` · order by ${shortDate(item.orderBy)}`
          : ""}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16, position: "relative", maxWidth: 260 }}>
        <Link
          to="/app/shop"
          search={shopOcc ? { occasion: shopOcc } : {}}
          className="a-abtn a-gold"
          style={{ flex: 1 }}
        >
          Shop the season
        </Link>
      </div>
    </div>
  );
}

/** Closing band: the tagline on Plum with the guide's colour strip. */
function SignOff() {
  return (
    <footer
      className="a-pat-plum"
      style={{ marginTop: 28, color: "#FFFFFF", textAlign: "center", padding: "28px 22px 24px" }}
    >
      <img src="/brand/logo-on-dark.svg" alt="" style={{ height: 22, width: "auto" }} />
      <div className="a-dsp" style={{ fontSize: 26, marginTop: 12 }}>
        We exist for the love of <span style={{ color: C.gold }}>gifting.</span>
      </div>
      <BrandStrip style={{ marginTop: 18 }} />
    </footer>
  );
}

function Ideas({
  person,
  hero,
  ideas,
}: {
  person: Person;
  hero: UpcomingItem;
  ideas: ShopProduct[];
}) {
  const first = person.name.split(" ")[0];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          padding: "0 6px",
        }}
      >
        <div className="a-eye">
          {/^\d/.test(hero.title)
            ? `For ${first}'s ${hero.title.split(" ")[0]}`
            : `Ideas for ${first}`}
        </div>
        <Link to="/app/shop" search={{ for: person.id }} style={{ fontSize: 13, fontWeight: 600 }}>
          See all
        </Link>
      </div>
      <div className="a-hscroll" style={{ gap: 12 }}>
        {ideas.map((p) => (
          <Link
            key={p.id}
            to="/app/shop/$slug"
            params={{ slug: p.slug }}
            search={{ for: person.id }}
            style={{ flexShrink: 0, width: 156, display: "flex", flexDirection: "column", gap: 6 }}
          >
            <div
              style={{
                position: "relative",
                aspectRatio: "4/5",
                borderRadius: 20,
                overflow: "hidden",
                background: "#FFFFFF",
              }}
            >
              {p.images[0] && (
                <img
                  src={p.images[0]}
                  alt={p.name}
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              )}
              {p.badges[0] && (
                <span
                  className="a-pill"
                  style={{ position: "absolute", top: 10, left: 10, background: C.gold }}
                >
                  {p.badges[0]}
                </span>
              )}
            </div>
            <strong className="a-dsp" style={{ fontSize: 19 }}>
              {p.name}
            </strong>
            <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
              {formatNaira(p.price)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Next30({ items, rows }: { items: UpcomingItem[]; rows?: boolean }) {
  if (!items.length) return null;
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: rows ? 24 : 20,
        border: `1.5px solid ${C.line}`,
        padding: rows ? 18 : 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div className="a-eye">Next 30 days</div>
        <div style={{ fontSize: 13 }}>
          <strong>
            {items.filter((i) => i.sorted).length} of {items.length}
          </strong>{" "}
          <span style={{ color: C.muted }}>sorted</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 12 }} aria-hidden="true">
        {items.slice(0, 6).map((i) => (
          <span
            key={i.key}
            style={{ flex: 1, height: 8, borderRadius: 4, background: status(i).bar }}
          />
        ))}
      </div>
      {rows ? (
        <div
          style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14, fontSize: 14 }}
        >
          {items.slice(0, 5).map((i) => {
            const s = status(i);
            const av = i.personId
              ? avatarColour(i.personId)
              : { background: C.nero, color: C.gold };
            const body = (
              <>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    ...av,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  {i.initial}
                </span>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {i.name.split(" ")[0]} · {dayMonth(i.date)}
                </span>
                {s.label && (
                  <span className="a-pill" style={{ background: s.bg, color: s.fg }}>
                    {s.label}
                  </span>
                )}
              </>
            );
            return i.personId ? (
              <Link
                key={i.key}
                to="/app/people/$personId"
                params={{ personId: i.personId }}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                {body}
              </Link>
            ) : (
              <Link
                key={i.key}
                to="/app/calendar"
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                {body}
              </Link>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 6, marginTop: 8, fontSize: 11, color: C.muted }}>
          {items.slice(0, 6).map((i) => {
            const u = status(i).label === "Order today";
            return (
              <span
                key={i.key}
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: u ? C.oxblood : C.muted,
                  fontWeight: u ? 700 : 400,
                }}
              >
                {i.name.split(" ")[0]}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NextUp({
  item,
  compact,
  light,
}: {
  item: UpcomingItem;
  compact?: boolean;
  light?: boolean;
}) {
  const s = status(item);
  const isPerson = item.kind === "person";
  const possessive = isPerson ? `${item.name.split(" ")[0]}'s` : item.name;
  const shopOcc = shopOccasionFor(item.occasionSlug);
  return (
    <div
      className={light ? "" : "a-pat-green"}
      style={{
        ...(light ? { background: "#FFFFFF", border: `1.5px solid ${C.line}` } : {}),
        color: light ? C.plum : "#FFFFFF",
        borderRadius: 24,
        padding: 22,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {!light && (
        <img
          src="/brand/bow-gold.svg"
          alt=""
          style={{
            position: "absolute",
            right: 14,
            top: 40,
            width: compact ? 104 : 122,
            height: "auto",
            filter: light
              ? "drop-shadow(0 8px 10px rgba(57,36,63,.25))"
              : "drop-shadow(0 12px 16px rgba(0,0,0,.35))",
          }}
        />
      )}
      <div className="a-eye" style={{ color: light ? C.goldText : C.gold, position: "relative" }}>
        Next up
      </div>
      <div
        className="a-dsp"
        style={{
          fontSize: compact ? 30 : 34,
          marginTop: 10,
          position: "relative",
          maxWidth: light ? 320 : 190,
        }}
      >
        {possessive}
        {item.title && (
          <span
            className="a-scr"
            style={{
              display: "block",
              color: light ? C.plum : C.gold,
              fontSize: item.title.length > 14 ? 32 : compact ? 40 : 46,
              marginTop: 2,
            }}
          >
            {item.title}
          </span>
        )}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          marginTop: 16,
          position: "relative",
        }}
      >
        {item.days > 1 ? (
          <>
            <span
              className="a-dsp"
              style={{ fontSize: 52, lineHeight: 0.9, fontVariantNumeric: "tabular-nums" }}
            >
              {item.days}
            </span>
            <span
              style={{
                fontSize: 13,
                lineHeight: 1.35,
                color: light ? C.muted : "rgba(255,255,255,.82)",
              }}
            >
              days to go
              <br />
              {longDate(item.date)}
            </span>
          </>
        ) : (
          <span className="a-dsp" style={{ fontSize: 40 }}>
            {whenText(item.days)}
          </span>
        )}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 16,
          position: "relative",
          flexWrap: "wrap",
        }}
      >
        {s.label && (
          <span
            className="a-pill"
            style={
              light ? { background: "#F4EFE5", color: C.plum } : { background: s.bg, color: s.fg }
            }
          >
            {s.label}
          </span>
        )}
        {item.orderBy && !item.sorted && s.label !== "Order today" && (
          <span style={{ fontSize: 13, color: light ? C.muted : "rgba(255,255,255,.86)" }}>
            Order by {shortDate(item.orderBy)}
          </span>
        )}
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 16,
          position: "relative",
          flexWrap: compact ? "wrap" : "nowrap",
        }}
      >
        <Link
          to="/app/shop"
          search={
            isPerson && item.personId
              ? { for: item.personId }
              : shopOcc
                ? { occasion: shopOcc }
                : {}
          }
          className={light ? "a-abtn" : "a-abtn a-gold"}
          style={{
            flex: 1,
            ...(light ? { background: C.plum, color: "#FFFFFF" } : {}),
          }}
        >
          {isPerson ? "Choose a gift" : "See gift ideas"}
        </Link>
        <Link
          to="/app/vouchers"
          search={item.personId ? { for: item.personId } : {}}
          className={light ? "a-abtn" : "a-abtn a-white-line"}
          style={{
            flex: 1,
            ...(light
              ? { border: `1.5px solid ${C.line}`, color: C.plum, background: "transparent" }
              : {}),
          }}
        >
          Send a voucher
        </Link>
      </div>
    </div>
  );
}

function UpCard({ item, peopleCount }: { item: UpcomingItem; peopleCount: number }) {
  const s = status(item);
  const urgent = s.label === "Order today";
  const isPerson = item.kind === "person";
  const av =
    isPerson && item.personId ? avatarColour(item.personId) : { background: C.nero, color: C.gold };
  const body = (
    <>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}
      >
        <span
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            ...av,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: isPerson ? 700 : 500,
            fontFamily: isPerson ? undefined : "'EB Garamond',Georgia,serif",
            fontSize: isPerson ? 15 : 18,
            flexShrink: 0,
          }}
        >
          {item.initial}
        </span>
        {isPerson
          ? s.label && (
              <span className="a-pill" style={{ background: s.bg, color: s.fg }}>
                {s.label}
              </span>
            )
          : peopleCount > 0 && (
              <span className="a-pill" style={{ background: C.gold }}>
                {peopleCount} {peopleCount === 1 ? "person" : "people"}
              </span>
            )}
      </div>
      <strong
        style={{ fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        {item.name}
      </strong>
      <span style={{ fontSize: 12, color: C.muted }}>
        {isPerson
          ? `${item.title.charAt(0).toUpperCase()}${item.title.slice(1)} · ${shortDate(item.date)}`
          : item.orderBy && item.orderBy >= todayIso()
            ? `Order by ${shortDate(item.orderBy)}`
            : dayMonth(item.date)}
      </span>
    </>
  );
  const style = {
    flexShrink: 0,
    width: 152,
    borderRadius: 20,
    padding: 14,
    boxSizing: "border-box" as const,
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    background: "#FFFFFF",
    border: `1.5px solid ${urgent ? C.oxblood : C.line}`,
  };
  const shopOcc = shopOccasionFor(item.occasionSlug);
  return isPerson && item.personId ? (
    <Link to="/app/people/$personId" params={{ personId: item.personId }} style={style}>
      {body}
    </Link>
  ) : (
    <Link to="/app/shop" search={shopOcc ? { occasion: shopOcc } : {}} style={style}>
      {body}
    </Link>
  );
}

function EmptyHome() {
  return (
    <div
      className="a-pat-green"
      style={{
        color: "#FFFFFF",
        borderRadius: 24,
        padding: 22,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <img
        src="/brand/bow-gold.svg"
        alt=""
        style={{ position: "absolute", right: 14, top: 30, width: 100, height: "auto" }}
      />
      <div className="a-eye" style={{ color: C.gold, position: "relative" }}>
        Start here
      </div>
      <div
        className="a-dsp"
        style={{ fontSize: 32, marginTop: 10, position: "relative", maxWidth: 220 }}
      >
        Who should we never let you forget?
      </div>
      <Link
        to="/app/people/new"
        className="a-abtn a-gold"
        style={{
          marginTop: 18,
          position: "relative",
          alignSelf: "flex-start",
          display: "inline-flex",
        }}
      >
        Add your first person
      </Link>
    </div>
  );
}

function InviteCard() {
  return (
    <Link
      to="/app/invite"

      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        borderRadius: 20,
        padding: 16,
        background: "#FFFFFF",
        border: `1.5px solid ${C.line}`,
        color: C.plum,
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>
        <strong className="a-dsp" style={{ display: "block", fontSize: 19 }}>
          Know someone who always forgets?
        </strong>
        <span style={{ fontSize: 13, color: C.muted }}>Invite them to the Gift Calendar.</span>
      </span>
      <span className="a-pill" style={{ background: "#E9E1EA", color: C.plum }}>
        Invite
      </span>
    </Link>
  );
}
