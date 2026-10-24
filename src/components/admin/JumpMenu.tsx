import { useNavigate } from "@tanstack/react-router";
import { Command } from "cmdk";
import { CornerDownLeft, ExternalLink, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DASHBOARD, NAV_GROUPS, route } from "./nav";

/** Press Ctrl+K (or Cmd+K) anywhere in the team area to jump straight to a page. */
export function JumpButton({ onOpen }: { onOpen: () => void }) {
  return <button type="button" onClick={onOpen} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-black/15 bg-white px-3.5 text-sm text-muted-foreground transition hover:border-nero hover:text-nero" aria-label="Jump to a page">
    <Search className="size-4" /><span className="hidden sm:inline">Jump to…</span>
    <kbd className="hidden rounded border border-black/15 bg-[#F7F4EC] px-1.5 py-0.5 text-[10px] font-semibold md:inline">Ctrl K</kbd>
  </button>;
}

export function JumpMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  useEffect(() => {
    const on = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); onOpenChange(!open); } };
    window.addEventListener("keydown", on); return () => window.removeEventListener("keydown", on);
  }, [open, onOpenChange]);
  useEffect(() => { if (!open) setQ(""); }, [open]);
  const go = (to: string) => { onOpenChange(false); void nav({ to: route(to) }); };
  const item = "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm aria-selected:bg-nero aria-selected:text-white";
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="top-[18%] max-w-xl translate-y-0 gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl">
      <DialogTitle className="sr-only">Jump to a page</DialogTitle>
      <DialogDescription className="sr-only">Type to search every page and action in the team area.</DialogDescription>
      <Command label="Jump to a page" loop>
        <div className="flex items-center gap-3 border-b border-black/10 px-4">
          <Search className="size-4 text-muted-foreground" />
          <Command.Input value={q} onValueChange={setQ} placeholder="Where do you want to go?" className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground" />
        </div>
        <Command.List className="max-h-[55vh] overflow-y-auto p-2">
          <Command.Empty className="px-4 py-8 text-center text-sm text-muted-foreground">Nothing matches that. Try “orders”, “audience” or “health”.</Command.Empty>
          <Command.Group heading="Quick actions" className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-[.14em] text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2">
            <Command.Item value="Start a new campaign" keywords={["write", "email"]} onSelect={() => go("/admin/campaigns")} className={item}><Plus className="size-4" />Start a new campaign<CornerDownLeft className="ml-auto size-3.5 opacity-50" /></Command.Item>
            <Command.Item value="Open the website" keywords={["view", "site"]} onSelect={() => { onOpenChange(false); window.open("/", "_blank", "noopener"); }} className={item}><ExternalLink className="size-4" />Open the website<CornerDownLeft className="ml-auto size-3.5 opacity-50" /></Command.Item>
          </Command.Group>
          <Command.Group heading="Dashboard" className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-[.14em] text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2">
            <Command.Item value={`${DASHBOARD.label} home`} keywords={[DASHBOARD.desc, "overview"]} onSelect={() => go(DASHBOARD.to)} className={item}><DASHBOARD.icon className="size-4" /><span>{DASHBOARD.label}<span className="ml-2 text-xs opacity-60">{DASHBOARD.desc}</span></span></Command.Item>
          </Command.Group>
          {NAV_GROUPS.map((g) => <Command.Group key={g.id} heading={g.label} className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-[.14em] text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2">
            {g.items.map((it) => <Command.Item key={it.to} value={`${g.label} ${it.label}`} keywords={[it.desc]} onSelect={() => go(it.to)} className={item}>
              <it.icon className="size-4" /><span className="min-w-0 truncate">{it.label}<span className="ml-2 text-xs opacity-60">{it.desc}</span></span>
              {it.soon && <span className="ml-auto rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider aria-selected:bg-white/20">Soon</span>}
            </Command.Item>)}
          </Command.Group>)}
        </Command.List>
      </Command>
    </DialogContent>
  </Dialog>;
}
