import { createStore } from "@/lib/store";
import type { AccountUser, Recipient } from "@/types/shop";

export const userStore = createStore<AccountUser | null>("bbd-user", null);
export const wishlistStore = createStore<string[]>("bbd-wishlist", []);
export const recipientsStore = createStore<Recipient[]>("bbd-recipients", [
  { id: "r1", name: "Amaka O.", phone: "0800 000 0000", address: "12 Admiralty Way", state: "Lagos", area: "Lekki Phase 1" },
]);

/** Mock sign-in: any email works. */
export async function signIn(email: string) {
  const name = email.split("@")[0] ?? "Guest";
  userStore.set({ name: name.charAt(0).toUpperCase() + name.slice(1), email, phone: "" });
}
export async function signOut() { userStore.set(null); }
export async function updateDetails(user: AccountUser) { userStore.set(user); }

export async function toggleWishlist(productId: string) {
  const list = wishlistStore.get();
  wishlistStore.set(list.includes(productId) ? list.filter((id) => id !== productId) : [...list, productId]);
}

export async function saveRecipient(r: Omit<Recipient, "id">) {
  recipientsStore.set([...recipientsStore.get(), { ...r, id: `r${Date.now()}` }]);
}
export async function removeRecipient(id: string) {
  recipientsStore.set(recipientsStore.get().filter((r) => r.id !== id));
}
