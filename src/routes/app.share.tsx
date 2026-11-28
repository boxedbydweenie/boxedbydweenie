import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-shop";
import { SHARE_BASE, myInviteCode } from "@/services/sharedDates";
import { C, TopBar, goBack } from "@/components/app/kit";

export const Route = createFileRoute("/app/share")({
  component: AppShare,
});

const GROUPS = [
  [
    "Family",
    "Hi family! I'm putting all our birthdays and anniversaries in one place so I never miss one.",
  ],
  [
    "Friends",
    "Hi! I never want to miss your special days. Could you add your birthday and anniversaries here?",
  ],
  [
    "Colleagues",
    "Hi team, I'm keeping track of everyone's birthdays and work anniversaries. Please add yours here.",
  ],
  [
    "Clients",
    "Hello! We'd love to celebrate your special days with you. Please add your birthday and anniversaries here.",
  ],
] as const;

/** "Ask for their dates": a personal link that lets family, friends and colleagues add their own dates. */
function AppShare() {
  const user = useUser();
  const navigate = useNavigate();
  const router = useRouter();
  const [link, setLink] = useState("");
  const [err, setErr] = useState("");
  const [group, setGroup] = useState(0);
  const [message, setMessage] = useState("");
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
    if (!user) return;
    myInviteCode()
      .then((c) => setLink(`${SHARE_BASE}/${c}`))
      .catch((e: Error) => setErr(e.message));
  }, [user]);
  useEffect(() => {
    if (link) setMessage(`${GROUPS[group]![1]} It takes a minute: ${link}`);
  }, [link, group]);

  const enc = encodeURIComponent(message);
  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} copied`);
    } catch {
      toast("Press and hold the link to copy it.");
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: "Add your special days", text: message });
    } catch {
      /* closed the share sheet */
    }
  };

  return (
    <>
      <TopBar
        onBack={() => goBack(router.history, () => void navigate({ to: "/app/people" }))}
        title="Ask for their dates"
        hideBackOnDesk
      />
      <div
        className="a-desk-pad"
        style={{ padding: "4px 16px 28px", display: "flex", flexDirection: "column", gap: 18 }}
      >
        <div>
          <h1 className="a-dsp" style={{ fontSize: 36 }}>
            Let them add <span style={{ color: C.goldText }}>their own dates.</span>
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: C.muted, margin: "8px 0 0" }}>
            Send one link to your family, friends, colleagues or clients. They add their birthday
            and anniversaries, and each one appears in your calendar with a reminder. No app or
            account needed on their side.
          </p>
        </div>

        <ol
          style={{
            listStyle: "none",
            margin: 0,
            padding: 16,
            background: "#FFFFFF",
            border: `1.5px solid ${C.line}`,
            borderRadius: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {[
            "Share your link in a chat or group.",
            "They tap it and add their dates in under a minute.",
            "Their dates land in your People list, with reminders.",
          ].map((t, n) => (
            <li key={t} style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 14 }}>
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: n === 2 ? C.gold : C.plum,
                  color: n === 2 ? C.nero : C.gold,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'EB Garamond',Georgia,serif",
                  fontSize: 17,
                  flexShrink: 0,
                }}
              >
                {n + 1}
              </span>
              {t}
            </li>
          ))}
        </ol>

        {err && <p style={{ margin: 0, fontSize: 14, color: C.oxblood }}>{err}</p>}

        <div>
          <div className="a-eye" style={{ marginBottom: 8 }}>
            Who are you sending it to?
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {GROUPS.map(([l], i) => (
              <button
                key={l}
                type="button"
                aria-pressed={group === i}
                onClick={() => setGroup(i)}
                style={{
                  minHeight: 44,
                  padding: "0 16px",
                  borderRadius: 999,
                  border: `1.5px solid ${group === i ? C.nero : C.line}`,
                  background: group === i ? C.nero : "#FFFFFF",
                  color: group === i ? "#FFFFFF" : C.nero,
                  font: "500 14px 'Parkinsans',system-ui,sans-serif",
                  cursor: "pointer",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="sh-msg" className="a-eye" style={{ display: "block", marginBottom: 8 }}>
            Your message
          </label>
          <textarea
            id="sh-msg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            disabled={!link}
            placeholder="Making your link…"
            style={{
              width: "100%",
              boxSizing: "border-box",
              borderRadius: 16,
              border: `1.5px solid ${C.line}`,
              background: "#FFFFFF",
              padding: "12px 14px",
              lineHeight: 1.5,
              color: C.nero,
              fontFamily: "'Parkinsans',sans-serif",
              fontSize: 16,
              resize: "vertical",
            }}
          />
        </div>

        {canShare && link && (
          <button type="button" className="a-abtn a-lg a-gold" onClick={() => void share()}>
            Share link
          </button>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
          <a
            href={link ? `https://wa.me/?text=${enc}` : undefined}
            target="_blank"
            rel="noreferrer"
            className="a-abtn a-lg"
            style={{ background: "#1F8F4E", color: "#FFFFFF", opacity: link ? 1 : 0.5 }}
          >
            WhatsApp
          </a>
          <a
            href={
              link
                ? `mailto:?subject=${encodeURIComponent("Add your special days")}&body=${enc}`
                : undefined
            }
            className="a-abtn a-lg a-line"
          >
            Email
          </a>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 16,
            border: `1.5px solid ${C.line}`,
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 14,
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              userSelect: "all",
              color: link ? C.nero : C.muted,
            }}
          >
            {link || "Making your link…"}
          </span>
          <button
            type="button"
            disabled={!link}
            onClick={() => void copy(link, "Link")}
            className="a-abtn a-line"
            style={{ minHeight: 38 }}
          >
            Copy link
          </button>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
          Your link stays the same, so you can reuse it. New dates arrive the next time you open the
          app or pull down to refresh.
        </p>
      </div>
    </>
  );
}
