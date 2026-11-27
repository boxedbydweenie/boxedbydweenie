import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { OCCASIONS } from "@/data/occasions";
import { customerClient } from "@/lib/supabase";
import { useMoments, usePeople, useScheduledGifts } from "@/hooks/use-calendar";
import { useUser } from "@/hooks/use-shop";
import { addPerson, getOccasionsForYear, momentsStore, todayIso } from "@/services/calendar";
import type { OccasionInstance, PersonalDateType } from "@/types/calendar";
import {
  C,
  IconCheck,
  StepHeader,
  canInstall,
  chip,
  followed,
  promptInstall,
  upcomingItems,
} from "@/components/app/kit";
import { PersonForm } from "@/components/app/PersonForm";

const STEPS = ["verify", "moments", "person", "import", "ready"] as const;
type Step = (typeof STEPS)[number];

export const Route = createFileRoute("/app/welcome")({
  validateSearch: z.object({
    step: z.enum(STEPS).optional().catch(undefined),
    from: z.enum(["account", "people"]).optional().catch(undefined),
  }),
  component: Welcome,
});

/** Onboarding after sign-up: 1.3 confirm email, 1.4 moments, 1.5 first person, 1.6 bring everyone in, 1.7 ready. */
function Welcome() {
  const { step = "verify", from } = Route.useSearch();
  const navigate = useNavigate();
  const go = (s: Step) =>
    void navigate({ to: "/app/welcome", search: { step: s, ...(from ? { from } : {}) } });
  // Opened from Profile or People to change one thing: return there afterwards.
  const done = from
    ? () => void navigate({ to: from === "account" ? "/app/account" : "/app/people" })
    : null;
  const back = (s: Step) => (done ? done() : go(s));

  return (
    <div
      className={step === "ready" ? "" : "a-top-pattern"}
      style={{
        minHeight: "100dvh",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        padding: step === "ready" ? 0 : "54px 22px 28px",
      }}
    >
      {step === "verify" && (
        <Verify onBack={() => void navigate({ to: "/app/signin" })} onDone={() => go("moments")} />
      )}
      {step === "moments" && (
        <Moments
          onBack={() => back("verify")}
          onDone={() => (done ? done() : go("person"))}
          standalone={Boolean(done)}
        />
      )}
      {step === "person" && (
        <>
          <StepHeader step={3} onBack={() => go("moments")} />
          <h1 className="a-dsp" style={{ fontSize: 38, marginTop: 24 }}>
            Who should we <span style={{ color: C.goldText }}>never let you forget?</span>
          </h1>
          <PersonForm onSaved={() => go("import")} />
          <button type="button" onClick={() => go("import")} style={skip}>
            Skip for now
          </button>
        </>
      )}
      {step === "import" && (
        <Import
          onBack={() => back("person")}
          onDone={() => (done ? done() : go("ready"))}
          standalone={Boolean(done)}
        />
      )}
      {step === "ready" && <Ready />}
    </div>
  );
}

