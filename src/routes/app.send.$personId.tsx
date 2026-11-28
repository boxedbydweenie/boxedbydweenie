import { useState } from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { usePeople } from "@/hooks/use-calendar";
import { useRecipients, useUser } from "@/hooks/use-shop";
import { addDays, giftIdeas, nextDateFor, scheduleGift, todayIso } from "@/services/calendar";
import { getProductById } from "@/services/products";
import { addToCart } from "@/services/cart";
import { GIFT_NOTE_LIMIT } from "@/config/shop";
import { formatNaira } from "@/lib/format";
import { BackButton, C, IconCheck, occasionTitle, shortDate } from "@/components/app/kit";

export const Route = createFileRoute("/app/send/$personId")({
  validateSearch: z.object({ product: z.string().optional().catch(undefined) }),
  component: SendGift,
});

function SendGift() {
  const { personId } = Route.useParams();
  const { product: productParam } = Route.useSearch();
  const person = usePeople().find((p) => p.id === personId);
  const user = useUser();
  const recipients = useRecipients();
  const navigate = useNavigate();
  const router = useRouter();
  const today = todayIso();

  const ideas = person ? giftIdeas(person, 8) : [];
  const [productId, setProductId] = useState(productParam ?? ideas[0]?.id ?? "");
  const [picking, setPicking] = useState(false);
  const next = person ? nextDateFor(person) : null;
  const first = person?.name.split(" ")[0] ?? "";
  const title = next
    ? occasionTitle(next.date.label, next.date.type, next.date.year, next.on)
    : "day";
  const signOff = `Love, ${user?.name.split(" ")[0] ?? ""}`.trim();
  const [message, setMessage] = useState(() =>
    first
      ? `Happy ${title}, ${first}. Thank you for everything you are to us. Here's to many more years of joy.`
      : "",
  );
  const dayBefore = next ? addDays(next.on, -1) : today;
  const [arrive, setArrive] = useState<"before" | "on">(
    next && dayBefore > today ? "before" : "on",
  );
  const [recipientId, setRecipientId] = useState(
    () =>
      recipients.find((r) => first && r.name.toLowerCase().includes(first.toLowerCase()))?.id ??
      recipients[0]?.id ??
      "",
  );
  const [busy, setBusy] = useState(false);

  if (!person || !next) {
    return (
      <section style={{ padding: "64px 22px 0", textAlign: "center" }}>
        <h1 className="a-dsp" style={{ fontSize: 32 }}>
          Choose who it's for
        </h1>
        <Link to="/app/people" className="a-abtn a-ink" style={{ marginTop: 22 }}>
          Go to people
        </Link>
      </section>
    );
  }

  const product = getProductById(productId) ?? ideas[0] ?? null;
  const limit = GIFT_NOTE_LIMIT - signOff.length - 1;
  const deliveryDate = arrive === "before" ? dayBefore : next.on;
  const recipient = recipients.find((r) => r.id === recipientId);
  const suggestions: [string, string][] = [
    [
      "Warm",
      `Happy ${title}, ${first}. Thank you for everything you are to us. Here's to many more years of joy.`,
    ],
    ["Short and sweet", `Happy ${title}, ${first}! With all my love.`],
    [
      "With a prayer",
      `Happy ${title}, ${first}. May this year bring you good health, peace and every blessing.`,
    ],
    ["Funny", `Happy ${title}, ${first}! Don't worry, you don't look a day over fabulous.`],
  ];

  const pay = async () => {
    if (!product) return;
    setBusy(true);
    try {
      await addToCart({
        kind: "product",
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        quantity: 1,
        note: `${message.trim()}\n${signOff}`.slice(0, GIFT_NOTE_LIMIT),
        handwritten: false,
        deliveryDate,
      });
      await scheduleGift({
        personId: person.id,
        productId: product.id,
        deliveryDate,
        occasionLabel: title.charAt(0).toUpperCase() + title.slice(1),
      });
      void navigate({ to: "/checkout" });
    } catch {
      toast.error("We couldn't add that gift. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        padding: "calc(env(safe-area-inset-top,0px) + 28px) 22px 28px",
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <BackButton
          onClick={() =>
            window.history.length > 1
              ? router.history.back()
              : void navigate({ to: "/app/people/$personId", params: { personId } })
          }
        />
        <div className="a-dsp" style={{ fontSize: 24 }}>
          A gift for{" "}
          <span className="a-name" style={{ color: C.goldText, fontSize: 26 }}>
            {first}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
        <Step n={1} label="Gift" done={Boolean(product)} />
        <Step n={2} label="Card" active />
        <Step n={3} label="Delivery" active />
        <Step n={4} label="Pay" />
      </div>

      {product ? (
        <div
          style={{
            marginTop: 18,
            background: "#FFFFFF",
            borderRadius: 20,
            border: `1.5px solid ${C.line}`,
            padding: 10,
            display: "flex",
            gap: 14,
            alignItems: "center",
          }}
        >
          {product.images[0] && (
            <img
              src={product.images[0]}
              alt={product.name}
              style={{
                width: 84,
                height: 104,
                borderRadius: 14,
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="a-eye" style={{ fontSize: 10 }}>
              {product.line}
            </div>
            <div className="a-dsp" style={{ fontSize: 24, marginTop: 4 }}>
              {product.name}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                marginTop: 4,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatNaira(product.price)}
            </div>
            <button
              type="button"
              onClick={() => setPicking((v) => !v)}
              style={{
                fontSize: 12,
                fontWeight: 600,
                background: "none",
                border: 0,
                padding: "6px 0 0",
                cursor: "pointer",
                textDecoration: "underline",
                color: C.nero,
              }}
            >
              {picking ? "Keep this gift" : "Change gift"}
            </button>
          </div>
        </div>
      ) : (
        <p style={{ marginTop: 18, fontSize: 14, color: C.muted }}>
          No boxes match this person's budget yet.{" "}
          <Link
            to="/app/shop"
            search={{ for: personId }}
            style={{ fontWeight: 600, textDecoration: "underline" }}
          >
            Browse the shop
          </Link>
          .
        </p>
      )}

      {picking && (
        <div className="a-hscroll" style={{ gap: 10, marginTop: 12 }}>
          {ideas.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setProductId(p.id);
                setPicking(false);
              }}
              aria-pressed={p.id === product?.id}
              style={{
                flexShrink: 0,
                width: 120,
                textAlign: "left",
                background: "#FFFFFF",
                border: `${p.id === product?.id ? 2 : 1.5}px solid ${p.id === product?.id ? C.nero : C.line}`,
                borderRadius: 16,
                padding: 8,
                cursor: "pointer",
                color: C.nero,
              }}
            >
              {p.images[0] && (
                <img
                  src={p.images[0]}
                  alt=""
                  style={{
                    width: "100%",
                    aspectRatio: "4/5",
                    objectFit: "cover",
                    borderRadius: 10,
                    display: "block",
                  }}
                />
              )}
              <span className="a-dsp" style={{ display: "block", fontSize: 15, marginTop: 6 }}>
                {p.name}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{formatNaira(p.price)}</span>
            </button>
          ))}
          <Link
            to="/app/shop"
            search={{ for: personId }}
            style={{
              flexShrink: 0,
              width: 120,
              borderRadius: 16,
              border: `1.5px dashed ${C.muted}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 600,
              textAlign: "center",
              padding: 8,
            }}
          >
            See the whole shop
          </Link>
        </div>
      )}

      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div className="a-eye">Card message</div>
          <span style={{ fontSize: 12, color: C.muted, fontVariantNumeric: "tabular-nums" }}>
            {message.length} / {limit}
          </span>
        </div>
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 18,
            border: `1.5px solid ${C.line}`,
            padding: "22px 18px 16px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <label htmlFor="gm" style={{ position: "absolute", left: -9999 }}>
            Card message
          </label>
          <textarea
            id="gm"
            rows={4}
            maxLength={limit}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              width: "100%",
              border: 0,
              resize: "none",
              background: "transparent",
              font: "400 19px/1.45 'EB Garamond',Georgia,serif",
              color: C.nero,
              padding: 0,
              boxSizing: "border-box",
              outline: "none",
            }}
          />
          <div className="a-scr" style={{ fontSize: 34, textAlign: "right", marginTop: 4 }}>
            {signOff}
          </div>
        </div>
        <div className="a-hscroll" style={{ gap: 8 }}>
          {suggestions.map(([label, text]) => (
            <button
              key={label}
              type="button"
              onClick={() => setMessage(text)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 36,
                padding: "0 13px",
                borderRadius: 999,
                border: `1.5px solid ${message === text ? C.nero : C.line}`,
                fontSize: 12,
                background: "#FFFFFF",
                whiteSpace: "nowrap",
                cursor: "pointer",
                flexShrink: 0,
                color: C.nero,
                fontWeight: message === text ? 700 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="a-eye">Deliver to</div>
        {recipients.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recipients.slice(0, 3).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRecipientId(r.id)}
                aria-pressed={r.id === recipientId}
                style={{
                  background: "#FFFFFF",
                  borderRadius: 18,
                  border: `${r.id === recipientId ? 2 : 1.5}px solid ${r.id === recipientId ? C.nero : C.line}`,
                  padding: "14px 16px",
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  textAlign: "left",
                  cursor: "pointer",
                  color: C.nero,
                }}
              >
                <svg
                  className="a-ico"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  style={{ color: C.goldText }}
                >
                  <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
                  <circle cx="12" cy="9.5" r="2.5" />
                </svg>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: 14 }}>{r.name}</strong>
                  <span
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: C.muted,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {[r.address, r.area, r.state].filter(Boolean).join(", ")}
                  </span>
                </span>
              </button>
            ))}
            <span style={{ fontSize: 12, color: C.muted }}>
              You'll confirm {recipient ? `${recipient.name}'s` : "the"} address at checkout.
            </span>
          </div>
        ) : (
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 18,
              border: `1.5px solid ${C.line}`,
              padding: "14px 16px",
              fontSize: 13,
              color: C.muted,
            }}
          >
            You'll add {first}'s address at checkout, and we'll save it for next time.
          </div>
        )}

        <div className="a-eye" style={{ marginTop: 6 }}>
          Arrives
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {dayBefore > today && (
            <ArriveOption
              on={arrive === "before"}
              onClick={() => setArrive("before")}
              title={shortDate(dayBefore)}
              note="The day before. Recommended."
            />
          )}
          <ArriveOption
            on={arrive === "on"}
            onClick={() => setArrive("on")}
            title={shortDate(next.on)}
            note="On the day. Lagos only."
          />
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 18 }} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          margin: "18px 4px 12px",
          fontSize: 14,
        }}
      >
        <span style={{ color: C.muted }}>Total before delivery</span>
        <strong className="a-dsp" style={{ fontSize: 24, fontVariantNumeric: "tabular-nums" }}>
          {formatNaira(product?.price ?? 0)}
        </strong>
      </div>
      <button
        type="button"
        className="a-abtn a-lg a-gold"
        disabled={!product || busy || !message.trim()}
        onClick={pay}
        style={{ opacity: !product || busy || !message.trim() ? 0.6 : 1 }}
      >
        {busy ? "Adding your gift…" : "Continue to payment"}
      </button>
      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          color: C.muted,
          marginTop: 12,
        }}
      >
        <svg
          className="a-ico"
          style={{ width: 14, height: 14 }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        Secure checkout on boxedbydweenie.com
      </div>
    </div>
  );
}

function Step({
  n,
  label,
  done,
  active,
}: {
  n: number;
  label: string;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: active || done ? C.nero : C.muted,
        fontWeight: active ? 700 : 400,
      }}
    >
      <b
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          background: done ? C.nero : active ? C.gold : C.line,
          color: done ? C.gold : C.nero,
        }}
      >
        {done ? <IconCheck style={{ width: 12, height: 12, strokeWidth: 3 }} /> : n}
      </b>
      {label}
    </span>
  );
}

function ArriveOption({
  on,
  onClick,
  title,
  note,
}: {
  on: boolean;
  onClick: () => void;
  title: string;
  note: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      style={{
        flex: 1,
        borderRadius: 16,
        padding: 12,
        border: `${on ? 2 : 1.5}px solid ${on ? C.nero : C.line}`,
        background: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        textAlign: "left",
        cursor: "pointer",
        color: C.nero,
      }}
    >
      <strong style={{ fontSize: 14 }}>{title}</strong>
      <span style={{ fontSize: 12, color: C.muted }}>{note}</span>
    </button>
  );
}
