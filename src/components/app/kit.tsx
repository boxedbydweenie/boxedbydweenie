import type { ReactNode, SVGProps } from "react";
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
.bbd-app{font-family:'Parkinsans','Segoe UI',system-ui,sans-serif;color:${C.nero};background:${C.ivory}}
.bbd-app a{color:inherit;text-decoration:none}
.bbd-app a:focus-visible,.bbd-app button:focus-visible{outline:2px solid ${C.nero};outline-offset:3px}
.a-dsp{font-family:'EB Garamond',Georgia,'Times New Roman',serif;font-weight:500;letter-spacing:-.01em;line-height:1.05;text-wrap:balance;margin:0}
.a-scr{font-family:'Pinyon Script','Snell Roundhand','Apple Chancery',cursive;font-weight:400;letter-spacing:0;line-height:.9}
.a-eye{font-size:12px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:${C.goldText}}
.a-abtn{display:flex;align-items:center;justify-content:center;gap:.6em;min-height:48px;padding:0 1.2em;border-radius:8px;font:600 14px 'Parkinsans','Segoe UI',system-ui,sans-serif;border:1.5px solid transparent;box-sizing:border-box;cursor:pointer;transition:transform .25s ease;white-space:nowrap}
.a-abtn:hover{transform:translateY(-2px)}
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
.a-pat-sage{background:${C.sage} url("/brand/bow-tile-sage.svg");background-size:72px}
.a-rv{background:linear-gradient(90deg,#D4A42F 0%,#EBC459 30%,#F0CD67 50%,#EBC459 70%,#D4A42F 100%)}
.a-rh{background:linear-gradient(180deg,#D4A42F 0%,#EBC459 30%,#F0CD67 50%,#EBC459 70%,#D4A42F 100%)}
.a-top-pattern{position:relative;isolation:isolate}
.a-top-pattern::before{content:"";position:absolute;left:0;right:0;top:0;height:260px;z-index:-1;background:url("/brand/pattern-ivory.svg") repeat;background-size:64px 62px;opacity:.55;-webkit-mask-image:linear-gradient(#000 30%,transparent);mask-image:linear-gradient(#000 30%,transparent)}
.bbd-row:first-child{border-top-width:0!important}
.a-hscroll{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;scroll-snap-type:x mandatory;margin:0 -16px;padding:0 16px}
.a-hscroll::-webkit-scrollbar{display:none}
.a-hscroll>*{scroll-snap-align:start}
@keyframes bbd-sway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
.a-sway{animation:bbd-sway 5s ease-in-out infinite;transform-origin:50% 40%}
@media (prefers-reduced-motion:reduce){.a-sway{animation:none}.a-abtn:hover{transform:none}}
`;

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
    if (!f.date || f.tbc) continue;
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
  return moments.length ? festivals.filter((f) => moments.includes(f.occasion.slug)) : festivals;
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