/* ---------- 1.3 Confirm email ---------- */
function Verify({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const user = useUser();
  const email = user?.email ?? "";
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [wait, setWait] = useState(0);
  const [sendFailed, setSendFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const sent = useRef(false);

  const send = async () => {
    if (!email) return;
    setErr("");
    const { error } = await customerClient().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) {
      setSendFailed(true);
      setErr(
        /rate|seconds/i.test(error.message)
          ? "Please wait a moment before asking for another code."
          : "We couldn't send the code just now.",
      );
    } else {
      setSendFailed(false);
      setWait(60);
    }
  };
  useEffect(() => {
    if (sent.current || !email) return;
    sent.current = true;
    void send();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const code = digits.join("");
  const verify = async () => {
    if (code.length !== 6) return setErr("Enter all six digits.");
    setBusy(true);
    setErr("");
    const { error } = await customerClient().auth.verifyOtp({ email, token: code, type: "email" });
    if (error) {
      setErr("That code didn't match. Check the latest email and try again.");
      setBusy(false);
      return;
    }
    await customerClient().auth.updateUser({
      data: { email_confirmed_in_app: new Date().toISOString() },
    });
    onDone();
  };

  const type = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "");
    if (clean.length > 1) {
      // Pasted the whole code.
      const next = clean.slice(0, 6).split("");
      setDigits([...next, ...Array(6 - next.length).fill("")]);
      refs.current[Math.min(5, next.length)]?.focus();
      return;
    }
    setDigits((d) => d.map((x, n) => (n === i ? clean : x)));
    if (clean && i < 5) refs.current[i + 1]?.focus();
  };

  return (
    <>
      <StepHeader step={1} onBack={onBack} />
      <div
        style={{
          marginTop: 40,
          width: 88,
          height: 88,
          borderRadius: "50%",
          background: C.gold,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <svg
          viewBox="0 0 48 48"
          width="42"
          height="42"
          aria-hidden="true"
          style={{
            fill: "none",
            stroke: C.nero,
            strokeWidth: 2.2,
            strokeLinejoin: "round",
            strokeLinecap: "round",
          }}
        >
          <rect x="6" y="12" width="36" height="26" rx="3" />
          <path d="m7 14 17 13 17-13" />
        </svg>
        <span
          style={{
            position: "absolute",
            right: -4,
            top: -4,
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: C.nero,
            color: C.gold,
            fontSize: 13,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `3px solid ${C.ivory}`,
          }}
        >
          1
        </span>
      </div>
      <h1 className="a-dsp" style={{ fontSize: 40, marginTop: 26 }}>
        Check your <span style={{ color: C.goldText }}>inbox.</span>
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: C.muted, margin: "10px 0 0" }}>
        We sent a 6-digit code to <strong style={{ color: C.nero }}>{email}</strong>. It keeps your
        calendar and reminders safe.
      </p>
      <div
        role="group"
        aria-label="Six digit code"
        style={{ display: "flex", gap: 8, marginTop: 28 }}
      >
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${i + 1}`}
            maxLength={6}
            onChange={(e) => type(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus();
              if (e.key === "Enter") void verify();
            }}
            style={{
              flex: 1,
              minWidth: 0,
              height: 60,
              borderRadius: 14,
              background: "#FFFFFF",
              border: `${d ? 1.5 : 2}px solid ${d ? C.line : C.nero}`,
              textAlign: "center",
              fontFamily: "'EB Garamond',Georgia,serif",
              fontWeight: 500,
              fontSize: 30,
              color: C.nero,
              outline: "none",
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 14,
          fontSize: 13,
          color: C.muted,
        }}
      >
        <span>Didn&rsquo;t get it? Check spam.</span>
        {wait > 0 ? (
          <span>
            Resend in{" "}
            <strong style={{ color: C.nero, fontVariantNumeric: "tabular-nums" }}>
              0:{String(wait).padStart(2, "0")}
            </strong>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => void send()}
            style={{
              border: 0,
              background: "none",
              fontWeight: 600,
              color: C.nero,
              textDecoration: "underline",
              cursor: "pointer",
              fontSize: 13,
              padding: 0,
            }}
          >
            Send a new code
          </button>
        )}
      </div>
      <div
        style={{
          marginTop: 22,
          background: "#FFFFFF",
          border: `1.5px solid ${C.gold}`,
          borderRadius: 16,
          padding: "14px 16px",
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        <svg
          className="a-ico"
          viewBox="0 0 24 24"
          aria-hidden="true"
          style={{ color: C.goldText, marginTop: 1, width: 20, height: 20 }}
        >
          <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        <span>
          Reminders come from <strong>hello@boxedbydweenie.com</strong>. Add us to your contacts so
          they never land in spam.
        </span>
      </div>
      {err && (
        <p role="alert" style={{ fontSize: 13, color: C.oxblood, fontWeight: 600, marginTop: 14 }}>
          {err}
        </p>
      )}
      <div style={{ flex: 1, minHeight: 24 }} />
      <button
        type="button"
        className="a-abtn a-lg a-ink"
        disabled={busy}
        onClick={() => void verify()}
        style={{ opacity: busy ? 0.6 : 1 }}
      >
        {busy ? "Checking…" : "Confirm and continue"}
      </button>
      <button
        type="button"
        onClick={onDone}
        style={{
          ...skip,
          fontWeight: sendFailed ? 600 : 400,
          color: sendFailed ? C.nero : C.muted,
        }}
      >
        Confirm later and continue
      </button>
    </>
  );
}

/* ---------- 1.4 Moments you gift for ---------- */
const GROUPS: [string, string][] = [
  ["faith", "Faith and festivals"],
  ["family", "Family"],
  ["celebrations", "Celebrations"],
  ["workplace", "Work"],
];
const DEFAULT_MOMENTS = [
  "christmas-day",
  "eid-al-fitr",
  "eid-al-adha",
  "mothering-sunday",
  "valentines-day",
  "year-end-staff-gifts",
];
const SHORT: Record<string, string> = {
  "christmas-day": "Christmas",
  "international-womens-day": "Women's Day",
  "international-mens-day": "Men's Day",
  "year-end-staff-gifts": "Year-end staff gifts",
};

function Moments({
  onBack,
  onDone,
  standalone,
}: {
  onBack: () => void;
  onDone: () => void;
  standalone: boolean;
}) {
  const saved = useMoments();
  const [on, setOn] = useState<Set<string>>(() => new Set(saved.length ? saved : DEFAULT_MOMENTS));
  const dated = OCCASIONS.filter(
    (o) => !["work-anniversaries", "new-starter-onboarding"].includes(o.slug),
  );
  const toggle = (slug: string) =>
    setOn((s) => {
      const n = new Set(s);
      if (n.has(slug)) n.delete(slug);
      else n.add(slug);
      return n;
    });
  return (
    <>
      <StepHeader step={2} onBack={onBack} />
      <h1 className="a-dsp" style={{ fontSize: 38, marginTop: 24 }}>
        Which moments do you <span style={{ color: C.goldText }}>gift for?</span>
      </h1>
      <p style={{ fontSize: 14, lineHeight: 1.55, color: C.muted, margin: "8px 0 0" }}>
        We&rsquo;ll add each one with an order-by date, so the box always arrives on time.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 20 }}>
        {GROUPS.map(([cat, name]) => {
          const items = dated.filter((o) => o.category === cat);
          if (!items.length) return null;
          return (
            <div key={cat} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="a-eye">{name}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {items.map((o) => {
                  const isOn = on.has(o.slug);
                  return (
                    <button
                      key={o.slug}
                      type="button"
                      aria-pressed={isOn}
                      onClick={() => toggle(o.slug)}
                      style={chip(isOn)}
                    >
                      {isOn && (
                        <IconCheck
                          style={{ width: 16, height: 16, stroke: C.gold, strokeWidth: 2.6 }}
                        />
                      )}
                      {SHORT[o.slug] ?? o.name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ flex: 1, minHeight: 24 }} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 13,
          margin: "20px 0 14px",
        }}
      >
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: C.gold,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'EB Garamond',Georgia,serif",
            fontWeight: 500,
            fontSize: 20,
            fontVariantNumeric: "tabular-nums",
            flexShrink: 0,
          }}
        >
          {on.size}
        </span>
        moments on your calendar. Change them any time.
      </div>
      <button
        type="button"
        className="a-abtn a-lg a-ink"
        onClick={() => {
          momentsStore.set([...on]);
          onDone();
        }}
      >
        {standalone ? "Save" : "Continue"}
      </button>
    </>
  );
}

/* ---------- 1.6 Bring everyone in ---------- */
interface Row {
  id: string;
  name: string;
  day: number | null;
  month: number | null;
  year: number | null;
  kind: "birthday" | "anniversary" | "work" | null;
}
const MONTH_NAMES = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];
const KIND_LABEL: Record<NonNullable<Row["kind"]>, [PersonalDateType, string]> = {
  birthday: ["birthday", "Birthday"],
  anniversary: ["anniversary", "Wedding anniversary"],
  work: ["custom", "Work anniversary"],
};

/** Reads one line such as "Tolu Adebayo, 5 Dec, work anniversary" or "Daddy - 14/02/1958 - birthday". */
function parseLine(line: string): Row | null {
  const raw = line.trim();
  if (!raw) return null;
  const parts = raw.split(/\s*[,;\t|]\s*|\s+[-–]\s+/).filter(Boolean);
  let day: number | null = null,
    month: number | null = null,
    year: number | null = null,
    kind: Row["kind"] = null;
  const nameParts: string[] = [];
  for (const p of parts) {
    const low = p.toLowerCase();
    if (/work/.test(low) && /anniv/.test(low)) {
      kind = "work";
      continue;
    }
    if (/anniv|wedding/.test(low)) {
      kind = "anniversary";
      continue;
    }
    if (/birth|bday|b-day/.test(low)) {
      kind = "birthday";
      continue;
    }
    let m = low.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) {
      year = +m[1]!;
      month = +m[2]!;
      day = +m[3]!;
      continue;
    }
    m = low.match(/^(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?$/);
    if (m) {
      day = +m[1]!;
      month = +m[2]!;
      if (m[3]) year = m[3].length === 2 ? 1900 + +m[3] : +m[3];
      continue;
    }
    m = low.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3,})\.?(?:\s+(\d{4}))?$/);
    if (m && MONTH_NAMES.includes(m[2]!.slice(0, 3))) {
      day = +m[1]!;
      month = MONTH_NAMES.indexOf(m[2]!.slice(0, 3)) + 1;
      if (m[3]) year = +m[3];
      continue;
    }
    m = low.match(/^([a-z]{3,})\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?$/);
    if (m && MONTH_NAMES.includes(m[1]!.slice(0, 3))) {
      month = MONTH_NAMES.indexOf(m[1]!.slice(0, 3)) + 1;
      day = +m[2]!;
      if (m[3]) year = +m[3];
      continue;
    }
    if (/^name$|^date$|^occasion$/i.test(p)) return null; // header row
    nameParts.push(p);
  }
  const name = nameParts.join(" ").trim();
  if (!name) return null;
  if (day && month && (month > 12 || day > 31)) {
    day = null;
    month = null;
  }
  return { id: crypto.randomUUID(), name, day, month, year, kind };
}

const ready = (r: Row) => Boolean(r.name && r.day && r.month && r.kind);

function Import({
  onBack,
  onDone,
  standalone,
}: {
  onBack: () => void;
  onDone: () => void;
  standalone: boolean;
}) {
  const [mode, setMode] = useState<"contacts" | "paste" | "file" | null>(null);
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const people = usePeople();
  const fileRef = useRef<HTMLInputElement>(null);
  const hasContacts =
    typeof navigator !== "undefined" &&
    "contacts" in navigator &&
    "select" in ((navigator as unknown as { contacts: object }).contacts ?? {});
  const last = people[people.length - 1];

  const readText = (t: string) =>
    setRows(
      t
        .split(/\r?\n/)
        .map(parseLine)
        .filter((r): r is Row => r !== null),
    );
  const pickContacts = async () => {
    setMode("contacts");
    try {
      const list = await (
        navigator as unknown as {
          contacts: {
            select: (p: string[], o: { multiple: boolean }) => Promise<{ name?: string[] }[]>;
          };
        }
      ).contacts.select(["name"], { multiple: true });
      setRows(
        list
          .map((c) => c.name?.[0]?.trim())
          .filter((n): n is string => Boolean(n))
          .map((name) => ({
            id: crypto.randomUUID(),
            name,
            day: null,
            month: null,
            year: null,
            kind: null,
          })),
      );
    } catch {
      toast("No contacts chosen.");
    }
  };
  const fix = (id: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const good = rows.filter(ready);

  const save = async () => {
    setBusy(true);
    // One person per name, with all their dates.
    const byName = new Map<string, Row[]>();
    for (const r of good) byName.set(r.name, [...(byName.get(r.name) ?? []), r]);
    for (const [name, list] of byName) {
      await addPerson({
        name,
        relationship: "Other",
        notes: { likes: "", dislikes: "", sizes: "", noAlcohol: false, budget: 0 },
        reminder: { daysBefore: [14], channels: ["email"] },
        dates: list.map((r) => ({
          type: KIND_LABEL[r.kind!][0],
          label: KIND_LABEL[r.kind!][1],
          day: r.day!,
          month: r.month!,
          ...(r.year ? { year: r.year } : {}),
        })),
      });
    }
    toast.success(`${byName.size} ${byName.size === 1 ? "person" : "people"} added`);
    onDone();
  };

  const option = (
    id: "contacts" | "paste" | "file",
    title: string,
    note: string,
    bg: string,
    fg: string,
    icon: React.ReactNode,
    onClick: () => void,
    disabled?: boolean,
  ) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={mode === id}
      style={{
        display: "flex",
        gap: 14,
        alignItems: "center",
        padding: 14,
        borderRadius: 18,
        background: "#FFFFFF",
        border: `${mode === id ? 2 : 1.5}px solid ${mode === id ? C.nero : C.line}`,
        textAlign: "left",
        cursor: disabled ? "not-allowed" : "pointer",
        color: C.nero,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <span
        style={{
          width: 46,
          height: 46,
          borderRadius: "50%",
          background: bg,
          color: fg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ display: "block", fontSize: 15 }}>{title}</strong>
        <span style={{ fontSize: 12, color: C.muted }}>{note}</span>
      </span>
    </button>
  );

  return (
    <>
      <StepHeader step={4} onBack={onBack} />
      {last && !standalone && (
        <div
          style={{
            marginTop: 20,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: C.sage,
            borderRadius: 999,
            padding: "8px 14px 8px 8px",
            fontSize: 13,
            fontWeight: 600,
            alignSelf: "flex-start",
          }}
        >
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: C.nero,
              color: C.gold,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconCheck style={{ width: 14, height: 14, strokeWidth: 2.8 }} />
          </span>
          {last.name.split(" ")[0]}&rsquo;s {last.dates[0]?.label.toLowerCase() ?? "date"} is saved
        </div>
      )}
      <h1 className="a-dsp" style={{ fontSize: 38, marginTop: 18 }}>
        Bring everyone in <span style={{ color: C.goldText }}>at once.</span>
      </h1>
      <p style={{ fontSize: 14, lineHeight: 1.55, color: C.muted, margin: "8px 0 0" }}>
        Choose how. We read the names and dates for you, and you check them before anything is
        saved.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
        {option(
          "contacts",
          "From my phone contacts",
          hasContacts
            ? "Pick names from your phone, then add their dates."
            : "Works in Chrome on Android phones.",
          C.nero,
          C.gold,
          <svg className="a-ico" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="5" y="3" width="14" height="18" rx="2" />
            <circle cx="12" cy="10" r="2.6" />
            <path d="M8.5 16.5c.6-1.7 2-2.6 3.5-2.6s2.9.9 3.5 2.6M3 7h2M3 12h2M3 17h2" />
          </svg>,
          () => void pickContacts(),
          !hasContacts,
        )}
        {option(
          "paste",
          "Paste a list",
          "From WhatsApp, Notes or anywhere. One per line.",
          C.gold,
          C.nero,
          <svg className="a-ico" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="5" y="4" width="14" height="17" rx="2" />
            <path d="M9 4V3h6v1M8.5 10h7M8.5 14h7M8.5 18h4" />
          </svg>,
          () => setMode("paste"),
        )}
        {option(
          "file",
          "Upload a spreadsheet",
          "A CSV file. In Excel or Google Sheets, save or download as CSV.",
          C.coral,
          C.nero,
          <svg className="a-ico" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 15v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4" />
          </svg>,
          () => {
            setMode("file");
            fileRef.current?.click();
          },
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void f.text().then(readText);
          }}
        />
      </div>

      {mode === "paste" && (
        <textarea
          aria-label="Paste your list"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            readText(e.target.value);
          }}
          rows={5}
          placeholder={
            "Tolu Adebayo, 5 Dec, work anniversary\nNgozi & Emeka, 31 Dec, wedding anniversary\nDaddy, 14 Feb, birthday"
          }
          style={{
            marginTop: 16,
            background: "#FFFFFF",
            borderRadius: 16,
            border: `1.5px dashed ${C.muted}`,
            padding: "12px 14px",
            fontSize: 13,
            lineHeight: 1.65,
            color: C.nero,
            fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace",
            resize: "vertical",
          }}
        />
      )}

      {rows.length > 0 && (
        <div
          style={{
            marginTop: 16,
            background: "#FFFFFF",
            borderRadius: 20,
            border: `1.5px solid ${C.line}`,
            padding: "14px 16px 6px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <div className="a-eye">
              We found {rows.length} {rows.length === 1 ? "person" : "people"}
            </div>
            <span className="a-pill" style={{ background: C.sage }}>
              {good.length} ready
            </span>
          </div>
          {rows.map((r) => (
            <ImportRow
              key={r.id}
              r={r}
              onFix={(p) => fix(r.id, p)}
              onRemove={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
            />
          ))}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 24 }} />
      {good.length > 0 ? (
        <button
          type="button"
          className="a-abtn a-lg a-ink"
          disabled={busy}
          onClick={() => void save()}
          style={{ opacity: busy ? 0.6 : 1 }}
        >
          Add {good.length} {good.length === 1 ? "person" : "people"}
        </button>
      ) : null}
      <button type="button" onClick={onDone} style={skip}>
        {standalone ? "Back" : "I'll do this later"}
      </button>
    </>
  );
}

function ImportRow({
  r,
  onFix,
  onRemove,
}: {
  r: Row;
  onFix: (p: Partial<Row>) => void;
  onRemove: () => void;
}) {
  const ok = ready(r);
  const [open, setOpen] = useState(!ok && !r.day);
  const date =
    r.day && r.month
      ? `${r.day} ${new Date(2026, r.month - 1, 1).toLocaleDateString("en-GB", { month: "short" })}`
      : null;
  const question = !r.day || !r.month ? "When is it?" : !r.kind ? `Which occasion is ${date}?` : "";
  return (
    <div style={{ padding: "11px 0", borderTop: `1px solid ${C.line}`, fontSize: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: ok ? C.sage : C.gold,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          {r.name.slice(0, 1).toUpperCase()}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <strong
            style={{
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {r.name}
          </strong>
          {ok ? (
            <span style={{ fontSize: 12, color: C.muted }}>
              {KIND_LABEL[r.kind!][1]} · {date}
            </span>
          ) : (
            <span style={{ fontSize: 12, color: C.oxblood, fontWeight: 600 }}>{question}</span>
          )}
        </span>
        {ok ? (
          <span className="a-pill" style={{ background: C.sage }}>
            Ready
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="a-pill"
            style={{ background: C.oxblood, color: "#FFFFFF", border: 0, cursor: "pointer" }}
          >
            {open ? "Done" : "Fix"}
          </button>
        )}
        <button
          type="button"
          aria-label={`Remove ${r.name}`}
          onClick={onRemove}
          style={{
            border: 0,
            background: "none",
            fontSize: 18,
            color: C.muted,
            cursor: "pointer",
            padding: "0 2px",
          }}
        >
          ×
        </button>
      </div>
      {open && !ok && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginTop: 10,
            paddingLeft: 46,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(["birthday", "anniversary", "work"] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={r.kind === k}
                onClick={() => onFix({ kind: k })}
                style={{ ...chip(r.kind === k), minHeight: 34, fontSize: 12, padding: "0 12px" }}
              >
                {KIND_LABEL[k][1]}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <select
              aria-label="Day"
              value={r.day ?? ""}
              onChange={(e) => onFix({ day: Number(e.target.value) || null })}
              style={sel}
            >
              <option value="">Day</option>
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            <select
              aria-label="Month"
              value={r.month ?? ""}
              onChange={(e) => onFix({ month: Number(e.target.value) || null })}
              style={{ ...sel, flex: 2 }}
            >
              <option value="">Month</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i + 1}>
                  {new Date(2026, i, 1).toLocaleDateString("en-GB", { month: "long" })}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- 1.7 Calendar ready ---------- */
function Ready() {
  const user = useUser();
  const people = usePeople();
  const scheduled = useScheduledGifts();
  const moments = useMoments();
  const navigate = useNavigate();
  const [festivals, setFestivals] = useState<OccasionInstance[]>([]);
  const [installable, setInstallable] = useState(false);
  useEffect(() => {
    const y = Number(todayIso().slice(0, 4));
    void Promise.all([getOccasionsForYear(y), getOccasionsForYear(y + 1)]).then((a) =>
      setFestivals(a.flat()),
    );
    setInstallable(canInstall());
  }, []);
  const mine = followed(festivals, moments);
  const datesAYear =
    people.reduce((n, p) => n + p.dates.length, 0) +
    new Set(mine.filter((f) => f.date).map((f) => f.occasion.slug)).size;
  const next = useMemo(
    () =>
      upcomingItems(people, scheduled, mine).find((i) => i.kind === "person") ??
      upcomingItems(people, scheduled, mine)[0],
    [people, scheduled, mine],
  );
  const first = user?.name.split(" ")[0] ?? "";
  const confetti: [string, number, string, number, number, number, string, number][] = [
    ["20deg", 40, "80px", 12, 6, 0, C.gold, 0],
    ["-30deg", 96, "160px", 8, 8, 0.6, C.coral, 0],
    ["45deg", -60, "96px", 14, 6, 1.1, C.sage, 0],
    ["10deg", -110, "200px", 7, 7, 0.3, C.ivory, 1],
    ["-15deg", -28, "230px", 10, 5, 1.6, C.gold, 0],
    ["60deg", 26, "250px", 9, 9, 0.9, C.oxblood, 0],
  ];

  return (
    <div
      className="a-pat-green"
      style={{
        minHeight: "100dvh",
        boxSizing: "border-box",
        color: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        padding: "56px 22px 30px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`@keyframes bbd-fall{0%{transform:translateY(-6px) rotate(var(--r))}50%{transform:translateY(6px) rotate(calc(var(--r) + 25deg))}100%{transform:translateY(-6px) rotate(var(--r))}}.bbd-c{position:absolute;display:block;animation:bbd-fall 4s ease-in-out infinite}@media (prefers-reduced-motion:reduce){.bbd-c{animation:none}}`}</style>
      {confetti.map(([r, x, top, w, h, delay, bg, round], i) => (
        <span
          key={i}
          className="bbd-c"
          aria-hidden="true"
          style={{
            ["--r" as string]: r,
            ...(x >= 0 ? { left: x } : { right: -x }),
            top,
            width: w,
            height: h,
            background: bg,
            borderRadius: round ? "50%" : 0,
            animationDelay: `${delay}s`,
          }}
        />
      ))}
      <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
        <img
          src="/brand/logo-on-dark.svg"
          alt="Boxed by Dweenie"
          style={{ height: 26, width: "auto" }}
        />
      </div>
      <div
        style={{ display: "flex", justifyContent: "center", marginTop: 30, position: "relative" }}
      >
        <img
          className="a-sway"
          src="/brand/bow-gold.svg"
          alt=""
          style={{ width: 150, height: "auto", filter: "drop-shadow(0 18px 24px rgba(0,0,0,.35))" }}
        />
      </div>
      <h1
        className="a-dsp"
        style={{ fontSize: 42, marginTop: 22, textAlign: "center", position: "relative" }}
      >
        Your calendar is ready,
        {first && (
          <span
            className="a-scr"
            style={{ display: "block", color: C.gold, fontSize: 60, marginTop: 6 }}
          >
            {first}.
          </span>
        )}
      </h1>
      <p
        style={{
          fontSize: 15,
          lineHeight: 1.55,
          color: "rgba(255,255,255,.8)",
          textAlign: "center",
          margin: "12px 0 0",
          position: "relative",
        }}
      >
        We&rsquo;ll tell you in good time, every time.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 24,
          position: "relative",
          gap: 8,
        }}
      >
        <Orb bg={C.ivory} n={people.length} label={people.length === 1 ? "Person" : "People"} />
        <Orb bg={C.sage} n={datesAYear} label="Dates a year" />
        {next ? (
          <Orb
            bg={C.gold}
            n={next.days}
            label={`Days to ${next.kind === "person" ? (/^\d/.test(next.title) ? `${next.name.split(" ")[0]}'s ${next.title.split(" ")[0]}` : next.name.split(" ")[0]) : next.name}`}
          />
        ) : (
          <Orb bg={C.gold} n={moments.length || 6} label="Moments" />
        )}
      </div>

      <div
        style={{
          marginTop: 20,
          background: C.ivory,
          color: C.nero,
          borderRadius: 20,
          padding: 16,
          display: "flex",
          gap: 14,
          alignItems: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: C.nero,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <img src="/brand/bow-gold.svg" alt="" style={{ width: 32, height: "auto" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ display: "block", fontSize: 15 }}>Put it on your home screen</strong>
          <span style={{ fontSize: 12, lineHeight: 1.4, color: C.muted }}>
            iPhone: Share, then Add to Home Screen. Android: tap Install.
          </span>
        </div>
        {installable && (
          <button
            type="button"
            onClick={() => void promptInstall().then(() => setInstallable(false))}
            className="a-abtn a-ink"
            style={{ minHeight: 40, padding: "0 14px", fontSize: 13 }}
          >
            Install
          </button>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 24 }} />
      <div
        className="a-dsp"
        style={{
          textAlign: "center",
          fontSize: 20,
          color: C.gold,
          marginBottom: 16,
          position: "relative",
        }}
      >
        We exist for the love of gifting.
      </div>
      <button
        type="button"
        className="a-abtn a-lg a-gold"
        onClick={() => void navigate({ to: "/app", replace: true })}
        style={{ position: "relative" }}
      >
        Go to my calendar
      </button>
    </div>
  );
}

function Orb({ bg, n, label }: { bg: string; n: number; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: 100,
        height: 100,
        borderRadius: "50%",
        textAlign: "center",
        color: C.nero,
        background: bg,
        flexShrink: 0,
      }}
    >
      <b
        style={{
          fontFamily: "'EB Garamond',Georgia,serif",
          fontWeight: 500,
          fontSize: 34,
          lineHeight: 1,
        }}
      >
        {n}
      </b>
      <span
        style={{
          marginTop: 4,
          fontSize: 9,
          letterSpacing: ".18em",
          textTransform: "uppercase",
          fontWeight: 600,
          maxWidth: 80,
          lineHeight: 1.3,
        }}
      >
        {label}
      </span>
    </div>
  );
}

const skip = {
  textAlign: "center",
  fontSize: 14,
  fontWeight: 600,
  marginTop: 14,
  background: "none",
  border: 0,
  cursor: "pointer",
  color: C.nero,
  padding: 8,
} as const;
const sel = {
  flex: 1,
  height: 40,
  borderRadius: 10,
  border: `1.5px solid ${C.line}`,
  background: "#FFFFFF",
  font: "inherit",
  fontSize: 13,
  color: C.nero,
  padding: "0 8px",
} as const;
