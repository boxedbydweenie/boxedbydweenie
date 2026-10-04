import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, LayoutGrid, Maximize, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { LookbookPageView } from "@/components/lookbook/LookbookPages";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { FormField, LoadingButton } from "@/components/site/Brand";
import { useIsMobile } from "@/hooks/use-mobile";
import { buildSpreads, getEdition, quoteListStore, removeFromQuoteList, requestPdf } from "@/services/lookbook";
import { getProductById } from "@/services/products";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lookbook/$edition")({
  validateSearch: z.object({ page: z.coerce.number().int().min(1).optional().catch(undefined) }),
  loader: async ({ params }) => { const e = await getEdition(params.edition); if (!e) throw notFound(); return e; },
  head: ({ loaderData }) => loaderData ? { meta: [
    { title: `${loaderData.title} — The Look Book — Boxed by Dweenie` },
    { name: "description", content: `Turn the pages of ${loaderData.title}. ${loaderData.pages.length} pages of shoppable gifts from Boxed by Dweenie.` },
    { property: "og:title", content: `${loaderData.title} — The Look Book` },
    { property: "og:description", content: "This season's boxes, page by page." },
    { property: "og:type", content: "article" },
    { name: "twitter:card", content: "summary_large_image" },
  ] } : { meta: [{ title: "Edition not found — Boxed by Dweenie" }, { name: "robots", content: "noindex" }] },
  notFoundComponent: () => <div className="surface-dark flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center"><h1 className="text-2xl text-on-dark">Edition not found</h1><Button asChild><Link to="/lookbook">Back to the library</Link></Button></div>,
  component: Viewer,
});

