import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, OCCASIONS, RECIPIENTS } from "@/config/shop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ProductRow } from "@/services/catalogue";

export interface Draft {
  id: string; isNew: boolean; name: string; slug: string; price: string; category: string; active: boolean; inStock: boolean; confirmed: boolean; sort: string;
  line: string; description: string; idealFor: string; saysAboutYou: string; collection: string;
  poem: string; inside: string; badges: string; images: string[]; occasions: string[]; recipients: string[];
  sameDay: boolean; corporateEligible: boolean; minCorporateQty: string;
}

export const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

export function toRow(d: Draft): Omit<ProductRow, "details"> & { details: ProductRow["details"] } {
  const details: ProductRow["details"] = {
    images: d.images, occasions: d.occasions, recipients: d.recipients, inside: lines(d.inside), badges: lines(d.badges), poem: lines(d.poem),
    sameDay: d.sameDay, corporateEligible: d.corporateEligible, minCorporateQty: Math.max(1, Number(d.minCorporateQty) || 10),
  };
  if (d.line.trim()) details.line = d.line.trim();
  if (d.description.trim()) details.description = d.description.trim();
  if (d.idealFor.trim()) details.idealFor = d.idealFor.trim();
  if (d.saysAboutYou.trim()) details.saysAboutYou = d.saysAboutYou.trim();
  if (d.collection.trim()) details.collection = d.collection.trim();
  return { id: d.id, slug: d.slug.trim() || slugify(d.name), name: d.name.trim(), price: Math.round(Number(d.price) || 0), category: d.category, active: d.active, confirmed: d.confirmed, in_stock: d.inStock, sort: Math.round(Number(d.sort) || 100), details };
}

/** Shrinks a photo to at most 1400px on the long edge and saves it as WebP, so it loads fast and stays inside the free storage plan. */
async function prepare(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Could not read that image"))), "image/webp", 0.86));
}

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) =>
  <div><Label className="text-sm font-semibold">{label}</Label>{hint && <p className="text-xs text-muted-foreground">{hint}</p>}<div className="mt-1.5">{children}</div></div>;

function Pills({ options, value, onChange }: { options: { slug: string; name: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  return <div className="flex flex-wrap gap-2">{options.map((o) => { const on = value.includes(o.slug);
    return <button key={o.slug} type="button" aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== o.slug) : [...value, o.slug])}
      className={cn("min-h-9 rounded-full border px-3.5 text-sm transition", on ? "border-nero bg-nero text-white" : "border-black/20 bg-white hover:border-nero")}>{o.name}</button>; })}</div>;
}

