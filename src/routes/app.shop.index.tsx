import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useCart } from "@/hooks/use-shop";
import { usePeople } from "@/hooks/use-calendar";
import { cartCount } from "@/services/cart";
import { filterProducts, getProducts } from "@/services/products";
import { giftIdeas } from "@/services/calendar";
import { OCCASIONS, PRICE_BANDS, RECIPIENTS } from "@/config/shop";
import { formatNaira } from "@/lib/format";
import type { ShopProduct } from "@/types/shop";
import { C, IconBag, IconSearch } from "@/components/app/kit";

export const Route = createFileRoute("/app/shop/")({
  validateSearch: z.object({
    for: z.string().optional().catch(undefined),
    occasion: z.string().optional().catch(undefined),
    q: z.string().optional().catch(undefined),
  }),
  component: AppShop,
});

type Chip = { key: string; label: string; kind: "occasion" | "recipient" | "budget" | "sameday" };
const CHIPS: Chip[] = [
  ...OCCASIONS.map((o) => ({ key: o.slug, label: o.name, kind: "occasion" as const })),
  ...RECIPIENTS.map((r) => ({ key: r.slug, label: r.name, kind: "recipient" as const })),
  ...PRICE_BANDS.map((b) => ({ key: b.slug, label: b.name, kind: "budget" as const })),
  { key: "sameday", label: "Same-day Lagos", kind: "sameday" },
];