function Viewer() {
  const edition = Route.useLoaderData();
  const { page: pageParam } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const mobile = useIsMobile();
  const total = edition.pages.length;
  const spreads = useMemo(() => buildSpreads(total), [total]);
  const page = Math.min(Math.max(pageParam ?? 1, 1), total);
  const spreadIdx = spreads.findIndex((s) => s.includes(page));
  const [dir, setDir] = useState<"next" | "prev">("next");
  const [chrome, setChrome] = useState(true);
  const [thumbs, setThumbs] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const quoteList = useSyncExternalStore(quoteListStore.subscribe, quoteListStore.get, quoteListStore.server);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const goPage = useCallback((p: number) => {
    const next = Math.min(Math.max(p, 1), total);
    setDir(next >= page ? "next" : "prev");
    navigate({ search: { page: next }, replace: true, resetScroll: false });
  }, [navigate, page, total]);
  const step = useCallback((d: 1 | -1) => {
    if (mobile) return goPage(page + d);
    const s = spreads[spreadIdx + d];
    if (s) goPage(s[0]!);
  }, [mobile, goPage, page, spreads, spreadIdx]);

  const wake = useCallback(() => {
    setChrome(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setChrome(false), 3000);
  }, []);
  useEffect(() => { wake(); return () => clearTimeout(timer.current); }, [wake]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea,[role=dialog]")) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const touch = useRef<{ x: number; y: number } | null>(null);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/lookbook/${edition.slug}?page=${page}` : "";
  const shareText = `${edition.title} from Boxed by Dweenie`;
  const atStart = mobile ? page === 1 : spreadIdx === 0;
  const atEnd = mobile ? page === total : spreadIdx === spreads.length - 1;

  // Only the current spread and its neighbours are mounted.
  const visible = mobile ? [page] : spreads[spreadIdx] ?? [1];
  const preload = mobile ? [page - 1, page + 1] : [...(spreads[spreadIdx - 1] ?? []), ...(spreads[spreadIdx + 1] ?? [])];

  const download = async () => {
    if (edition.gatedDownload) return setPdfOpen(true);
    await requestPdf({ edition: edition.slug });
    toast("Your PDF download will start shortly.", { description: "Placeholder: the file is not connected yet." });
  };

  return <div className="surface-dark fixed inset-0 flex flex-col overflow-hidden" onMouseMove={wake} onTouchStart={wake}>
    {/* Toolbar */}
    <header className={cn("absolute inset-x-0 top-0 z-30 flex items-center gap-2 border-b border-line-dark bg-nero/95 px-3 py-2 transition-all duration-500", chrome ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0")}>
      <Button asChild variant="ghost" size="icon" className="text-on-dark" aria-label="Back to library"><Link to="/lookbook"><ArrowLeft /></Link></Button>
      <div className="min-w-0 flex-1"><h1 className="truncate text-xs text-on-dark md:text-sm">{edition.title}</h1><p className="text-xs text-on-dark-muted" aria-live="polite">Page {page} of {total}</p></div>
      <Button variant="ghost" size="icon" className="text-on-dark" aria-label="Thumbnails" onClick={() => setThumbs(true)}><LayoutGrid /></Button>
      <Button variant="ghost" size="icon" className="hidden text-on-dark sm:inline-flex" aria-label="Full screen" onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.()}><Maximize /></Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="text-on-dark" aria-label="Share"><Share2 /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => { navigator.clipboard?.writeText(shareUrl); toast("Link copied"); }}>Copy link</DropdownMenuItem>
          <DropdownMenuItem asChild><a href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`} target="_blank" rel="noreferrer">WhatsApp</a></DropdownMenuItem>
          <DropdownMenuItem asChild><a href={`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareUrl)}`}>Email</a></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="ghost" size="icon" className="text-on-dark" aria-label="Download PDF" onClick={download}><Download /></Button>
    </header>

    {/* Stage */}
    <main className="relative flex flex-1 items-center justify-center md:px-16 md:py-16"
      onTouchStart={(e) => { const t = e.touches[0]!; touch.current = { x: t.clientX, y: t.clientY }; }}
      onTouchEnd={(e) => { const s = touch.current; const t = e.changedTouches[0]!; if (!s) return; const dx = t.clientX - s.x, dy = t.clientY - s.y; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1); touch.current = null; }}>
      <div key={visible.join("-")} style={mobile ? undefined : { height: `min(calc(100vh - 8rem), calc((100vw - 8rem) * ${visible.length === 2 ? "2 / 3" : "4 / 3"}))` }} className={cn("relative flex h-full w-full md:w-auto md:shadow-soft", dir === "next" ? "animate-page-next" : "animate-page-prev")}>
        {visible.map((n, i) => <section key={n} aria-label={`Page ${n}`} className={cn("relative h-full w-full md:aspect-[3/4] md:w-auto md:shrink-0", !mobile && visible.length === 2 && i === 0 && "border-r border-line-dark")}>
          <LookbookPageView page={edition.pages[n - 1]!} edition={edition} />
        </section>)}
        {!mobile && <><button type="button" tabIndex={-1} aria-label="Previous page" onClick={() => step(-1)} className="absolute inset-y-0 left-0 z-10 w-8 hover:bg-gold/10" /><button type="button" tabIndex={-1} aria-label="Next page" onClick={() => step(1)} className="absolute inset-y-0 right-0 z-10 w-8 hover:bg-gold/10" /></>}
      </div>
      <div hidden aria-hidden>{preload.filter((n) => n >= 1 && n <= total).map((n) => <span key={n}>{edition.pages[n - 1]!.title}</span>)}</div>
      <Button variant="outline" size="icon" aria-label="Previous" disabled={atStart} onClick={() => step(-1)} className={cn("absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border-line-dark bg-nero text-on-dark md:inline-flex")}><ChevronLeft /></Button>
      <Button variant="outline" size="icon" aria-label="Next" disabled={atEnd} onClick={() => step(1)} className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border-line-dark bg-nero text-on-dark md:inline-flex"><ChevronRight /></Button>
    </main>

    {/* Quote pill */}
    {quoteList.length > 0 && <button type="button" onClick={() => setQuoteOpen(true)} className="absolute bottom-5 left-1/2 z-30 min-h-11 -translate-x-1/2 rounded-full bg-gold px-5 text-sm font-semibold text-nero shadow-soft">Quote list ({quoteList.length})</button>}

    {/* Thumbnails */}
    <Sheet open={thumbs} onOpenChange={setThumbs}>
      <SheetContent side="bottom" className="border-line-dark bg-nero text-on-dark">
        <SheetTitle className="text-sm text-on-dark">Jump to a page</SheetTitle>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-3">
          {edition.pages.map((p, i) => <button key={i} type="button" onClick={() => { goPage(i + 1); setThumbs(false); }} className={cn("w-20 shrink-0 text-left", visible.includes(i + 1) && "opacity-100", !visible.includes(i + 1) && "opacity-70 hover:opacity-100")}>
            <div className={cn("flex aspect-[3/4] items-center justify-center rounded-sm border p-1 text-center text-[9px] uppercase tracking-wider", visible.includes(i + 1) ? "border-gold" : "border-line-dark", p.kind === "note" || p.kind === "grid" || p.kind === "feature-text" || p.kind === "tiers" ? "bg-ivory text-nero" : "bg-nero-soft text-on-dark")}>{p.title}</div>
            <span className="mt-1 block text-xs text-on-dark-muted">{i + 1}</span>
          </button>)}
        </div>
      </SheetContent>
    </Sheet>

    {/* Quote drawer */}
    <Sheet open={quoteOpen} onOpenChange={setQuoteOpen}>
      <SheetContent side="right" className="flex flex-col bg-paper">
        <SheetTitle>Quote list</SheetTitle>
        <ul className="mt-4 flex-1 divide-y divide-border overflow-y-auto">
          {quoteList.map((id) => { const p = getProductById(id); if (!p) return null; return <li key={id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold">{p.name}</p><p className="text-xs text-muted-foreground">{formatNaira(p.price)} each</p></div><Button variant="ghost" size="icon" aria-label={`Remove ${p.name}`} onClick={() => removeFromQuoteList(id)}><X /></Button></li>; })}
        </ul>
        <Button asChild className="mt-4"><Link to="/corporate/quote" search={{ items: quoteList.join(",") }}>Build my quote</Link></Button>
      </SheetContent>
    </Sheet>

    <PdfGate open={pdfOpen} onOpenChange={setPdfOpen} edition={edition.slug} />
    <CartDrawer />
  </div>;
}

function PdfGate({ open, onOpenChange, edition }: { open: boolean; onOpenChange: (o: boolean) => void; edition: string }) {
  const [loading, setLoading] = useState(false);
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="bg-paper">
      <DialogTitle>Download The Corporate Edit</DialogTitle>
      <DialogDescription>Tell us where to send it. A consultant may follow up with pricing for your team.</DialogDescription>
      <form className="mt-2 grid gap-4" onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setLoading(true);
        await requestPdf({ edition, name: String(f.get("name")), company: String(f.get("company")), email: String(f.get("email")) });
        setLoading(false); onOpenChange(false);
        toast("Thank you. Your PDF download will start shortly.", { description: "Placeholder: the file is not connected yet." });
      }}>
        <FormField name="name" label="Name" required autoComplete="name" />
        <FormField name="company" label="Company" required autoComplete="organization" />
        <FormField name="email" type="email" label="Work email" required autoComplete="email" />
        <LoadingButton type="submit" loading={loading}>Download PDF</LoadingButton>
      </form>
    </DialogContent>
  </Dialog>;
}
