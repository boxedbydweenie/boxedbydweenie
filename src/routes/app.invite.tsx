import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-shop";
import { C, TopBar, defaultInviteMessage, goBack, inviteLink } from "@/components/app/kit";

export const Route = createFileRoute("/app/invite")({
  component: AppInvite,
});

/** Invite friends: share a personal link that opens the app with "<name> invited you" and install steps. */
function AppInvite() {
  const user = useUser();
  const navigate = useNavigate();
  const router = useRouter();
  const first = user?.name.trim().split(/\s+/)[0] ?? "";
  const [link, setLink] = useState("");
  const [message, setMessage] = useState("");
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    const l = inviteLink(first);
    setLink(l);
    setMessage(defaultInviteMessage(l));
    setCanShare(typeof navigator.share === "function");
  }, [first]);

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
      await navigator.share({ title: "BBD Gift Calendar", text: message });
    } catch {
      /* closed the share sheet */
    }
  };

  return (
    <>
      <TopBar
        onBack={() => goBack(router.history, () => void navigate({ to: "/app/account" }))}
        title="Invite friends"
        hideBackOnDesk
      />
      <div
        className="a-desk-pad"
        style={{ padding: "4px 16px 28px", display: "flex", flexDirection: "column", gap: 18 }}
      >
        <div>
          <h1 className="a-dsp" style={{ fontSize: 36 }}>
            Share the love <span style={{ color: C.goldText }}>of gifting.</span>
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: C.muted, margin: "8px 0 0" }}>
            Send your friends a link. They&rsquo;ll see that{" "}
            {first ? `${first} invited them` : "you invited them"}, with simple steps to put the app
            on their phone.
          </p>
        </div>

        <div
          style={{
            borderRadius: 20,
            overflow: "hidden",
            border: `1.5px solid ${C.line}`,
            background: "#FFFFFF",
          }}
        >
          <img
            src="/app/share.jpg"
            alt="Preview: Every date that matters, remembered. The Gift Calendar by Boxed by Dweenie."
            style={{ width: "100%", display: "block", aspectRatio: "1200/630", objectFit: "cover" }}
          />
          <div style={{ padding: "10px 14px", fontSize: 12, color: C.muted }}>
            This is how your link looks in WhatsApp and Messages.
          </div>
        </div>

        <div>
          <label htmlFor="inv-msg" className="a-eye" style={{ display: "block", marginBottom: 8 }}>
            Your message
          </label>
          <textarea
            id="inv-msg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
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
              resize: "vertical",
            }}
          />
        </div>

        {canShare && (
          <button type="button" className="a-abtn a-lg a-gold" onClick={() => void share()}>
            Share invite
          </button>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
          <a
            href={`https://wa.me/?text=${enc}`}
            target="_blank"
            rel="noreferrer"
            className="a-abtn a-lg"
            style={{ background: "#1F8F4E", color: "#FFFFFF" }}
          >
            WhatsApp
          </a>
          <a href={`sms:?&body=${enc}`} className="a-abtn a-lg a-line">
            Messages
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent("You'll love this: the BBD Gift Calendar")}&body=${enc}`}
            className="a-abtn a-lg a-line"
          >
            Email
          </a>
          <button
            type="button"
            className="a-abtn a-lg a-ink"
            onClick={() => void copy(message, "Message")}
          >
            Copy message
          </button>
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
            }}
          >
            {link}
          </span>
          <button
            type="button"
            onClick={() => void copy(link, "Link")}
            className="a-abtn a-line"
            style={{ minHeight: 38 }}
          >
            Copy link
          </button>
        </div>
      </div>
    </>
  );
}
