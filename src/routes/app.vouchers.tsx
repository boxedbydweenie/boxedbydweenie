import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { usePeople } from "@/hooks/use-calendar";
import { nextDateFor, todayIso } from "@/services/calendar";
import { addToCart } from "@/services/cart";
import { GIFT_CARD_AMOUNTS, GIFT_CARD_MAX, GIFT_CARD_MIN, GIFT_NOTE_LIMIT } from "@/config/shop";
import { formatNaira } from "@/lib/format";
import type { GiftCardDetails } from "@/types/shop";
import {
  C,
  CalTile,
  IconCheck,
  avatarColour,
  occasionTitle,
  shortDate,
} from "@/components/app/kit";

export const Route = createFileRoute("/app/vouchers")({
  validateSearch: z.object({ for: z.string().optional().catch(undefined) }),
  component: AppVouchers,
});

type Design = GiftCardDetails["design"];
const DESIGNS: { id: Design; label: string; bg: string; pattern?: string; dark: boolean }[] = [
  {
    id: "black-leaf",
    label: "Black with gold bows",
    bg: C.nero,
    pattern: "url(/brand/pattern-black.png) 0 0/72px 68px",
    dark: true,
  },
  { id: "white-ribbon", label: "White with gold ribbon", bg: "#FFFFFF", dark: false },
  {
    id: "ivory-bow",
    label: "Ivory with bow pattern",
    bg: C.ivory,
    pattern: "url(/brand/pattern-ivory.svg) 0 0/64px 62px",
    dark: false,
  },
  {
    id: "plum-bow",
    label: "Plum with bow pattern",
    bg: C.plum,
    pattern: "url(/brand/pattern-plum.svg) center/cover",
    dark: true,
  },
  {
    id: "oxblood-bow",
    label: "Oxblood with bow pattern",
    bg: C.oxblood,
    pattern: "url(/brand/pattern-oxblood.svg) center/cover",
    dark: true,
  },
];
const short = (n: number) => (n >= 1000 ? `₦${n / 1000}k` : formatNaira(n));

