import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  SENDER_RELS,
  inviteName,
  submitSharedDates,
  type SharedDateInput,
} from "@/services/sharedDates";
import { C, NativeDate, chip } from "@/components/app/kit";

/**
 * Public page behind someone's "Add your dates" link. No account needed: the visitor adds their own
 * birthday and anniversaries, and they appear in the link owner's Gift Calendar.
 */
export const Route = createFileRoute("/app/add/$code")({
  head: () => ({
    meta: [
      { title: "Add your special days — Boxed by Dweenie Gift Calendar" },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Add your special days" },
      {
        property: "og:description",
        content: "Someone wants to remember your birthday and anniversaries. It takes a minute.",
      },
    ],
  }),
  component: AddDates,
});

type Kind = "birthday" | "wedding" | "work" | "other";
const KINDS: [Kind, string][] = [
  ["birthday", "Birthday"],
  ["wedding", "Wedding anniversary"],
  ["work", "Work anniversary"],
  ["other", "Something else"],
];
interface Entry {
  id: string;
  kind: Kind;
  text: string;
  iso: string;
  noYear: boolean;
}
const newEntry = (kind: Kind): Entry => ({
  id: Math.random().toString(36).slice(2),
  kind,
  text: "",
  iso: "",
  noYear: kind === "birthday",
});
const today = new Date().toISOString().slice(0, 10);

