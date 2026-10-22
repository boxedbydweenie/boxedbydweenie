import { createStore } from "@/lib/store";
import { callAccount } from "@/lib/api";
import { customerClient } from "@/lib/supabase";
import type { AccountUser, Recipient } from "@/types/shop";

export const userStore = createStore<AccountUser | null>("bbd-user", null);
export const wishlistStore = createStore<string[]>("bbd-wishlist", []);
export const recipientsStore = createStore<Recipient[]>("bbd-recipients", []);

const toUser = (u: { email?: string | undefined; user_metadata?: Record<string, unknown> | undefined }): AccountUser => ({
  name: String(u.user_metadata?.["name"] ?? u.email?.split("@")[0] ?? "Guest"), email: u.email ?? "", phone: String(u.user_metadata?.["phone"] ?? ""),
});

/** Create a real customer account, then sign in. */
export async function signUp(input: { name: string; email: string; phone: string; password: string; marketing?: boolean }) {
  await callAccount({ action: "signup", ...input });
  await signIn(input.email, input.password);
}
export async function signIn(email: string, password: string) {
  const { data, error } = await customerClient().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error || !data.user) throw new Error("That email and password do not match. Check them and try again.");
  userStore.set(toUser(data.user));
}
export async function signOut() {
  await customerClient().auth.signOut();
  userStore.set(null);
}
export async function updateDetails(user: AccountUser) {
  const { data, error } = await customerClient().auth.updateUser({ data: { name: user.name, phone: user.phone } });
  if (error) throw new Error("We could not save your details. Please try again.");
  userStore.set(toUser(data.user));
}
export async function changePassword(password: string) {
  if (password.length < 8) throw new Error("Choose a password of at least 8 characters.");
  const { error } = await customerClient().auth.updateUser({ password });
  if (error) throw new Error("We could not change your password. Please sign in again and retry.");
}
export { toUser };

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
