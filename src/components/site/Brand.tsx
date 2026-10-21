import { Heart, LoaderCircle, Minus, Plus, ShoppingBag } from "lucide-react";
import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { addToCart } from "@/services/cart";
import { toggleWishlist } from "@/services/account";
import { openCart, useWishlist } from "@/hooks/use-shop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";
import { PlaceholderTile } from "./PlaceholderTile";
import { Photo } from "@/components/home/Photo";
import type { ImageKey } from "@/data/images";
import type { Product } from "@/types/home";

export { Button };

export function Eyebrow({ children, dark, className }: { children: ReactNode; dark?: boolean; className?: string }) {
  return <p className={cn("eyebrow", dark ? "text-gold" : "text-muted-foreground", className)}>{children}</p>;
}

export function GoldRule({ className }: { className?: string }) {
  return <div aria-hidden className={cn("gold-rule w-12", className)} />;
}

export function SectionHeading({ eyebrow, title, intro, dark, center, className }: { eyebrow: string; title: string; intro?: string; dark?: boolean; center?: boolean; className?: string }) {
  return <div className={cn("max-w-2xl", center && "mx-auto text-center", className)}>
    <Eyebrow {...(dark === undefined ? {} : { dark })}>{eyebrow}</Eyebrow><GoldRule className={cn("mt-4", center && "mx-auto")} />
    <h2 className={cn("mt-5 text-2xl md:text-4xl", dark && "text-on-dark")}>{title}</h2>
    {intro && <p className={cn("mt-4 leading-relaxed", dark ? "text-on-dark-muted" : "text-muted-foreground")}>{intro}</p>}
  </div>;
}

export function FormField({ label, helper, error, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; helper?: string; error?: string }) {
  return <div className={className}><Label htmlFor={props.id ?? props.name}>{label}</Label><Input {...props} id={props.id ?? props.name} aria-invalid={!!error} className="mt-2 min-h-11 bg-paper" />{(error || helper) && <p className={cn("mt-1 text-xs", error ? "text-destructive" : "text-muted-foreground")}>{error || helper}</p>}</div>;
}

export function CheckboxField({ label, id }: { label: string; id: string }) {
  return <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm"><Checkbox id={id} /><span>{label}</span></label>;
}

export function Stepper({ value, onChange, min = 1 }: { value: number; onChange: (value: number) => void; min?: number }) {
  return <div className="inline-flex items-center rounded-md border border-border bg-paper"><Button type="button" size="icon" variant="ghost" onClick={() => onChange(Math.max(min, value - 1))} aria-label="Decrease"><Minus /></Button><output className="w-12 text-center font-semibold">{value}</output><Button type="button" size="icon" variant="ghost" onClick={() => onChange(value + 1)} aria-label="Increase"><Plus /></Button></div>;
}

export function BudgetSlider({ value, onChange }: { value: number[]; onChange: (value: number[]) => void }) {
  return <Slider value={value} onValueChange={onChange} min={10000} max={300000} step={5000} aria-label="Budget" />;
}

