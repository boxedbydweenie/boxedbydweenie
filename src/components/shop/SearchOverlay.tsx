import { Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PlaceholderTile } from "@/components/site/PlaceholderTile";
import { POPULAR_SEARCHES, SEARCH_PAGES } from "@/config/shop";
import { openSearch, useUi } from "@/hooks/use-shop";
import { formatNaira } from "@/lib/format";
import { searchCatalogue } from "@/services/products";

type Results = Awaited<ReturnType<typeof searchCatalogue>>;

export function SearchPanel({ onPick }: { onPick?: () => void }) {
  const [term, setTerm] = useState("");
  const [res, setRes] = useState<Results | null>(null);
  const navigate = useNavigate();
  useEffect(() => { let live = true; searchCatalogue(term).then((r) => live && setRes(r)); return () => { live = false; }; }, [term]);
  const pages = term.trim() ? SEARCH_PAGES.filter((p) => p.name.toLowerCase().includes(term.trim().toLowerCase())) : [];
  const empty = term.trim() && res && !res.products.length && !res.occasions.length && !res.categories.length && !pages.length;
  return <div>
    <form role="search" onSubmit={(e) => { e.preventDefault(); onPick?.(); navigate({ to: "/shop", search: { q: term } }); }} className="relative">
      <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
      <Input autoFocus value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search gifts, occasions, pages" aria-label="Search" className="min-h-14 bg-paper pl-12 text-base" />
    </form>
    {!term.trim() && <div className="mt-6"><p className="eyebrow text-muted-foreground">Popular searches</p><div className="mt-3 flex flex-wrap gap-2">{POPULAR_SEARCHES.map((s) => <button key={s} type="button" onClick={() => setTerm(s)} className="min-h-11 rounded-full border border-border px-4 text-sm hover:border-nero">{s}</button>)}</div></div>}
    {empty && <p className="mt-6 text-sm text-muted-foreground">Nothing matches “{term}”. Try an occasion, such as birthday.</p>}
    {res && res.products.length > 0 && <div className="mt-6"><p className="eyebrow text-muted-foreground">Gifts</p><ul className="mt-3 grid gap-2 sm:grid-cols-2">{res.products.map((p) => <li key={p.id}><Link to="/shop/$slug" params={{ slug: p.slug }} onClick={onPick} className="flex min-h-11 items-center gap-3 rounded-md p-2 hover:bg-ivory"><PlaceholderTile label="" className="size-12 shrink-0" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{p.name}</span><span className="text-xs text-muted-foreground">{formatNaira(p.price)}</span></span></Link></li>)}</ul></div>}
    {res && res.occasions.length > 0 && <div className="mt-6"><p className="eyebrow text-muted-foreground">Occasions</p><div className="mt-3 flex flex-wrap gap-2">{res.occasions.map((o) => <Link key={o.slug} to="/shop" search={{ occasion: o.slug }} onClick={onPick} className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm hover:border-nero">{o.name}</Link>)}</div></div>}
    {pages.length > 0 && <div className="mt-6"><p className="eyebrow text-muted-foreground">Pages</p><ul className="mt-3">{pages.map((p) => <li key={p.to}><Link to={p.to} onClick={onPick} className="flex min-h-11 items-center text-sm underline-offset-4 hover:underline">{p.name}</Link></li>)}</ul></div>}
  </div>;
}

export function SearchOverlay() {
  const { search } = useUi();
  return <Dialog open={search} onOpenChange={openSearch}>
    <DialogContent className="top-0 max-w-none translate-y-0 rounded-none border-0 bg-paper p-6 sm:top-[10%] sm:max-w-2xl sm:rounded-md sm:p-8">
      <DialogTitle className="text-lg">Search</DialogTitle>
      <DialogDescription className="sr-only">Search the shop</DialogDescription>
      <div className="max-h-[75vh] overflow-y-auto"><SearchPanel onPick={() => openSearch(false)} /></div>
    </DialogContent>
  </Dialog>;
}
