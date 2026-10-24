import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, ExternalLink, KeyRound, LogOut, Menu, RefreshCw } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AdminDataProvider, useAdminData } from "./AdminData";
import { LEVEL, StatusDot } from "./AdminBits";
import { JumpButton, JumpMenu } from "./JumpMenu";
import { DASHBOARD, locate, NAV_GROUPS, route, SOON, type NavGroup, type NavItem } from "./nav";

const OPEN_KEY = "bbd-admin-open-groups";
const readOpen = (): string[] | null => { try { const v = localStorage.getItem(OPEN_KEY); return v ? (JSON.parse(v) as string[]) : null; } catch { return null; } };
const writeOpen = (v: string[]) => { try { localStorage.setItem(OPEN_KEY, JSON.stringify(v)); } catch { /* private window: the menu simply forgets */ } };

export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  return <AdminDataProvider email={email}><Frame email={email}>{children}</Frame></AdminDataProvider>;
}

function Frame({ email, children }: { email: string; children: ReactNode }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [menu, setMenu] = useState(false);
  const [jump, setJump] = useState(false);
  useEffect(() => { setMenu(false); window.scrollTo({ top: 0 }); }, [path]);
  const { group, item } = locate(path);
  const onSoon = path.startsWith("/admin/soon/");
  const soonKey = onSoon ? path.split("/")[3] ?? "" : "";
  const soon = SOON[soonKey];

  return <div className="min-h-screen bg-[#F7F4EC] text-nero lg:grid lg:grid-cols-[288px_1fr]">
    <aside className="brand-pattern-black hidden text-on-dark lg:sticky lg:top-0 lg:block lg:h-screen"><SideNav email={email} path={path} /></aside>
    <Sheet open={menu} onOpenChange={setMenu}>
      <SheetContent side="left" className="brand-pattern-black w-[88vw] max-w-[320px] border-0 p-0 text-on-dark [&>button]:text-on-dark">
        <SheetTitle className="sr-only">Team area menu</SheetTitle><SheetDescription className="sr-only">Every section of the team area.</SheetDescription>
        <SideNav email={email} path={path} />
      </SheetContent>
    </Sheet>
    <div className="min-w-0">
      <TopBar onMenu={() => setMenu(true)} onJump={() => setJump(true)} group={group} item={item} soonTitle={soon?.title} soonGroup={soon?.group} onSoon={onSoon} />
      {group && <SectionTabs group={group} path={path} />}
      <main className="mx-auto w-full max-w-[1320px] p-4 pb-16 sm:p-6 lg:p-10 lg:pb-20">{children}</main>
    </div>
    <JumpMenu open={jump} onOpenChange={setJump} />
  </div>;
}