export function FilterChip({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return <Button type="button" size="sm" variant={active ? "default" : "outline"} onClick={onClick} className="rounded-full">{children}</Button>;
}

export function BowLoader({ label = "Loading" }: { label?: string }) {
  return <div role="status" className="flex flex-col items-center gap-3"><div className="animate-bow-pulse pattern-bow size-16" /><span className="sr-only">{label}</span></div>;
}

export function EmptyState({ line, action }: { line: string; action: ReactNode }) {
  return <div className="flex flex-col items-center border border-border bg-ivory px-6 py-12 text-center"><div className="pattern-bow size-20 opacity-20" /><p className="mt-4 text-muted-foreground">{line}</p><div className="mt-5">{action}</div></div>;
}

export function ProductCard({ product, variant = "default", image, image2 }: { product: Product; variant?: "default" | "home"; image?: ImageKey; image2?: ImageKey }) {
  const wishlist = useWishlist();
  const liked = wishlist.includes(product.id);
  const soldOut = product.inStock === false;
  const quickAdd = async () => {
    await addToCart({ kind: "product", productId: product.id, ...(product.slug ? { slug: product.slug } : {}), name: product.name, price: product.price, quantity: 1, packaging: "signature-black" });
    openCart();
  };
  const tile = <PlaceholderTile label={product.name} className="aspect-[4/5] w-full transition-transform duration-500 group-hover:scale-[1.01]" />;
  if (variant === "home") {
    const pic = image ? <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md"><Photo name={image} className="absolute inset-0" sizes="(min-width: 1024px) 25vw, 50vw" />{image2 && <Photo name={image2} decorative className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" sizes="(min-width: 1024px) 25vw, 50vw" />}</div> : tile;
    return <article className="zoom-host group relative">
      <div className="relative">
        {product.slug ? <Link to="/shop/$slug" params={{ slug: product.slug }} aria-label={product.name} tabIndex={-1}>{pic}</Link> : pic}
        {product.badge && <span className={cn("absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider", product.badge === "Bestseller" ? "bg-gold text-nero" : "bg-nero text-on-dark")}>{product.badge}</span>}
        <Button type="button" size="icon" variant="ghost" className="absolute right-2 top-2 size-11 rounded-full bg-paper/90" aria-pressed={liked} aria-label={liked ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`} onClick={() => toggleWishlist(product.id)}><Heart className={liked ? "fill-current" : ""} /></Button>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0"><h3 className="text-sm">{product.slug ? <Link to="/shop/$slug" params={{ slug: product.slug }} className="hover:text-muted-foreground">{product.name}</Link> : product.name}</h3><p className="mt-1 text-sm text-muted-foreground">{product.line}</p><p className="mt-2 font-semibold">{formatNaira(product.price)}</p></div>
        {soldOut ? <span className="shrink-0 text-xs text-muted-foreground">Sold out</span> : <button type="button" onClick={quickAdd} aria-label={`Add ${product.name} to bag`} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-nero/30 text-nero transition-colors hover:border-gold hover:bg-gold"><ShoppingBag className="size-4" /></button>}
      </div>
    </article>;
  }
  return <article className="group relative">
    <div className="relative overflow-hidden rounded-[2px] bg-ivory shadow-[0_20px_30px_-24px_rgba(41,40,40,.55)] transition-shadow duration-500 group-hover:shadow-[0_30px_40px_-24px_rgba(41,40,40,.6)]">
      {product.slug ? <Link to="/shop/$slug" params={{ slug: product.slug }} aria-label={product.name} tabIndex={-1} className="block overflow-hidden">{tile}</Link> : tile}
      {product.badge && <span className="pill pill-gold absolute left-3 top-3 !min-h-0 py-1 text-[10px] uppercase tracking-wider">{product.badge}</span>}
      <Button type="button" size="icon" variant="ghost" className="absolute right-2 top-2 size-11 rounded-full bg-paper/90" aria-pressed={liked} aria-label={liked ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`} onClick={() => toggleWishlist(product.id)}><Heart className={liked ? "fill-current" : ""} /></Button>
      {!soldOut && <button type="button" onClick={quickAdd} aria-label={`Quick add ${product.name}`} className="absolute inset-x-3 bottom-3 flex min-h-11 translate-y-3 items-center justify-center gap-2 rounded-full bg-nero text-sm font-semibold text-white opacity-0 transition duration-300 focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 max-lg:translate-y-0 max-lg:opacity-100"><ShoppingBag className="size-4" /> Add to bag</button>}
    </div>
    <h3 className="mt-4 font-heading text-xl font-medium leading-tight">{product.slug ? <Link to="/shop/$slug" params={{ slug: product.slug }} className="hover:text-[#8E6A10]">{product.name}</Link> : product.name}</h3>
    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{product.line}</p>
    <p className="mt-2 flex items-center justify-between text-[15px] font-semibold"><span>{formatNaira(product.price)}</span>{soldOut && <span className="text-xs font-normal text-muted-foreground">Sold out</span>}</p>
  </article>;
}

export function LoadingButton({ loading, children, ...props }: React.ComponentProps<typeof Button> & { loading?: boolean }) {
  return <Button disabled={loading || props.disabled} {...props}>{loading && <LoaderCircle className="animate-spin" />}{children}</Button>;
}