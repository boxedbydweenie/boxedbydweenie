import { useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { addPerson, nextOccurrence, todayIso, updatePerson } from "@/services/calendar";
import type { Person, PersonalDateType, Relationship } from "@/types/calendar";
import { C, chip, defaultLeadStore, isMilestone, longDate, occasionTitle } from "./kit";
import type { CSSProperties, ReactNode } from "react";

/** 1.5 Add a person and date. Also used to edit someone already saved. */

const RELS: [string, Relationship][] = [
  ["Mum", "Parent"],
  ["Dad", "Parent"],
  ["Partner", "Partner"],
  ["Sibling", "Sibling"],
  ["Child", "Child"],
  ["Friend", "Friend"],
  ["Colleague", "Colleague"],
  ["Client", "Client"],
];
const KINDS: [string, PersonalDateType, string][] = [
  ["Birthday", "birthday", "Birthday"],
  ["Wedding anniversary", "anniversary", "Wedding anniversary"],
  ["Work anniversary", "custom", "Work anniversary"],
  ["Something else", "custom", ""],
];
const LEADS: [number, string, string][] = [
  [30, "1 month before", "Best for branded or custom boxes"],
  [14, "2 weeks before", "Recommended: time to choose and deliver"],
  [7, "1 week before", "Enough for most boxes in Lagos and Abuja"],
  [3, "3 days before", "Vouchers and same-week Lagos delivery"],
  [0, "On the day", "A nudge to call or send a message"],
];
const LOVES = [
  "Flowers",
  "Chocolate",
  "Wine",
  "Tea & coffee",
  "Skincare",
  "Perfume",
  "Books",
  "Fashion",
  "Tech",
  "Home",
  "Food hampers",
  "Spa & wellness",
];
const STEPS = 6;
const MONTHS = Array.from({ length: 12 }, (_, i) =>
  new Date(2026, i, 1).toLocaleDateString("en-GB", { month: "long" }),
);
const daysIn = (m: number, y?: number) => new Date(y ?? 2024, m, 0).getDate();

interface Draft {
  kind: number;
  label: string;
  day: number;
  month: number;
  year: number | null;
}
const today = todayIso();
const blank = (): Draft => ({
  kind: 0,
  label: "",
  day: Number(today.slice(8, 10)),
  month: Number(today.slice(5, 7)),
  year: null,
});

export function PersonForm({
  editing,
  onSaved,
}: {
  editing?: Person | undefined;
  onSaved: (p: Person) => void;
}) {
  const defaultLead = useSyncExternalStore(
    defaultLeadStore.subscribe,
    defaultLeadStore.get,
    defaultLeadStore.server,
  );
  const [name, setName] = useState(editing?.name ?? "");
  const [photo, setPhoto] = useState<string | undefined>(editing?.photo);
  const [rel, setRel] = useState<string>(() =>
    editing ? (RELS.find(([, r]) => r === editing.relationship)?.[0] ?? "Friend") : "",
  );
  const [saved, setSaved] = useState<Person["dates"]>(editing?.dates.slice(1) ?? []);
  const [draft, setDraft] = useState<Draft>(() => {
    const d = editing?.dates[0];
    if (!d) return blank();
    const k =
      d.type === "birthday"
        ? 0
        : d.type === "anniversary"
          ? 1
          : d.label === "Work anniversary"
            ? 2
            : 3;
    return {
      kind: k,
      label: k === 3 ? d.label : "",
      day: d.day,
      month: d.month,
      year: d.year ?? null,
    };
  });
  const [leads, setLeads] = useState<number[]>(
    editing?.reminder.daysBefore.length ? editing.reminder.daysBefore : [defaultLead],
  );
  const [step, setStep] = useState(0);
  const [yearText, setYearText] = useState(
    editing?.dates[0]?.year ? String(editing.dates[0].year) : "",
  );
  const [monthPicked, setMonthPicked] = useState(Boolean(editing));
  const [dayPicked, setDayPicked] = useState(Boolean(editing));
  const [likes, setLikes] = useState<string[]>(() =>
    (editing?.notes.likes ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const [likeInput, setLikeInput] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const first = name.trim().split(" ")[0] || "them";
  const kind = KINDS[draft.kind]!;
  const label = draft.kind === 3 ? draft.label.trim() : kind[2];
  const on = nextOccurrence({ day: draft.day, month: draft.month }, today);
  const title = occasionTitle(label || "Date", kind[1], draft.year ?? undefined, on);
  const milestone = draft.year && isMilestone(title) ? title.split(" ")[0] : null;

  const currentDate = (): Omit<Person["dates"][number], "personId"> | null =>
    label
      ? {
          id: crypto.randomUUID(),
          type: kind[1],
          label,
          day: draft.day,
          month: draft.month,
          ...(draft.year ? { year: draft.year } : {}),
        }
      : null;

  const addAnother = () => {
    const d = currentDate();
    if (!d) {
      toast.error("Name the occasion first.");
      return;
    }
    setSaved((s) => [...s, { ...d, personId: editing?.id ?? "" }]);
    setDraft(blank());
    setYearText("");
    toast.success(`${label} saved. Add the next date.`);
  };

  const pickPhoto = (file: File) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const size = 240,
        c = document.createElement("canvas");
      c.width = c.height = size;
      const s = Math.min(img.width, img.height);
      c.getContext("2d")?.drawImage(
        img,
        (img.width - s) / 2,
        (img.height - s) / 2,
        s,
        s,
        0,
        0,
        size,
        size,
      );
      setPhoto(c.toDataURL("image/jpeg", 0.82));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const addLike = () => {
    const v = likeInput.trim();
    if (v && !likes.includes(v)) setLikes((l) => [...l, v]);
    setLikeInput("");
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error("Add their name.");
      return;
    }
    if (!rel) {
      toast.error(`Choose who ${first} is to you.`);
      return;
    }
    const d = currentDate();
    if (!d && saved.length === 0) {
      toast.error("Name the occasion.");
      return;
    }
    setBusy(true);
    const dates = [...saved, ...(d ? [{ ...d, personId: editing?.id ?? "" }] : [])];
    const relationship = RELS.find(([l]) => l === rel)![1];
    const notes = {
      likes: likes.join(", "),
      dislikes: editing?.notes.dislikes ?? "",
      sizes: editing?.notes.sizes ?? "",
      noAlcohol: editing?.notes.noAlcohol ?? false,
      budget: editing?.notes.budget ?? 0,
    };
    const reminder = {
      daysBefore: [...leads].sort((a, b) => b - a),
      channels: editing?.reminder.channels ?? (["email"] as const).slice(),
    };
    try {
      if (editing) {
        const p: Person = {
          ...editing,
          name: name.trim(),
          relationship,
          ...(photo ? { photo } : {}),
          notes,
          reminder,
          dates: dates.map((x) => ({ ...x, personId: editing.id })),
        };
        await updatePerson(p);
        onSaved(p);
      } else {
        const p = await addPerson({
          name: name.trim(),
          relationship,
          ...(photo ? { photo } : {}),
          notes,
          reminder,
          dates: dates.map(({ personId: _p, ...x }) => x),
        });
        onSaved(p);
      }
    } catch {
      toast.error("We couldn't save that. Please try again.");
      setBusy(false);
    }
  };

  const toggleLove = (v: string) =>
    setLikes((l) => (l.includes(v) ? l.filter((x) => x !== v) : [...l, v]));
  const toggleLead = (d: number) =>
    setLeads((l) => (l.includes(d) ? (l.length > 1 ? l.filter((x) => x !== d) : l) : [...l, d]));

  /** Can the person move on from this step? */
  const ready = [
    Boolean(name.trim()),
    Boolean(rel),
    Boolean(label),
    monthPicked && dayPicked,
    leads.length > 0,
    true,
  ][step];
  const next = () => {
    if (!ready) {
      toast.error(
        [
          "Add their name.",
          `Choose who ${first} is to you.`,
          "Name the occasion.",
          "Pick the month and the day.",
          "Pick at least one reminder.",
          "",
        ][step] ?? "",
      );
      return;
    }
    if (step < STEPS - 1) setStep(step + 1);
    else void save();
  };
  const another = () => {
    addAnother();
    setMonthPicked(false);
    setDayPicked(false);
    setStep(2);
  };

  const titles: ReactNode[] = [
    <>
      Who should we <span style={{ color: C.goldText }}>never let you forget?</span>
    </>,
    <>
      Who is <span style={{ color: C.goldText }}>{first}</span> to you?
    </>,
    <>
      What are we <span style={{ color: C.goldText }}>remembering?</span>
    </>,
    <>
      When is {first}&rsquo;s{" "}
      <span style={{ color: C.goldText }}>{(label || "day").toLowerCase()}?</span>
    </>,
    <>
      When should we <span style={{ color: C.goldText }}>remind you?</span>
    </>,
    <>
      What does {first} <span style={{ color: C.goldText }}>love?</span>
    </>,
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, marginTop: 18 }}>
      {/* progress */}
      <div style={{ display: "flex", gap: 6 }} aria-label={`Step ${step + 1} of ${STEPS}`}>
        {Array.from({ length: STEPS }, (_, i) => (
          <span
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: i <= step ? C.plum : C.line,
              transition: "background .25s",
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 12.5, color: C.muted, marginTop: 10 }}>
        Step {step + 1} of {STEPS}
        {step === STEPS - 1 ? " · optional" : ""}
      </div>
      <h2 className="a-dsp" style={{ fontSize: 34, marginTop: 8, lineHeight: 1.08 }}>
        {titles[step]}
      </h2>

      <div key={step} className="a-screen" style={{ marginTop: 22, flex: 1 }}>
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Add a photo (optional)"
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                background: photo ? "transparent" : "#E9E1EA",
                color: C.plum,
                border: 0,
                padding: 0,
                cursor: "pointer",
                position: "relative",
              }}
            >
              {photo ? (
                <img
                  src={photo}
                  alt=""
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontFamily: "'EB Garamond',Georgia,serif", fontSize: 40 }}>
                  {name.trim().slice(0, 1).toUpperCase() || "+"}
                </span>
              )}
              <span
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: -10,
                  transform: "translateX(-50%)",
                  background: C.plum,
                  color: "#FFFFFF",
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 999,
                  padding: "3px 10px",
                  whiteSpace: "nowrap",
                }}
              >
                {photo ? "Change" : "Add photo"}
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => e.target.files?.[0] && pickPhoto(e.target.files[0])}
            />
            <input
              id="ap-name"
              aria-label="Their name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && next()}
              placeholder="Their name, e.g. Mama"
              autoComplete="off"
              autoFocus={!editing}
              style={{ ...input, height: 58, fontSize: 18, textAlign: "center", marginTop: 6 }}
            />
          </div>
        )}

        {step === 1 && (
          <div style={grid2}>
            {RELS.map(([l]) => (
              <BigOption
                key={l}
                on={rel === l}
                onClick={() => {
                  setRel(l);
                  setTimeout(() => setStep(2), 180);
                }}
              >
                {l}
              </BigOption>
            ))}
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {KINDS.map(([l], i) => (
              <BigOption
                key={l}
                on={draft.kind === i}
                onClick={() => {
                  setDraft((d) => ({ ...d, kind: i }));
                  if (i !== 3) setTimeout(() => setStep(3), 180);
                }}
              >
                {l}
              </BigOption>
            ))}
            {draft.kind === 3 && (
              <input
                aria-label="Name the occasion"
                value={draft.label}
                onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && next()}
                placeholder="e.g. Graduation, Naming ceremony"
                autoFocus
                style={{ ...input, marginTop: 4 }}
              />
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={label12}>Month</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
              {MONTHS.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    const mm = i + 1;
                    setDraft((d) => ({
                      ...d,
                      month: mm,
                      day: Math.min(d.day, daysIn(mm, d.year ?? undefined)),
                    }));
                    setMonthPicked(true);
                  }}
                  style={tile(monthPicked && draft.month === i + 1)}
                >
                  {m.slice(0, 3)}
                </button>
              ))}
            </div>
            {monthPicked && (
              <>
                <div style={{ ...label12, marginTop: 18 }}>Day</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
                  {Array.from({ length: daysIn(draft.month, draft.year ?? undefined) }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setDraft((d) => ({ ...d, day: i + 1 }));
                        setDayPicked(true);
                      }}
                      style={{
                        ...tile(dayPicked && draft.day === i + 1),
                        height: 42,
                        fontSize: 15,
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <div style={{ ...label12, marginTop: 18 }}>Year born or married (optional)</div>
                <input
                  inputMode="numeric"
                  aria-label="Year (optional)"
                  value={yearText}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                    const y = Number(v);
                    setDraft((d) => ({
                      ...d,
                      year: v.length === 4 && y > 1900 && y <= Number(today.slice(0, 4)) ? y : null,
                    }));
                    setYearText(v);
                  }}
                  placeholder="e.g. 1966"
                  style={{ ...input, width: 140 }}
                />
                <p style={{ fontSize: 13, color: C.muted, margin: "8px 0 0" }}>
                  Helps us spot milestones like a 60th.
                </p>
              </>
            )}
            {monthPicked && dayPicked && (
              <div
                style={{
                  marginTop: 18,
                  background: "#FFFFFF",
                  border: `1.5px solid ${C.line}`,
                  borderRadius: 16,
                  padding: "12px 14px",
                  fontSize: 14,
                }}
              >
                Next one: <strong>{longDate(on)}</strong>
                {milestone ? (
                  <span style={{ color: C.goldText, fontWeight: 700 }}> · {title}</span>
                ) : null}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 14, color: C.muted, margin: "0 0 4px" }}>
              Pick as many as you like. We&rsquo;ll email you each time.
            </p>
            {LEADS.map(([d, l, note]) => {
              const onL = leads.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  role="checkbox"
                  aria-checked={onL}
                  onClick={() => toggleLead(d)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    textAlign: "left",
                    padding: "14px 16px",
                    borderRadius: 16,
                    background: "#FFFFFF",
                    border: `1.5px solid ${onL ? C.plum : C.line}`,
                    cursor: "pointer",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 7,
                      flexShrink: 0,
                      border: `1.5px solid ${onL ? C.plum : C.muted}`,
                      background: onL ? C.plum : "transparent",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                      fontWeight: 700,
                    }}
                  >
                    {onL ? "✓" : ""}
                  </span>
                  <span>
                    <strong style={{ display: "block", fontSize: 15, color: C.nero }}>{l}</strong>
                    <span style={{ fontSize: 12.5, color: C.muted }}>{note}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {step === 5 && (
          <div>
            <p style={{ fontSize: 14, color: C.muted, margin: "0 0 14px" }}>
              Tap a few. We use them to suggest boxes {first}&rsquo;ll love.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[...LOVES, ...likes.filter((l) => !LOVES.includes(l))].map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={likes.includes(v)}
                  onClick={() => toggleLove(v)}
                  style={chip(likes.includes(v))}
                >
                  {v}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <input
                aria-label="Add something else they love"
                value={likeInput}
                onChange={(e) => setLikeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addLike()}
                placeholder="Something else…"
                style={{ ...input, flex: 1 }}
              />
              <button type="button" onClick={addLike} style={{ ...chip(false), minHeight: 52 }}>
                Add
              </button>
            </div>
            <button
              type="button"
              onClick={another}
              style={{
                marginTop: 22,
                background: "none",
                border: 0,
                padding: 0,
                fontWeight: 600,
                fontSize: 14,
                color: C.plum,
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              + Add another date for {first}
            </button>
            {saved.length > 0 && (
              <p style={{ fontSize: 13, color: C.muted, margin: "8px 0 0" }}>
                {saved.length + 1} dates saved for {first}.
              </p>
            )}
          </div>
        )}
      </div>

      {/* sticky actions */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          marginTop: 24,
          padding: "14px 0 calc(env(safe-area-inset-bottom,0px) + 10px)",
          background: `linear-gradient(rgba(244,239,229,0), ${C.ivory} 26%)`,
          display: "flex",
          gap: 10,
          zIndex: 5,
        }}
      >
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="a-abtn a-lg"
            style={{
              flex: "0 0 auto",
              padding: "0 20px",
              background: "#FFFFFF",
              border: `1.5px solid ${C.line}`,
            }}
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={next}
          disabled={busy}
          className="a-abtn a-lg"
          style={{
            flex: 1,
            background: ready ? C.plum : "#CFC6D1",
            color: "#FFFFFF",
            border: 0,
          }}
        >
          {busy
            ? "Saving…"
            : step === STEPS - 1
              ? `Save ${first}`
              : step === STEPS - 2
                ? "Next"
                : "Continue"}
        </button>
      </div>
      {editing && step < STEPS - 1 && (
        <button
          type="button"
          onClick={() => void save()}
          style={{
            background: "none",
            border: 0,
            fontSize: 14,
            fontWeight: 600,
            color: C.plum,
            textDecoration: "underline",
            marginTop: 4,
            cursor: "pointer",
          }}
        >
          Save changes now
        </button>
      )}
    </div>
  );
}

function BigOption({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      style={{
        minHeight: 56,
        padding: "0 18px",
        borderRadius: 16,
        textAlign: "left",
        background: on ? C.plum : "#FFFFFF",
        color: on ? "#FFFFFF" : C.nero,
        border: `1.5px solid ${on ? C.plum : C.line}`,
        font: "600 16px 'Parkinsans','Segoe UI',system-ui,sans-serif",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

const grid2: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };
const label12: CSSProperties = {
  fontSize: 12,
  letterSpacing: ".16em",
  fontWeight: 700,
  color: C.goldText,
  textTransform: "uppercase",
  marginBottom: 8,
};
const tile = (on: boolean): CSSProperties => ({
  height: 48,
  borderRadius: 12,
  border: `1.5px solid ${on ? C.plum : C.line}`,
  background: on ? C.plum : "#FFFFFF",
  color: on ? "#FFFFFF" : C.nero,
  font: "600 15px 'Parkinsans','Segoe UI',system-ui,sans-serif",
  cursor: "pointer",
  padding: 0,
});

const input = {
  width: "100%",
  boxSizing: "border-box",
  height: 52,
  border: `1.5px solid ${C.line}`,
  borderRadius: 14,
  background: "#FFFFFF",
  padding: "0 14px",
  font: "500 16px 'Parkinsans','Segoe UI',system-ui,sans-serif",
  color: C.nero,
} as const;