/* ---------- Top bar ---------- */
function TopBar({ onMenu, onJump, group, item, onSoon, soonTitle, soonGroup }: { onMenu: () => void; onJump: () => void; group?: NavGroup | undefined; item?: NavItem | undefined; onSoon: boolean; soonTitle?: string | undefined; soonGroup?: string | undefined }) {
  const { status, ready, refresh, refreshing } = useAdminData();
  const lvl = ready ? status.level : "off";
  const label = !ready ? "Checking…" : status.level === "ok" ? "All systems healthy" : `${status.bad + status.warn} to look at`;
  const crumbGroup = onSoon ? soonGroup : group?.label; const crumbItem = onSoon ? soonTitle : item?.label;
  return <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-black/10 bg-[#F7F4EC]/90 px-4 backdrop-blur sm:px-6 lg:px-10">
    <button type="button" onClick={onMenu} aria-label="Open menu" className="grid size-10 place-items-center rounded-full border border-black/15 bg-white lg:hidden"><Menu className="size-5" /></button>
    <nav aria-label="Breadcrumb" className="min-w-0 flex-1 truncate text-sm">
      <Link to="/admin" className="text-muted-foreground hover:text-nero">Dashboard</Link>
      {crumbGroup && <><span className="mx-2 text-muted-foreground">/</span><span className={cn(!crumbItem || crumbItem === "Overview" ? "font-semibold" : "text-muted-foreground")}>{crumbGroup}</span></>}
      {crumbItem && crumbItem !== "Overview" && <><span className="mx-2 text-muted-foreground">/</span><span className="font-semibold">{crumbItem}</span></>}
    </nav>
    <JumpButton onOpen={onJump} />
    <Link to="/admin/system" className={cn("hidden min-h-10 items-center gap-2 rounded-full px-3.5 text-sm font-semibold sm:inline-flex", LEVEL[lvl].bg, LEVEL[lvl].text)} title="Open Health & setup">
      <StatusDot level={lvl} pulse />{label}
    </Link>
    <Link to="/admin/system" aria-label={label} className="grid size-10 place-items-center rounded-full bg-white sm:hidden"><StatusDot level={lvl} pulse /></Link>
    <button type="button" onClick={() => void refresh()} aria-label="Refresh numbers" title="Refresh numbers" className="grid size-10 place-items-center rounded-full border border-black/15 bg-white transition hover:border-nero"><RefreshCw className={cn("size-4", refreshing && "animate-spin")} /></button>
  </header>;
}

/** The tabs under the top bar: every page of the section you are in, so a whole job lives in one place. */
function SectionTabs({ group, path }: { group: NavGroup; path: string }) {
  const { badge } = useAdminData();
  return <div className="border-b border-black/10 bg-white/60 px-4 sm:px-6 lg:px-10">
    <div className="flex items-center gap-1 overflow-x-auto py-2" role="tablist" aria-label={`${group.label} pages`}>
      <span className="mr-2 hidden items-center gap-2 pr-3 text-[11px] font-bold uppercase tracking-[.16em] text-muted-foreground sm:flex"><span className="size-2 rounded-full" style={{ background: group.accent }} />{group.label}</span>
      {group.items.map((it) => {
        const on = locate(path).item?.to === it.to; const n = it.badge ? badgeCount(badge, it) : 0;
        return <Link key={it.to} to={route(it.to)} role="tab" aria-selected={on} className={cn("inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition", on ? "bg-nero text-white" : "text-nero/80 hover:bg-black/5")}>
          <it.icon className="size-4" />{it.label}
          {n > 0 && <span className={cn("rounded-full px-1.5 text-[11px] font-bold", on ? "bg-gold text-nero" : "bg-[#83252C] text-white")}>{n}</span>}
          {it.soon && <span className={cn("rounded-full px-1.5 text-[10px] font-bold uppercase tracking-wider", on ? "bg-white/20" : "bg-black/10")}>Soon</span>}
        </Link>;
      })}
    </div>
  </div>;
}
const badgeCount = (badge: (k: NonNullable<NavItem["badge"]>) => number, it: NavItem) => (it.badge ? badge(it.badge) : 0);

/* ---------- Sidebar ---------- */
function SideNav({ email, path }: { email: string; path: string }) {
  const { badge, status, ready } = useAdminData();
  const current = locate(path).group?.id;
  const [open, setOpen] = useState<string[]>(() => (typeof window === "undefined" ? [] : readOpen() ?? []));
  // The section you are in always opens by itself, so you never lose your place.
  useEffect(() => { if (current && !open.includes(current)) setOpen((o) => { const n = [...o, current]; writeOpen(n); return n; }); }, [current]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = (id: string) => setOpen((o) => { const n = o.includes(id) ? o.filter((x) => x !== id) : [...o, id]; writeOpen(n); return n; });
  const [pw, setPw] = useState(false);
  const dash = path === "/admin" || path === "/admin/";
  const lvl = ready ? status.level : "off";

  return <div className="flex h-full min-h-0 flex-col">
    <div className="p-5 pb-3">
      <Link to="/admin"><img src="/brand/logo-on-dark.svg" alt="Boxed by Dweenie" className="h-10 w-auto" /></Link>
      <p className="eyebrow mt-4 text-gold">Team area</p>
    </div>
    <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3" aria-label="Team area">
      <Link to="/admin" className={cn("flex min-h-12 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition", dash ? "bg-gold text-nero" : "text-on-dark hover:bg-white/10")}>
        <DASHBOARD.icon className="size-[18px]" />Dashboard
        <span className="ml-auto"><StatusDot level={lvl} pulse /></span>
      </Link>
      <div className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[.2em] text-on-dark-muted">Sections</div>
      {NAV_GROUPS.map((g) => {
        const isOpen = open.includes(g.id); const inGroup = current === g.id;
        const alert = g.items.reduce((a, it) => a + (it.badge && it.badge !== "attention" ? badge(it.badge) : 0), 0) + (g.id === "system" ? badge("attention") : 0);
        return <div key={g.id}>
          <button type="button" onClick={() => toggle(g.id)} aria-expanded={isOpen} className={cn("flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] font-semibold transition hover:bg-white/10", inGroup ? "text-white" : "text-on-dark")}>
            <span className="grid size-8 place-items-center rounded-lg" style={{ background: inGroup ? g.accent : "rgba(255,255,255,.08)" }}><g.icon className="size-4" /></span>
            <span className="flex-1">{g.label}</span>
            {!isOpen && alert > 0 && <span className="rounded-full bg-[#C8362F] px-1.5 text-[11px] font-bold text-white">{alert}</span>}
            <ChevronDown className={cn("size-4 opacity-60 transition", isOpen && "rotate-180")} />
          </button>
          {isOpen && <ul className="ml-[22px] mt-1 space-y-0.5 border-l border-white/15 pb-2 pl-3">
            {g.items.map((it) => { const on = locate(path).item?.to === it.to; const n = it.badge ? badgeCount(badge, it) : 0;
              return <li key={it.to}><Link to={route(it.to)} className={cn("flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm transition", on ? "bg-white/15 font-semibold text-white" : "text-on-dark-muted hover:bg-white/10 hover:text-white")}>
                <it.icon className="size-4 shrink-0" /><span className="flex-1 truncate">{it.label}</span>
                {n > 0 && <span className="rounded-full bg-[#C8362F] px-1.5 text-[11px] font-bold text-white">{n}</span>}
                {it.soon && <span className="rounded-full bg-white/15 px-1.5 text-[9px] font-bold uppercase tracking-wider">Soon</span>}
              </Link></li>; })}
          </ul>}
        </div>;
      })}
    </nav>
    <div className="border-t border-white/10 p-4">
      <div className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold font-heading text-lg text-nero">{(email[0] ?? "?").toUpperCase()}</span><p className="min-w-0 truncate text-xs text-on-dark-muted">{email}</p></div>
      <div className="mt-3 grid gap-0.5">
        <a href="/" target="_blank" rel="noreferrer" className="flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm text-on-dark hover:bg-white/10"><ExternalLink className="size-4" />View website</a>
        <button type="button" onClick={() => setPw((v) => !v)} className="flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm text-on-dark hover:bg-white/10"><KeyRound className="size-4" />Change password</button>
        {pw && <PasswordForm onDone={() => setPw(false)} />}
        <button type="button" onClick={() => void supabase().auth.signOut()} className="flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm text-on-dark hover:bg-white/10"><LogOut className="size-4" />Sign out</button>
      </div>
    </div>
  </div>;
}

function PasswordForm({ onDone }: { onDone: () => void }) {
  const [v, setV] = useState("");
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (v.length < 10) { toast.error("Use at least 10 characters."); return; }
    const { error } = await supabase().auth.updateUser({ password: v });
    if (error) toast.error(error.message); else { toast.success("Password changed."); setV(""); onDone(); }
  };
  return <form onSubmit={save} className="my-2 space-y-2"><Input type="password" autoComplete="new-password" value={v} onChange={(e) => setV(e.target.value)} placeholder="New password (10+ characters)" className="min-h-10 bg-white text-nero" /><Button type="submit" size="sm" className="min-h-9 w-full bg-gold text-nero">Save password</Button></form>;
}
