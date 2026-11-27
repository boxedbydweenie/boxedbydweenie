import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useUser } from "@/hooks/use-shop";
import { usePeople, useScheduledGifts } from "@/hooks/use-calendar";
import { getUpcomingOccasions, giftIdeas } from "@/services/calendar";
import { formatNaira } from "@/lib/format";
import type { OccasionInstance } from "@/types/calendar";
import {
  C,
  IconBell,
  avatarColour,
  dayMonth,
  greeting,
  longDate,
  shortDate,
  status,
  upcomingItems,
  whenText,
  type UpcomingItem,
} from "@/components/app/kit";

export const Route = createFileRoute("/app/")({
  component: AppHome,
});

/** First screen for visitors: splash with sign-up and sign-in. Signed-in users see Home. */
function AppHome() {
  const user = useUser();
  return user ? <Home name={user.name} /> : <Splash />;
}

/* ---------- 1.1 Splash ---------- */
function Splash() {
  return (
    <section
      className="a-pat-green"
      style={{
        minHeight: "100dvh",
        boxSizing: "border-box",
        color: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        padding: "60px 24px 32px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <img
        src="/brand/logo-on-dark.svg"
        alt="Boxed by Dweenie"
        style={{ height: 26, width: "auto", alignSelf: "flex-start", position: "relative" }}
      />
      <div
        style={{ display: "flex", justifyContent: "center", marginTop: 44, position: "relative" }}
      >
        <img
          className="a-sway"
          src="/brand/bow-gold.svg"
          alt=""
          style={{ width: 170, height: "auto", filter: "drop-shadow(0 18px 24px rgba(0,0,0,.35))" }}
        />
      </div>
      <h1
        className="a-dsp"
        style={{ fontSize: 50, marginTop: 40, textAlign: "center", position: "relative" }}
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
          position: "relative",
        }}
      >
        Birthdays, anniversaries and every festive season, with a box on its way before the day.
      </p>
      <div style={{ flex: 1, minHeight: 32 }} />
      <Link
        to="/app/signin"
        search={{ mode: "up" }}
        className="a-abtn a-lg a-gold"
        style={{ position: "relative" }}
      >
        Create my calendar
      </Link>
      <Link
        to="/app/signin"
        search={{ mode: "in" }}
        className="a-abtn a-lg a-white-line"
        style={{ marginTop: 10, position: "relative" }}
      >
        I already have an account
      </Link>
      <div
        className="a-dsp"
        style={{
          textAlign: "center",
          fontSize: 18,
          color: C.gold,
          marginTop: 22,
          position: "relative",
        }}
      >
        We exist for the love of gifting.
      </div>
    </section>
  );
}

