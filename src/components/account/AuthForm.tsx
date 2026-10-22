import { useState } from "react";
import { Button, FormField } from "@/components/site/Brand";
import { signIn, signUp } from "@/services/account";
import { cn } from "@/lib/utils";

/** Real sign-in and account creation (email + password). Used on the account page and the Gift Calendar. */
export function AuthForm({ cta = "Continue", intro }: { cta?: string; intro?: string }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget); const v = (k: string) => String(f.get(k) ?? "").trim();
    setErr(""); setBusy(true);
    try {
      if (mode === "in") await signIn(v("email"), String(f.get("password") ?? ""));
      else await signUp({ name: v("name"), email: v("email"), phone: v("phone"), password: String(f.get("password") ?? ""), marketing: f.get("marketing") === "on" });
    } catch (x) { setErr(x instanceof Error ? x.message : "Something went wrong. Please try again."); setBusy(false); }
  };
  return <div className="mx-auto max-w-md rounded-2xl border border-nero/10 bg-white p-8 shadow-[0_30px_60px_-40px_rgba(41,40,40,.5)]">
    <div className="grid grid-cols-2 rounded-full bg-[#F4EFE5] p-1 text-sm font-semibold">{([["in", "Sign in"], ["up", "Create account"]] as const).map(([m, l]) => <button key={m} type="button" onClick={() => { setMode(m); setErr(""); }} className={cn("min-h-10 rounded-full transition", mode === m ? "bg-nero text-white" : "text-nero/60")}>{l}</button>)}</div>
    <p className="mt-5 text-sm text-muted-foreground">{intro ?? (mode === "in" ? "Sign in to see your orders, saved recipients, wishlist and dates on any device." : "Create a free account to keep your orders, recipients and important dates safe.")}</p>
    <form key={mode} className="mt-5 grid gap-4" onSubmit={submit}>
      {mode === "up" && <FormField label="Your name" name="name" autoComplete="name" required />}
      <FormField label="Email" name="email" type="email" autoComplete="email" required />
      {mode === "up" && <FormField label="Phone (optional)" name="phone" type="tel" autoComplete="tel" />}
      <FormField label={mode === "up" ? "Password (8+ characters)" : "Password"} name="password" type="password" autoComplete={mode === "up" ? "new-password" : "current-password"} minLength={8} required />
      {mode === "up" && <label className="flex cursor-pointer items-start gap-3 text-sm text-muted-foreground"><input type="checkbox" name="marketing" className="mt-1 size-4 shrink-0 accent-[var(--color-nero)]" /><span>Send me gift ideas, offers and news from Boxed by Dweenie. You can unsubscribe at any time.</span></label>}
      {err && <p role="alert" className="text-sm font-medium text-destructive">{err}</p>}
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "One moment…" : mode === "in" ? cta : "Create my account"}</Button>
      {mode === "in" && <p className="text-center text-xs text-muted-foreground">Forgot your password? Message us on WhatsApp or email hello@boxedbydweenie.com and we will reset it.</p>}
    </form>
  </div>;
}
