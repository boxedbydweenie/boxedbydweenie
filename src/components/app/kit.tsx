import { useEffect, useState, type ReactNode, type SVGProps } from "react";
import type { OccasionInstance, Person, ScheduledGift } from "@/types/calendar";
import { addDays, daysUntil, nextOccurrence, todayIso } from "@/services/calendar";
import { createStore } from "@/lib/store";

/**
 * Gift Calendar app kit: the brand styles and shared helpers used by every /app screen.
 * Colours, type and patterns follow the BBD brand guide (see the design canvas, "BBD Gift Calendar App").
 */

export const C = {
  nero: "#292828",
  gold: "#E7B93B",
  goldText: "#8E6A10",
  ivory: "#F4EFE5",
  line: "#E2D9C8",
  muted: "#5B5755",
  forest: "#263D35",
  navy: "#263868",
  oxblood: "#83252C",
  coral: "#EB826C",
  sage: "#86BAA3",
  plum: "#39243F",
} as const;

/** Reminder lead time used as the default when adding someone new (days). */
export const defaultLeadStore = createStore<number>("bbd-default-lead", 14);

/** Days before a personal date that a box must be ordered for delivery in Lagos. */
export const PERSON_ORDER_LEAD_DAYS = 4;

export const APP_CSS = `
html:has(.bbd-app),body:has(.bbd-app){background:${C.ivory};overscroll-behavior-y:none}
.bbd-app{font-family:'Parkinsans','Segoe UI',system-ui,sans-serif;color:${C.nero};background:${C.ivory};min-height:100dvh;-webkit-tap-highlight-color:transparent;-webkit-font-smoothing:antialiased}
.bbd-app a{color:inherit;text-decoration:none}
.bbd-app a:focus-visible,.bbd-app button:focus-visible,.bbd-app [tabindex]:focus-visible{outline:2px solid ${C.nero};outline-offset:3px}
.bbd-app input:not(.a-big),.bbd-app textarea:not(.a-big),.bbd-app select{font-size:16px!important}
.a-dsp{font-family:'EB Garamond',Georgia,'Times New Roman',serif;font-weight:500;letter-spacing:-.01em;line-height:1.05;text-wrap:balance;margin:0}
.a-scr{font-family:'Pinyon Script','Snell Roundhand','Apple Chancery',cursive;font-weight:400;letter-spacing:0;line-height:.9}
.a-eye{font-size:12px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:${C.goldText}}
.a-abtn{display:flex;align-items:center;justify-content:center;gap:.6em;min-height:48px;padding:0 1.2em;border-radius:8px;font:600 14px 'Parkinsans','Segoe UI',system-ui,sans-serif;border:1.5px solid transparent;box-sizing:border-box;cursor:pointer;transition:transform .2s ease,opacity .2s ease;white-space:nowrap;-webkit-user-select:none;user-select:none}
.a-abtn:active{transform:scale(.98)}
.a-abtn.a-lg{min-height:52px;font-size:15px;padding:0 1.6em}
.a-abtn.a-gold{background:${C.gold};color:${C.nero}}
.a-abtn.a-ink{background:${C.nero};color:#FFFFFF}
.a-abtn.a-line{border-color:${C.nero};color:${C.nero};background:transparent}
.a-abtn.a-white-line{border-color:#FFFFFF;color:#FFFFFF;background:transparent}
.a-pill{display:inline-flex;align-items:center;min-height:26px;padding:0 11px;border-radius:999px;font-size:12px;font-weight:600;letter-spacing:.04em;color:${C.nero};white-space:nowrap}
.a-ico{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}
.a-pat-green{background:${C.forest} url("/brand/pattern-green.svg");background-size:380px}
.a-pat-navy{background:${C.navy} url("/brand/pattern-navy.svg") center/cover}
.a-pat-nero{background:${C.nero} url("/brand/pattern-black.png");background-size:72px 68px}
.a-pat-plum{background:${C.plum} url("/brand/pattern-plum.svg");background-size:430px}
.a-pat-oxblood{background:${C.oxblood} url("/brand/pattern-oxblood.svg");background-size:154px}
.a-dark-head{color:#FFFFFF;position:relative}
.a-dark-head .a-eye{color:${C.gold}}
.a-dark-head h1 span,.a-dark-head .a-dsp span{color:${C.gold}!important}
.a-dark-head a{color:#FFFFFF}
.a-bleed{margin:0 calc(var(--bleed,16px) * -1);padding:calc(env(safe-area-inset-top,0px) + 28px) calc(var(--bleed,16px) + 6px) 28px;border-radius:0 0 28px 28px}
.a-pat-sage{background:${C.sage} url("/brand/bow-tile-sage.svg");background-size:72px}
.a-top-pattern{position:relative;isolation:isolate}
.a-top-pattern::before{content:"";position:absolute;left:0;right:0;top:0;height:260px;z-index:-1;background:url("/brand/pattern-ivory.svg") repeat;background-size:64px 62px;opacity:.55;-webkit-mask-image:linear-gradient(#000 30%,transparent);mask-image:linear-gradient(#000 30%,transparent);pointer-events:none}
.bbd-row:first-child{border-top-width:0!important}
.a-hscroll{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;scroll-snap-type:x mandatory;margin:0 -16px;padding:0 16px}
.a-hscroll::-webkit-scrollbar{display:none}
.a-hscroll>*{scroll-snap-align:start}
@keyframes bbd-sway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
.a-sway{animation:bbd-sway 5s ease-in-out infinite;transform-origin:50% 40%}

/* Shell: phone = content + solid full-width tab bar; laptop = green sidebar + wide content */
.a-shell{display:flex;min-height:100dvh}
.a-side{display:none}
.a-main{flex:1;min-width:0;display:flex;flex-direction:column}
.a-main.a-tabs-on{padding-bottom:calc(68px + env(safe-area-inset-bottom,0px))}
.a-screen{flex:1;display:flex;flex-direction:column;animation:a-in .22s ease both}
@keyframes a-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.a-tabbar{position:fixed;left:0;right:0;bottom:0;z-index:60;background:${C.nero} url("/brand/pattern-black.png");background-size:72px 68px;border-top:1px solid rgba(231,185,59,.45);box-shadow:0 -10px 30px rgba(41,40,40,.22);display:flex;align-items:stretch;padding:0 max(4px,env(safe-area-inset-right,0px)) env(safe-area-inset-bottom,0px) max(4px,env(safe-area-inset-left,0px));height:calc(68px + env(safe-area-inset-bottom,0px));box-sizing:border-box}
.bbd-app .a-tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;font-size:11px;font-weight:500;letter-spacing:.02em;color:rgba(244,239,229,.62);position:relative;-webkit-user-select:none;user-select:none;min-width:0;transition:color .2s ease}
.a-tab>*{position:relative;z-index:1}
.bbd-app .a-tab[aria-current=page]{color:${C.gold};font-weight:700}
.a-tab::before{content:"";position:absolute;top:9px;left:50%;width:54px;height:32px;margin-left:-27px;border-radius:999px;background:rgba(231,185,59,.16);opacity:0;transform:scale(.7);transition:opacity .2s ease,transform .2s ease}
.a-tab[aria-current=page]::before{opacity:1;transform:none}
.a-tab::after{content:"";position:absolute;top:0;left:50%;width:22px;height:2px;margin-left:-11px;border-radius:0 0 2px 2px;background:${C.gold};opacity:0;transition:opacity .2s ease}
.a-tab[aria-current=page]::after{opacity:1}
.a-badge{position:absolute;top:7px;left:calc(50% + 5px);min-width:17px;height:17px;border-radius:9px;background:${C.coral};color:${C.nero};font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 4px;box-sizing:border-box;border:2px solid ${C.nero}}
.a-topbar{position:sticky;top:0;z-index:40;display:flex;align-items:center;gap:12px;min-height:60px;padding:calc(env(safe-area-inset-top,0px) + 8px) 16px 8px;background:rgba(244,239,229,.94);-webkit-backdrop-filter:saturate(1.4) blur(12px);backdrop-filter:saturate(1.4) blur(12px);border-bottom:1px solid transparent}
.a-col{width:100%;max-width:600px;margin:0 auto;box-sizing:border-box}
.a-wide{width:100%;max-width:1180px;margin:0 auto;box-sizing:border-box}
.a-grid-products{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.a-snav{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:12px;font-size:15px;color:rgba(255,255,255,.82);position:relative}
.a-snav:hover{background:rgba(255,255,255,.07);color:#FFFFFF}
.a-snav[aria-current=page]{background:rgba(255,255,255,.12);color:#FFFFFF;font-weight:600}
.a-only-desk{display:none!important}
@media (min-width:640px){.a-grid-products{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (min-width:1024px){
  .a-side{display:flex;flex-direction:column;position:sticky;top:0;height:100dvh;width:264px;flex-shrink:0;box-sizing:border-box;padding:28px 18px 22px;color:#FFFFFF;gap:2px;overflow-y:auto}
  .a-tabbar{display:none}
  .a-main.a-tabs-on{padding-bottom:0}
  .a-only-phone{display:none!important}
  .a-only-desk{display:revert!important}
  .a-grid-products{grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}
  .a-desk-pad{padding-left:40px!important;padding-right:40px!important}
  .a-bleed{margin:24px 0 0;border-radius:24px;padding:28px 30px}
  .a-topbar{padding-left:40px;padding-right:40px}
}
@media (prefers-reduced-motion:reduce){.a-sway,.a-screen{animation:none}.a-abtn:active{transform:none}}
`;

