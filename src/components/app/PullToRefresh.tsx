import { useEffect, useRef, useState } from "react";
import { refreshAccountData } from "@/services/sync";
import { C } from "./kit";

/**
 * Pull down from the top of any app page to refresh it, like a native app.
 * Fetches the latest account data, then re-draws the page (onRefreshed bumps a key in the shell).
 */
const TRIGGER = 72; // px of (damped) pull needed to refresh
const MAX = 110;

export function PullToRefresh({ onRefreshed }: { onRefreshed: () => void }) {
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const active = useRef(false);
  const pullRef = useRef(0);
  const busyRef = useRef(false);

  useEffect(() => {
    const atTop = () => (window.scrollY || document.documentElement.scrollTop) <= 0;
    const inScroller = (el: EventTarget | null) => {
      let n: HTMLElement | null =
        el instanceof HTMLElement ? el : el instanceof Node ? el.parentElement : null;
      while (n && n !== document.body) {
        if (n.dataset?.["noPull"] !== undefined) return true;
        const st = getComputedStyle(n);
        if (/(auto|scroll)/.test(st.overflowY) && n.scrollTop > 0) return true;
        n = n.parentElement;
      }
      return false;
    };
    const set = (v: number) => {
      pullRef.current = v;
      setPull(v);
    };
    const onStart = (e: TouchEvent) => {
      if (busyRef.current || e.touches.length !== 1 || !atTop() || inScroller(e.target)) {
        start.current = null;
        return;
      }
      const t = e.touches[0]!;
      start.current = { x: t.clientX, y: t.clientY };
      active.current = false;
    };
    const onMove = (e: TouchEvent) => {
      if (!start.current) return;
      const t = e.touches[0]!;
      const dy = t.clientY - start.current.y;
      const dx = Math.abs(t.clientX - start.current.x);
      if (!active.current) {
        if (dy > 8 && dy > dx * 1.4 && atTop()) active.current = true;
        else if (dy < 0 || dx > 12) {
          start.current = null;
          return;
        } else return;
      }
      if (e.cancelable) e.preventDefault();
      set(Math.min(MAX, Math.max(0, dy * 0.5)));
    };
    const onEnd = async () => {
      if (!start.current) return;
      start.current = null;
      const reached = active.current && pullRef.current >= TRIGGER;
      active.current = false;
      if (!reached) return set(0);
      busyRef.current = true;
      setBusy(true);
      set(TRIGGER * 0.8);
      try {
        await Promise.all([
          refreshAccountData().catch(() => {}),
          new Promise((r) => setTimeout(r, 650)),
        ]);
      } finally {
        onRefreshed();
        busyRef.current = false;
        setBusy(false);
        set(0);
      }
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [onRefreshed]);

  const shown = pull > 2 || busy;
  const ready = pull >= TRIGGER;
  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        top: "calc(env(safe-area-inset-top,0px) + 6px)",
        left: "50%",
        zIndex: 80,
        width: 44,
        height: 44,
        marginLeft: -22,
        borderRadius: "50%",
        background: C.plum,
        border: `1.5px solid ${C.gold}`,
        boxShadow: "0 10px 24px -8px rgba(41,40,40,.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        opacity: shown ? Math.min(1, pull / 40 + (busy ? 1 : 0)) : 0,
        transform: `translateY(${busy ? 54 : Math.max(0, pull - 22)}px) scale(${shown ? 1 : 0.6})`,
        transition: start.current ? "none" : "transform .25s ease, opacity .2s ease",
      }}
    >
      <span className="sr-only">{busy ? "Refreshing" : ""}</span>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{
          width: 22,
          height: 22,
          fill: "none",
          stroke: C.gold,
          strokeWidth: 2.2,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          transform: busy ? undefined : `rotate(${(pull / TRIGGER) * 270}deg)`,
          animation: busy ? "a-ptr-spin .8s linear infinite" : undefined,
          opacity: ready || busy ? 1 : 0.75,
        }}
      >
        <path d="M20 12a8 8 0 1 1-2.34-5.66" />
        <path d="M20 4v5h-5" />
      </svg>
      <style>{`@keyframes a-ptr-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
