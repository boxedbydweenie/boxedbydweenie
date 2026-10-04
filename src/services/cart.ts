import { createStore } from "@/lib/store";
import { PROMO_CODES } from "@/config/shop";
import type { CartItem } from "@/types/shop";

export const cartStore = createStore<CartItem[]>("bbd-cart", []);

export const getCart = async () => cartStore.get();

export async function addToCart(item: Omit<CartItem, "key">) {
  const key = item.kind === "gift-card"
    ? `gc-${Date.now()}`
    : [item.productId, item.packaging, item.note, item.handwritten, item.deliveryDate].join("|");
  const cart = cartStore.get();
  const existing = cart.find((c) => c.key === key);
  cartStore.set(existing
    ? cart.map((c) => (c.key === key ? { ...c, quantity: c.quantity + item.quantity } : c))
    : [...cart, { ...item, key }]);
}

export async function updateQuantity(key: string, quantity: number) {
  cartStore.set(cartStore.get().map((c) => (c.key === key ? { ...c, quantity: Math.max(1, quantity) } : c)));
}

export async function removeFromCart(key: string) {
  cartStore.set(cartStore.get().filter((c) => c.key !== key));
}

export async function clearCart() { cartStore.set([]); }

export const cartSubtotal = (items: CartItem[]) => items.reduce((s, i) => s + i.price * i.quantity, 0);
export const cartCount = (items: CartItem[]) => items.reduce((s, i) => s + i.quantity, 0);

export async function applyPromo(code: string): Promise<{ ok: boolean; percent: number; message: string }> {
  const percent = PROMO_CODES[code.trim().toUpperCase()];
  return percent
    ? { ok: true, percent, message: `${percent}% off applied.` }
    : { ok: false, percent: 0, message: "That code is not valid." };
}
