import { createStore } from "@/lib/store";
import { callShop } from "@/lib/api";
import type { CartItem, Order, OrderStatus } from "@/types/shop";

/**
 * Orders live in Supabase. A copy of what the customer typed is also kept in this browser,
 * so the confirmation page can show the full delivery address without the server sending it back.
 */
export const ordersStore = createStore<Order[]>("bbd-orders", []);

/** What the server returns about an order (no address or contact details). */
export interface ServerOrder {
  ref: string;
  status: "pending_payment" | "paid" | "packed" | "out_for_delivery" | "delivered" | "cancelled" | "payment_failed";
  createdAt: string;
  paidAt: string | null;
  items: { productId: string; slug: string; name: string; price: number; quantity: number }[];
  subtotal: number; discount: number; deliveryFee: number; total: number;
  recipient: { name: string; state: string; area: string; deliveryDate: string; phone?: string; address?: string; notes?: string; surprise?: boolean };
  customer: { name: string; email?: string; phone?: string };
}

const STEP: Record<ServerOrder["status"], OrderStatus> = {
  pending_payment: 0, payment_failed: 0, cancelled: 0, paid: 0, packed: 1, out_for_delivery: 2, delivered: 3,
};

/** Merge the server's status and totals into the local copy (or build one from the server alone). */
export function mergeOrder(s: ServerOrder): Order & { payment_status: ServerOrder["status"] } {
  const local = ordersStore.get().find((o) => o.id === s.ref);
  const merged: Order = {
    ...(local ?? {
      id: s.ref, createdAt: s.createdAt, sendTo: "someone", payment: "card",
      recipient: { name: s.recipient.name, phone: s.recipient.phone ?? "", address: s.recipient.address ?? "", state: s.recipient.state, area: s.recipient.area, deliveryDate: s.recipient.deliveryDate, notes: s.recipient.notes ?? "", surprise: Boolean(s.recipient.surprise) },
      customer: { name: s.customer.name, email: s.customer.email ?? "", phone: s.customer.phone ?? "" },
    }),
    items: s.items.map((i, k) => ({ key: `${i.productId}-${k}`, kind: i.productId === "prd-gift-card" ? "gift-card" : "product", productId: i.productId, slug: i.slug, name: i.name, price: i.price, quantity: i.quantity }) as CartItem),
    subtotal: s.subtotal, discount: s.discount, deliveryFee: s.deliveryFee, total: s.total,
    status: STEP[s.status],
  } as Order;
  ordersStore.set([merged, ...ordersStore.get().filter((o) => o.id !== s.ref)]);
  return { ...merged, payment_status: s.status };
}

export const getOrders = async () => ordersStore.get();
export const getOrder = async (id: string) => ordersStore.get().find((o) => o.id === id) ?? null;

export interface CheckoutInput {
  items: CartItem[];
  sendTo: Order["sendTo"];
  recipient: Order["recipient"];
  customer: Order["customer"];
  promoCode?: string;
}

/** Creates the order on the server and returns the Paystack page to send the customer to. */
export async function startCheckout(input: CheckoutInput & { giftCardCode?: string }): Promise<{ ref: string; authorizationUrl: string | null }> {
  const r = await callShop<{ order: ServerOrder; authorizationUrl: string | null; reference: string }>("create-order", {
    items: input.items.map((i) => ({ productId: i.kind === "gift-card" ? "prd-gift-card" : i.productId, quantity: i.quantity, packaging: i.packaging, note: i.note, handwritten: i.handwritten, price: i.price, giftCard: i.giftCard ? { amount: i.price, toName: i.giftCard.recipientName, toEmail: i.giftCard.recipientContact, message: i.giftCard.message, sendOn: i.giftCard.sendOn ?? "" } : undefined })),
    sendTo: input.sendTo, recipient: input.recipient, customer: input.customer, promoCode: input.promoCode, giftCardCode: input.giftCardCode ?? "",
  });
  const local: Order = {
    id: r.order.ref, createdAt: r.order.createdAt, items: input.items, sendTo: input.sendTo, payment: "card",
    subtotal: r.order.subtotal, discount: r.order.discount, deliveryFee: r.order.deliveryFee, total: r.order.total,
    status: 0, recipient: input.recipient, customer: input.customer,
  };
  ordersStore.set([local, ...ordersStore.get().filter((o) => o.id !== local.id)]);
  return { ref: r.reference, authorizationUrl: r.authorizationUrl };
}

/** After Paystack sends the customer back: confirm the payment with the server. */
export async function verifyPayment(ref: string) {
  const r = await callShop<{ order: ServerOrder }>("verify", { reference: ref });
  return mergeOrder(r.order);
}

/** Order tracking by order number and email. */
export async function lookupOrder(ref: string, email: string) {
  const r = await callShop<{ order: ServerOrder; giftCards?: { code: string; amount: number }[] }>("get-order", { ref, email });
  return { ...mergeOrder(r.order), giftCards: r.giftCards ?? [] };
}
