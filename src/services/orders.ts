import { createStore } from "@/lib/store";
import type { Order } from "@/types/shop";

const seed: Order[] = [
  {
    id: "BBD-24817", createdAt: "2026-09-12T10:20:00", status: 3, sendTo: "someone", payment: "card",
    items: [{ key: "s1", kind: "product", productId: "prd-001", slug: "the-signature-box", name: "The Signature Box", price: 65000, quantity: 1, packaging: "signature-black", note: "Happy birthday, Amaka." }],
    subtotal: 65000, discount: 0, deliveryFee: 5000, total: 70000,
    recipient: { name: "Amaka O.", phone: "0800 000 0000", address: "12 Admiralty Way", state: "Lagos", area: "Lekki Phase 1", deliveryDate: "2026-09-14", notes: "", surprise: true },
    customer: { name: "You", email: "you@example.com", phone: "0800 000 0000" },
  },
  {
    id: "BBD-25102", createdAt: "2026-09-29T15:05:00", status: 1, sendTo: "me", payment: "transfer",
    items: [{ key: "s2", kind: "product", productId: "prd-009", slug: "sunday-morning", name: "Sunday Morning", price: 58000, quantity: 1, packaging: "ivory" }],
    subtotal: 58000, discount: 0, deliveryFee: 9000, total: 67000,
    recipient: { name: "You", phone: "0800 000 0000", address: "4 Aminu Kano Crescent", state: "FCT Abuja", area: "Wuse 2", deliveryDate: "2026-10-06", notes: "", surprise: false },
    customer: { name: "You", email: "you@example.com", phone: "0800 000 0000" },
  },
];

export const ordersStore = createStore<Order[]>("bbd-orders", seed);

export const getOrders = async () => ordersStore.get();
export const getOrder = async (id: string) => ordersStore.get().find((o) => o.id === id) ?? null;

export async function createOrder(input: Omit<Order, "id" | "createdAt" | "status">): Promise<Order> {
  const order: Order = { ...input, id: `BBD-${Math.floor(30000 + Math.random() * 60000)}`, createdAt: new Date().toISOString(), status: 0 };
  ordersStore.set([order, ...ordersStore.get()]);
  await new Promise((r) => setTimeout(r, 700));
  return order;
}
