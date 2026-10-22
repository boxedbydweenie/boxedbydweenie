import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { KeyRound, LayoutDashboard, LogOut, Mail, Package, ReceiptText, ExternalLink, Megaphone, Users, ListChecks, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type State = { phase: "loading" } | { phase: "out" } | { phase: "denied"; email: string } | { phase: "in"; email: string };
const Ctx = createContext<{ email: string }>({ email: "" });
export const useAdmin = () => useContext(Ctx);

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ReceiptText },
  { to: "/admin/leads", label: "Enquiries", icon: Mail },
  { to: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/admin/audience", label: "Audience", icon: Users },
  { to: "/admin/email-log", label: "Send log", icon: ListChecks },
  { to: "/admin/images", label: "Images", icon: ImageIcon },
] as const;

export function AdminGate({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>({ phase: "loading" });
  useEffect(() => {
    const sb = supabase();
    const check = async () => {
      const { data } = await sb.auth.getSession();
      const email = data.session?.user.email;
      if (!email) return setS({ phase: "out" });
      const { data: ok } = await sb.rpc("is_admin");
      setS(ok === true ? { phase: "in", email } : { phase: "denied", email });
    };
    void check();
    const { data: sub } = sb.auth.onAuthStateChange((e) => { if (e === "SIGNED_IN" || e === "SIGNED_OUT") void check(); });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (s.phase === "loading") return <div className="grid min-h-screen place-items-center bg-ivory text-sm text-muted-foreground">Loading</div>;
  if (s.phase === "out") return <Login />;
  if (s.phase === "denied") return <Denied email={s.email} />;
  return <Ctx.Provider value={{ email: s.email }}><Shell email={s.email}>{children}</Shell></Ctx.Provider>;
}

function Frame({ children }: { children: ReactNode }) {
  return <div className="brand-pattern-green grid min-h-screen place-items-center px-5 py-12"><div className="w-full max-w-md rounded-lg bg-ivory p-8 shadow-[0_40px_80px_-40px_rgba(0,0,0,.8)] md:p-10">
    <img src="/brand/logo-primary.svg" alt="Boxed by Dweenie" className="h-12 w-auto" />
    {children}
  </div></div>;
}

function Login() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true); setErr("");
    const f = new FormData(e.currentTarget);
    const { error } = await supabase().auth.signInWithPassword({ email: String(f.get("email")).trim(), password: String(f.get("password")) });
    setBusy(false);
    if (error) setErr("That email or password is not right.");
  };
  return <Frame>
    <p className="eyebrow mt-8 text-[#8E6A10]">Team area</p><div aria-hidden className="mt-3 h-px w-12 bg-gold" />
    <h1 className="mt-4 text-4xl">Sign in</h1>
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div><Label htmlFor="a-email">Email</Label><Input id="a-email" name="email" type="email" autoComplete="username" required className="mt-2 min-h-11 bg-white" /></div>
      <div><Label htmlFor="a-pw">Password</Label><Input id="a-pw" name="password" type="password" autoComplete="current-password" required className="mt-2 min-h-11 bg-white" /></div>
      {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Signing in" : "Sign in"}</Button>
    </form>
    <p className="mt-6 text-xs text-muted-foreground">Staff only. Ask the owner if you need an account.</p>
  </Frame>;
}

function Denied({ email }: { email: string }) {
  return <Frame>
    <h1 className="mt-8 text-3xl">No access yet</h1>
    <p className="mt-3 text-sm text-muted-foreground">{email} is signed in but is not on the team list. Ask the owner to add you.</p>
    <Button className="mt-6" variant="outline" onClick={() => void supabase().auth.signOut()}>Sign out</Button>
  </Frame>;
}

function Shell({ email, children }: { email: string; children: ReactNode }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [pwOpen, setPwOpen] = useState(false);
  return <div className="min-h-screen bg-[#F7F4EC] text-nero md:grid md:grid-cols-[250px_1fr]">
    <aside className="brand-pattern-black text-on-dark md:sticky md:top-0 md:h-screen">
      <div className="flex items-center justify-between gap-4 p-5 md:block">
        <img src="/brand/logo-on-dark.svg" alt="Boxed by Dweenie" className="h-10 w-auto" />
        <p className="eyebrow hidden text-gold md:mt-5 md:block">Team area</p>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:space-y-1 md:px-3" aria-label="Admin">
        {NAV.map((n) => { const on = "exact" in n && n.exact ? path === n.to : path.startsWith(n.to);
          return <Link key={n.to} to={n.to} className={cn("flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition", on ? "bg-gold text-nero" : "text-on-dark hover:bg-white/10")}><n.icon className="size-4" />{n.label}</Link>; })}
        <a href="/" target="_blank" rel="noreferrer" className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-on-dark-muted hover:bg-white/10"><ExternalLink className="size-4" />View site</a>
      </nav>
      <div className="hidden p-4 md:absolute md:bottom-0 md:block md:w-full">
        <p className="truncate text-xs text-on-dark-muted">{email}</p>
        <button type="button" onClick={() => setPwOpen((v) => !v)} className="mt-2 flex min-h-9 items-center gap-2 text-sm text-on-dark hover:text-gold"><KeyRound className="size-4" />Change password</button>
        {pwOpen && <PasswordForm onDone={() => setPwOpen(false)} />}
        <button type="button" onClick={() => void supabase().auth.signOut()} className="flex min-h-9 items-center gap-2 text-sm text-on-dark hover:text-gold"><LogOut className="size-4" />Sign out</button>
      </div>
    </aside>
    <main className="min-w-0 p-5 md:p-10">{children}
      <div className="mt-12 flex gap-4 border-t border-black/10 pt-4 text-sm md:hidden"><button type="button" onClick={() => void supabase().auth.signOut()} className="underline">Sign out</button><span className="text-muted-foreground">{email}</span></div>
    </main>
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
