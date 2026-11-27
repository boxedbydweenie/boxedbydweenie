import { useEffect } from "react";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useUser } from "@/hooks/use-shop";
import {
  AppStyles,
  C,
  IconCalendar,
  IconGift,
  IconHome,
  IconPeople,
  IconPlus,
} from "@/components/app/kit";

/**
 * Standalone Gift Calendar app (installable PWA).
 * Lives in the same codebase and shares the BBD account, data and checkout,
 * but has no website header, footer or shop chrome.
 */
export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Gift Calendar — Boxed by Dweenie" },
      {
        name: "description",
        content:
          "Every date that matters, remembered. Birthdays, anniversaries and festive gifts, with reminders in good time.",
      },
      { name: "theme-color", content: "#263D35" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Gift Calendar" },
    ],
    links: [
      { rel: "manifest", href: "/app/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/app/icon-192.png" },
    ],
  }),
  component: AppLayout,
});

/** Screens anyone can see. Everything else needs a BBD account. */
const OPEN = new Set(["/app", "/app/signin"]);
/** Full-screen steps that hide the bottom bar. */
const NO_NAV = /^\/app\/(signin|welcome|send)/;

function AppLayout() {
  const path = useLocation({ select: (l) => l.pathname.replace(/\/$/, "") || "/" });
  const user = useUser();

  // Offline support: cache the app so it opens without a connection.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/app-sw.js", { scope: "/app" }).catch(() => {});
  }, []);

  const locked = !user && !OPEN.has(path);
  const showNav = Boolean(user) && !NO_NAV.test(path);

  return (
    <div className="bbd-app mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col">
      <AppStyles />
      <main className="flex-1" style={{ paddingBottom: showNav ? 112 : 0 }}>
        {locked ? (
          <section style={{ padding: "64px 22px 0", textAlign: "center" }}>
            <h1 className="a-dsp" style={{ fontSize: 34 }}>
              Sign in to see <span style={{ color: C.goldText }}>your calendar.</span>
            </h1>
            <p style={{ marginTop: 12, fontSize: 14, color: C.muted }}>
              Your dates and reminders are saved to your Boxed by Dweenie account.
            </p>
            <Link to="/app/signin" className="a-abtn a-lg a-ink" style={{ marginTop: 24 }}>
              Sign in
            </Link>
          </section>
        ) : (
          <Outlet />
        )}
      </main>
      {showNav && <BottomNav path={path} />}
    </div>
  );
}

const TABS = [
  { to: "/app", label: "Home", Icon: IconHome },
  { to: "/app/calendar", label: "Calendar", Icon: IconCalendar },
  { to: "/app/people", label: "People", Icon: IconPeople },
  { to: "/app/vouchers", label: "Vouchers", Icon: IconGift },
] as const;

function BottomNav({ path }: { path: string }) {
  const tab = (t: (typeof TABS)[number]) => {
    const on = t.to === "/app" ? path === "/app" : path.startsWith(t.to);
    return (
      <Link
        key={t.to}
        to={t.to}
        aria-current={on ? "page" : undefined}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          fontSize: 11,
          minWidth: 56,
          padding: "6px 0",
          color: on ? C.nero : C.muted,
          fontWeight: on ? 700 : 400,
        }}
      >
        <t.Icon />
        {t.label}
      </Link>
    );
  };
  return (
    <nav
      aria-label="App"
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: "calc(22px + env(safe-area-inset-bottom, 0px))",
        width: "calc(100% - 28px)",
        maxWidth: 402,
        height: 70,
        background: "#FFFFFF",
        borderRadius: 24,
        boxShadow: "0 10px 30px rgba(41,40,40,.14)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "0 6px",
        zIndex: 50,
      }}
    >
      {tab(TABS[0])}
      {tab(TABS[1])}
      <Link
        to="/app/people"
        search={{ add: true }}
        aria-label="Add a date"
        style={{
          width: 58,
          height: 58,
          borderRadius: "50%",
          background: C.nero,
          color: C.gold,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: -34,
          boxShadow: "0 8px 20px rgba(41,40,40,.3)",
          border: `4px solid ${C.ivory}`,
        }}
      >
        <IconPlus style={{ width: 26, height: 26, strokeWidth: 2.2 }} />
      </Link>
      {tab(TABS[2])}
      {tab(TABS[3])}
    </nav>
  );
}
