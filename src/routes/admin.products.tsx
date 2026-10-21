import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { PRODUCTS } from "@/data/products";
import { applyRow, type ProductRow } from "@/services/catalogue";
import { CATEGORIES } from "@/config/shop";
import { formatNaira } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProductEditor, type Draft } from "@/components/admin/ProductEditor";

export const Route = createFileRoute("/admin/products")({ component: Products });

function toDraft(r: ProductRow): Draft {
  const p = applyRow(r, PRODUCTS.find((x) => x.id === r.id));
  return {
    id: r.id, isNew: false, name: p.name, slug: p.slug, price: String(p.price), category: p.category, active: r.active, inStock: r.in_stock, confirmed: r.confirmed, sort: String(r.sort),
    line: p.line, description: p.description, idealFor: p.idealFor ?? "", saysAboutYou: p.saysAboutYou ?? "", collection: p.collection ?? "",
    poem: (p.poem ?? []).join("\n"), inside: p.inside.join("\n"), badges: p.badges.join("\n"), images: p.images, occasions: p.occasions, recipients: p.recipients,
    sameDay: p.sameDay, corporateEligible: p.corporateEligible, minCorporateQty: String(p.minCorporateQty),
  };
}
const blank = (): Draft => ({ id: `prd-${Date.now().toString(36)}`, isNew: true, name: "", slug: "", price: "", category: "gift-boxes", active: true, inStock: true, confirmed: true, sort: "100",
  line: "", description: "", idealFor: "", saysAboutYou: "", collection: "", poem: "", inside: "", badges: "", images: [], occasions: [], recipients: [], sameDay: false, corporateEligible: true, minCorporateQty: "10" });

function Products() {
  const [rows, setRows] = useState<ProductRow[] | null>(null);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Draft | null>(null);
  const load = useCallback(async () => {
    const { data, error } = await supabase().from("products").select("*").order("sort").order("name");
    if (error) return void toast.error("Could not load products.");
    setRows(data as ProductRow[]);
  }, []);
  useEffect(() => { void load(); }, [load]);
  const shown = useMemo(() => (rows ?? []).filter((r) => r.name.toLowerCase().includes(q.trim().toLowerCase())), [rows, q]);

  const quick = async (r: ProductRow, patch: Partial<Pick<ProductRow, "active" | "in_stock">>) => {
    setRows((cur) => cur?.map((x) => (x.id === r.id ? { ...x, ...patch } : x)) ?? cur);
    const { error } = await supabase().from("products").update(patch).eq("id", r.id);
    if (error) { toast.error("Could not update."); void load(); }
  };

  return <div>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="eyebrow text-[#8E6A10]">Catalogue</p><div aria-hidden className="mt-3 h-px w-12 bg-gold" /><h1 className="mt-4 text-4xl md:text-5xl">Products</h1></div>
      <Button size="lg" onClick={() => setEdit(blank())}><Plus className="size-4" />New product</Button>
    </div>
    <div className="relative mt-6 max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="min-h-11 bg-white pl-9" aria-label="Search products" /></div>

    <div className="mt-6 overflow-hidden rounded-lg bg-white shadow-sm">
      {!rows && <p className="p-8 text-sm text-muted-foreground">Loading products</p>}
      {rows && shown.length === 0 && <p className="p-8 text-sm text-muted-foreground">No products match.</p>}
      <ul className="divide-y divide-black/5">{shown.map((r) => { const img = r.details.images?.[0] ?? PRODUCTS.find((p) => p.id === r.id)?.images[0];
        return <li key={r.id} className="grid grid-cols-[64px_1fr] items-center gap-x-4 gap-y-2 p-4 sm:grid-cols-[64px_1fr_auto_auto]">
          <button type="button" onClick={() => setEdit(toDraft(r))} className="size-16 overflow-hidden rounded-md bg-ivory" aria-label={`Edit ${r.name}`}>{img && <img src={img} alt="" className="size-full object-cover" />}</button>
          <button type="button" onClick={() => setEdit(toDraft(r))} className="min-w-0 text-left"><span className="block truncate font-heading text-xl">{r.name}</span><span className="block text-sm text-muted-foreground">{formatNaira(r.price)} · {CATEGORIES.find((c) => c.slug === r.category)?.name ?? r.category}{!r.active && " · Hidden"}{r.active && !r.in_stock && " · Sold out"}</span></button>
          <div className="col-span-2 flex flex-wrap gap-2 sm:col-span-1">
            <Button size="sm" variant="outline" className="min-h-9" onClick={() => void quick(r, { in_stock: !r.in_stock })}>{r.in_stock ? "Mark sold out" : "Back in stock"}</Button>
            <Button size="sm" variant="outline" className="min-h-9" onClick={() => void quick(r, { active: !r.active })}>{r.active ? "Hide" : "Show"}</Button>
          </div>
          <Button size="sm" className="col-span-2 min-h-9 sm:col-span-1" onClick={() => setEdit(toDraft(r))}>Edit</Button>
        </li>; })}</ul>
    </div>

    <Sheet open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-[#F7F4EC] p-5 sm:max-w-xl sm:p-7">
        <SheetHeader><SheetTitle className="text-3xl">{edit?.isNew ? "New product" : edit?.name}</SheetTitle><SheetDescription>Changes appear on the website within moments of saving.</SheetDescription></SheetHeader>
        {edit && <div className="mt-6"><ProductEditor key={edit.id} draft={edit} onCancel={() => setEdit(null)} onSaved={() => { setEdit(null); void load(); }} /></div>}
      </SheetContent>
    </Sheet>
  </div>;
}
