import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminShell } from "./AdminShell";

type State = { phase: "loading" } | { phase: "out" } | { phase: "denied"; email: string } | { phase: "in"; email: string };
const Ctx = createContext<{ email: string }>({ email: "" });
export const useAdmin = () => useContext(Ctx);

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
  return <Ctx.Provider value={{ email: s.email }}><AdminShell email={s.email}>{children}</AdminShell></Ctx.Provider>;
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
