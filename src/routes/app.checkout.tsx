import { useState } from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useCart, useRecipients, useUser } from "@/hooks/use-shop";
import { applyPromo, cartSubtotal, clearCart } from "@/services/cart";
import { startCheckout } from "@/services/orders";
import { callAccount } from "@/lib/api";
import { STATES, deliveryFeeFor } from "@/config/delivery";
import { formatNaira } from "@/lib/format";
import { APP_PAY_KEY, C, TopBar, goBack } from "@/components/app/kit";

export const Route = createFileRoute("/app/checkout")({
  component: AppCheckout,
});

function AppCheckout() {
  const items = useCart();
  const user = useUser();
  const recipients = useRecipients();
  const navigate = useNavigate();
  const router = useRouter();
  const firstDate =
    items
      .map((i) => i.deliveryDate ?? i.giftCard?.sendOn ?? "")
      .filter(Boolean)
      .sort()[0] ?? "";
  const onlyCards = items.length > 0 && items.every((i) => i.kind === "gift-card");

  const [sendTo, setSendTo] = useState<"someone" | "me">("someone");
  const [r, setR] = useState({
    name: "",
    phone: "",
    address: "",
    state: "Lagos",
    area: "",
    date: firstDate,
    notes: "",
  });
  const [surprise, setSurprise] = useState(true);
  const [c, setC] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });
  const [marketing, setMarketing] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; percent: number; msg: string } | null>(null);
  const [cardInput, setCardInput] = useState("");
  const [card, setCard] = useState<{ code: string; balance: number; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (items.length === 0) {
    return (
      <>
        <TopBar onBack={() => void navigate({ to: "/app/shop" })} title="Checkout" />
        <div className="a-col" style={{ padding: "48px 22px", textAlign: "center" }}>
          <h1 className="a-dsp" style={{ fontSize: 30 }}>
            Nothing to check out yet.
          </h1>
          <Link to="/app/shop" className="a-abtn a-lg a-ink" style={{ marginTop: 20 }}>
            Shop gifts
          </Link>
        </div>
      </>
    );
  }

  const subtotal = cartSubtotal(items);
  const discount = promo ? Math.round((subtotal * promo.percent) / 100) : 0;
  const fee = onlyCards ? 0 : deliveryFeeFor(r.state);
  const owed = subtotal - discount + fee;
  const cardApplied = card?.balance ? Math.min(card.balance, owed) : 0;
  const total = owed - cardApplied;

  const applyPromoCode = async () => {
    if (!promoInput.trim()) return;
    const res = await applyPromo(promoInput);
    setPromo(
      res.ok
        ? { code: promoInput.trim().toUpperCase(), percent: res.percent, msg: res.message }
        : { code: "", percent: 0, msg: res.message },
    );
  };
  const applyVoucherCode = async () => {
    if (!cardInput.trim()) return;
    try {
      const res = await callAccount<{ balance: number }>({
        action: "gift-card",
        code: cardInput.trim(),
      });
      setCard({
        code: cardInput.trim().toUpperCase(),
        balance: res.balance,
        msg: `Voucher balance ${formatNaira(res.balance)}.`,
      });
    } catch (e) {
      setCard({
        code: "",
        balance: 0,
        msg: e instanceof Error ? e.message : "We could not check that voucher.",
      });
    }
  };

  const pay = async () => {
    const need = onlyCards
      ? [c.name, c.email, c.phone]
      : [r.name, r.phone, r.address, r.area, r.date, c.name, c.email, c.phone];
    if (need.some((v) => !v.trim()))
      return setError("Please complete every field marked as needed.");
    setError("");
    setBusy(true);
    try {
      if (marketing)
        await callAccount({
          action: "subscribe",
          email: c.email,
          name: c.name,
          source: "app-checkout",
        }).catch(() => undefined);
      const recipient = onlyCards
        ? {
            name: c.name,
            phone: c.phone,
            address: "Digital delivery",
            state: "Lagos",
            area: "Email or SMS",
            deliveryDate: new Date().toISOString().slice(0, 10),
            notes: "",
            surprise: false,
          }
        : { ...r, deliveryDate: r.date, surprise: sendTo === "someone" && surprise };
      const { authorizationUrl, ref } = await startCheckout({
        items,
        sendTo: onlyCards ? "me" : sendTo,
        promoCode: promo?.code ?? "",
        giftCardCode: card?.code ?? "",
        recipient,
        customer: c,
      });
      try {
        localStorage.setItem(APP_PAY_KEY, ref);
      } catch {
        /* private mode: the customer lands on the website's order page instead */
      }
      if (authorizationUrl) window.location.assign(authorizationUrl);
      else {
        await clearCart();
        void navigate({ to: "/app/order/$id", params: { id: ref }, replace: true });
      }
    } catch (e) {
      setBusy(false);
      setError(
        e instanceof Error ? e.message : "We could not start your payment. Please try again.",
      );
    }
  };

  return (
    <>
      <TopBar
        onBack={() => goBack(router.history, () => void navigate({ to: "/app/bag" }))}
        title="Checkout"
      />
      <div
        className="a-col a-desk-pad"
        style={{ padding: "4px 16px 28px", display: "flex", flexDirection: "column", gap: 18 }}
      >
        {!onlyCards && (
          <Card title="Who is it going to?">
            <div style={{ display: "flex", gap: 8 }}>
              {(["someone", "me"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={sendTo === s}
                  onClick={() => {
                    setSendTo(s);
                    if (s === "me" && user)
                      setR((x) => ({ ...x, name: user.name, phone: user.phone }));
                  }}
                  style={seg(sendTo === s)}
                >
                  {s === "someone" ? "Someone else" : "Me"}
                </button>
              ))}
            </div>
            {recipients.length > 0 && sendTo === "someone" && (
              <div className="a-hscroll" style={{ gap: 8, margin: "0 -14px", padding: "0 14px" }}>
                {recipients.map((x) => (
                  <button
                    key={x.id}
                    type="button"
                    onClick={() =>
                      setR((v) => ({
                        ...v,
                        name: x.name,
                        phone: x.phone,
                        address: x.address,
                        state: STATES.includes(x.state) ? x.state : v.state,
                        area: x.area,
                      }))
                    }
                    style={{
                      flexShrink: 0,
                      minHeight: 36,
                      padding: "0 12px",
                      borderRadius: 999,
                      border: `1.5px solid ${r.name === x.name ? C.nero : C.line}`,
                      background: "#FFFFFF",
                      fontSize: 13,
                      cursor: "pointer",
                      color: C.nero,
                    }}
                  >
                    {x.name}
                  </button>
                ))}
              </div>
            )}
            <Field
              label="Their name"
              value={r.name}
              onChange={(v) => setR({ ...r, name: v })}
              auto="off"
            />
            <Field
              label="Their phone"
              value={r.phone}
              onChange={(v) => setR({ ...r, phone: v })}
              type="tel"
            />
            <Field
              label="Address"
              value={r.address}
              onChange={(v) => setR({ ...r, address: v })}
              auto="street-address"
            />
            <div style={{ display: "flex", gap: 10 }}>
              <label style={{ flex: 1, minWidth: 0 }}>
                <span style={lab}>State</span>
                <select
                  value={r.state}
                  onChange={(e) => setR({ ...r, state: e.target.value })}
                  style={inp}
                >
                  {STATES.map((s) => (
                    <option key={s} value={s}>
                      {s} · {formatNaira(deliveryFeeFor(s))}
                    </option>
                  ))}
                </select>
              </label>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Field
                  label="City or area"
                  value={r.area}
                  onChange={(v) => setR({ ...r, area: v })}
                />
              </div>
            </div>
            <label>
              <span style={lab}>Delivery day</span>
              <input
                type="date"
                value={r.date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setR({ ...r, date: e.target.value })}
                style={inp}
              />
            </label>
            <Field
              label="Delivery notes (optional)"
              value={r.notes}
              onChange={(v) => setR({ ...r, notes: v })}
              placeholder="Gate code, landmark, best time"
            />
            {sendTo === "someone" && (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  fontSize: 14,
                }}
              >
                <span>
                  <strong style={{ display: "block" }}>Keep it a surprise</strong>
                  <span style={{ fontSize: 12, color: C.muted }}>
                    We won&rsquo;t call them before delivery.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={surprise}
                  onChange={(e) => setSurprise(e.target.checked)}
                  style={{ width: 22, height: 22, accentColor: C.nero }}
                />
              </label>
            )}
          </Card>
        )}

        <Card title="Your details">
          <Field
            label="Your name"
            value={c.name}
            onChange={(v) => setC({ ...c, name: v })}
            auto="name"
          />
          <Field
            label="Email"
            value={c.email}
            onChange={(v) => setC({ ...c, email: v })}
            type="email"
            auto="email"
          />
          <Field
            label="Phone"
            value={c.phone}
            onChange={(v) => setC({ ...c, phone: v })}
            type="tel"
            auto="tel"
          />
          <label
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              fontSize: 13,
              color: C.muted,
              lineHeight: 1.45,
            }}
          >
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              style={{ width: 20, height: 20, margin: 0, accentColor: C.nero, flexShrink: 0 }}
            />
            Send me gift ideas and offers. Order updates are always sent.
          </label>
        </Card>

        <Card title="Summary">
          {items.map((i) => (
            <div
              key={i.key}
              style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14 }}
            >
              <span>
                {i.quantity} × {i.name}
              </span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatNaira(i.price * i.quantity)}
              </span>
            </div>
          ))}
          <div
            style={{
              borderTop: `1px solid ${C.line}`,
              paddingTop: 10,
              display: "grid",
              gap: 6,
              fontSize: 14,
            }}
          >
            <Row k="Subtotal" v={formatNaira(subtotal)} />
            {discount > 0 && <Row k={`Promo ${promo?.code}`} v={`−${formatNaira(discount)}`} />}
            {!onlyCards && <Row k={`Delivery to ${r.state}`} v={formatNaira(fee)} />}
            {cardApplied > 0 && <Row k="Voucher" v={`−${formatNaira(cardApplied)}`} />}
          </div>
          <Apply
            label="Promo code"
            value={promoInput}
            onChange={setPromoInput}
            onApply={() => void applyPromoCode()}
            msg={promo?.msg}
            ok={Boolean(promo?.percent)}
          />
          {!items.some((i) => i.kind === "gift-card") && (
            <Apply
              label="Voucher code"
              value={cardInput}
              onChange={setCardInput}
              onApply={() => void applyVoucherCode()}
              msg={card?.msg}
              ok={Boolean(card?.balance)}
            />
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              borderTop: `1px solid ${C.line}`,
              paddingTop: 10,
            }}
          >
            <strong>Total</strong>
            <strong className="a-dsp" style={{ fontSize: 26, fontVariantNumeric: "tabular-nums" }}>
              {formatNaira(total)}
            </strong>
          </div>
        </Card>

        {error && (
          <p role="alert" style={{ fontSize: 13, color: C.oxblood, fontWeight: 600, margin: 0 }}>
            {error}
          </p>
        )}
        <button
          type="button"
          className="a-abtn a-lg a-gold"
          disabled={busy}
          onClick={() => void pay()}
          style={{ opacity: busy ? 0.6 : 1 }}
        >
          {busy ? "Opening secure payment…" : `Pay ${formatNaira(total)} securely`}
        </button>
        <p style={{ fontSize: 12, color: C.muted, textAlign: "center", margin: 0 }}>
          You&rsquo;ll pay on Paystack by card, transfer or USSD, then come straight back here.
        </p>
      </div>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: "#FFFFFF",
        borderRadius: 20,
        border: `1.5px solid ${C.line}`,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div className="a-eye">{title}</div>
      {children}
    </section>
  );
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  auto,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  auto?: string;
  placeholder?: string;
}) {
  return (
    <label style={{ display: "block" }}>
      <span style={lab}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={auto}
        placeholder={placeholder}
        style={inp}
      />
    </label>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: C.muted }}>{k}</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{v}</span>
    </div>
  );
}
function Apply({
  label,
  value,
  onChange,
  onApply,
  msg,
  ok,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onApply: () => void;
  msg?: string | undefined;
  ok: boolean;
}) {
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          aria-label={label}
          placeholder={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inp, flex: 1, minWidth: 0, height: 44 }}
        />
        <button type="button" onClick={onApply} className="a-abtn a-line" style={{ minHeight: 44 }}>
          Apply
        </button>
      </div>
      {msg && (
        <p
          role="status"
          style={{
            fontSize: 12,
            margin: "6px 0 0",
            color: ok ? C.forest : C.oxblood,
            fontWeight: 600,
          }}
        >
          {msg}
        </p>
      )}
    </div>
  );
}

const lab = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: C.muted,
  marginBottom: 6,
} as const;
const inp = {
  width: "100%",
  boxSizing: "border-box",
  height: 50,
  border: `1.5px solid ${C.line}`,
  borderRadius: 12,
  background: "#FFFFFF",
  padding: "0 12px",
  color: C.nero,
  fontFamily: "'Parkinsans',sans-serif",
} as const;
const seg = (on: boolean) =>
  ({
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    border: `${on ? 2 : 1.5}px solid ${on ? C.nero : C.line}`,
    background: on ? C.ivory : "#FFFFFF",
    fontWeight: on ? 700 : 400,
    fontSize: 14,
    cursor: "pointer",
    color: C.nero,
  }) as const;