function AddDates() {
  const { code } = Route.useParams();
  const [owner, setOwner] = useState<string | null | undefined>(undefined);
  const [loadErr, setLoadErr] = useState("");
  const [name, setName] = useState("");
  const [rel, setRel] = useState("");
  const [entries, setEntries] = useState<Entry[]>([newEntry("birthday")]);
  const [likes, setLikes] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    inviteName(code)
      .then(setOwner)
      .catch((e: Error) => {
        setLoadErr(e.message);
        setOwner(null);
      });
  }, [code]);

  const set = (id: string, p: Partial<Entry>) =>
    setEntries((list) => list.map((e) => (e.id === id ? { ...e, ...p } : e)));

  const submit = async () => {
    setErr("");
    if (!name.trim()) return setErr("Add your name.");
    const filled = entries.filter((e) => e.iso);
    if (!filled.length) return setErr("Pick at least one date.");
    if (filled.some((e) => e.kind === "other" && !e.text.trim()))
      return setErr("Name each 'something else' occasion.");
    const dates: SharedDateInput[] = filled.map((e) => {
      const year = Number(e.iso.slice(0, 4));
      const keepYear = e.kind !== "other" && !e.noYear && e.iso <= today;
      return {
        type: e.kind === "birthday" ? "birthday" : e.kind === "other" ? "custom" : "anniversary",
        label:
          e.kind === "birthday"
            ? "Birthday"
            : e.kind === "wedding"
              ? "Wedding anniversary"
              : e.kind === "work"
                ? "Work anniversary"
                : e.text.trim().slice(0, 60),
        day: Number(e.iso.slice(8, 10)),
        month: Number(e.iso.slice(5, 7)),
        ...(keepYear ? { year } : {}),
      };
    });
    setBusy(true);
    try {
      await submitSharedDates({
        code,
        name: name.trim(),
        relationship: rel,
        dates,
        likes: likes.trim(),
      });
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "We couldn't save your dates. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const shell = (children: React.ReactNode) => (
    <div
      className="a-top-pattern"
      style={{
        padding: "calc(env(safe-area-inset-top,0px) + 26px) 22px 36px",
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        boxSizing: "border-box",
      }}
    >
      <img
        src="/brand/logo-primary.svg"
        alt="Boxed by Dweenie"
        style={{ height: 34, width: "auto", alignSelf: "center" }}
      />
      {children}
    </div>
  );

  if (owner === undefined) return shell(<div style={{ flex: 1 }} />);
  if (!owner)
    return shell(
      <div style={{ textAlign: "center", marginTop: 60 }}>
        <h1 className="a-dsp" style={{ fontSize: 32 }}>
          {loadErr ? "Something went wrong" : "This link isn't working"}
        </h1>
        <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.55 }}>
          {loadErr || "Ask the person who sent it for a fresh link."}
        </p>
      </div>,
    );

  if (done)
    return shell(
      <div style={{ textAlign: "center", marginTop: 44 }}>
        <img src="/brand/bow-gold.svg" alt="" style={{ width: 84, height: "auto" }} />
        <h1 className="a-dsp" style={{ fontSize: 38, marginTop: 18 }}>
          Thank you,{" "}
          <span className="a-name" style={{ color: C.goldText }}>
            {name.split(" ")[0]}
          </span>
        </h1>
        <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.6, margin: "12px 0 0" }}>
          Your dates are with {owner} now. They&rsquo;ll get a reminder before each one.
        </p>
        <div
          style={{
            marginTop: 30,
            background: C.plum,
            color: "#FFFFFF",
            borderRadius: 24,
            padding: "22px 20px",
            textAlign: "left",
          }}
        >
          <div className="a-dsp" style={{ fontSize: 26, color: "#FFFFFF" }}>
            Never miss a date <span style={{ color: C.gold }}>yourself.</span>
          </div>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.55,
              color: "rgba(255,255,255,.82)",
              margin: "8px 0 16px",
            }}
          >
            Get your own free Gift Calendar: birthdays, anniversaries and every holiday, with a gift
            ready in time.
          </p>
          <Link to="/app/signin" className="a-abtn a-lg a-gold" style={{ width: "100%" }}>
            Create my calendar
          </Link>
        </div>
      </div>,
    );

  return shell(
    <>
      <h1 className="a-dsp" style={{ fontSize: 36, marginTop: 28, textAlign: "center" }}>
        <span className="a-name" style={{ color: C.goldText }}>
          {owner}
        </span>{" "}
        wants to remember your special days.
      </h1>
      <p
        style={{
          fontSize: 15,
          color: C.muted,
          lineHeight: 1.55,
          textAlign: "center",
          margin: "10px 0 0",
        }}
      >
        Add your birthday and anniversaries. It takes a minute, and only {owner} will see them.
      </p>

      <Section title="Your name">
        <input
          aria-label="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First and last name"
          autoComplete="name"
          style={input}
        />
      </Section>

      <Section title={`You are ${owner}'s`}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SENDER_RELS.map(([l]) => (
            <button
              key={l}
              type="button"
              aria-pressed={rel === l}
              onClick={() => setRel(rel === l ? "" : l)}
              style={chip(rel === l)}
            >
              {l}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Your special days">
        {entries.map((e, i) => (
          <div
            key={e.id}
            style={{
              background: "#FFFFFF",
              border: `1.5px solid ${C.line}`,
              borderRadius: 20,
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <strong style={{ fontSize: 15 }}>{KINDS.find(([k]) => k === e.kind)![1]}</strong>
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => setEntries((l) => l.filter((x) => x.id !== e.id))}
                  style={{
                    border: 0,
                    background: "none",
                    color: C.muted,
                    font: "600 13px 'Parkinsans',sans-serif",
                    cursor: "pointer",
                    minHeight: 32,
                  }}
                >
                  Remove
                </button>
              )}
            </div>
            {e.kind === "other" && (
              <input
                aria-label="Name the occasion"
                value={e.text}
                onChange={(ev) => set(e.id, { text: ev.target.value })}
                placeholder="Graduation, naming ceremony…"
                style={input}
              />
            )}
            <NativeDate
              value={e.iso}
              onChange={(iso) => set(e.id, { iso })}
              label={`Date of ${KINDS.find(([k]) => k === e.kind)![1]}`}
              showYear={e.kind !== "other" && !e.noYear}
            />
            {e.kind !== "other" && (
              <label
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  fontSize: 13,
                  color: C.muted,
                }}
              >
                <input
                  type="checkbox"
                  checked={e.noYear}
                  onChange={(ev) => set(e.id, { noYear: ev.target.checked })}
                  style={{ width: 20, height: 20, accentColor: C.plum }}
                />
                Keep the year private
              </label>
            )}
          </div>
        ))}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {KINDS.filter(
            ([k]) => k !== "birthday" || !entries.some((e) => e.kind === "birthday"),
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setEntries((list) => [...list, newEntry(k)])}
              style={{
                ...chip(false),
                border: `1.5px dashed ${C.goldText}`,
                background: "transparent",
              }}
            >
              + {l}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Things you love (optional)">
        <input
          aria-label="Things you love"
          value={likes}
          onChange={(e) => setLikes(e.target.value)}
          placeholder="Tea, scented candles, chocolate…"
          style={input}
        />
      </Section>

      {err && <p style={{ margin: "16px 0 0", fontSize: 14, color: C.oxblood }}>{err}</p>}
      <div style={{ flex: 1, minHeight: 20 }} />
      <button
        type="button"
        className="a-abtn a-lg a-ink"
        disabled={busy}
        style={{ marginTop: 22, opacity: busy ? 0.6 : 1 }}
        onClick={() => void submit()}
      >
        {busy ? "Sending…" : `Send to ${owner}`}
      </button>
      <p
        style={{
          fontSize: 12,
          color: C.muted,
          textAlign: "center",
          margin: "12px 0 0",
          lineHeight: 1.5,
        }}
      >
        Your dates are only shared with {owner}. Boxed by Dweenie won&rsquo;t email you because of
        this.
      </p>
    </>,
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="a-eye">{title}</div>
      {children}
    </div>
  );
}

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
