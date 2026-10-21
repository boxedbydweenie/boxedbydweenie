import { useSyncExternalStore } from "react";
import { useEffect } from "react";
import { adoptKeys, refreshExchange, santaStore } from "@/services/secretSanta";

export const useSanta = () => useSyncExternalStore(santaStore.subscribe, santaStore.get, santaStore.server);

/** Opens an exchange from a private link (?k= organiser key, ?p= and ?t= participant), then keeps it fresh. */
export function useSantaSync(id: string) {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    adoptKeys(id, { org: q.get("k") ?? "", pid: q.get("p") ?? "", pToken: q.get("t") ?? "" });
    void refreshExchange(id);
    const timer = setInterval(() => { if (document.visibilityState === "visible") void refreshExchange(id); }, 20000);
    return () => clearInterval(timer);
  }, [id]);
}