/** Phones and small tablets: show the app at 75% scale, like a native app. Laptops stay at 100%. */
export const APP_SCALE = 0.75;
export const viewportFor = (screenWidth: number) =>
  screenWidth < 820
    ? `width=${Math.round(screenWidth / APP_SCALE)}, initial-scale=${APP_SCALE}, viewport-fit=cover`
    : "width=device-width, initial-scale=1, viewport-fit=cover";
/** Runs in <head> before first paint so the scale never jumps. */
export const VIEWPORT_SCRIPT = `(function(){try{var w=Math.min(screen.width,screen.height)<820?screen.width:9999;var m=document.querySelector('meta[name=viewport]');if(m&&w<820){m.setAttribute('content','width='+Math.round(w/${0.75})+', initial-scale=${0.75}, viewport-fit=cover')}}catch(e){}})();`;

export function AppStyles() {
  return <style dangerouslySetInnerHTML={{ __html: APP_CSS }} />;
}

/* ---------- Icons (same strokes as the canvas) ---------- */
type IconProps = SVGProps<SVGSVGElement>;
const Svg = ({ children, ...p }: IconProps & { children: ReactNode }) => (
  <svg className="a-ico" viewBox="0 0 24 24" aria-hidden="true" {...p}>
    {children}
  </svg>
);
export const IconHome = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
  </Svg>
);
export const IconCalendar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Svg>
);
export const IconPeople = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.7 3 2.5 3.5 5.2" />
  </Svg>
);
export const IconGift = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M12 8v13M12 8C10.5 5 7 4 6 6s2 2 6 2zm0 0c1.5-3 5-4 6-2s-2 2-6 2z" />
  </Svg>
);
export const IconPlus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const IconBell = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </Svg>
);
export const IconBack = (p: IconProps) => (
  <Svg {...p}>
    <path d="m15 5-7 7 7 7" />
  </Svg>
);
export const IconBag = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 8h14l-1 12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </Svg>
);
export const IconShop = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    <path d="M3 9l2-5h14l2 5M9 13a3 3 0 0 0 6 0" />
  </Svg>
);
export const IconSearch = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Svg>
);
export const IconBox = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 8 12 3l9 5v8l-9 5-9-5z" />
    <path d="m3 8 9 5 9-5M12 13v8" />
  </Svg>
);
export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);

