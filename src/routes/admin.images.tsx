import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { uploadEmailImage } from "@/lib/marketing";
import { Card, PageHead } from "@/components/admin/EmailBits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/images")({ component: Images });

interface Img { path: string; url: string; name: string; size: number; at: string }

function Images() {
  const ref = useRef<HTMLInputElement>(null);
  const [imgs, setImgs] = useState<Img[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  const load = useCallback(async () => {
    const sb = supabase(); const st = sb.storage.from("email-images");
    const { data: months, error } = await st.list("", { limit: 100, sortBy: { column: "name", order: "desc" } });
    if (error) return void toast.error("Could not load images.");
    const out: Img[] = [];
    for (const m of (months ?? []).filter((x) => !x.id).slice(0, 12)) {
      const { data } = await st.list(m.name, { limit: 200, sortBy: { column: "created_at", order: "desc" } });
      for (const f of data ?? []) if (f.id) out.push({ path: `${m.name}/${f.name}`, url: st.getPublicUrl(`${m.name}/${f.name}`).data.publicUrl, name: f.name, size: Number(f.metadata?.size ?? 0), at: f.created_at ?? "" });
    }
    setImgs(out.sort((a, b) => b.at.localeCompare(a.at)));
  }, []);
  useEffect(() => { void load(); }, [load]);

  const upload = async (files: FileList | File[]) => {
    setBusy(true);
    try { for (const f of Array.from(files)) { const url = await uploadEmailImage(f); await navigator.clipboard?.writeText(url).catch(() => undefined); } toast.success("Uploaded. The last link is on your clipboard."); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed."); } finally { setBusy(false); }
  };
  const copy = (u: string) => { void navigator.clipboard?.writeText(u); toast.success("Link copied."); };
  const del = async (i: Img) => {
    if (!window.confirm("Delete this image? Any email already sent with it will show a broken picture.")) return;
    const { error } = await supabase().storage.from("email-images").remove([i.path]);
    if (error) return void toast.error("Could not delete."); toast.success("Deleted."); void load();
  };

  return <div>
    <PageHead eyebrow="Email marketing" title="Images" intro="Upload pictures for your emails and copy the link into your HTML as the image src." />
    <Card className="mt-8" accent="from-[#EB826C] to-[#E7B93B]">
      <div role="button" tabIndex={0} onClick={() => ref.current?.click()} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") ref.current?.click(); }} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); void upload(e.dataTransfer.files); }}
        className={cn("flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition", drag ? "border-gold bg-gold/10" : "border-black/20 bg-[#F4EFE5]/50 hover:border-nero/50")}>
        <ImagePlus className="size-8" /><p className="font-semibold">{busy ? "Uploading…" : "Drop images here"}</p><p className="text-sm text-muted-foreground">PNG, JPG, WebP or GIF, up to 5 MB each. For sharp emails, make them about 1200 px wide.</p>
        <input ref={ref} type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(e) => { if (e.target.files?.length) void upload(e.target.files); e.target.value = ""; }} />
      </div>
    </Card>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {!imgs && <p className="text-sm text-muted-foreground">Loading…</p>}
      {imgs?.length === 0 && <p className="rounded-2xl bg-white p-8 text-sm text-muted-foreground sm:col-span-2 lg:col-span-4">No images yet.</p>}
      {imgs?.map((i) => <figure key={i.path} className="overflow-hidden rounded-2xl bg-white shadow-[0_20px_40px_-32px_rgba(41,40,40,.5)]">
        <div className="grid aspect-[4/3] place-items-center bg-[#F4EFE5]"><img src={i.url} alt={i.name} loading="lazy" className="max-h-full max-w-full object-contain" /></div>
        <figcaption className="p-3"><p className="truncate text-xs font-medium" title={i.name}>{i.name}</p><p className="text-[11px] text-muted-foreground">{(i.size / 1024).toFixed(0)} KB</p>
          <div className="mt-2 flex gap-2"><button type="button" onClick={() => copy(i.url)} className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-nero text-xs font-semibold hover:bg-nero hover:text-white"><Copy className="size-3.5" />Copy link</button><button type="button" onClick={() => void del(i)} aria-label={`Delete ${i.name}`} className="grid size-9 place-items-center rounded-full border border-black/15 text-[#83252C] hover:bg-[#FBE0DA]"><Trash2 className="size-4" /></button></div></figcaption>
      </figure>)}
    </div>
    <p className="mt-6 text-xs text-muted-foreground">Images are stored with our own database today. Links are plain https addresses, so we can move to Cloudinary later without touching old emails.</p>
  </div>;
}
