import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { addPerson, nextOccurrence, todayIso, updatePerson } from "@/services/calendar";
import type { Person, PersonalDate, PersonalDateType, Relationship } from "@/types/calendar";
import {
  C,
  LEAD_CHOICES,
  NativeDate,
  chip,
  defaultLeadStore,
  isMilestone,
  leadLabel,
  longDate,
  occasionTitle,
} from "./kit";

/**
 * 1.5 Add a person and their dates, in two short screens.
 * Screen 1: name, who they are, the first occasion (phone date picker, any number of reminders).
 * Screen 2 (optional): more occasions and what they love. Editing opens straight on screen 2.
 */

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

type Kind = "birthday" | "anniversary" | "other";
type Sub = "wedding" | "work" | "else";
const KINDS: [Kind, string][] = [
  ["birthday", "Birthday"],
  ["anniversary", "Anniversary"],
  ["other", "Something else"],
];
const SUBS: [Sub, string][] = [
  ["wedding", "Wedding"],
  ["work", "Work"],
  ["else", "Other"],
];

interface Draft {
  id: string;
  kind: Kind;
  sub: Sub;
  text: string;
  iso: string;
  noYear: boolean;
  leads: number[];
}
type SavedDate = Omit<PersonalDate, "personId">;

const today = todayIso();
const thisYear = Number(today.slice(0, 4));
const pad = (n: number) => String(n).padStart(2, "0");
const newId = () => Math.random().toString(36).slice(2, 10);
const blank = (leads: number[]): Draft => ({
  id: newId(),
  kind: "birthday",
  sub: "wedding",
  text: "",
  iso: "",
  noYear: false,
  leads,
});

function labelOf(d: Draft) {
  if (d.kind === "birthday") return "Birthday";
  if (d.kind === "other") return d.text.trim();
  if (d.sub === "wedding") return "Wedding anniversary";
  if (d.sub === "work") return "Work anniversary";
  const t = d.text.trim();
  return !t ? "" : /anniversary$/i.test(t) ? t : `${t} anniversary`;
}

/** Check a draft and turn it into a saved date, or return what's missing. */
function toDate(d: Draft): SavedDate | string {
  const label = labelOf(d);
  if (!label) return d.kind === "other" ? "Name the occasion." : "Say what the anniversary is for.";
  if (!d.iso) return "Pick the date.";
  if (!d.leads.length) return "Choose at least one reminder.";
  const year = Number(d.iso.slice(0, 4));
  const keepYear = d.kind !== "other" && !d.noYear;
  if (keepYear && year > thisYear) return "That year is still to come. Check the date.";
  const type: PersonalDateType =
    d.kind === "birthday" ? "birthday" : d.kind === "anniversary" ? "anniversary" : "custom";
  return {
    id: d.id,
    type,
    label,
    day: Number(d.iso.slice(8, 10)),
    month: Number(d.iso.slice(5, 7)),
    ...(keepYear ? { year } : {}),
    daysBefore: [...d.leads].sort((a, b) => b - a),
  };
}

function fromDate(d: PersonalDate, fallbackLeads: number[]): Draft {
  const anniv = d.type === "anniversary" || /anniversary$/i.test(d.label);
  const kind: Kind = d.type === "birthday" ? "birthday" : anniv ? "anniversary" : "other";
  const sub: Sub = /^wedding anniversary$|^anniversary$/i.test(d.label)
    ? "wedding"
    : /^work anniversary$/i.test(d.label)
      ? "work"
      : "else";
  return {
    id: d.id,
    kind,
    sub,
    text:
      kind === "other" ? d.label : sub === "else" ? d.label.replace(/\s*anniversary$/i, "") : "",
    iso: `${d.year ?? thisYear}-${pad(d.month)}-${pad(d.day)}`,
    noYear: !d.year,
    leads: d.daysBefore?.length ? d.daysBefore : fallbackLeads,
  };
}