export function ProductEditor({ draft, onSaved, onCancel }: { draft: Draft; onSaved: () => void; onCancel: () => void }) {
  const [d, setD] = useState(draft);
  const [busy, setBusy] = useState(false);
  const [up, setUp] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUp(true);
    try {
      const added: string[] = [];
      for (const f of Array.from(files)) {
        if (!f.type.startsWith("image/")) { toast.error(`${f.name} is not an image.`); continue; }
        const blob = await prepare(f);
        const path = `${d.id}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`;
        const { error } = await supabase().storage.from("product-images").upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
        if (error) throw error;
        added.push(supabase().storage.from("product-images").getPublicUrl(path).data.publicUrl);
      }
      if (added.length) set("images", [...d.images, ...added]);
    } catch (e) { toast.error(`Upload failed. ${e instanceof Error ? e.message : ""}`); }
    setUp(false); if (file.current) file.current.value = "";
  };
  const move = (i: number, dir: -1 | 1) => { const a = [...d.images]; const j = i + dir; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j]!, a[i]!]; set("images", a); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!d.name.trim()) { toast.error("Give the product a name."); return; }
    if (!(Number(d.price) >= 0) || d.price === "") { toast.error("Enter a price."); return; }
    if (d.images.length === 0) { toast.error("Add at least one photo."); return; }
    setBusy(true);
    const row = toRow(d);
    const { error } = await supabase().from("products").upsert(row, { onConflict: "id" });
    setBusy(false);
    if (error) { toast.error(error.message.includes("slug") ? "Another product already uses that web address. Change the slug." : `Could not save. ${error.message}`); return; }
    toast.success(d.isNew ? "Product added." : "Changes saved."); onSaved();
  };

  return <form onSubmit={save} className="space-y-6 pb-4">
    <section className="space-y-4">
      <Field label="Name"><Input value={d.name} onChange={(e) => { set("name", e.target.value); if (d.isNew) set("slug", slugify(e.target.value)); }} className="min-h-11 bg-white" required /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Price (₦)"><Input inputMode="numeric" value={d.price} onChange={(e) => set("price", e.target.value.replace(/[^\d]/g, ""))} className="min-h-11 bg-white" required /></Field>
        <Field label="Type"><Select value={d.category} onValueChange={(v) => set("category", v)}><SelectTrigger className="min-h-11 bg-white"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}</SelectContent></Select></Field>
      </div>
      <Field label="Short line" hint="One line under the name on cards, e.g. who it is for."><Input value={d.line} onChange={(e) => set("line", e.target.value)} className="min-h-11 bg-white" /></Field>
      <Field label="Description"><Textarea value={d.description} onChange={(e) => set("description", e.target.value)} className="min-h-24 bg-white" /></Field>
    </section>

    <section>
      <div className="flex items-center justify-between"><p className="text-sm font-semibold">Photos</p>
        <Button type="button" size="sm" variant="outline" disabled={up} onClick={() => file.current?.click()}><ImagePlus className="size-4" />{up ? "Uploading" : "Add photos"}</Button></div>
      <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => void upload(e.target.files)} />
      <p className="text-xs text-muted-foreground">The first photo is the main one. Photos are resized automatically.</p>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{d.images.map((src, i) => <li key={src} className="overflow-hidden rounded-md border border-black/10 bg-white">
        <div className="relative aspect-square bg-ivory"><img src={src} alt="" className="size-full object-cover" />{i === 0 && <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Main</span>}</div>
        <div className="flex justify-between p-1">
          <button type="button" aria-label="Move earlier" disabled={i === 0} onClick={() => move(i, -1)} className="grid size-9 place-items-center rounded hover:bg-black/5 disabled:opacity-30"><ArrowUp className="size-4" /></button>
          <button type="button" aria-label="Move later" disabled={i === d.images.length - 1} onClick={() => move(i, 1)} className="grid size-9 place-items-center rounded hover:bg-black/5 disabled:opacity-30"><ArrowDown className="size-4" /></button>
          <button type="button" aria-label="Remove photo" onClick={() => set("images", d.images.filter((_, j) => j !== i))} className="grid size-9 place-items-center rounded text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></button>
        </div></li>)}</ul>
    </section>

    <section className="space-y-4">
      <Field label="Occasions"><Pills options={OCCASIONS} value={d.occasions} onChange={(v) => set("occasions", v)} /></Field>
      <Field label="Recipients"><Pills options={RECIPIENTS} value={d.recipients} onChange={(v) => set("recipients", v)} /></Field>
      <Field label="What's inside" hint="One item per line."><Textarea value={d.inside} onChange={(e) => set("inside", e.target.value)} className="min-h-28 bg-white" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ideal for"><Input value={d.idealFor} onChange={(e) => set("idealFor", e.target.value)} className="min-h-11 bg-white" /></Field>
        <Field label="Collection"><Input value={d.collection} onChange={(e) => set("collection", e.target.value)} className="min-h-11 bg-white" /></Field>
      </div>
      <Field label="What it says about you"><Input value={d.saysAboutYou} onChange={(e) => set("saysAboutYou", e.target.value)} className="min-h-11 bg-white" /></Field>
      <Field label="Poem" hint="One line per row."><Textarea value={d.poem} onChange={(e) => set("poem", e.target.value)} className="min-h-20 bg-white" /></Field>
      <Field label="Badges" hint="One per line, e.g. Bestseller."><Textarea value={d.badges} onChange={(e) => set("badges", e.target.value)} className="min-h-16 bg-white" /></Field>
    </section>

    <section className="space-y-3 rounded-lg bg-white p-4">
      <Toggle label="Show on the website" sub="Turn off to hide it without deleting." v={d.active} on={(v) => set("active", v)} />
      <Toggle label="In stock" sub="Off shows “Sold out” and blocks Add to bag." v={d.inStock} on={(v) => set("inStock", v)} />
      <Toggle label="Same-day Lagos delivery" v={d.sameDay} on={(v) => set("sameDay", v)} />
      <Toggle label="Available for corporate orders" v={d.corporateEligible} on={(v) => set("corporateEligible", v)} />
      <Toggle label="Details confirmed by client" v={d.confirmed} on={(v) => set("confirmed", v)} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Min. corporate qty"><Input inputMode="numeric" value={d.minCorporateQty} onChange={(e) => set("minCorporateQty", e.target.value.replace(/[^\d]/g, ""))} className="min-h-11 bg-white" /></Field>
        <Field label="Order on site" hint="Lower comes first."><Input inputMode="numeric" value={d.sort} onChange={(e) => set("sort", e.target.value.replace(/[^\d]/g, ""))} className="min-h-11 bg-white" /></Field>
        <Field label="Web address"><Input value={d.slug} onChange={(e) => set("slug", slugify(e.target.value))} className="min-h-11 bg-white" /></Field>
      </div>
    </section>

    <div className="sticky bottom-0 -mx-1 flex gap-3 border-t border-black/10 bg-[#F7F4EC] px-1 py-4">
      <Button type="submit" size="lg" className="flex-1" disabled={busy || up}>{busy ? "Saving" : d.isNew ? "Add product" : "Save changes"}</Button>
      <Button type="button" size="lg" variant="outline" onClick={onCancel}>Cancel</Button>
    </div>
  </form>;
}

const Toggle = ({ label, sub, v, on }: { label: string; sub?: string; v: boolean; on: (v: boolean) => void }) =>
  <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4"><span><span className="block text-sm font-medium">{label}</span>{sub && <span className="block text-xs text-muted-foreground">{sub}</span>}</span><Switch checked={v} onCheckedChange={on} /></label>;
