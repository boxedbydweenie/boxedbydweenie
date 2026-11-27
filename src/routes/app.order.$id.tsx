import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getOrder, lookupOrder, verifyPayment, type ServerOrder } from "@/services/orders";
import { clearCart } from "@/services/cart";
import { ORDER_STEPS } from "@/config/shop";
import { formatNaira } from "@/lib/format";
import type { Order } from "@/types/shop";
import { APP_PAY_KEY, C, IconCheck, TopBar, shortDate } from "@/components/app/kit";

export const Route = createFileRoute("/app/order/$id")({
  validateSearch: (s: Record<string, unknown>): { verify?: 1 } =>
    s["verify"] ? { verify: 1 } : {},
  component: AppOrder,
});

function AppOrder() {
  const { id } = Route.useParams();
  const { verify } = Route.useSearch();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [pay, setPay] = useState<ServerOrder["status"] | null>(null);
  const [cards, setCards] = useState<{ code: string; amount: number }[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        localStorage.removeItem(APP_PAY_KEY);
      } catch {
        /* ignore */
      }
      if (verify) {
        try {
          const o = await verifyPayment(id);
          if (!live) return;
          setPay(o.payment_status);
          setOrder(o);
          if (o.payment_status === "paid") await clearCart();
        } catch (e) {
          if (!live) return;
          setError(e instanceof Error ? e.message : "We could not check your payment.");
          setOrder(await getOrder(id));
        }
      } else setOrder(await getOrder(id));
    })();
    return () => {
      live = false;
    };
  }, [id, verify]);

  useEffect(() => {
    if (pay !== "paid" || !order?.customer.email) return;
    lookupOrder(id, order.customer.email)
      .then((o) => setCards(o.giftCards))
      .catch(() => undefined);
  }, [pay, order?.customer.email, id]);

  if (order === undefined) {
    return (
      <div className="a-col" style={{ padding: "96px 22px", textAlign: "center" }}>
        <img
          className="a-sway"
          src="/brand/bow-gold.svg"
          alt=""
          style={{ width: 96, height: "auto" }}
        />
        <p className="a-dsp" style={{ fontSize: 24, marginTop: 14 }}>
          {verify ? "Confirming your payment…" : "Loading your order…"}
        </p>
      </div>
    );
  }
  if (!order) {
    return (
      <>
        <TopBar title={`Order ${id}`} />
        <div className="a-col" style={{ padding: "40px 22px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: C.muted }}>
            We couldn&rsquo;t find this order on this device.
          </p>
          <a
            href={`/order/${encodeURIComponent(id)}`}
            className="a-abtn a-ink"
            style={{ marginTop: 16 }}
          >
            Track it with your email
          </a>
        </div>
      </>
    );
  }

  const unpaid = pay === "pending_payment" || pay === "payment_failed";
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        className="a-pat-green"
        style={{
          color: "#FFFFFF",
          padding: "calc(env(safe-area-inset-top,0px) + 48px) 22px 30px",
          textAlign: "center",
        }}
      >
        <img
          className="a-sway"
          src="/brand/bow-gold.svg"
          alt=""
          style={{ width: 110, height: "auto" }}
        />
        <div className="a-eye" style={{ color: C.gold, marginTop: 14 }}>
          {unpaid ? "Payment not received" : "Order confirmed"}
        </div>
        <h1 className="a-dsp" style={{ fontSize: 36, marginTop: 10 }}>
          {unpaid ? "Your payment didn't go through." : "Your moment is being boxed."}
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,.82)", marginTop: 10 }}>
          Order <strong style={{ color: "#FFFFFF" }}>{order.id}</strong>
          {unpaid
            ? ". Nothing was charged and your bag is still here."
            : pay === "paid"
              ? ". Payment received."
              : ""}
        </p>
      </div>
      <div
        className="a-col a-desk-pad"
        style={{ padding: "18px 16px 28px", display: "flex", flexDirection: "column", gap: 16 }}
      >
        {error && (
          <p role="alert" style={{ fontSize: 13, color: C.oxblood, fontWeight: 600, margin: 0 }}>
            {error}
          </p>
        )}
        {unpaid ? (
          <Link to="/app/checkout" className="a-abtn a-lg a-gold">
            Try paying again
          </Link>
        ) : (
          <ol
            style={{
              listStyle: "none",
              margin: 0,
              padding: 16,
              background: "#FFFFFF",
              borderRadius: 20,
              border: `1.5px solid ${C.line}`,
              display: "grid",
              gap: 12,
            }}
            aria-label="Order progress"
          >
            {ORDER_STEPS.map((s, i) => {
              const done = i <= order.status;
              return (
                <li
                  key={s}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    fontSize: 14,
                    fontWeight: i === order.status ? 700 : 400,
                    color: done ? C.nero : C.muted,
                  }}
                  aria-current={i === order.status ? "step" : undefined}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: done ? C.gold : C.ivory,
                      border: `1.5px solid ${done ? C.gold : C.line}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {i < order.status ? (
                      <IconCheck style={{ width: 14, height: 14, strokeWidth: 3 }} />
                    ) : (
                      i + 1
                    )}
                  </span>
                  {s}
                </li>
              );
            })}
          </ol>
        )}
        {cards.length > 0 && (
          <section
            style={{
              borderRadius: 20,
              border: `2px solid ${C.gold}`,
              background: "#FBF6E6",
              padding: 16,
              textAlign: "center",
            }}
          >
            <div className="a-eye">Voucher {cards.length > 1 ? "codes" : "code"}</div>
            {cards.map((cd) => (
              <div
                key={cd.code}
                style={{
                  fontFamily: "ui-monospace,Menlo,monospace",
                  fontSize: 17,
                  fontWeight: 700,
                  letterSpacing: ".06em",
                  marginTop: 8,
                }}
              >
                {cd.code}{" "}
                <span
                  style={{ fontFamily: "inherit", fontSize: 13, fontWeight: 400, color: C.muted }}
                >
                  · {formatNaira(cd.amount)}
                </span>
              </div>
            ))}
          </section>
        )}
        <section
          style={{
            background: "#FFFFFF",
            borderRadius: 20,
            border: `1.5px solid ${C.line}`,
            padding: 16,
            display: "grid",
            gap: 8,
            fontSize: 14,
          }}
        >
          <div className="a-eye">Summary</div>
          {order.items.map((i) => (
            <div key={i.key} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span>
                {i.quantity} × {i.name}
              </span>
              <span>{formatNaira(i.price * i.quantity)}</span>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: `1px solid ${C.line}`,
              paddingTop: 8,
              fontWeight: 700,
            }}
          >
            <span>Total</span>
            <span>{formatNaira(order.total)}</span>
          </div>
          <div style={{ color: C.muted, fontSize: 13 }}>
            To {order.recipient.name},{" "}
            {[order.recipient.area, order.recipient.state].filter(Boolean).join(", ")} ·{" "}
            {shortDate(order.recipient.deliveryDate)}
          </div>
        </section>
        <Link to="/app" className="a-abtn a-lg a-ink">
          Back to my calendar
        </Link>
        <Link to="/app/orders" className="a-abtn a-lg a-line">
          All my orders
        </Link>
      </div>
    </div>
  );
}
