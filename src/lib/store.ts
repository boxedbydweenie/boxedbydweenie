/** Tiny persisted store used by mock services. Swap services for real APIs later. */
export function createStore<T>(key: string, initial: T) {
  let state = initial;
  let loaded = false;
  const listeners = new Set<() => void>();
  const load = () => {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try { const raw = localStorage.getItem(key); if (raw) state = JSON.parse(raw) as T; } catch { /* ignore */ }
  };
  return {
    get: () => { load(); return state; },
    server: () => initial,
    set: (next: T) => {
      load();
      state = next;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => { listeners.add(l); return () => listeners.delete(l); },
  };
}