/* ---------- Helpers ---------- */
const AVATAR = [C.coral, C.plum, C.navy, C.gold, C.sage, C.oxblood] as const;
const DARK_AVATAR = new Set<string>([C.plum, C.navy, C.oxblood]);
/** A stable brand colour per person, so the same person always looks the same. */
export function avatarColour(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const bg = AVATAR[h % AVATAR.length]!;
  return { background: bg, color: DARK_AVATAR.has(bg) ? "#FFFFFF" : C.nero };
}

export function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};

/** "60th birthday" when the year is known; otherwise the label ("birthday", "work anniversary", or a proper name such as "Mothering Sunday"). */
export function occasionTitle(
  label: string,
  type: string,
  year: number | undefined,
  onIso: string,
) {
  if (year && (type === "birthday" || type === "anniversary")) {
    const n = Number(onIso.slice(0, 4)) - year;
    if (n > 0) return `${ordinal(n)} ${type}`;
  }
  return /^(birthday|anniversary|wedding anniversary|work anniversary)$/i.test(label.trim())
    ? label.toLowerCase()
    : label;
}

/** Milestones worth celebrating louder: 18, 21, and every 10th, plus silver and gold anniversaries. */
export const isMilestone = (title: string) =>
  /^(18|21|25|30|40|50|60|70|80|90|100)(st|nd|rd|th) /.test(title);

