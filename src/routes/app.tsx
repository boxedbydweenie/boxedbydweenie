import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useCart, useUser } from "@/hooks/use-shop";
import { cartCount } from "@/services/cart";
import { PullToRefresh } from "@/components/app/PullToRefresh";
import {
  AppStyles,
  C,
  IconBag,
  IconBox,
  IconCalendar,
  IconGift,
  IconHome,
  IconPeople,
  IconShop,
  VIEWPORT_SCRIPT,
  useEntered,
  viewportFor,
} from "@/components/app/kit";

/**
 * BBD Gift Calendar app (installable PWA) at /app.
 * Same codebase, account, database, catalogue and checkout as boxedbydweenie.com, with its own shell:
 * phones get a solid full-width tab bar at 75% scale; laptops get the green sidebar and wide screens.
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
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#F4EFE5" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Gift Calendar" },
      { property: "og:title", content: "The Gift Calendar by Boxed by Dweenie" },
      {
        property: "og:description",
        content:
          "Every date that matters, remembered. Free, and it installs on your phone like an app.",
      },
      { property: "og:image", content: "https://boxedbydweenie.com/app/share.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:url", content: "https://boxedbydweenie.com/app" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://boxedbydweenie.com/app/share.jpg" },
    ],
    links: [
      { rel: "manifest", href: "/app/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/app/icon-192.png" },
    ],
    scripts: [{ children: VIEWPORT_SCRIPT }],
  }),
  component: AppLayout,
});

/** Screens anyone can see. Everything else needs a BBD account. */
const OPEN =
  /^\/app(\/signin|\/shop(\/.*)?|\/bag|\/checkout|\/order\/.*|\/occasion\/.*|\/add\/.*)?$/;
/** Screens laid out as one centred column on laptops. */
const NARROW =
  /^\/app\/(people|send|vouchers|account|welcome|signin|bag|checkout|orders|order|invite|occasion|add|share)/;
/** Focused, full-screen steps: no tab bar. */
const FOCUSED = /^\/app\/(signin|welcome|send|checkout|add)/;

