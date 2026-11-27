import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useCart } from "@/hooks/use-shop";
import { cartSubtotal, removeFromCart, updateQuantity } from "@/services/cart";
import { getProductById } from "@/services/products";
import { PACKAGING } from "@/config/shop";
import { formatNaira } from "@/lib/format";
import { C, TopBar, goBack, shortDate } from "@/components/app/kit";

export const Route = createFileRoute("/app/bag")({
  component: AppBag,
});

function AppBag() {
  const items = useCart();
  const navigate = useNavigate();
  const router = useRouter();
  const subtotal = cartSubtotal(items);

  return (
    <>
      <TopBar
        onBack={() => goBack(router.history, () => void navigate({ to: "/app/shop" }))}
        title="Your bag"
        hideBackOnDesk
      />
      <div className="a-col a-desk-pad" style={{ padding: "4px 16px 28px" }}>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 12px" }}>
            <img src="/brand/bow-gold.svg" alt="" style={{ width: 84, height: "auto" }} />
            <h1 className="a-dsp" style={{ fontSize: 30, marginTop: 12 }}>
              Your bag is <span style={{ color: C.goldText }}>empty.</span>
            </h1>
            <p style={{ fontSize: 14, color: C.muted, marginTop: 8 }}>
              Find a box for the next date on your calendar.
            </p>
            <Link to="/app/shop" className="a-abtn a-lg a-ink" style={{ marginTop: 22 }}>
              Shop gifts
            </Link>
          </div>
        ) : (
          <>
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 20,
                border: `1.5px solid ${C.line}`,
                padding: "4px 14px",
              }}
            >
              {items.map((i, n) => {
                const p = i.kind === "product" ? getProductById(i.productId) : null;
                const pack = PACKAGING.find((x) => x.slug === i.packaging)?.name;
                const details =
                  i.kind === "gift-card" && i.giftCard
                    ? [
                        `For ${i.giftCard.recipientName}`,
                        i.giftCard.sendOn
                          ? `arrives ${shortDate(i.giftCard.sendOn)}`
                          : "sent today",
                      ]
                    : [
                        pack,
                        i.deliveryDate ? `arrives ${shortDate(i.deliveryDate)}` : null,
                        i.note ? "with a gift note" : null,
                      ];
                return (
                  <div
                    key={i.key}
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: "14px 0",
                      borderTop: n ? `1px solid ${C.line}` : 0,
                    }}
                  >
                    {p?.images[0] ? (
                      <img
                        src={p.images[0]}
                        alt=""
                        style={{
                          width: 72,
                          height: 88,
                          borderRadius: 12,
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <span
                        className="a-pat-nero"
                        style={{
                          width: 72,
                          height: 88,
                          borderRadius: 12,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <img
                          src="/brand/bow-gold.svg"
                          alt=""
                          style={{ width: 40, height: "auto" }}
                        />
                      </span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong className="a-dsp" style={{ fontSize: 19, display: "block" }}>
                        {i.name}
                      </strong>
                      <span style={{ fontSize: 12, color: C.muted }}>
                        {details.filter(Boolean).join(" · ")}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: 8,
                          gap: 8,
                        }}
                      >
                        {i.kind === "product" ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              border: `1.5px solid ${C.line}`,
                              borderRadius: 10,
                            }}
                          >
                            <button
                              type="button"
                              aria-label={`One fewer ${i.name}`}
                              onClick={() =>
                                void (i.quantity > 1
                                  ? updateQuantity(i.key, i.quantity - 1)
                                  : removeFromCart(i.key))
                              }
                              style={qtyBtn}
                            >
                              −
                            </button>
                            <span
                              style={{
                                minWidth: 22,
                                textAlign: "center",
                                fontWeight: 700,
                                fontSize: 14,
                              }}
                            >
                              {i.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`One more ${i.name}`}
                              onClick={() => void updateQuantity(i.key, i.quantity + 1)}
                              style={qtyBtn}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <span />
                        )}
                        <strong style={{ fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
                          {formatNaira(i.price * i.quantity)}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => void removeFromCart(i.key)}
                        style={{
                          marginTop: 6,
                          border: 0,
                          background: "none",
                          padding: 0,
                          fontSize: 12,
                          fontWeight: 600,
                          color: C.oxblood,
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                margin: "18px 4px 4px",
              }}
            >
              <span style={{ fontSize: 14, color: C.muted }}>Subtotal</span>
              <strong
                className="a-dsp"
                style={{ fontSize: 26, fontVariantNumeric: "tabular-nums" }}
              >
                {formatNaira(subtotal)}
              </strong>
            </div>
            <p style={{ fontSize: 12, color: C.muted, margin: "0 4px 16px" }}>
              Delivery is added at checkout, based on the state.
            </p>
            <Link to="/app/checkout" className="a-abtn a-lg a-gold">
              Check out
            </Link>
            <Link to="/app/shop" className="a-abtn a-lg a-line" style={{ marginTop: 10 }}>
              Keep shopping
            </Link>
          </>
        )}
      </div>
    </>
  );
}

const qtyBtn = {
  width: 34,
  height: 34,
  border: 0,
  background: "none",
  fontSize: 18,
  cursor: "pointer",
  color: C.nero,
} as const;