const titleFor = (d: SavedDate) => {
  const t = occasionTitle(d.label, d.type, d.year, nextOccurrence(d, today));
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export function PersonForm({
  editing,
  startAdding,
  onSaved,
}: {
  editing?: Person | undefined;
  /** Open with a fresh occasion ready to fill (from "+ Add occasion" on the person page). */
  startAdding?: boolean;
  onSaved: (p: Person) => void;
}) {
  const defaultLead = useSyncExternalStore(
    defaultLeadStore.subscribe,
    defaultLeadStore.get,
    defaultLeadStore.server,
  );
  const personLeads = editing?.reminder.daysBefore.length
    ? editing.reminder.daysBefore
    : [defaultLead];

  const [step, setStep] = useState<1 | 2>(editing ? 2 : 1);
  const [name, setName] = useState(editing?.name ?? "");
  const [photo, setPhoto] = useState<string | undefined>(editing?.photo);
  const [rel, setRel] = useState<string>(() =>
    editing ? (RELS.find(([, r]) => r === editing.relationship)?.[0] ?? "Friend") : "",
  );
  const [dates, setDates] = useState<SavedDate[]>(() =>
    (editing?.dates ?? []).map(({ personId: _p, ...d }) => ({
      ...d,
      daysBefore: d.daysBefore?.length ? d.daysBefore : personLeads,
    })),
  );
  /** The occasion being filled in. On screen 2 it is null until "+ Add another occasion" or Edit. */
  const [draft, setDraft] = useState<Draft | null>(() =>
    !editing || startAdding ? blank([defaultLead]) : null,
  );
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
  const editorRef = useRef<HTMLDivElement>(null);
  // Coming from "+ Add an occasion": bring the new occasion into view.
  useEffect(() => {
    if (editing && startAdding)
      setTimeout(
        () => editorRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }),
        150,
      );
  }, [editing, startAdding]);

  const first = name.trim().split(" ")[0] || "them";
  const who = name.trim() ? first : "them";

  const checkPerson = () => {
    if (!name.trim()) return (toast.error("Add their name."), false);
    if (!rel) return (toast.error(`Choose who ${first} is to you.`), false);
    return true;
  };

  /** Put the draft into the list. Returns the updated list, or null if something is missing. */
  const commitDraft = (): SavedDate[] | null => {
    if (!draft) return dates;
    const d = toDate(draft);
    if (typeof d === "string") {
      toast.error(d);
      return null;
    }
    const next = dates.some((x) => x.id === d.id)
      ? dates.map((x) => (x.id === d.id ? d : x))
      : [...dates, d];
    setDates(next);
    setDraft(null);
    return next;
  };

  const save = async (list: SavedDate[]) => {
    if (!checkPerson()) return;
    if (!list.length) {
      toast.error("Add at least one occasion.");
      return;
    }
    setBusy(true);
    const relationship = RELS.find(([l]) => l === rel)![1];
    const notes = {
      likes: likes.join(", "),
      dislikes: editing?.notes.dislikes ?? "",
      sizes: editing?.notes.sizes ?? "",
      noAlcohol: editing?.notes.noAlcohol ?? false,
      budget: editing?.notes.budget ?? 0,
    };
    // Every lead time in use, kept on the person too so older reminder emails still work.
    const reminder = {
      daysBefore: [...new Set(list.flatMap((d) => d.daysBefore ?? []))].sort((a, b) => b - a),
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
          dates: list.map((x) => ({ ...x, personId: editing.id })),
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
          dates: list.map(({ id: _i, ...x }) => x),
        });
        onSaved(p);
      }
    } catch {
      toast.error("We couldn't save that. Please try again.");
      setBusy(false);
    }
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

  const personFields = (
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
    </>
  );

  /* ---------- Screen 1 ---------- */
  if (step === 1) {
    return (
      <>
        <StepDots step={1} />
        {personFields}
        {draft && <OccasionEditor draft={draft} setDraft={setDraft} who={who} />}
        <div style={{ flex: 1, minHeight: 24 }} />
        <button
          type="button"
          className="a-abtn a-lg a-ink"
          disabled={busy}
          style={{ marginTop: 24, opacity: busy ? 0.6 : 1 }}
          onClick={() => {
            if (!checkPerson()) return;
            const list = commitDraft();
            if (list) void save(list);
          }}
        >
          Save {name.trim() ? first : "person"}
        </button>
        <button
          type="button"
          className="a-abtn a-lg a-line"
          style={{ marginTop: 10 }}
          onClick={() => {
            if (!checkPerson()) return;
            if (commitDraft()) {
              setStep(2);
              window.scrollTo({ top: 0 });
            }
          }}
        >
          + Add another occasion or what {who} loves
        </button>
      </>
    );
  }

  /* ---------- Screen 2 ---------- */
  return (
    <>
      {!editing && <StepDots step={2} />}
      {editing && personFields}

      <Section title={`${name.trim() ? first + "'s" : "Their"} occasions`}>
        {dates.length === 0 && !draft && (
          <p style={{ margin: 0, fontSize: 13, color: C.muted }}>
            No occasions yet. Add one below.
          </p>
        )}
        {dates.map((d) =>
          draft?.id === d.id ? null : (
            <div
              key={d.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "#FFFFFF",
                border: `1.5px solid ${C.line}`,
                borderRadius: 16,
                padding: "12px 14px",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: 15 }}>{titleFor(d)}</strong>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                  {longDate(nextOccurrence(d, today)).replace(/^\w+ /, "")}
                  {" · "}
                  {(d.daysBefore ?? []).length === 1 ? "Reminder " : "Reminders "}
                  {(d.daysBefore ?? []).map(leadLabel).join(", ")} before
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (draft && !commitDraft()) return;
                  setDraft(fromDate({ ...d, personId: "" }, personLeads));
                }}
                style={smallBtn}
              >
                Edit
              </button>
              <button
                type="button"
                aria-label={`Remove ${d.label}`}
                onClick={() => setDates((x) => x.filter((y) => y.id !== d.id))}
                style={{ ...smallBtn, width: 36, padding: 0 }}
              >
                ×
              </button>
            </div>
          ),
        )}
        {draft ? (
          <div
            ref={editorRef}
            style={{
              scrollMarginTop: 16,
              background: "#FFFFFF",
              border: `1.5px solid ${C.gold}`,
              borderRadius: 20,
              padding: "4px 14px 14px",
            }}
          >
            <OccasionEditor draft={draft} setDraft={setDraft} who={who} />
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                type="button"
                className="a-abtn a-line"
                style={{ flex: 1 }}
                onClick={() => setDraft(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="a-abtn a-ink"
                style={{ flex: 2 }}
                onClick={() => commitDraft()}
              >
                {dates.some((x) => x.id === draft.id) ? "Update occasion" : "Add occasion"}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setDraft(blank([defaultLead]))}
            style={{
              minHeight: 52,
              borderRadius: 16,
              border: `1.5px dashed ${C.goldText}`,
              background: "transparent",
              font: "600 14px 'Parkinsans',system-ui,sans-serif",
              color: C.nero,
              cursor: "pointer",
            }}
          >
            + Add another occasion for {who}
          </button>
        )}
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
                height: 36,
                borderRadius: 999,
                border: `1.5px solid ${C.nero}`,
                padding: "0 12px",
                font: "500 16px 'Parkinsans',sans-serif",
                width: 170,
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
          Optional. We use this to suggest boxes {who}&rsquo;ll love.
        </div>
      </Section>

      <div style={{ flex: 1, minHeight: 24 }} />
      <button
        type="button"
        className="a-abtn a-lg a-ink"
        disabled={busy}
        style={{ marginTop: 24, opacity: busy ? 0.6 : 1 }}
        onClick={() => {
          // An open occasion with nothing picked yet is simply dropped.
          if (draft && !draft.iso && !draft.text.trim()) {
            setDraft(null);
            void save(dates);
            return;
          }
          const list = commitDraft();
          if (list) void save(list);
        }}
      >
        {editing ? "Save changes" : "Done"}
      </button>
      {!editing && (
        <button
          type="button"
          onClick={() => setStep(1)}
          style={{
            margin: "14px auto 0",
            background: "none",
            border: 0,
            font: "500 14px 'Parkinsans',sans-serif",
            color: C.muted,
            cursor: "pointer",
          }}
        >
          Back
        </button>
      )}
    </>
  );
}

