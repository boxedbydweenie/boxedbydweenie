import { useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { addPerson, nextOccurrence, todayIso, updatePerson } from "@/services/calendar";
import type { Person, PersonalDateType, Relationship } from "@/types/calendar";
import { C, chip, defaultLeadStore, isMilestone, longDate, occasionTitle } from "./kit";

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
  ["Other", "custom", ""],
];
const LEADS: [number, string, string][] = [
  [3, "3 days", "Best for vouchers and same-week Lagos delivery."],
  [7, "1 week", "Enough time for most boxes in Lagos and Abuja."],
  [14, "2 weeks", "Recommended. Time to choose, personalise and deliver."],
  [30, "1 month", "Ideal for branded or custom boxes."],
];
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
  const [lead, setLead] = useState(editing?.reminder.daysBefore[0] ?? defaultLead);
  const [likes, setLikes] = useState<string[]>(() =>
    (editing?.notes.likes ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const [likeInput, setLikeInput] = useState("");
  const [addingLike, setAddingLike] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const first = name.trim().split(" ")[0] || "them";
  const kind = KINDS[draft.kind]!;
  const label = draft.kind === 3 ? draft.label.trim() : kind[2];
  const on = nextOccurrence({ day: draft.day, month: draft.month }, today);
  const title = occasionTitle(label || "Date", kind[1], draft.year ?? undefined, on);
  const milestone = draft.year && isMilestone(title) ? title.split(" ")[0] : null;
  const leadNote = LEADS.find(([d]) => d === lead)?.[2] ?? "";

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
    setAddingLike(false);
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
      daysBefore: [lead],
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

  return (
    <>
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 20 }}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Add a photo (optional)"
          style={{
            width: 76,
            height: 76,
            borderRadius: "50%",
            background: C.sage,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            flexShrink: 0,
            border: 0,
            cursor: "pointer",
            padding: 0,
            color: C.nero,
          }}
        >
          {photo ? (
            <img
              src={photo}
              alt=""
              style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <span
              style={{ fontFamily: "'EB Garamond',Georgia,serif", fontWeight: 500, fontSize: 34 }}
            >
              {name.trim().slice(0, 1).toUpperCase() || "+"}
            </span>
          )}
          <span
            style={{
              position: "absolute",
              right: -2,
              bottom: -2,
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: C.nero,
              color: C.gold,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `3px solid ${C.ivory}`,
            }}
          >
            <svg
              className="a-ico"
              style={{ width: 15, height: 15 }}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => e.target.files?.[0] && pickPhoto(e.target.files[0])}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <label
            htmlFor="ap-name"
            style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}
          >
            Their name
          </label>
          <input
            id="ap-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mama"
            autoComplete="off"
            style={input}
          />
        </div>
      </div>

      <Section title="They are your">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {RELS.map(([l]) => (
            <button
              key={l}
              type="button"
              aria-pressed={rel === l}
              onClick={() => setRel(l)}
              style={chip(rel === l)}
            >
              {l}
            </button>
          ))}
        </div>
      </Section>

      <Section title="The occasion">
        <div
          role="group"
          aria-label="Occasion"
          style={{ display: "flex", gap: 4, background: C.line, borderRadius: 16, padding: 4 }}
        >
          {KINDS.map(([l], i) => {
            const onK = draft.kind === i;
            return (
              <button
                key={l}
                type="button"
                aria-pressed={onK}
                onClick={() => setDraft((d) => ({ ...d, kind: i }))}
                style={{
                  flex: 1,
                  minHeight: 46,
                  border: 0,
                  borderRadius: 12,
                  background: onK ? "#FFFFFF" : "transparent",
                  boxShadow: onK ? "0 2px 8px rgba(41,40,40,.12)" : "none",
                  color: C.nero,
                  font: `${onK ? 700 : 500} 13px 'Parkinsans',system-ui,sans-serif`,
                  cursor: "pointer",
                  padding: "6px 4px",
                  lineHeight: 1.2,
                }}
              >
                {l}
              </button>
            );
          })}
        </div>
        {draft.kind === 3 && (
          <input
            aria-label="Name the occasion"
            value={draft.label}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
            placeholder="e.g. Graduation, Naming ceremony"
            style={{ ...input, marginTop: 4 }}
          />
        )}
      </Section>

      <div
        style={{
          marginTop: 18,
          background: "#FFFFFF",
          borderRadius: 20,
          border: `1.5px solid ${C.line}`,
          padding: "16px 14px",
          position: "relative",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            top: 62,
            height: 46,
            borderRadius: 12,
            background: C.ivory,
          }}
        />
        <div style={{ display: "flex", position: "relative" }}>
          <Wheel
            label="Day"
            values={Array.from(
              { length: daysIn(draft.month, draft.year ?? undefined) },
              (_, i) => i + 1,
            )}
            value={draft.day}
            onChange={(day) => setDraft((d) => ({ ...d, day }))}
          />
          <Wheel
            wide
            label="Month"
            values={MONTHS.map((_, i) => i + 1)}
            value={draft.month}
            format={(m) => MONTHS[m - 1]!}
            onChange={(month) =>
              setDraft((d) => ({
                ...d,
                month,
                day: Math.min(d.day, daysIn(month, d.year ?? undefined)),
              }))
            }
          />
          <Wheel
            label="Year"
            values={[0, ...Array.from({ length: 101 }, (_, i) => Number(today.slice(0, 4)) - i)]}
            value={draft.year ?? 0}
            format={(y) => (y ? String(y) : "—")}
            onChange={(y) => setDraft((d) => ({ ...d, year: y || null }))}
          />
        </div>
        {milestone && (
          <div
            style={{
              marginTop: 14,
              display: "flex",
              gap: 12,
              alignItems: "center",
              border: `1.5px solid ${C.gold}`,
              borderRadius: 14,
              padding: "12px 14px",
              position: "relative",
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
                fontSize: 18,
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              {parseInt(milestone, 10)}
            </span>
            <span style={{ fontSize: 13, lineHeight: 1.45 }}>
              {kind[1] === "birthday"
                ? `${first} turns ${parseInt(milestone, 10)} on ${longDate(on)}. A milestone worth marking.`
                : `${parseInt(milestone, 10)} years on ${longDate(on)}. A milestone worth marking.`}
            </span>
          </div>
        )}
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            color: C.muted,
            textAlign: "center",
            position: "relative",
          }}
        >
          The year is optional. It helps us spot milestones.
        </div>
      </div>

      {saved.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {saved.map((d) => (
            <span key={d.id} className="a-pill" style={{ background: C.sage, gap: 6 }}>
              {d.label} · {d.day} {MONTHS[d.month - 1]!.slice(0, 3)}
              <button
                type="button"
                aria-label={`Remove ${d.label}`}
                onClick={() => setSaved((s) => s.filter((x) => x.id !== d.id))}
                style={{
                  border: 0,
                  background: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  padding: 0,
                  color: C.nero,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <Section title="Remind me">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {LEADS.map(([d, l]) => (
            <button
              key={d}
              type="button"
              aria-pressed={lead === d}
              onClick={() => setLead(d)}
              style={chip(lead === d)}
            >
              {l}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: C.muted }}>{leadNote}</div>
      </Section>

      <Section title={`What ${name.trim() ? first : "they"} love${name.trim() ? "s" : ""}`}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {likes.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLikes((x) => x.filter((y) => y !== l))}
              aria-label={`Remove ${l}`}
              className="a-pill"
              style={{
                background: C.coral,
                minHeight: 32,
                fontSize: 13,
                border: 0,
                cursor: "pointer",
              }}
            >
              {l} ×
            </button>
          ))}
          {addingLike ? (
            <input
              autoFocus
              aria-label="Something they love"
              value={likeInput}
              onChange={(e) => setLikeInput(e.target.value)}
              onBlur={addLike}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addLike();
                  setAddingLike(true);
                }
              }}
              placeholder="Tea, lace, gold…"
              style={{
                height: 32,
                borderRadius: 999,
                border: `1.5px solid ${C.nero}`,
                padding: "0 12px",
                font: "500 13px 'Parkinsans',sans-serif",
                width: 150,
                outline: "none",
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setAddingLike(true)}
              className="a-pill"
              style={{
                border: `1.5px dashed ${C.muted}`,
                background: "transparent",
                minHeight: 32,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              + Add
            </button>
          )}
        </div>
        <div style={{ fontSize: 12, color: C.muted }}>
          We use this to suggest boxes {name.trim() ? first : "they"}&rsquo;ll love.
        </div>
      </Section>

      <div style={{ flex: 1, minHeight: 20 }} />
      <button
        type="button"
        onClick={addAnother}
        style={{
          textAlign: "center",
          fontSize: 14,
          fontWeight: 600,
          margin: "22px 0 14px",
          background: "none",
          border: 0,
          cursor: "pointer",
          color: C.nero,
        }}
      >
        + Add another date for {name.trim() ? first : "them"}
      </button>
      <button
        type="button"
        className="a-abtn a-lg a-ink"
        disabled={busy}
        onClick={save}
        style={{ opacity: busy ? 0.6 : 1 }}
      >
        {editing ? "Save changes" : `Save ${name.trim() ? first : "person"}`}
      </button>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="a-eye">{title}</div>
      {children}
    </div>
  );
}

/** A three-row date wheel: tap the row above or below (or use the arrow keys) to change the value. */
function Wheel({
  label,
  values,
  value,
  onChange,
  format = String,
  wide,
}: {
  label: string;
  values: number[];
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  wide?: boolean;
}) {
  const i = Math.max(0, values.indexOf(value));
  const prev = values[i - 1],
    next = values[i + 1];
  const step = (d: number) => {
    const v = values[i + d];
    if (v !== undefined) onChange(v);
  };
  return (
    <div
      role="spinbutton"
      tabIndex={0}
      aria-label={label}
      aria-valuenow={value}
      aria-valuetext={format(value)}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          step(-1);
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          step(1);
        }
      }}
      onWheel={(e) => step(e.deltaY > 0 ? 1 : -1)}
      style={{
        flex: wide ? 1.7 : 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        fontVariantNumeric: "tabular-nums",
        outlineOffset: 2,
        borderRadius: 12,
      }}
    >
      <span style={{ fontSize: 11, letterSpacing: ".2em", color: C.goldText, fontWeight: 600 }}>
        {label.toUpperCase()}
      </span>
      <button type="button" tabIndex={-1} onClick={() => step(-1)} style={wheelBtn}>
        {prev !== undefined ? format(prev) : " "}
      </button>
      <strong
        style={{
          fontFamily: "'EB Garamond',Georgia,serif",
          fontSize: 26,
          fontWeight: 500,
          lineHeight: 1,
          minHeight: 28,
          whiteSpace: "nowrap",
        }}
      >
        {format(value)}
      </strong>
      <button type="button" tabIndex={-1} onClick={() => step(1)} style={wheelBtn}>
        {next !== undefined ? format(next) : " "}
      </button>
    </div>
  );
}

const wheelBtn = {
  fontSize: 15,
  color: C.muted,
  background: "none",
  border: 0,
  cursor: "pointer",
  minHeight: 22,
  padding: 0,
  font: "400 15px 'Parkinsans',sans-serif",
  whiteSpace: "nowrap",
} as const;
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