/* ---------- 2.1 Home ---------- */
function Home({ name }: { name: string }) {
  const people = usePeople();
  const scheduled = useScheduledGifts();
  const [festivals, setFestivals] = useState<OccasionInstance[]>([]);
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
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="a-top-pattern" style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          padding: "54px 22px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, color: C.muted }}>{today}</div>
          <h1 className="a-dsp" style={{ fontSize: 30, marginTop: 4 }}>
            {greeting()},{" "}
            <span className="a-scr" style={{ color: C.goldText, fontSize: 38 }}>
              {first}
            </span>
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <Link
            to="/app/calendar"
            aria-label="Upcoming reminders"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#FFFFFF",
              border: `1.5px solid ${C.line}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              boxSizing: "border-box",
            }}
          >
            <IconBell />
            {next30.some((i) => status(i).label === "Order today") && (
              <span
                style={{
                  position: "absolute",
                  right: 9,
                  top: 9,
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: C.oxblood,
                  border: "2px solid #FFFFFF",
                }}
              />
            )}
          </Link>
          <Link
            to="/app/account"
            aria-label="Profile"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: C.nero,
              color: C.gold,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {initials || "B"}
          </Link>
        </div>
      </div>

      {hero ? <NextUp item={hero} /> : <EmptyHome />}

      {next30.length > 0 && (
        <div
          style={{
            margin: "16px 16px 0",
            background: "#FFFFFF",
            borderRadius: 20,
            border: `1.5px solid ${C.line}`,
            padding: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div className="a-eye">Next 30 days</div>
            <div style={{ fontSize: 13 }}>
              <strong>
                {next30.filter((i) => i.sorted).length} of {next30.length}
              </strong>{" "}
              <span style={{ color: C.muted }}>gifts sorted</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 12 }} aria-hidden="true">
            {next30.slice(0, 6).map((i) => (
              <span
                key={i.key}
                style={{ flex: 1, height: 8, borderRadius: 4, background: status(i).bar }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8, fontSize: 11, color: C.muted }}>
            {next30.slice(0, 6).map((i) => {
              const urgent = status(i).label === "Order today";
              return (
                <span
                  key={i.key}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: urgent ? C.oxblood : C.muted,
                    fontWeight: urgent ? 700 : 400,
                  }}
                >
                  {i.name.split(" ")[0]}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div style={{ padding: "22px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              padding: "0 6px",
            }}
          >
            <div className="a-eye">Coming up</div>
            <Link to="/app/calendar" style={{ fontSize: 13, fontWeight: 600 }}>
              Calendar
            </Link>
          </div>
          <div className="a-hscroll">
            {rest.map((i) => (
              <UpCard key={i.key} item={i} peopleCount={people.length} />
            ))}
          </div>
        </div>
      )}

      {heroPerson && hero && ideas.length > 0 && (
        <div style={{ padding: "22px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
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
                ? `For ${heroPerson.name.split(" ")[0]}'s ${hero.title.split(" ")[0]}`
                : `Ideas for ${heroPerson.name.split(" ")[0]}`}
            </div>
            <Link
              to="/app/people/$personId"
              params={{ personId: heroPerson.id }}
              style={{ fontSize: 13, fontWeight: 600 }}
            >
              See all
            </Link>
          </div>
          <div className="a-hscroll" style={{ gap: 12 }}>
            {ideas.map((p) => (
              <Link
                key={p.id}
                to="/app/send/$personId"
                params={{ personId: heroPerson.id }}
                search={{ product: p.id }}
                style={{
                  flexShrink: 0,
                  width: 156,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    aspectRatio: "4/5",
                    borderRadius: 20,
                    overflow: "hidden",
                    background: C.ivory,
                  }}
                >
                  {p.images[0] && (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
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
      )}
    </div>
  );
}

function NextUp({ item }: { item: UpcomingItem }) {
  const s = status(item);
  const isPerson = item.kind === "person";
  const possessive = isPerson ? `${item.name.split(" ")[0]}'s` : item.name;
  return (
    <div
      className="a-pat-green"
      style={{
        margin: "18px 16px 0",
        color: "#FFFFFF",
        borderRadius: 24,
        padding: 22,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <span
        className="a-rv"
        aria-hidden="true"
        style={{ position: "absolute", right: 62, top: 0, bottom: 0, width: 26 }}
      />
      <span
        className="a-rh"
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "56%",
          right: 0,
          top: 86,
          height: 26,
          borderRadius: "13px 0 0 13px",
        }}
      />
      <img
        src="/brand/bow-gold.svg"
        alt=""
        style={{
          position: "absolute",
          right: 14,
          top: 50,
          width: 122,
          height: "auto",
          filter: "drop-shadow(0 12px 16px rgba(0,0,0,.35))",
        }}
      />
      <div className="a-eye" style={{ color: C.gold, position: "relative" }}>
        Next up
      </div>
      <div
        className="a-dsp"
        style={{ fontSize: 34, marginTop: 10, position: "relative", maxWidth: 190 }}
      >
        {possessive}
        {item.title && (
          <span
            className="a-scr"
            style={{
              display: "block",
              color: C.gold,
              fontSize: item.title.length > 14 ? 34 : 46,
              marginTop: 2,
              maxWidth: 200,
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
            <span style={{ fontSize: 13, lineHeight: 1.35, color: "rgba(255,255,255,.82)" }}>
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
          <span className="a-pill" style={{ background: s.bg, color: s.fg }}>
            {s.label}
          </span>
        )}
        {item.orderBy && !item.sorted && (
          <span style={{ fontSize: 13, color: "rgba(255,255,255,.86)" }}>
            Order by {shortDate(item.orderBy)}
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16, position: "relative" }}>
        {isPerson && item.personId ? (
          <Link
            to="/app/send/$personId"
            params={{ personId: item.personId }}
            className="a-abtn a-gold"
            style={{ flex: 1 }}
          >
            Choose a gift
          </Link>
        ) : (
          <Link to="/app/calendar" className="a-abtn a-gold" style={{ flex: 1 }}>
            See gift ideas
          </Link>
        )}
        <Link to="/app/vouchers" className="a-abtn a-white-line" style={{ flex: 1 }}>
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
          : item.orderBy
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
  return isPerson && item.personId ? (
    <Link to="/app/people/$personId" params={{ personId: item.personId }} style={style}>
      {body}
    </Link>
  ) : (
    <Link to="/app/calendar" style={style}>
      {body}
    </Link>
  );
}

function EmptyHome() {
  return (
    <div
      className="a-pat-green"
      style={{
        margin: "18px 16px 0",
        color: "#FFFFFF",
        borderRadius: 24,
        padding: 22,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <span
        className="a-rv"
        aria-hidden="true"
        style={{ position: "absolute", right: 62, top: 0, bottom: 0, width: 26 }}
      />
      <div className="a-eye" style={{ color: C.gold, position: "relative" }}>
        Start here
      </div>
      <div
        className="a-dsp"
        style={{ fontSize: 32, marginTop: 10, position: "relative", maxWidth: 230 }}
      >
        Who should we never let you forget?
      </div>
      <Link
        to="/app/people"
        search={{ add: true }}
        className="a-abtn a-gold"
        style={{ marginTop: 18, position: "relative" }}
      >
        Add your first person
      </Link>
    </div>
  );
}
