import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useOrders } from "@/hooks/use-shop";
import { ORDER_STEPS } from "@/config/shop";
import { formatNaira } from "@/lib/format";
import { C, TopBar, goBack, shortDate } from "@/components/app/kit";

export const Route = createFileRoute("/app/orders")({
  component: AppOrders,
});

function AppOrders() {
  const orders = useOrders();
  const navigate = useNavigate();
  const router = useRouter();
  return (
    <>
      <TopBar
        onBack={() => goBack(router.history, () => void navigate({ to: "/app/account" }))}
        title="Orders"
        hideBackOnDesk
      />
      <div className="a-col a-desk-pad" style={{ padding: "4px 16px 28px" }}>
        {orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 12px" }}>
            <img src="/brand/bow-gold.svg" alt="" style={{ width: 84, height: "auto" }} />
            <h1 className="a-dsp" style={{ fontSize: 28, marginTop: 12 }}>
              No orders yet.
            </h1>
            <Link to="/app/shop" className="a-abtn a-lg a-ink" style={{ marginTop: 20 }}>
              Shop gifts
            </Link>
          </div>
        ) : (
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 20,
              border: `1.5px solid ${C.line}`,
              padding: "4px 14px",
            }}
          >
            {orders.map((o, n) => (
              <Link
                key={o.id}
                to="/app/order/$id"
                params={{ id: o.id }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 0",
                  borderTop: n ? `1px solid ${C.line}` : 0,
                }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: "block", fontSize: 15 }}>
                    {o.items.map((i) => i.name).join(", ")}
                  </strong>
                  <span style={{ fontSize: 12, color: C.muted }}>
                    {o.id} · {shortDate(o.createdAt.slice(0, 10))} · {formatNaira(o.total)}
                  </span>
                </span>
                <span className="a-pill" style={{ background: o.status >= 3 ? C.sage : C.gold }}>
                  {ORDER_STEPS[o.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