function AppLayout() {
  const path = useLocation({ select: (l) => l.pathname.replace(/\/$/, "") || "/" });
  const user = useUser();
  const bag = cartCount(useCart());

  // 75% scale on phones; restore the website's normal scale if the person leaves the app.
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!meta) return;
    const apply = () =>
      meta.setAttribute(
        "content",
        viewportFor(Math.min(screen.width, screen.height) < 820 ? screen.width : 9999),
      );
    apply();
    window.addEventListener("orientationchange", apply);
    return () => {
      window.removeEventListener("orientationchange", apply);
      meta.setAttribute("content", "width=device-width, initial-scale=1");
    };
  }, []);

  // Offline support: cache the app so it opens without a connection.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/app-sw.js", { scope: "/app" }).catch(() => {});
  }, []);

  const entered = useEntered();
  const signedOutSplash = path === "/app" && (!user || !entered);
  const locked = !user && !OPEN.test(path);
  const showChrome = !signedOutSplash && !FOCUSED.test(path);
  const [refreshes, setRefreshes] = useState(0);
  const onRefreshed = useCallback(() => setRefreshes((n) => n + 1), []);

  return (
    <div className="bbd-app">
      <AppStyles />
      <div className="a-shell">
        {showChrome && (
          <Sidebar path={path} bag={bag} name={user?.name ?? ""} signedIn={Boolean(user)} />
        )}
        <main className={`a-main${showChrome ? " a-tabs-on" : ""}`}>
          <div key={`${path}#${refreshes}`} className="a-screen">
            {locked ? (
              <Locked />
            ) : NARROW.test(path) ? (
              <div className="a-col" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <Outlet />
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>
      {showChrome && <TabBar path={path} bag={bag} />}
      {showChrome && <PullToRefresh onRefreshed={onRefreshed} />}
    </div>
  );
}

const isOn = (path: string, to: string) =>
  to === "/app" ? path === "/app" : path === to || path.startsWith(`${to}/`);

const TABS = [
  { to: "/app", label: "Home", Icon: IconHome },
  { to: "/app/calendar", label: "Calendar", Icon: IconCalendar },
  { to: "/app/shop", label: "Shop", Icon: IconShop },
  { to: "/app/vouchers", label: "Vouchers", Icon: IconGift },
  { to: "/app/people", label: "People", Icon: IconPeople },
] as const;

function TabBar({ path, bag }: { path: string; bag: number }) {
  return (
    <nav className="a-tabbar" aria-label="App">
      {TABS.map((t) => {
        const on =
          isOn(path, t.to) ||
          (t.to === "/app/shop" && (path.startsWith("/app/bag") || path.startsWith("/app/order")));
        return (
          <Link
            key={t.to}
            to={t.to}
            className="a-tab"
            activeOptions={{ exact: t.to === "/app", includeSearch: false }}
            aria-current={on ? "page" : undefined}
          >
            <t.Icon style={{ width: 24, height: 24 }} />
            {t.label}
            {t.to === "/app/shop" && bag > 0 && (
              <span className="a-badge" aria-label={`${bag} in your bag`}>
                {bag}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function Sidebar({
  path,
  bag,
  name,
  signedIn,
}: {
  path: string;
  bag: number;
  name: string;
  signedIn: boolean;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const nav = [
    ...TABS,
    { to: "/app/orders", label: "Orders", Icon: IconBox },
    { to: "/app/bag", label: "Bag", Icon: IconBag },
    { to: "/app/invite", label: "Invite friends", Icon: IconPeople },
  ] as const;
  return (
    <aside className="a-side a-pat-green" aria-label="Gift Calendar">
      <Link to="/app" aria-label="Gift Calendar home" style={{ alignSelf: "flex-start" }}>
        <img
          src="/brand/logo-on-dark.svg"
          alt="Boxed by Dweenie"
          style={{ height: 30, width: "auto" }}
        />
      </Link>
      <div className="a-dsp" style={{ fontSize: 30, color: C.gold, margin: "12px 0 22px" }}>
        Gift Calendar
      </div>
      {nav.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          className="a-snav"
          activeOptions={{ exact: t.to === "/app", includeSearch: false }}
          aria-current={isOn(path, t.to) ? "page" : undefined}
        >
          <t.Icon style={{ width: 20, height: 20 }} />
          {t.label}
          {t.to === "/app/bag" && bag > 0 && (
            <span
              style={{
                marginLeft: "auto",
                fontSize: 12,
                fontWeight: 700,
                background: C.gold,
                color: C.nero,
                borderRadius: 999,
                padding: "1px 8px",
              }}
            >
              {bag}
            </span>
          )}
        </Link>
      ))}
      <div style={{ flex: 1, minHeight: 24 }} />
      <a
        href="/corporate/quote"
        style={{
          background: C.ivory,
          color: C.nero,
          borderRadius: 18,
          padding: 16,
          fontSize: 13,
          lineHeight: 1.5,
          display: "block",
        }}
      >
        <strong className="a-dsp" style={{ display: "block", fontSize: 20, marginBottom: 4 }}>
          Gifting for a team?
        </strong>
        Upload staff birthdays and work anniversaries. We handle every one.
        <span
          style={{ display: "block", marginTop: 10, fontWeight: 600, textDecoration: "underline" }}
        >
          Get a corporate quote
        </span>
      </a>
      {signedIn ? (
        <Link
          to="/app/account"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 16,
            padding: 6,
            borderRadius: 12,
          }}
          className="a-snav"
          aria-current={isOn(path, "/app/account") ? "page" : undefined}
        >
          <span
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: C.gold,
              color: C.nero,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {initials || "B"}
          </span>
          <span
            style={{
              fontSize: 14,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </span>
        </Link>
      ) : (
        <Link to="/app/signin" className="a-abtn a-gold" style={{ marginTop: 16 }}>
          Sign in
        </Link>
      )}
    </aside>
  );
}

function Locked() {
  return (
    <section className="a-col" style={{ padding: "72px 22px 0", textAlign: "center" }}>
      <img src="/brand/bow-gold.svg" alt="" style={{ width: 96, height: "auto" }} />
      <h1 className="a-dsp" style={{ fontSize: 34, marginTop: 18 }}>
        Sign in to see <span style={{ color: C.goldText }}>your calendar.</span>
      </h1>
      <p style={{ marginTop: 12, fontSize: 14, color: C.muted }}>
        Your dates and reminders are saved to your Boxed by Dweenie account.
      </p>
      <Link to="/app/signin" className="a-abtn a-lg a-ink" style={{ marginTop: 24 }}>
        Sign in
      </Link>
      <Link
        to="/app/signin"
        search={{ mode: "up" }}
        style={{ display: "block", marginTop: 14, fontSize: 14, fontWeight: 600 }}
      >
        Create an account
      </Link>
    </section>
  );
}