export const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
export const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
export const dayMonth = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export function whenText(days: number) {
  return days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days to go`;
}

export interface UpcomingItem {
  key: string;
  kind: "person" | "festival";
  /** e.g. "Mama's" or "Christmas" */
  name: string;
  /** e.g. "60th birthday"; empty for festivals */
  title: string;
  date: string;
  orderBy: string | null;
  days: number;
  personId?: string;
  occasionSlug?: string;
  initial: string;
  sorted: boolean;
  /** Date still to be confirmed (Islamic holidays follow the moon). */
  tbc?: boolean;
  publicHoliday?: boolean;
}

/** People's dates and festivals in one list, soonest first. A gift is "sorted" when one is scheduled for that date. */
export function upcomingItems(
  people: Person[],
  scheduled: ScheduledGift[],
  festivals: OccasionInstance[],
  from = todayIso(),
): UpcomingItem[] {
  const items: UpcomingItem[] = [];
  for (const p of people) {
    for (const d of p.dates) {
      const on = nextOccurrence(d, from);
      const title = occasionTitle(d.label, d.type, d.year, on);
      items.push({
        key: `${p.id}-${d.id}`,
        kind: "person",
        name: p.name,
        title,
        date: on,
        orderBy: addDays(on, -PERSON_ORDER_LEAD_DAYS),
        days: daysUntil(on, from),
        personId: p.id,
        initial: p.name.trim().slice(0, 1).toUpperCase(),
        sorted: scheduled.some(
          (g) => g.personId === p.id && g.deliveryDate <= on && g.deliveryDate >= from,
        ),
      });
    }
  }
  for (const f of festivals) {
    if (!f.date) continue;
    items.push({
      key: `f-${f.occasion.slug}-${f.date}`,
      kind: "festival",
      name: f.occasion.name,
      title: "",
      date: f.date,
      orderBy: f.orderBy,
      days: daysUntil(f.date, from),
      occasionSlug: f.occasion.slug,
      initial: String(Number(f.date.slice(8, 10))),
      sorted: false,
      tbc: f.tbc,
      publicHoliday: Boolean(f.occasion.publicHoliday),
    });
  }
  return items
    .filter((i) => i.days >= 0)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.kind === "person" ? -1 : 1));
}

/** Status of an upcoming date: sorted, order today (urgent), or still to plan. */
export function status(i: UpcomingItem, from = todayIso()) {
  if (i.sorted) return { label: "Sorted", bg: C.sage, fg: C.nero, bar: C.sage };
  if (i.orderBy && i.orderBy <= from)
    return { label: "Order today", bg: C.oxblood, fg: "#FFFFFF", bar: C.oxblood };
  if (i.kind === "festival") return { label: "", bg: C.gold, fg: C.nero, bar: C.line };
  return { label: "No gift yet", bg: C.oxblood, fg: "#FFFFFF", bar: C.coral };
}

/* ---------- Shared pieces ---------- */

/** Keep only the festivals the customer follows. No choice yet means all of them. */
export function followed(festivals: OccasionInstance[], moments: string[]) {
  // Public holidays always show; other moments follow the customer's choice (none chosen = all of them).
  return moments.length
    ? festivals.filter((f) => f.occasion.publicHoliday || moments.includes(f.occasion.slug))
    : festivals;
}

export function BackButton({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        border: `1.5px solid ${C.line}`,
        background: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        color: C.nero,
      }}
    >
      <IconBack style={{ width: 20, height: 20 }} />
    </button>
  );
}

/** Gold progress ring around an avatar: fills as the date gets closer (full at 0 days, empty at 60+). */
export function Ring({
  size,
  days,
  children,
}: {
  size: number;
  days: number;
  children: ReactNode;
}) {
  const r = size / 2 - 4;
  const circ = 2 * Math.PI * r;
  const frac = Math.max(0.06, Math.min(1, 1 - days / 60));
  const id = `gld-${size}`;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#D4A42F" />
            <stop offset=".5" stopColor="#F0CD67" />
            <stop offset="1" stopColor="#D4A42F" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.line}
          strokeWidth={size > 80 ? 5 : 4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={size > 80 ? 5 : 4}
          strokeLinecap="round"
          strokeDasharray={`${circ * frac} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: size > 80 ? 11 : 7,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Small calendar tile: month in oxblood, day in Garamond. */
export function CalTile({ iso, tone = C.oxblood }: { iso: string; tone?: string }) {
  const d = new Date(`${iso}T00:00:00`);
  return (
    <div
      style={{
        width: 46,
        height: 50,
        borderRadius: 12,
        background: C.ivory,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 700, color: tone, letterSpacing: ".12em" }}>
        {d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase()}
      </span>
      <span
        style={{
          fontFamily: "'EB Garamond',Georgia,serif",
          fontWeight: 500,
          fontSize: 22,
          lineHeight: 1,
        }}
      >
        {d.getDate()}
      </span>
    </div>
  );
}

/** Onboarding header: back, logo, step count and progress bars. */
export function StepHeader({
  step,
  total = 4,
  onBack,
}: {
  step: number;
  total?: number;
  onBack: () => void;
}) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <BackButton onClick={onBack} />
        <img
          src="/brand/logo-primary.svg"
          alt="Boxed by Dweenie"
          style={{ height: 24, width: "auto" }}
        />
        <span style={{ fontSize: 13, color: C.muted, minWidth: 44, textAlign: "right" }}>
          {step} of {total}
        </span>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 18 }} aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            style={{ flex: 1, height: 3, borderRadius: 2, background: i < step ? C.nero : C.line }}
          />
        ))}
      </div>
    </>
  );
}

