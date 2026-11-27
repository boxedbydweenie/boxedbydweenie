import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-shop";
import { usePeople } from "@/hooks/use-calendar";
import { addToCart, cartCount } from "@/services/cart";
import { getProductBySlug, getRelated } from "@/services/products";
import { GIFT_NOTE_LIMIT, PACKAGING } from "@/config/shop";
import { earliestDelivery } from "@/config/delivery";
import { formatNaira } from "@/lib/format";
import type { PackagingChoice, ShopProduct } from "@/types/shop";
import { C, IconBag, IconCheck, TopBar, goBack } from "@/components/app/kit";

export const Route = createFileRoute("/app/shop/$slug")({
  validateSearch: z.object({ for: z.string().optional().catch(undefined) }),
  component: AppProduct,
});

function AppProduct() {
  const { slug } = Route.useParams();
  const { for: forId } = Route.useSearch();
  const person = usePeople().find((p) => p.id === forId);
  const bag = cartCount(useCart());
  const navigate = useNavigate();
  const router = useRouter();
  const [p, setP] = useState<ShopProduct | null | undefined>(undefined);
  const [img, setImg] = useState(0);
  const [packaging, setPackaging] = useState<PackagingChoice>("signature-black");
  const [note, setNote] = useState("");
  const [handwritten, setHandwritten] = useState(false);
  const [date, setDate] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setP(undefined);
    setImg(0);
    void getProductBySlug(slug).then(setP);
  }, [slug]);

  const back = () =>
    goBack(
      router.history,
      () => void navigate({ to: "/app/shop", search: forId ? { for: forId } : {} }),
    );
  const bagButton = (
    <Link
      to="/app/bag"
      aria-label={`Bag, ${bag} items`}
      style={{
        position: "relative",
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: C.nero,
        color: C.gold,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <IconBag style={{ width: 20, height: 20 }} />
      {bag > 0 && (
        <span className="a-badge" style={{ top: -4, left: "auto", right: -4 }}>
          {bag}
        </span>
      )}
    </Link>
  );

  if (p === undefined) {
    return (
      <>
        <TopBar onBack={back} right={bagButton} />
        <div
          style={{
            margin: "0 16px",
            aspectRatio: "1",
            borderRadius: 24,
            background: C.line,
            opacity: 0.5,
          }}
          aria-busy="true"
        />
      </>
    );
  }
  if (!p) {
    return (
      <>
        <TopBar onBack={back} right={bagButton} />
        <div className="a-col" style={{ padding: "48px 22px", textAlign: "center" }}>
          <h1 className="a-dsp" style={{ fontSize: 30 }}>
            That gift has moved.
          </h1>
          <Link to="/app/shop" className="a-abtn a-ink" style={{ marginTop: 18 }}>
            Back to the shop
          </Link>
        </div>
      </>
    );
  }

  const related = getRelated(p);
  const more = [...related.pairs, ...related.occasion]
    .filter((x, i, a) => a.findIndex((y) => y.id === x.id) === i)
    .slice(0, 4);
  const earliest = earliestDelivery(p.sameDay);

  const add = async () => {
    await addToCart({
      kind: "product",
      productId: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      quantity: qty,
      packaging,
      handwritten,
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(date ? { deliveryDate: date } : {}),
    });
    setAdded(true);
    toast.success(`${p.name} is in your bag`);
  };

  return (
    <>
      <TopBar
        onBack={back}
        title={<span className="a-only-desk">{p.name}</span>}
        right={bagButton}
      />
      <div
        className="a-wide a-desk-pad"
        style={{
          padding: "0 16px 28px",
          display: "grid",
          gap: 24,
          gridTemplateColumns: "minmax(0,1fr)",
        }}
      >
        <div className="a-product" style={{ display: "grid", gap: 24 }}>
          <style>{`@media (min-width:1024px){.a-product{grid-template-columns:minmax(0,1.1fr) minmax(0,1fr)!important;align-items:start;gap:40px!important}.a-product-media{position:sticky;top:76px}}`}</style>
          <div className="a-product-media">
            <div
              className="a-hscroll"
              style={{ gap: 10, margin: 0, padding: 0 }}
              onScroll={(e) =>
                setImg(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))
              }
            >
              {(p.images.length ? p.images : [""]).map((src, i) => (
                <div
                  key={i}
                  style={{
                    flex: "0 0 100%",
                    aspectRatio: "1",
                    borderRadius: 24,
                    overflow: "hidden",
                    background: "#FFFFFF",
                  }}
                >
                  {src && (
                    <img
                      src={src}
                      alt={i === 0 ? p.name : ""}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            {p.images.length > 1 && (
              <div
                style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}
                aria-hidden="true"
              >
                {p.images.map((_, i) => (
                  <span
                    key={i}
                    style={{
                      width: i === img ? 18 : 6,
                      height: 6,
                      borderRadius: 3,
                      background: i === img ? C.nero : C.line,
                      transition: "width .2s",
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div className="a-eye">{p.line}</div>
            <h1 className="a-dsp" style={{ fontSize: 38, marginTop: 8 }}>
              {p.name}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 10,
                flexWrap: "wrap",
              }}
            >
              <span className="a-dsp" style={{ fontSize: 28, fontVariantNumeric: "tabular-nums" }}>
                {formatNaira(p.price)}
              </span>
              {p.sameDay && (
                <span className="a-pill" style={{ background: C.sage }}>
                  Same-day in Lagos
                </span>
              )}
              {p.badges.map((b) => (
                <span key={b} className="a-pill" style={{ background: C.gold }}>
                  {b}
                </span>
              ))}
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: C.muted, marginTop: 14 }}>
              {p.description}
            </p>

            {p.inside.length > 0 && (
              <div
                style={{
                  marginTop: 18,
                  background: "#FFFFFF",
                  borderRadius: 20,
                  border: `1.5px solid ${C.line}`,
                  padding: "14px 16px",
                }}
              >
                <div className="a-eye">What&rsquo;s inside</div>
                <ul
                  style={{
                    margin: "10px 0 0",
                    padding: 0,
                    listStyle: "none",
                    display: "grid",
                    gap: 8,
                  }}
                >
                  {p.inside.map((i) => (
                    <li
                      key={i}
                      style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: 1.45 }}
                    >
                      <IconCheck
                        style={{ width: 16, height: 16, color: C.goldText, marginTop: 2 }}
                      />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {person ? (
              <div style={{ marginTop: 22, display: "grid", gap: 10 }}>
                <Link
                  to="/app/send/$personId"
                  params={{ personId: person.id }}
                  search={{ product: p.id }}
                  className="a-abtn a-lg a-gold"
                >
                  Send this to {person.name.split(" ")[0]}
                </Link>
                <p style={{ fontSize: 12, color: C.muted, textAlign: "center", margin: 0 }}>
                  Next: your card message and the delivery day.
                </p>
              </div>
            ) : (
              <>
                <Section title="Packaging">
                  <div style={{ display: "grid", gap: 8 }}>
                    {PACKAGING.map((o) => (
                      <button
                        key={o.slug}
                        type="button"
                        aria-pressed={packaging === o.slug}
                        onClick={() => setPackaging(o.slug)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                          textAlign: "left",
                          padding: "12px 14px",
                          borderRadius: 16,
                          border: `${packaging === o.slug ? 2 : 1.5}px solid ${packaging === o.slug ? C.nero : C.line}`,
                          background: "#FFFFFF",
                          cursor: "pointer",
                          color: C.nero,
                        }}
                      >
                        <strong style={{ fontSize: 14 }}>{o.name}</strong>
                        <span style={{ fontSize: 12, color: C.muted }}>{o.line}</span>
                      </button>
                    ))}
                  </div>
                </Section>
                <Section title="Gift note" aside={`${note.length}/${GIFT_NOTE_LIMIT}`}>
                  <textarea
                    value={note}
                    maxLength={GIFT_NOTE_LIMIT}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Write something they will keep"
                    aria-label="Gift note"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      borderRadius: 16,
                      border: `1.5px solid ${C.line}`,
                      background: "#FFFFFF",
                      padding: "12px 14px",
                      font: "400 18px/1.45 'EB Garamond',Georgia,serif",
                      color: C.nero,
                      resize: "vertical",
                    }}
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={handwritten}
                      onChange={(e) => setHandwritten(e.target.checked)}
                      style={{ width: 20, height: 20, margin: 0, accentColor: C.nero }}
                    />
                    Handwritten card
                  </label>
                </Section>
                <Section title="Delivery day">
                  <input
                    type="date"
                    aria-label="Delivery day"
                    min={earliest}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{
                      height: 50,
                      borderRadius: 14,
                      border: `1.5px solid ${C.line}`,
                      background: "#FFFFFF",
                      padding: "0 14px",
                      color: C.nero,
                    }}
                  />
                  <span style={{ fontSize: 12, color: C.muted }}>
                    Leave it empty to choose at checkout.
                  </span>
                </Section>
                <div style={{ display: "flex", gap: 10, marginTop: 22, alignItems: "stretch" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      border: `1.5px solid ${C.line}`,
                      borderRadius: 10,
                      background: "#FFFFFF",
                    }}
                  >
                    <button
                      type="button"
                      aria-label="One fewer"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      style={stepBtn}
                    >
                      −
                    </button>
                    <span
                      style={{
                        minWidth: 26,
                        textAlign: "center",
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                      }}
                      aria-live="polite"
                    >
                      {qty}
                    </span>
                    <button
                      type="button"
                      aria-label="One more"
                      onClick={() => setQty((q) => q + 1)}
                      style={stepBtn}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="a-abtn a-lg a-gold"
                    disabled={!p.inStock}
                    onClick={() => void add()}
                    style={{ flex: 1, opacity: p.inStock ? 1 : 0.5 }}
                  >
                    {p.inStock ? `Add to bag · ${formatNaira(p.price * qty)}` : "Sold out"}
                  </button>
                </div>
                {added && (
                  <Link to="/app/bag" className="a-abtn a-lg a-ink" style={{ marginTop: 10 }}>
                    View bag and check out
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {more.length > 0 && (
          <div>
            <div className="a-eye" style={{ padding: "0 6px" }}>
              You might also love
            </div>
            <div className="a-grid-products" style={{ marginTop: 12 }}>
              {more.map((x) => (
                <Link
                  key={x.id}
                  to="/app/shop/$slug"
                  params={{ slug: x.slug }}
                  search={forId ? { for: forId } : {}}
                  style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}
                >
                  <div
                    style={{
                      aspectRatio: "4/5",
                      borderRadius: 20,
                      overflow: "hidden",
                      background: "#FFFFFF",
                    }}
                  >
                    {x.images[0] && (
                      <img
                        src={x.images[0]}
                        alt={x.name}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    )}
                  </div>
                  <strong className="a-dsp" style={{ fontSize: 18 }}>
                    {x.name}
                  </strong>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{formatNaira(x.price)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div className="a-eye">{title}</div>
        {aside && (
          <span style={{ fontSize: 12, color: C.muted, fontVariantNumeric: "tabular-nums" }}>
            {aside}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

const stepBtn = {
  width: 42,
  height: "100%",
  minHeight: 50,
  border: 0,
  background: "none",
  fontSize: 20,
  cursor: "pointer",
  color: C.nero,
} as const;