/** The BBD shop inside the app: same products, prices and stock as boxedbydweenie.com. */
function AppShop() {
  const search = Route.useSearch();
  const people = usePeople();
  const bag = cartCount(useCart());
  const [all, setAll] = useState<ShopProduct[] | null>(null);
  const [q, setQ] = useState(search.q ?? "");
  const [picked, setPicked] = useState<Chip | null>(() =>
    search.occasion
      ? (CHIPS.find((c) => c.kind === "occasion" && c.key === search.occasion) ?? null)
      : null,
  );
  const person = people.find((p) => p.id === search.for);

  useEffect(() => {
    void getProducts().then(setAll);
  }, []);

  const list = useMemo(() => {
    if (!all) return [];
    const shoppable = all.filter((p) => p.category !== "gift-cards" && p.category !== "packaging");
    const filtered = filterProducts(shoppable, {
      q: q || undefined,
      occasion: picked?.kind === "occasion" ? picked.key : undefined,
      recipient: picked?.kind === "recipient" ? picked.key : undefined,
      budget: picked?.kind === "budget" ? picked.key : undefined,
      sameday: picked?.kind === "sameday" ? true : undefined,
    });
    if (!person || q || picked) return filtered;
    // Shopping for someone: their best matches first.
    const ideas = giftIdeas(person, 8).map((p) => p.id);
    return [...filtered].sort(
      (a, b) =>
        (ideas.includes(a.id) ? ideas.indexOf(a.id) : 99) -
        (ideas.includes(b.id) ? ideas.indexOf(b.id) : 99),
    );
  }, [all, q, picked, person]);

  return (
    <div
      className="a-top-pattern a-desk-pad"
      style={{ padding: "calc(env(safe-area-inset-top,0px) + 34px) 16px 24px" }}
    >
      <div className="a-wide">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            padding: "0 6px",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div className="a-eye">
              {person ? `Shopping for ${person.name.split(" ")[0]}` : "The BBD shop"}
            </div>
            <h1 className="a-dsp" style={{ fontSize: 38, marginTop: 6 }}>
              {person ? (
                <>
                  Something {person.name.split(" ")[0]}{" "}
                  <span style={{ color: C.goldText }}>will love.</span>
                </>
              ) : (
                <>
                  Find the perfect <span style={{ color: C.goldText }}>wow.</span>
                </>
              )}
            </h1>
          </div>
          <Link
            to="/app/bag"
            aria-label={`Bag, ${bag} items`}
            style={{
              position: "relative",
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: C.nero,
              color: C.gold,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconBag />
            {bag > 0 && (
              <span className="a-badge" style={{ top: -4, left: "auto", right: -4 }}>
                {bag}
              </span>
            )}
          </Link>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "18px 0 0",
            background: "#FFFFFF",
            border: `1.5px solid ${C.line}`,
            borderRadius: 14,
            padding: "0 14px",
            height: 50,
          }}
        >
          <IconSearch style={{ width: 20, height: 20, color: C.muted }} />
          <span style={{ position: "absolute", left: -9999 }}>Search the shop</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search boxes, hampers, for him…"
            type="search"
            style={{
              flex: 1,
              minWidth: 0,
              border: 0,
              background: "transparent",
              outline: "none",
              color: C.nero,
              font: "400 16px 'Parkinsans',sans-serif",
            }}
          />
        </label>

        <div className="a-hscroll" style={{ gap: 8, marginTop: 14 }}>
          {person && !picked && !q && (
            <span
              className="a-pill"
              style={{ background: C.gold, minHeight: 40, padding: "0 14px", flexShrink: 0 }}
            >
              Best for {person.name.split(" ")[0]}
            </span>
          )}
          {CHIPS.map((c) => {
            const on = picked?.key === c.key && picked.kind === c.kind;
            return (
              <button
                key={`${c.kind}-${c.key}`}
                type="button"
                aria-pressed={on}
                onClick={() => setPicked(on ? null : c)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 40,
                  padding: "0 14px",
                  borderRadius: 999,
                  border: `1.5px solid ${on ? C.nero : C.line}`,
                  background: on ? C.nero : "#FFFFFF",
                  color: on ? "#FFFFFF" : C.nero,
                  fontSize: 13,
                  fontWeight: on ? 600 : 400,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {all === null ? (
          <div className="a-grid-products" style={{ marginTop: 18 }} aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                style={{ aspectRatio: "4/5", borderRadius: 20, background: C.line, opacity: 0.5 }}
              />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 12px" }}>
            <img src="/brand/bow-gold.svg" alt="" style={{ width: 72, height: "auto" }} />
            <p className="a-dsp" style={{ fontSize: 24, marginTop: 10 }}>
              Nothing matches yet.
            </p>
            <button
              type="button"
              onClick={() => {
                setQ("");
                setPicked(null);
              }}
              className="a-abtn a-line"
              style={{ margin: "16px auto 0" }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="a-grid-products" style={{ marginTop: 18 }}>
            {list.map((p) => (
              <ProductCard key={p.id} p={p} forId={person?.id} />
            ))}
          </div>
        )}

        <Link
          to="/app/vouchers"
          search={person ? { for: person.id } : {}}
          className="a-pat-nero"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginTop: 24,
            borderRadius: 20,
            padding: 18,
            color: "#FFFFFF",
          }}
        >
          <img
            src="/brand/bow-gold.svg"
            alt=""
            style={{ width: 56, height: "auto", flexShrink: 0 }}
          />
          <span style={{ flex: 1, minWidth: 0 }}>
            <strong className="a-dsp" style={{ display: "block", fontSize: 22 }}>
              Not sure what to choose?
            </strong>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,.8)" }}>
              Send a gift voucher and let them choose their wow.
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}

function ProductCard({ p, forId }: { p: ShopProduct; forId?: string | undefined }) {
  return (
    <Link
      to="/app/shop/$slug"
      params={{ slug: p.slug }}
      search={forId ? { for: forId } : {}}
      style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "4/5",
          borderRadius: 20,
          overflow: "hidden",
          background: "#FFFFFF",
        }}
      >
        {p.images[0] && (
          <img
            src={p.images[0]}
            alt={p.name}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
        {p.badges[0] && (
          <span
            className="a-pill"
            style={{ position: "absolute", top: 10, left: 10, background: C.gold }}
          >
            {p.badges[0]}
          </span>
        )}
        {!p.inStock && (
          <span
            className="a-pill"
            style={{
              position: "absolute",
              bottom: 10,
              left: 10,
              background: C.nero,
              color: "#FFFFFF",
            }}
          >
            Sold out
          </span>
        )}
      </div>
      <strong className="a-dsp" style={{ fontSize: 19, marginTop: 2 }}>
        {p.name}
      </strong>
      <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
        {formatNaira(p.price)}
      </span>
    </Link>
  );
}