export const chip = (on: boolean) =>
  ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 44,
    padding: "0 15px",
    borderRadius: 999,
    border: `1.5px solid ${on ? C.nero : C.line}`,
    background: on ? C.nero : "#FFFFFF",
    color: on ? "#FFFFFF" : C.nero,
    font: "500 14px 'Parkinsans','Segoe UI',system-ui,sans-serif",
    cursor: "pointer",
  }) as const;

/** Download every saved date as one .ics file that repeats yearly (Google, Apple and Outlook calendars all accept it). */
export function downloadAllDates(people: Person[]) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const year = new Date().getFullYear();
  const esc = (s: string) => s.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
  const events = people.flatMap((p) =>
    p.dates.map((d) => {
      const start = `${year}${pad2(d.month)}${pad2(d.day)}`;
      const end = new Date(year, d.month - 1, d.day + 1);
      const endStr = `${end.getFullYear()}${pad2(end.getMonth() + 1)}${pad2(end.getDate())}`;
      return [
        "BEGIN:VEVENT",
        `UID:${p.id}-${d.id}@boxedbydweenie.com`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${start}`,
        `DTEND;VALUE=DATE:${endStr}`,
        "RRULE:FREQ=YEARLY",
        `SUMMARY:${esc(`${p.name}: ${d.label}`)}`,
        `DESCRIPTION:${esc("Choose a gift in your BBD Gift Calendar: https://boxedbydweenie.com/app")}`,
        "BEGIN:VALARM",
        "TRIGGER:-P7D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${esc(`${p.name}'s ${d.label.toLowerCase()} is in a week`)}`,
        "END:VALARM",
        "END:VEVENT",
      ].join("\r\n");
    }),
  );
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Boxed by Dweenie//Gift Calendar//EN",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "bbd-gift-calendar.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ---------- Install to home screen ---------- */
type InstallEvent = Event & { prompt: () => Promise<void> };
let deferredInstall: InstallEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstall = e as InstallEvent;
  });
}
/** True on browsers (Android Chrome, desktop Chrome and Edge) that let us show the install prompt ourselves. */
export const canInstall = () => deferredInstall !== null;
export async function promptInstall() {
  if (!deferredInstall) return false;
  await deferredInstall.prompt();
  deferredInstall = null;
  return true;
}

/** Sticky header for inner screens: back, title, optional action. Blurs content scrolling beneath it, like a native app. */
export function TopBar({
  title,
  onBack,
  right,
  hideBackOnDesk,
}: {
  title?: ReactNode;
  onBack?: () => void;
  right?: ReactNode;
  hideBackOnDesk?: boolean;
}) {
  return (
    <div className="a-topbar">
      {onBack && (
        <span
          className={hideBackOnDesk ? "a-only-phone" : undefined}
          style={{ display: "contents" }}
        >
          <BackButton onClick={onBack} />
        </span>
      )}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          fontWeight: 700,
          fontSize: 16,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </div>
      {right}
    </div>
  );
}

