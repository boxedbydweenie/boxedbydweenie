import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const PROFILE_PAGES = Array.from({ length: 17 }, (_, i) => `/profile/p${String(i + 1).padStart(2, "0")}.webp`);
const TITLES = ["Cover", "Our note", "About us", "Vision and mission", "Services", "Track record", "Services in detail", "Occasions", "Our boxes", "Made for your brand", "Gallery", "Happy clients", "Reviews", "Three easy ways to start", "How we work with you", "Contact us", "Happiness In a Box"];

/** A short paper "whoosh" made in the browser (no audio file needed). */
function useTurnSound() {
  const ctx = useRef<AudioContext | null>(null);
  return useCallback(() => {
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx.current ??= new AC();
      const c = ctx.current; if (c.state === "suspended") void c.resume();
      const len = Math.floor(c.sampleRate * 0.55), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) { const t = i / len; d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * t) ** 1.5 * (0.6 + 0.4 * Math.random()); }
      const src = c.createBufferSource(); src.buffer = buf;
      const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 0.7;
      bp.frequency.setValueAtTime(900, c.currentTime); bp.frequency.exponentialRampToValueAtTime(3800, c.currentTime + 0.4);
      const g = c.createGain(); g.gain.value = 0.28;
      src.connect(bp).connect(g).connect(c.destination); src.start();
    } catch { /* sound is a nicety */ }
  }, []);
}

export function FlipBook({ pages = PROFILE_PAGES }: { pages?: string[] }) {
  const [page, setPage] = useState(0); // number of leaves already turned
  const [sound, setSound] = useState(true);
  const [full, setFull] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const play = useTurnSound();
  const total = pages.length;
  const go = useCallback((to: number) => {
    const n = Math.max(0, Math.min(total - 1, to));
    if (n === page) return;
    if (sound) play();
    setPage(n);
  }, [page, play, sound, total]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "ArrowRight") go(page + 1); if (e.key === "ArrowLeft") go(page - 1); };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [go, page]);
  useEffect(() => { const f = () => setFull(!!document.fullscreenElement); document.addEventListener("fullscreenchange", f); return () => document.removeEventListener("fullscreenchange", f); }, []);
  const touch = useRef(0);

  return <div ref={stage} className={cn("flex flex-col items-center", full && "justify-center bg-nero p-4")}>
    <div className="relative w-full max-w-[1100px] select-none [perspective:2200px]" style={{ aspectRatio: "16 / 9" }}
      onTouchStart={(e) => { touch.current = e.touches[0]!.clientX; }}
      onTouchEnd={(e) => { const dx = e.changedTouches[0]!.clientX - touch.current; if (Math.abs(dx) > 40) go(page + (dx < 0 ? 1 : -1)); }}>
      <div aria-hidden className="absolute -inset-x-3 -bottom-3 top-3 rounded-[2px] bg-black/40 blur-2xl" />
      {/* the stack: turned leaves swing away on the left hinge */}
      {pages.map((src, i) => {
        const turned = i < page;
        return <div key={src} className="absolute inset-0 [transform-style:preserve-3d]" style={{
          transformOrigin: "left center", zIndex: turned ? i : total - i,
          transform: turned ? "rotateY(-105deg)" : "rotateY(0deg)", opacity: turned && i < page - 1 ? 0 : 1,
          transition: "transform 900ms cubic-bezier(.45,.05,.25,1), opacity 300ms ease 600ms", pointerEvents: "none",
        }}>
          <img src={src} alt={`Company profile, page ${i + 1}: ${TITLES[i] ?? ""}`} draggable={false} loading={i < 3 ? "eager" : "lazy"} className="absolute inset-0 size-full rounded-[2px] object-cover [backface-visibility:hidden]" />
          <div aria-hidden className="absolute inset-0 rounded-[2px] bg-[#e9e3d6] [backface-visibility:hidden] [transform:rotateY(180deg)]" />
          {/* shading that deepens as the page turns */}
          <div aria-hidden className="absolute inset-0 rounded-[2px] bg-gradient-to-r from-black/35 via-transparent to-transparent transition-opacity duration-700" style={{ opacity: turned ? 1 : 0 }} />
          <div aria-hidden className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/30 to-transparent" />
        </div>;
      })}
      <button type="button" onClick={() => go(page - 1)} aria-label="Previous page" className="absolute inset-y-0 left-0 z-[100] w-1/4 cursor-w-resize focus-visible:outline-gold" />
      <button type="button" onClick={() => go(page + 1)} aria-label="Next page" className="absolute inset-y-0 right-0 z-[100] w-3/4 cursor-e-resize focus-visible:outline-gold" />
    </div>

    <div className="mt-8 flex w-full max-w-[1100px] items-center justify-between gap-3 text-on-dark">
      <button type="button" onClick={() => go(page - 1)} disabled={page === 0} className="flex size-12 items-center justify-center rounded-full border border-gold/60 transition hover:bg-gold hover:text-nero disabled:opacity-30" aria-label="Previous page"><ChevronLeft /></button>
      <div className="min-w-0 flex-1 text-center">
        <p className="eyebrow text-gold">Page {page + 1} of {total}</p>
        <p className="mt-1 truncate font-heading text-lg">{TITLES[page]}</p>
        <input type="range" min={0} max={total - 1} value={page} onChange={(e) => go(Number(e.target.value))} aria-label="Go to page" className="mt-3 w-full max-w-md accent-[#E7B93B]" />
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setSound((s) => !s)} aria-pressed={sound} aria-label={sound ? "Mute page sound" : "Turn on page sound"} className="flex size-12 items-center justify-center rounded-full border border-gold/60 transition hover:bg-gold hover:text-nero">{sound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}</button>
        <button type="button" onClick={() => (document.fullscreenElement ? document.exitFullscreen() : stage.current?.requestFullscreen?.())} aria-label="Toggle full screen" className="hidden size-12 items-center justify-center rounded-full border border-gold/60 transition hover:bg-gold hover:text-nero sm:flex">{full ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}</button>
        <button type="button" onClick={() => go(page + 1)} disabled={page === total - 1} className="flex size-12 items-center justify-center rounded-full bg-gold text-nero transition hover:brightness-105 disabled:opacity-30" aria-label="Next page"><ChevronRight /></button>
      </div>
    </div>
  </div>;
}
