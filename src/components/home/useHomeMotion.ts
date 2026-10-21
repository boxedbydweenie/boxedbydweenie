import { useEffect, type RefObject } from "react";

/**
 * Motion for the homepage concept: bow tie/untie, product rail drag, the scroll-driven
 * unboxing, rotating reviews, rise-in reveals and count-up numbers.
 * Everything is readable without it; it only adds movement.
 */
export function useHomeMotion(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const $ = <T extends Element = HTMLElement>(s: string) => el.querySelector<T>(s as never) as T | null;
    const $$ = <T extends Element = HTMLElement>(s: string) => Array.from(el.querySelectorAll<T>(s as never)) as T[];
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const cleanups: (() => void)[] = [];
    const on = <K extends keyof WindowEventMap>(t: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions) => {
      window.addEventListener(t, fn, opts);
      cleanups.push(() => window.removeEventListener(t, fn, opts));
    };

    // Hero bow starts its loop once it has landed
    if (!reduce) {
      const t = window.setTimeout(() => $(".hero")?.classList.add("live"), 2100);
      cleanups.push(() => window.clearTimeout(t));
    }

    // Product rail: arrows and drag
    const rail = $("#railEl");
    if (rail) {
      const step = () => (rail.querySelector(".prod")?.getBoundingClientRect().width ?? 300) + 22;
      const next = $<HTMLButtonElement>("#next"), prev = $<HTMLButtonElement>("#prev");
      if (next) next.onclick = () => rail.scrollBy({ left: step(), behavior: "smooth" });
      if (prev) prev.onclick = () => rail.scrollBy({ left: -step(), behavior: "smooth" });
      let down = false, sx = 0, sl = 0, moved = false;
      const pd = (e: PointerEvent) => { if (e.pointerType !== "mouse") return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; rail.classList.add("drag"); };
      const click = (e: MouseEvent) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } };
      rail.addEventListener("pointerdown", pd);
      rail.addEventListener("click", click, true);
      cleanups.push(() => { rail.removeEventListener("pointerdown", pd); rail.removeEventListener("click", click, true); });
      on("pointermove", (e) => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; rail.scrollLeft = sl - dx; });
      on("pointerup", () => { if (!down) return; down = false; rail.classList.remove("drag"); });
    }

    // Unboxing: scroll lifts the lid and lights the steps in order
    const ub = $("#unbox"), gb = $("#giftbox"), steps = $$("#steps li"), dots = $$(".ub-dots i");
    const onScroll = () => {
      if (reduce || !ub || !gb) return;
      const r = ub.getBoundingClientRect();
      const total = Math.max(1, ub.offsetHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / total));
      gb.style.setProperty("--p", Math.min(1, p * 1.3).toFixed(3));
      gb.classList.toggle("idle", p < 0.02);
      const idx = Math.min(steps.length - 1, Math.floor(p * steps.length * 1.05));
      steps.forEach((s, i) => { s.classList.toggle("on", i <= idx); s.classList.toggle("cur", i === idx); });
      dots.forEach((d, i) => d.style.setProperty("--f", Math.min(1, Math.max(0, p * steps.length - i)).toFixed(3)));
    };
    on("scroll", onScroll, { passive: true });
    onScroll();

    // Reviews rotate
    const qs = $$("#qs .q"), qc = $("#qctl");
    let qi = 0, qt = 0;
    if (qc && qs.length) {
      qc.innerHTML = "";
      const show = (i: number) => { qi = i; qs.forEach((q, k) => q.classList.toggle("on", k === i)); Array.from(qc.children).forEach((d, k) => d.classList.toggle("on", k === i)); };
      const restart = () => { window.clearInterval(qt); if (!reduce) qt = window.setInterval(() => show((qi + 1) % qs.length), 6000); };
      qs.forEach((_, i) => { const b = document.createElement("button"); b.type = "button"; b.className = "dot"; b.setAttribute("aria-label", `Show review ${i + 1}`); b.onclick = () => { show(i); restart(); }; qc.appendChild(b); });
      show(0); restart();
      cleanups.push(() => window.clearInterval(qt));
    }

    // Rise-in below the fold, count-up numbers
    if (!reduce && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.remove("pre"); io.unobserve(en.target); } }), { threshold: 0.12 });
      $$(".rv").forEach((x) => { if (x.getBoundingClientRect().top > window.innerHeight) { x.classList.add("pre"); io.observe(x); } });
      const co = new IntersectionObserver((es) => es.forEach((en) => {
        if (!en.isIntersecting) return;
        const t = en.target as HTMLElement, end = Number(t.dataset["count"]), suf = t.dataset["suffix"] ?? "";
        let t0 = 0; co.unobserve(t);
        const f = (now: number) => { if (!t0) t0 = now; const k = Math.min(1, (now - t0) / 1600); t.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))).toLocaleString("en-NG") + suf; if (k < 1) requestAnimationFrame(f); };
        requestAnimationFrame(f);
      }), { threshold: 0.6 });
      $$("[data-count]").forEach((x) => { if (x.getBoundingClientRect().top > window.innerHeight) co.observe(x); });
      cleanups.push(() => { io.disconnect(); co.disconnect(); });
    }

    return () => cleanups.forEach((c) => c());
  }, [root]);
}