/** Go back within the app, or to a sensible screen when the app was opened directly on this page. */
export function goBack(history: { back: () => void }, fallback: () => void) {
  if (
    typeof window !== "undefined" &&
    window.history.length > 1 &&
    document.referrer.includes(window.location.host)
  )
    history.back();
  else if (
    typeof window !== "undefined" &&
    window.history.state &&
    (window.history.state as { __TSR_index?: number }).__TSR_index
  )
    history.back();
  else fallback();
}

/** Marks an order started in the app, so the website's payment return page sends the customer back into the app. */
export const APP_PAY_KEY = "bbd-app-pay";

/** True on laptop-size screens (1024px and wider), where the app shows the sidebar layout. */
export function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

/* ---------- Invites ---------- */
export const SITE = "https://boxedbydweenie.com";

/** The personal invite link: opens the app with "<name> invited you" on the splash. */
export function inviteLink(firstName: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : SITE;
  return `${origin}/app${firstName ? `?from=${encodeURIComponent(firstName)}` : ""}`;
}

export const defaultInviteMessage = (link: string) =>
  `Look what I found! The Boxed by Dweenie Gift Calendar remembers every birthday and anniversary for you, reminds you in good time, and helps you send a beautiful gift. It's free and installs on your phone like an app. Try it: ${link}`;

type Platform = "ios" | "android" | "desktop" | "installed";
export function usePlatform(): Platform {
  const [p, setP] = useState<Platform>("desktop");
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const ua = navigator.userAgent;
    setP(
      standalone
        ? "installed"
        : /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
          ? "ios"
          : /Android/i.test(ua)
            ? "android"
            : "desktop",
    );
  }, []);
  return p;
}

/** How to put the app on your home screen, for the phone in your hand. */
export function InstallHelp({ dark }: { dark?: boolean }) {
  const platform = usePlatform();
  const [can, setCan] = useState(false);
  useEffect(() => {
    setCan(canInstall());
    const t = setInterval(() => setCan(canInstall()), 1000);
    return () => clearInterval(t);
  }, []);
  if (platform === "installed") return null;
  const fg = dark ? "#FFFFFF" : C.nero;
  const sub = dark ? "rgba(255,255,255,.78)" : C.muted;
  const steps =
    platform === "ios"
      ? [
          "Tap the Share button at the bottom of Safari",
          "Scroll and tap “Add to Home Screen”",
          "Tap “Add”. The Gift Calendar is now on your phone",
        ]
      : platform === "android"
        ? [
            "Tap the menu (⋮) at the top of Chrome",
            "Tap “Install app” or “Add to Home screen”",
            "Open the Gift Calendar from your home screen",
          ]
        : [
            "Open this link on your phone",
            "Add it to your home screen",
            "Or keep using it right here in your browser",
          ];
  return (
    <div
      style={{
        background: dark ? "rgba(255,255,255,.08)" : "#FFFFFF",
        border: dark ? "1px solid rgba(255,255,255,.18)" : `1.5px solid ${C.line}`,
        borderRadius: 20,
        padding: 16,
        color: fg,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: C.nero,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <img src="/brand/bow-gold.svg" alt="" style={{ width: 30, height: "auto" }} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ display: "block", fontSize: 15 }}>Get the app on your phone</strong>
          <span style={{ fontSize: 12, color: sub }}>Free. No app store needed.</span>
        </div>
        {can && (
          <button
            type="button"
            className="a-abtn a-gold"
            style={{ minHeight: 40, padding: "0 16px" }}
            onClick={() => void promptInstall().then(() => setCan(false))}
          >
            Install
          </button>
        )}
      </div>
      {!can && (
        <ol style={{ margin: "14px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
          {steps.map((s, i) => (
            <li
              key={s}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                fontSize: 13,
                lineHeight: 1.45,
                color: sub,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: C.gold,
                  color: C.nero,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <span style={{ paddingTop: 2 }}>{s}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** The colour strip from the brand guide's colour combinations: Gold, Sage, Coral, Oxblood. */
export function BrandStrip({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      style={{
        display: "flex",
        height: 5,
        borderRadius: 3,
        overflow: "hidden",
        maxWidth: 220,
        margin: "0 auto",
        ...style,
      }}
    >
      {[C.gold, C.sage, C.coral, C.oxblood].map((c) => (
        <span key={c} style={{ flex: 1, background: c }} />
      ))}
    </div>
  );
}
