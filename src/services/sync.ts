import { customerClient } from "@/lib/supabase";
import { recipientsStore, toUser, userStore, wishlistStore } from "@/services/account";
import { peopleStore, scheduledStore } from "@/services/calendar";
import { mergeOrder, ordersStore, type ServerOrder } from "@/services/orders";

type Syncable = { get: () => unknown; set: (v: never) => void; subscribe: (l: () => void) => () => void };
const KEYS: [string, Syncable, unknown][] = [
  ["recipients", recipientsStore as unknown as Syncable, []], ["wishlist", wishlistStore as unknown as Syncable, []],
  ["people", peopleStore as unknown as Syncable, []], ["scheduled", scheduledStore as unknown as Syncable, []],
];
let started = false;

/**
 * Keeps a signed-in customer's saved recipients, wishlist, dates and orders in the database,
 * so they follow the customer to any device. Guests keep using this browser only.
 */
export function startAccountSync() {
  if (started || typeof window === "undefined") return;
  started = true;
  const sb = customerClient();
  let uid: string | null = null, applying = false;
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  const push = (key: string, store: Syncable) => {
    if (!uid || applying) return;
    clearTimeout(timers.get(key));
    const owner = uid;
    timers.set(key, setTimeout(() => { void sb.from("user_data").upsert({ user_id: owner, key, value: store.get(), updated_at: new Date().toISOString() }); }, 600));
  };
  for (const [key, store] of KEYS) store.subscribe(() => push(key, store));

  const pull = async (userId: string) => {
    const { data } = await sb.from("user_data").select("key,value").eq("user_id", userId);
    const rows = new Map((data ?? []).map((r) => [r.key as string, r.value]));
    applying = true;
    for (const [key, store, empty] of KEYS) {
      const server = rows.get(key);
      const local = store.get();
      if (Array.isArray(server) && server.length) {
        // Merge guest data made before sign-in: keep server items, add local ones with new ids.
        const ids = new Set(server.map((x: { id?: string } | string) => (typeof x === "string" ? x : x.id)));
        const extra = Array.isArray(local) ? (local as ({ id?: string } | string)[]).filter((x) => !ids.has(typeof x === "string" ? x : x.id)) : [];
        store.set([...server, ...extra] as never);
      } else if (Array.isArray(local) && local.length) {
        // Nothing saved yet: upload what this browser already has.
        applying = false; push(key, store); applying = true;
      } else store.set(empty as never);
    }
    applying = false;
    const { data: orders } = await sb.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
    for (const o of [...(orders ?? [])].reverse()) {
      mergeOrder({ ref: o.ref, status: o.status, createdAt: o.created_at, paidAt: o.paid_at, items: o.items, subtotal: o.subtotal, discount: o.discount, deliveryFee: o.delivery_fee, total: o.total, recipient: o.recipient, customer: o.customer } as ServerOrder);
    }
  };

  sb.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      userStore.set(toUser(session.user));
      if (uid !== session.user.id) { uid = session.user.id; setTimeout(() => void pull(session.user.id), 0); }
    } else if (event === "INITIAL_SESSION") {
      userStore.set(null);
    } else if (event === "SIGNED_OUT") {
      uid = null; applying = true;
      for (const [, store, empty] of KEYS) store.set(empty as never);
      ordersStore.set([]);
      applying = false;
    }
  });
}
