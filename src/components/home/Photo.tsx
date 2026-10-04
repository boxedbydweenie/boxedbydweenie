import { useEffect, useRef, useState } from "react";
import { IMAGES, type ImageKey } from "@/data/images";
import { SHOW_SAMPLE_CHIPS } from "@/config/site";
import { cn } from "@/lib/utils";

/** Fixed-ratio photo with a blurred preview while loading. Set `priority` only for the hero. */
export function Photo({ name, className, imgClassName, overlay, priority, sizes = "(min-width: 1024px) 50vw, 100vw", decorative }: {
  name: ImageKey; className?: string; imgClassName?: string; overlay?: boolean; priority?: boolean; sizes?: string; decorative?: boolean;
}) {
  const img = IMAGES[name];
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { if (ref.current?.complete) setLoaded(true); }, []);
  return <div className={cn("photo", overlay && "photo-overlay", className)} style={{ backgroundImage: loaded ? undefined : `url(${img.lqip})` }}>
    <img ref={ref} src={img.src} width={img.width} height={img.height} alt={decorative ? "" : img.alt} sizes={sizes}
      loading={priority ? "eager" : "lazy"} decoding={priority ? "sync" : "async"} {...(priority ? { fetchPriority: "high" as const } : {})}
      onLoad={() => setLoaded(true)} className={cn(loaded && "is-loaded", imgClassName)} />
  </div>;
}

export function SampleChip({ show = true, dark }: { show?: boolean; dark?: boolean }) {
  if (!SHOW_SAMPLE_CHIPS || !show) return null;
  return <span className={cn("absolute right-4 top-4 z-10 rounded-sm border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em]", dark ? "border-line-dark bg-nero-soft text-on-dark" : "border-border bg-paper text-nero")}>Sample content</span>;
}

/** Fades sections marked `data-reveal` up as they enter the viewport, once. */
export function useScrollReveal() {
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = [...document.querySelectorAll<HTMLElement>("[data-reveal], .draw-line")];
    els.forEach((el) => { if (el.hasAttribute("data-reveal")) [...el.children].forEach((c, i) => (c as HTMLElement).style.setProperty("--i", String(Math.min(i, 8)))); });
    root.classList.add("reveal-ready");
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach((el) => io.observe(el));
    return () => { io.disconnect(); root.classList.remove("reveal-ready"); };
  }, []);
}