/* ---------- One occasion: kind, date, reminders ---------- */
function OccasionEditor({
  draft,
  setDraft,
  who,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  who: string;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customDays, setCustomDays] = useState("");
  const set = (p: Partial<Draft>) => setDraft({ ...draft, ...p });
  const label = labelOf(draft);
  const preview = (() => {
    if (!draft.iso) return null;
    const on = nextOccurrence(
      { day: Number(draft.iso.slice(8, 10)), month: Number(draft.iso.slice(5, 7)) },
      today,
    );
    const keepYear = draft.kind !== "other" && !draft.noYear;
    const type: PersonalDateType =
      draft.kind === "birthday"
        ? "birthday"
        : draft.kind === "anniversary"
          ? "anniversary"
          : "custom";
    const title = occasionTitle(
      label || "Occasion",
      type,
      keepYear ? Number(draft.iso.slice(0, 4)) : undefined,
      on,
    );
    return { on, title, milestone: isMilestone(title) };
  })();
  const toggleLead = (n: number) =>
    set({
      leads: draft.leads.includes(n) ? draft.leads.filter((x) => x !== n) : [...draft.leads, n],
    });
  const extraLeads = draft.leads.filter((n) => !LEAD_CHOICES.some(([d]) => d === n));

  return (
    <>
      <Section title="The occasion">
        <div
          role="group"
          aria-label="Occasion"
          style={{ display: "flex", gap: 4, background: C.line, borderRadius: 16, padding: 4 }}
        >
          {KINDS.map(([k, l]) => {
            const on = draft.kind === k;
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                onClick={() => set({ kind: k, text: "" })}
                style={{
                  flex: 1,
                  minHeight: 46,
                  border: 0,
                  borderRadius: 12,
                  background: on ? "#FFFFFF" : "transparent",
                  boxShadow: on ? "0 2px 8px rgba(41,40,40,.12)" : "none",
                  color: C.nero,
                  font: `${on ? 700 : 500} 13px 'Parkinsans',system-ui,sans-serif`,
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
        {draft.kind === "anniversary" && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SUBS.map(([s, l]) => (
              <button
                key={s}
                type="button"
                aria-pressed={draft.sub === s}
                onClick={() => set({ sub: s, text: "" })}
                style={chip(draft.sub === s)}
              >
                {l}
              </button>
            ))}
          </div>
        )}
        {(draft.kind === "other" || (draft.kind === "anniversary" && draft.sub === "else")) && (
          <input
            aria-label={
              draft.kind === "other" ? "Name the occasion" : "What is the anniversary for?"
            }
            value={draft.text}
            onChange={(e) => set({ text: e.target.value })}
            placeholder={
              draft.kind === "other"
                ? "Graduation, naming ceremony…"
                : "Business launch, first date…"
            }
            style={input}
          />
        )}
      </Section>

      <Section title="The date">
        <NativeDate
          value={draft.iso}
          onChange={(iso) => set({ iso })}
          label="The date"
          {...(draft.kind === "other" || draft.noYear ? {} : { max: today })}
          showYear={draft.kind !== "other" && !draft.noYear}
        />
        {draft.kind !== "other" && (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              color: C.muted,
              cursor: "pointer",
              minHeight: 32,
            }}
          >
            <input
              type="checkbox"
              checked={draft.noYear}
              onChange={(e) => set({ noYear: e.target.checked })}
              style={{ width: 20, height: 20, accentColor: C.plum }}
            />
            I don&rsquo;t know the year
          </label>
        )}
        {preview && (
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              border: `1.5px solid ${preview.milestone ? C.gold : C.line}`,
              background: preview.milestone ? "rgba(231,185,59,.10)" : "transparent",
              borderRadius: 14,
              padding: "10px 14px",
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            <span>
              Next:{" "}
              <strong>{preview.title.charAt(0).toUpperCase() + preview.title.slice(1)}</strong> on{" "}
              {longDate(preview.on)}
              {preview.milestone ? ". A milestone worth marking." : ""}
            </span>
          </div>
        )}
      </Section>

      <Section title="Remind me">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {LEAD_CHOICES.map(([d, l]) => (
            <button
              key={d}
              type="button"
              aria-pressed={draft.leads.includes(d)}
              onClick={() => toggleLead(d)}
              style={chip(draft.leads.includes(d))}
            >
              {l}
            </button>
          ))}
          {extraLeads.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed
              onClick={() => toggleLead(d)}
              style={chip(true)}
            >
              {leadLabel(d)} ×
            </button>
          ))}
          {customOpen ? (
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <input
                autoFocus
                inputMode="numeric"
                aria-label="Days before"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder="10"
                style={{ ...input, width: 70, height: 44, textAlign: "center" }}
              />
              <span style={{ fontSize: 13 }}>days</span>
              <button
                type="button"
                style={chip(false)}
                onClick={() => {
                  const n = Number(customDays);
                  if (n >= 1 && n <= 365 && !draft.leads.includes(n))
                    set({ leads: [...draft.leads, n] });
                  setCustomDays("");
                  setCustomOpen(false);
                }}
              >
                Add
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setCustomOpen(true)}
              style={{
                ...chip(false),
                border: `1.5px dashed ${C.muted}`,
                background: "transparent",
              }}
            >
              + Other
            </button>
          )}
        </div>
        <div style={{ fontSize: 12, color: C.muted }}>
          {draft.leads.length
            ? `We'll email you ${[...draft.leads]
                .sort((a, b) => b - a)
                .map(leadLabel)
                .join(", ")} before, so there's time to choose a box for ${who}.`
            : "Tap as many as you like."}
        </div>
      </Section>
    </>
  );
}

function StepDots({ step }: { step: 1 | 2 }) {
  return (
    <div
      aria-label={`Step ${step} of 2`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginTop: 14,
        fontSize: 12,
        color: C.muted,
      }}
    >
      {[1, 2].map((n) => (
        <span
          key={n}
          style={{
            width: n === step ? 22 : 8,
            height: 8,
            borderRadius: 999,
            background: n <= step ? C.plum : C.line,
            transition: "width .2s",
          }}
        />
      ))}
      <span style={{ marginLeft: 4 }}>
        {step === 1 ? "Step 1 of 2 · the essentials" : "Step 2 of 2 · optional"}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="a-eye">{title}</div>
      {children}
    </div>
  );
}

const smallBtn = {
  minHeight: 36,
  padding: "0 12px",
  borderRadius: 999,
  border: `1.5px solid ${C.line}`,
  background: "#FFFFFF",
  font: "600 13px 'Parkinsans',system-ui,sans-serif",
  color: C.nero,
  cursor: "pointer",
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
