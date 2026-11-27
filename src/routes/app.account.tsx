import { useState } from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { useMoments, usePeople, useScheduledGifts } from "@/hooks/use-calendar";
import { useOrders, useRecipients, useUser } from "@/hooks/use-shop";
import { signOut } from "@/services/account";
import { updatePerson } from "@/services/calendar";
import { callAccount } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { useSyncExternalStore } from "react";
import { BackButton, C, defaultLeadStore, downloadAllDates } from "@/components/app/kit";

export const Route = createFileRoute("/app/account")({
  component: AppAccount,
});

const LEADS: [number, string][] = [
  [3, "3 days before"],
  [7, "1 week before"],
  [14, "2 weeks before"],
  [30, "1 month before"],
];

function AppAccount() {
  const user = useUser();
  const people = usePeople();
  const scheduled = useScheduledGifts();
  const moments = useMoments();
  const orders = useOrders();
  const recipients = useRecipients();
  const navigate = useNavigate();
  const router = useRouter();
  const lead = useSyncExternalStore(
    defaultLeadStore.subscribe,
    defaultLeadStore.get,
    defaultLeadStore.server,
  );
  const [code, setCode] = useState("");
  const [balance, setBalance] = useState<{ ok: boolean; text: string } | null>(null);
  const [checking, setChecking] = useState(false);

  if (!user) return null;
  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const emailOn = people.length === 0 || people.every((p) => p.reminder.channels.includes("email"));
  const onTheWay = orders.filter((o) => o.status < 3).length;
  const sentCount = orders.length + scheduled.filter((g) => g.status === "sent").length;

  const toggleEmail = async () => {
    const next = !emailOn;
    for (const p of people) {
      const channels = next
        ? Array.from(new Set([...p.reminder.channels, "email" as const]))
        : p.reminder.channels.filter((c) => c !== "email");
      await updatePerson({ ...p, reminder: { ...p.reminder, channels } });
    }
    toast.success(next ? "Email reminders are on" : "Email reminders are off");
  };

  const check = async () => {
    if (!code.trim()) return;
    setChecking(true);
    try {
      const r = await callAccount<{ balance: number }>({ action: "gift-card", code: code.trim() });
      setBalance({ ok: true, text: formatNaira(r.balance) });
    } catch (e) {
      setBalance({
        ok: false,
        text: e instanceof Error ? e.message : "We could not check that code.",
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      style={{
        padding: "calc(env(safe-area-inset-top,0px) + 28px) 16px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 6px",
        }}
      >
        <BackButton
          onClick={() =>
            window.history.length > 1 ? router.history.back() : void navigate({ to: "/app" })
          }
        />
        <img
          src="/brand/logo-primary.svg"
          alt="Boxed by Dweenie"
          style={{ height: 24, width: "auto" }}
        />
        <span style={{ width: 44 }} />
      </div>

      <div style={{ display: "flex", gap: 14, alignItems: "center", padding: "0 6px" }}>
        <span
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: C.nero,
            color: C.gold,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'EB Garamond',Georgia,serif",
            fontWeight: 500,
            fontSize: 26,
            flexShrink: 0,
          }}
        >
          {initials}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="a-dsp" style={{ fontSize: 30 }}>
            {user.name}
          </h1>
          <div
            style={{
              fontSize: 13,
              color: C.muted,
              marginTop: 4,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {user.email}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <div
          id="balance"
          className="a-pat-nero"
          style={{
            flex: 1.8,
            minWidth: 0,
            color: "#FFFFFF",
            borderRadius: 18,
            padding: 14,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <label
            htmlFor="bal"
            style={{ fontSize: 12, color: "rgba(255,255,255,.8)", position: "relative" }}
          >
            Voucher balance
          </label>
          {balance?.ok ? (
            <div
              className="a-dsp"
              style={{
                fontSize: 28,
                marginTop: 4,
                fontVariantNumeric: "tabular-nums",
                position: "relative",
              }}
            >
              {balance.text}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 8,
                position: "relative",
                paddingRight: 22,
              }}
            >
              <input
                id="bal"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Code"
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: 36,
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,.3)",
                  background: "rgba(255,255,255,.08)",
                  color: "#FFFFFF",
                  padding: "0 10px",
                  font: "500 13px 'Parkinsans',sans-serif",
                }}
              />
              <button
                type="button"
                onClick={check}
                disabled={checking}
                style={{
                  height: 36,
                  borderRadius: 8,
                  border: 0,
                  background: C.gold,
                  color: C.nero,
                  fontWeight: 600,
                  fontSize: 12,
                  padding: "0 10px",
                  cursor: "pointer",
                }}
              >
                {checking ? "…" : "Check"}
              </button>
            </div>
          )}
          {balance && !balance.ok && (
            <div
              role="status"
              style={{ fontSize: 11, marginTop: 6, color: "#F0CD67", position: "relative" }}
            >
              {balance.text}
            </div>
          )}
        </div>
        <div
          style={{
            flex: 1,
            background: "#FFFFFF",
            border: `1.5px solid ${C.line}`,
            borderRadius: 18,
            padding: 14,
          }}
        >
          <div style={{ fontSize: 12, color: C.muted }}>Gifts sent</div>
          <div className="a-dsp" style={{ fontSize: 28, marginTop: 4 }}>
            {sentCount}
          </div>
        </div>
      </div>

      <div className="a-eye" style={{ padding: "0 4px" }}>
        Reminders
      </div>
      <div style={grp}>
        <Row>
          <span style={{ flex: 1 }}>Email</span>
          <Switch on={emailOn} label="Email reminders" onClick={() => void toggleEmail()} />
        </Row>
        <Row>
          <span style={{ flex: 1 }}>
            App notifications <Soon />
          </span>
          <Switch on={false} label="App notifications, coming soon" disabled />
        </Row>
        <Row>
          <span style={{ flex: 1 }}>
            WhatsApp <Soon />
          </span>
          <Switch on={false} label="WhatsApp reminders, coming soon" disabled />
        </Row>
        <Row>
          <label htmlFor="lead" style={{ flex: 1 }}>
            Default reminder
          </label>
          <select
            id="lead"
            value={lead}
            onChange={(e) => defaultLeadStore.set(Number(e.target.value))}
            style={{
              border: 0,
              background: "transparent",
              fontSize: 13,
              color: C.muted,
              font: "inherit",
              textAlign: "right",
              cursor: "pointer",
            }}
          >
            {LEADS.map(([d, l]) => (
              <option key={d} value={d}>
                {l}
              </option>
            ))}
          </select>
        </Row>
      </div>

      <div className="a-eye" style={{ padding: "0 4px" }}>
        Your calendar
      </div>
      <div style={grp}>
        <Row as={Link} to="/app/welcome" search={{ step: "moments", from: "account" }}>
          <span style={{ flex: 1 }}>Moments you follow</span>
          <span style={val}>{moments.length || "All"}</span>
        </Row>
        <Row as={Link} to="/app/welcome" search={{ step: "import", from: "account" }}>
          <span style={{ flex: 1 }}>Import more people</span>
          <Chevron />
        </Row>
        <Row
          as="button"
          onClick={() =>
            people.length
              ? downloadAllDates(people)
              : toast("Add someone first, then their dates can go to your calendar.")
          }
        >
          <span style={{ flex: 1, textAlign: "left" }}>Add to Google or Apple Calendar</span>
          <Chevron />
        </Row>
      </div>

      <div className="a-eye" style={{ padding: "0 4px" }}>
        Orders and delivery
      </div>
      <div style={grp}>
        <Row as={Link} to="/app/orders">
          <span style={{ flex: 1 }}>Orders</span>
          <span style={val}>
            {onTheWay
              ? `${onTheWay} on the way`
              : orders.length
                ? `${orders.length} delivered`
                : "None yet"}
          </span>
        </Row>
        <Row as="a" href="/account">
          <span style={{ flex: 1 }}>Saved addresses</span>
          <span style={val}>{recipients.length}</span>
        </Row>
        <Row as="a" href="/secret-santa">
          <span style={{ flex: 1 }}>Secret Santa</span>
          <Chevron />
        </Row>
        <Row as="a" href="/corporate/quote">
          <span style={{ flex: 1 }}>Gifting for a team?</span>
          <span style={{ ...val, color: C.nero, fontWeight: 600 }}>Corporate quote</span>
        </Row>
      </div>

      <button
        type="button"
        onClick={async () => {
          await signOut();
          void navigate({ to: "/app" });
        }}
        style={{
          textAlign: "center",
          fontSize: 14,
          fontWeight: 600,
          color: C.oxblood,
          background: "none",
          border: 0,
          padding: 14,
          cursor: "pointer",
        }}
      >
        Sign out
      </button>
    </div>
  );
}

