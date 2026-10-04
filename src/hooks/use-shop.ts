import { useSyncExternalStore } from "react";
import { cartStore } from "@/services/cart";
import { recipientsStore, userStore, wishlistStore } from "@/services/account";
import { ordersStore } from "@/services/orders";

type Store<T> = { get: () => T; server: () => T; subscribe: (l: () => void) => () => void };
const useStore = <T,>(s: Store<T>) => useSyncExternalStore(s.subscribe, s.get, s.server);

export const useCart = () => useStore(cartStore);
export const useWishlist = () => useStore(wishlistStore);
export const useUser = () => useStore(userStore);
export const useRecipients = () => useStore(recipientsStore);
export const useOrders = () => useStore(ordersStore);

/** Session-only UI state for the cart drawer and search overlay. */
const ui = (() => {
  let state = { cart: false, search: false };
  const ls = new Set<() => void>();
  return {
    get: () => state, server: () => state,
    set: (p: Partial<typeof state>) => { state = { ...state, ...p }; ls.forEach((l) => l()); },
    subscribe: (l: () => void) => { ls.add(l); return () => { ls.delete(l); }; },
  };
})();
export const useUi = () => useSyncExternalStore(ui.subscribe, ui.get, ui.server);
export const openCart = (open = true) => ui.set({ cart: open });
export const openSearch = (open = true) => ui.set({ search: open });
