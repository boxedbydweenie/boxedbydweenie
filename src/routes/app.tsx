import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { CalendarDays, Gift, Home, Users } from "lucide-react";

/**
 * Standalone Gift Calendar app (installable PWA).
 * Lives in the same codebase and shares the BBD account, data and checkout,
 * but has no website header, footer or shop chrome.
 */
export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Gift Calendar — Boxed by Dweenie" },
      { name: "description", content: "Every date that matters, remembered. Birthdays, anniversaries and festive gifts, with reminders in good time." },
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

const TABS = [
  { to: "/app", label: "Home", Icon: Home },
  { to: "/app/calendar", label: "Calendar", Icon: CalendarDays },
  { to: "/app/people", label: "People", Icon: Users },
  { to: "/app/vouchers", label: "Vouchers", Icon: Gift },
] as const;

function AppLayout() {
  const path = useLocation({ select: (l) => l.pathname });
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col bg-ivory text-foreground">
      <main className="flex-1 pb-28">
        <Outlet />
      </main>
      <nav
        aria-label="App"
        className="fixed bottom-4 left-1/2 z-50 flex h-16 w-[calc(100%-2rem)] max-w-[398px] -translate-x-1/2 items-center justify-around rounded-3xl border border-border bg-card px-2 shadow-lg pb-[env(safe-area-inset-bottom)]"
      >
        {TABS.map(({ to, label, Icon }) => {
          const active = to === "/app" ? path === "/app" : path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