function AppVouchers() {
  const people = usePeople();
  const { for: forId } = Route.useSearch();
  const navigate = useNavigate();
  const today = todayIso();

  const [design, setDesign] = useState<Design>("black-leaf");
  const [amount, setAmount] = useState(50000);
  const [custom, setCustom] = useState("");
  const [personId, setPersonId] = useState(forId ?? "");
  const person = people.find((p) => p.id === personId);
  const [name, setName] = useState(person?.name ?? "");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const next = person ? nextDateFor(person) : null;
  const [when, setWhen] = useState<"date" | "now" | "pick">(next ? "date" : "now");
  const [pickDate, setPickDate] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const value = custom ? Number(custom) : amount;
  const d = DESIGNS.find((x) => x.id === design)!;
  const sendOn = when === "now" ? null : when === "date" && next ? next.on : pickDate || null;
  const first = (name || person?.name || "").split(" ")[0];
  const nextTitle = next
    ? occasionTitle(next.date.label, next.date.type, next.date.year, next.on)
    : "";

  const choose = (id: string) => {
    const p = people.find((x) => x.id === id);
    setPersonId(id);
    setName(p?.name ?? "");
    setWhen(p && nextDateFor(p) ? "date" : "now");
  };

  const buy = async () => {
    if (!value || value < GIFT_CARD_MIN || value > GIFT_CARD_MAX)
      return setError(
        `Choose an amount between ${formatNaira(GIFT_CARD_MIN)} and ${formatNaira(GIFT_CARD_MAX)}.`,
      );
    if (!name.trim() || !contact.trim())
      return setError(
        "Add their name and their email or phone number, so we know where to send it.",
      );
    if (when === "pick" && !pickDate) return setError("Choose the date it should arrive.");
    setError("");
    setBusy(true);
    try {
      await addToCart({
        kind: "gift-card",
        productId: "prd-gift-card",
        name: `BBD Gift Card, ${formatNaira(value)}`,
        price: value,
        quantity: 1,
        giftCard: {
          design,
          recipientName: name.trim(),
          recipientContact: contact.trim(),
          message: message.trim(),
          sendOn,
        },
      });
      void navigate({ to: "/checkout" });
    } catch {
      toast.error("We couldn't add that voucher. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: "54px 22px 16px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="a-eye">Gift vouchers</div>
        <Link to="/app/account" hash="balance" style={{ fontSize: 13, fontWeight: 600 }}>
          Check a balance
        </Link>
      </div>
      <h1 className="a-dsp" style={{ fontSize: 38, marginTop: 8 }}>
        Let them choose <span style={{ color: C.goldText }}>their wow.</span>
      </h1>

      {/* Live card preview */}
      <div
        role="img"
        aria-label={`${d.label} voucher, ${formatNaira(value || 0)}${first ? ` for ${first}` : ""}`}
        style={{
          marginTop: 18,
          height: 214,
          borderRadius: 20,
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 30px 50px -28px rgba(0,0,0,.8)",
          transform: "rotate(-2deg)",
          background: d.pattern ? `${d.pattern}, ${d.bg}` : d.bg,
          border: d.dark ? 0 : `1.5px solid ${C.line}`,
          transition: "background .4s ease",
        }}
      >
        <span
          className="a-rv"
          aria-hidden="true"
          style={{ position: "absolute", right: 78, top: 0, bottom: 0, width: 18 }}
        />
        <span
          className="a-rh"
          aria-hidden="true"
          style={{ position: "absolute", left: 0, right: 0, top: 136, height: 18 }}
        />
        <img
          src="/brand/bow-gold.svg"
          alt=""
          style={{
            position: "absolute",
            right: 30,
            top: 104,
            width: 114,
            height: "auto",
            filter: "drop-shadow(0 10px 14px rgba(0,0,0,.45))",
          }}
        />
        <img
          src={d.dark ? "/brand/logo-on-dark.svg" : "/brand/logo-primary.svg"}
          alt=""
          style={{ position: "absolute", left: 22, top: 22, height: 24, width: "auto" }}
        />
        <div
          className="a-dsp"
          style={{
            position: "absolute",
            left: 22,
            top: 60,
            fontSize: 50,
            color: d.dark ? "#FFFFFF" : C.nero,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatNaira(value || 0)}
        </div>
        {first && (
          <div
            className="a-scr"
            style={{
              position: "absolute",
              left: 24,
              top: 116,
              fontSize: 28,
              color: d.dark ? C.gold : C.goldText,
            }}
          >
            for {first}
          </div>
        )}
        <div
          style={{
            position: "absolute",
            left: 22,
            bottom: 18,
            fontSize: 11,
            letterSpacing: ".2em",
            color: d.dark ? "rgba(255,255,255,.78)" : C.muted,
          }}
        >
          VALID 12 MONTHS
        </div>
      </div>

      <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 10 }}>
        <div className="a-eye" style={{ flex: 1 }}>
          Design
        </div>
        {DESIGNS.map((x) => (
          <button
            key={x.id}
            type="button"
            aria-label={x.label}
            aria-pressed={design === x.id}
            onClick={() => setDesign(x.id)}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: `3px solid ${C.ivory}`,
              boxSizing: "border-box",
              background: x.pattern ? `${x.pattern}, ${x.bg}` : x.bg,
              boxShadow: `0 0 0 ${design === x.id ? 2.5 : 1.5}px ${design === x.id ? C.gold : C.line}`,
              cursor: "pointer",
              padding: 0,
            }}
          />
        ))}
      </div>

      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="a-eye">Amount</div>
        <div style={{ display: "flex", gap: 6 }}>
          {GIFT_CARD_AMOUNTS.map((a) => {
            const on = !custom && amount === a;
            return (
              <button
                key={a}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setAmount(a);
                  setCustom("");
                }}
                style={amt(on)}
              >
                {short(a)}
              </button>
            );
          })}
          <label style={{ ...amt(Boolean(custom)), position: "relative", fontSize: 13 }}>
            <span style={{ position: "absolute", left: -9999 }}>Other amount</span>
            <input
              inputMode="numeric"
              placeholder="Other"
              value={custom}
              onChange={(e) => setCustom(e.target.value.replace(/\D/g, ""))}
              style={{
                width: "100%",
                border: 0,
                background: "transparent",
                textAlign: "center",
                font: "inherit",
                color: "inherit",
                outline: "none",
              }}
            />
          </label>
        </div>
      </div>

      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="a-eye">Who is it for?</div>
        {people.length > 0 && (
          <div className="a-hscroll" style={{ gap: 8 }}>
            {people.map((p) => {
              const on = p.id === personId;
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => choose(p.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    minHeight: 44,
                    padding: "0 14px 0 6px",
                    borderRadius: 999,
                    border: `${on ? 2 : 1.5}px solid ${on ? C.nero : C.line}`,
                    background: "#FFFFFF",
                    cursor: "pointer",
                    flexShrink: 0,
                    color: C.nero,
                    fontWeight: on ? 700 : 400,
                    fontSize: 14,
                  }}
                >
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      ...avatarColour(p.id),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    {p.name.slice(0, 1).toUpperCase()}
                  </span>
                  {p.name.split(" ")[0]}
                </button>
              );
            })}
          </div>
        )}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 18,
            border: `1.5px solid ${C.line}`,
            padding: "4px 14px",
          }}
        >
          <Field
            id="v-name"
            label="Their name"
            value={name}
            onChange={setName}
            placeholder="Tolu Adebayo"
          />
          <Field
            id="v-contact"
            label="Their email or phone"
            value={contact}
            onChange={setContact}
            placeholder="tolu@example.com"
            divider
          />
          <Field
            id="v-msg"
            label="Short message (optional)"
            value={message}
            onChange={(v) => setMessage(v.slice(0, GIFT_NOTE_LIMIT))}
            placeholder="Treat yourself. You've earned it."
            divider
          />
        </div>
      </div>

      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="a-eye">When should it arrive?</div>
        {next && (
          <button
            type="button"
            aria-pressed={when === "date"}
            onClick={() => setWhen("date")}
            style={{
              background: "#FFFFFF",
              border: `1.5px solid ${when === "date" ? C.gold : C.line}`,
              borderRadius: 18,
              padding: 14,
              display: "flex",
              gap: 12,
              alignItems: "center",
              textAlign: "left",
              cursor: "pointer",
              color: C.nero,
            }}
          >
            <CalTile iso={next.on} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ fontSize: 14 }}>
                On {first ? `${first}'s` : "their"} {nextTitle}
              </strong>
              <span style={{ display: "block", fontSize: 12, color: C.muted }}>
                {shortDate(next.on)}, 8:00 am, by email or SMS
              </span>
            </span>
            {when === "date" && (
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
                <IconCheck style={{ width: 13, height: 13, strokeWidth: 3 }} />
              </span>
            )}
          </button>
        )}
        <div style={{ display: "flex", gap: 8, fontSize: 13 }}>
          <button
            type="button"
            aria-pressed={when === "now"}
            onClick={() => setWhen("now")}
            style={opt(when === "now")}
          >
            Send now
          </button>
          <button
            type="button"
            aria-pressed={when === "pick"}
            onClick={() => setWhen("pick")}
            style={opt(when === "pick")}
          >
            Pick another date
          </button>
        </div>
        {when === "pick" && (
          <input
            type="date"
            aria-label="Arrival date"
            min={today}
            value={pickDate}
            onChange={(e) => setPickDate(e.target.value)}
            style={{
              height: 48,
              borderRadius: 14,
              border: `1.5px solid ${C.line}`,
              background: "#FFFFFF",
              padding: "0 14px",
              font: "inherit",
              color: C.nero,
            }}
          />
        )}
      </div>

      {error && (
        <p role="alert" style={{ fontSize: 13, color: C.oxblood, marginTop: 14, fontWeight: 600 }}>
          {error}
        </p>
      )}
      <button
        type="button"
        className="a-abtn a-lg a-gold"
        onClick={buy}
        disabled={busy}
        style={{ marginTop: 18, opacity: busy ? 0.6 : 1 }}
      >
        {busy ? "Adding your voucher…" : `Buy voucher, ${formatNaira(value || 0)}`}
      </button>
      <div style={{ textAlign: "center", fontSize: 12, color: C.muted, marginTop: 12 }}>
        Spend it on anything at boxedbydweenie.com
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  divider,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  divider?: boolean;
}) {
  return (
    <div style={{ padding: "10px 0", borderTop: divider ? `1px solid ${C.line}` : 0 }}>
      <label
        htmlFor={id}
        style={{ display: "block", fontSize: 12, color: C.muted, fontWeight: 600 }}
      >
        {label}
      </label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          border: 0,
          background: "transparent",
          font: "500 15px 'Parkinsans',system-ui,sans-serif",
          color: C.nero,
          padding: "4px 0 0",
          outline: "none",
        }}
      />
    </div>
  );
}

const amt = (on: boolean) =>
  ({
    flex: 1,
    minWidth: 0,
    minHeight: 46,
    borderRadius: 999,
    border: `1.5px solid ${on ? C.nero : C.line}`,
    background: on ? C.nero : "#FFFFFF",
    color: on ? "#FFFFFF" : C.nero,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: on ? 700 : 400,
    fontVariantNumeric: "tabular-nums",
    cursor: "pointer",
    padding: "0 4px",
  }) as const;
const opt = (on: boolean) =>
  ({
    flex: 1,
    textAlign: "center",
    padding: "12px 0",
    borderRadius: 999,
    border: `1.5px solid ${on ? C.nero : C.line}`,
    background: "#FFFFFF",
    cursor: "pointer",
    color: C.nero,
    fontWeight: on ? 700 : 400,
    font: "inherit",
  }) as const;
