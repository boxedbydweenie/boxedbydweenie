import { cn } from "@/lib/utils";
import { PRODUCTS } from "@/data/products";

/** A product photo when we have one (by URL or product name), otherwise a branded tile. */
function photoFor(label: string): string | undefined {
  if (label.startsWith("/")) return label;
  return PRODUCTS.find((p) => p.name === label)?.images[0];
}

export function PlaceholderTile({
  label,
  tone = "ivory",
  className,
}: {
  label: string;
  tone?: "ivory" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";
  const photo = photoFor(label);
  if (photo) {
    return (
      <div className={cn("relative overflow-hidden rounded-md bg-ivory", className)}>
        <img src={photo} alt={label.startsWith("/") ? "" : label} loading="lazy" className="absolute inset-0 size-full object-cover" />
      </div>
    );
  }
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-md",
        dark ? "surface-dark border border-line-dark" : "bg-ivory border border-border",
        className,
      )}
    >
      <div className={cn("absolute inset-0", dark ? "pattern-bow-light opacity-[0.12]" : "pattern-bow opacity-[0.08]")} />
      <span
        className={cn(
          "relative px-4 text-center font-heading text-xs uppercase tracking-[0.2em]",
          dark ? "text-on-dark" : "text-nero",
        )}
      >
        {label}
      </span>
    </div>
  );
}
