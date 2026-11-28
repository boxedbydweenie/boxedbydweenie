import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useCustomMoments, useMoments } from "@/hooks/use-calendar";
import { OCCASION_ABOUT } from "@/data/occasionAbout";
import { OCCASIONS } from "@/data/occasions";
import { daysUntil, getOccasion, momentsStore, todayIso } from "@/services/calendar";
import type { OccasionInstance } from "@/types/calendar";
import { BackButton, C, longDate, shortDate } from "@/components/app/kit";

/** "What is this day?": a public holiday or other occasion, explained, with a choice to keep it on the calendar. */
export const Route = createFileRoute("/app/occasion/$slug")({
  component: AppOccasion,
});

const CATEGORY: Record<string, string> = {
  national: "National day",
  faith: "Faith and festivals",
  family: "Family",
  celebrations: "Celebration",
  workplace: "Work",
};

function AppOccasion() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();
  const moments = useMoments();
  const custom = useCustomMoments();
  const [inst, setInst] = useState<OccasionInstance | null | undefined>(undefined);
  useEffect(() => {
    void getOccasion(slug).then(setInst);
  }, [slug, custom]);

  const back = () =>
    window.history.length > 1 ? router.history.back() : void navigate({ to: "/app/calendar" });

  if (inst === undefined) return <div style={{ minHeight: "60vh" }} />;
  if (!inst) {
    return (
      <section style={{ padding: "64px 22px 0", textAlign: "center" }}>
        <h1 className="a-dsp" style={{ fontSize: 32 }}>
          Occasion not found
        </h1>
        <Link to="/app/calendar" className="a-abtn a-ink" style={{ marginTop: 22 }}>
          Back to the calendar
        </Link>
      </section>
    );
  }

  const o = inst.occasion;
  const ph = Boolean(o.publicHoliday);
  const own = o.slug.startsWith("mine-");
  const info = OCCASION_ABOUT[o.slug];
  const today = todayIso();
  const days = inst.date ? daysUntil(inst.date, today) : null;
  const following = ph || own || moments.length === 0 || moments.includes(o.slug);
  const tone = ph ? C.forest : own ? C.plum : C.oxblood;

  const toggle = () => {
    // No choice saved yet means "all of them": start from everything, then change this one.
    const base = moments.length
      ? moments
      : OCCASIONS.filter((x) => x.rule.type !== "anytime").map((x) => x.slug);
    momentsStore.set(
      following ? base.filter((s) => s !== o.slug) : [...new Set([...base, o.slug])],
    );
  };

  return (
    <div style={{ padding: "calc(env(safe-area-inset-top,0px) + 20px) 22px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <BackButton onClick={back} />
        <img
          src="/brand/logo-primary.svg"
          alt="Boxed by Dweenie"
          style={{ height: 30, width: "auto" }}
        />
        <span style={{ width: 44 }} />
      </div>

      <div
        style={{
          marginTop: 22,
          borderRadius: 26,
          background: tone,
          color: "#FFFFFF",
          padding: "24px 22px 22px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ph && (
            <span className="a-pill" style={{ background: C.gold, color: C.nero }}>
              Public holiday
            </span>
          )}
          <span
            className="a-pill"
            style={{ background: "rgba(255,255,255,.14)", color: "#FFFFFF" }}
          >
            {own ? "Your own occasion" : (CATEGORY[o.category] ?? "Occasion")}
          </span>
        </div>
        <h1 className="a-dsp" style={{ fontSize: 40, marginTop: 16, color: "#FFFFFF" }}>
          {o.name}
        </h1>
        {inst.date && (
          <p style={{ margin: "8px 0 0", fontSize: 15, color: "rgba(255,255,255,.85)" }}>
            {longDate(inst.date)} {inst.date.slice(0, 4)}
            {inst.tbc ? " (to be confirmed)" : ""}
          </p>
        )}
        {days !== null && (
          <div
            style={{
              marginTop: 18,
              display: "inline-flex",
              alignItems: "baseline",
              gap: 8,
              background: "rgba(0,0,0,.18)",
              borderRadius: 16,
              padding: "10px 14px",
            }}
          >
            <span className="a-dsp" style={{ fontSize: 34, color: C.gold, lineHeight: 1 }}>
              {days === 0 ? "Today" : days}
            </span>
            {days > 0 && (
              <span style={{ fontSize: 13, letterSpacing: ".16em" }}>
                {days === 1 ? "DAY TO GO" : "DAYS TO GO"}
              </span>
            )}
          </div>
        )}
      </div>

      <Block title="What is it?">
        {(info?.about ?? [o.line, own ? "" : o.note].filter(Boolean)).map((t) => (
          <p key={t} style={para}>
            {t}
          </p>
        ))}
        {inst.tbc && (
          <p style={{ ...para, color: C.muted, fontSize: 13 }}>
            This date follows the moon, so it is confirmed by the Federal Government nearer the
            time. We&rsquo;ll update your calendar when it is.
          </p>
        )}
      </Block>

      {info?.marked && (
        <Block title="How it's marked">
          <p style={para}>{info.marked}</p>
        </Block>
      )}

      {(info?.idea || (!own && o.note)) && (
        <Block title="Gift idea">
          <p style={para}>{info?.idea ?? o.note}</p>
          {inst.orderBy && inst.orderBy >= today && (
            <p style={{ ...para, fontWeight: 600 }}>Order by {shortDate(inst.orderBy)}.</p>
          )}
        </Block>
      )}

      <div
        style={{
          marginTop: 22,
          background: "#FFFFFF",
          border: `1.5px solid ${C.line}`,
          borderRadius: 20,
          padding: 16,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div style={{ flex: 1, fontSize: 14, lineHeight: 1.45 }}>
          {ph ? (
            <>
              <strong>Always on your calendar.</strong> Public holidays show for everyone.
            </>
          ) : own ? (
            <>
              <strong>On your calendar.</strong> Only you can see it.
            </>
          ) : following ? (
            <>
              <strong>On your calendar.</strong> We&rsquo;ll show it with an order-by date.
            </>
          ) : (
            <>
              <strong>Not on your calendar.</strong> Add it to get the countdown and order-by date.
            </>
          )}
        </div>
        {!ph && !own && (
          <button
            type="button"
            onClick={toggle}
            className={following ? "a-abtn a-line" : "a-abtn a-ink"}
            style={{ flexShrink: 0, minHeight: 44, padding: "0 16px" }}
          >
            {following ? "Remove" : "Add to my calendar"}
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <Link
          to="/app/shop"
          search={o.shop.occasion ? { occasion: o.shop.occasion } : {}}
          className="a-abtn a-lg a-ink"
          style={{ flex: 1 }}
        >
          See gift ideas
        </Link>
        <Link to="/app/vouchers" className="a-abtn a-lg a-line" style={{ flex: 1 }}>
          Send a voucher
        </Link>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 24 }}>
      <div className="a-eye">{title}</div>
      <div style={{ marginTop: 10 }}>{children}</div>
    </section>
  );
}

const para = { margin: "0 0 10px", fontSize: 15, lineHeight: 1.6, color: C.nero } as const;
