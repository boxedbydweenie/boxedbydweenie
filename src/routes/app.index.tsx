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
  C,
  InstallHelp,
  avatarColour,
  dayMonth,
  greeting,
  longDate,
  shortDate,
  status,
  upcomingItems,
  useWide,
  useEntered,
  enterApp,
  whenText,
  type UpcomingItem,
} from "@/components/app/kit";
import { LookCountdown } from "@/components/app/HomeLooks";
import { MonthGrid, useCalendarEvents } from "@/components/app/MonthCalendar";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/app/")({
  validateSearch: z.object({
    from: z.string().max(40).optional().catch(undefined),
  }),
  component: AppHome,
});

/** Visitors see the splash; signed-in customers see Home. */
function AppHome() {
  const user = useUser();
  const entered = useEntered();
  const { from } = Route.useSearch();
  if (!user) return <Splash from={from} />;
  if (!entered) return <Splash name={user.name} />;
  return <Home name={user.name} />;
}

/* ---------- 1.1 Splash ---------- */
function Splash({ from, name }: { from?: string | undefined; name?: string }) {
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
          {name
            ? "Your dates, your people and every festive season, all in one place."
            : from
              ? `${from} uses the Gift Calendar to remember birthdays and anniversaries, and send a beautiful gift in time. It's free.`
              : "Birthdays, anniversaries and every festive season, with a box on its way before the day."}
        </p>
        {from && (
          <div style={{ marginTop: 22 }}>
            <InstallHelp dark />
          </div>
        )}
        <div style={{ flex: 1, minHeight: 28 }} />
        {name ? (
          <>
            <div style={{ textAlign: "center", fontSize: 15, color: "rgba(255,255,255,.8)" }}>
              Welcome back, {name.trim().split(/\s+/)[0]}
            </div>
            <button
              type="button"
              className="a-abtn a-lg a-gold"
              style={{ marginTop: 14 }}
              onClick={enterApp}
            >
              Open my calendar
            </button>
            <div
              className="a-dsp"
              style={{ textAlign: "center", fontSize: 18, color: C.gold, marginTop: 22 }}
            >
              We exist for the love of gifting.
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
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
  const todayText = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const items = upcomingItems(people, scheduled, festivals);
  const hero = items.find((i) => i.kind === "person") ?? items[0];
  const next30 = items.filter((i) => i.days <= 30);
  const heroPerson = hero?.personId ? people.find((p) => p.id === hero.personId) : undefined;
  const ideas = heroPerson ? giftIdeas(heroPerson, 4) : [];

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

  return <LookCountdown name={name} items={items} people={people} />;
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