const grp = {
  background: "#FFFFFF",
  borderRadius: 20,
  border: `1.5px solid ${C.line}`,
  padding: "0 16px",
} as const;
const val = { fontSize: 13, color: C.muted } as const;

function Row({
  as: As = "div",
  children,
  ...rest
}: {
  as?: React.ElementType;
  children: React.ReactNode;
  [k: string]: unknown;
}) {
  return (
    <As
      {...rest}
      className="bbd-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        minHeight: 56,
        borderTop: `1px solid ${C.line}`,
        fontSize: 15,
        color: C.nero,
        width: "100%",
        background: "none",
        border: 0,
        borderTopStyle: "solid",
        borderTopWidth: 1,
        borderTopColor: C.line,
        padding: 0,
        cursor: As === "div" ? "default" : "pointer",
        font: "inherit",
        boxSizing: "border-box",
      }}
    >
      {children}
    </As>
  );
}

function Switch({
  on,
  label,
  onClick,
  disabled,
}: {
  on: boolean;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 46,
        height: 28,
        borderRadius: 999,
        background: on ? C.nero : C.line,
        position: "relative",
        flexShrink: 0,
        border: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        padding: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: on ? 21 : 3,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: on ? C.gold : "#FFFFFF",
          transition: "left .2s ease",
        }}
      />
    </button>
  );
}

const Soon = () => (
  <span
    className="a-pill"
    style={{ background: C.gold, marginLeft: 6, minHeight: 22, fontSize: 11, padding: "0 8px" }}
  >
    Soon
  </span>
);
const Chevron = () => (
  <svg
    className="a-ico"
    viewBox="0 0 24 24"
    aria-hidden="true"
    style={{ color: C.muted, width: 20, height: 20 }}
  >
    <path d="m9 5 7 7-7 7" />
  </svg>
);
