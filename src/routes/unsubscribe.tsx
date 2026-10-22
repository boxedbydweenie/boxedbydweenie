import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { CircleCheck, Gift, MailX } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/site/Brand";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: (s: Record<string, unknown>): { t?: string } => (typeof s["t"] === "string" ? { t: s["t"] } : {}),
  head: () => ({ meta: [{ title: "Email preferences — Boxed by Dweenie" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: UnsubscribePage,
});

type Phase = "loading" | "bad" | "test" | "ready" | "done" | "already" | "blocked" | "back" | "error";
const REASONS = ["Too many emails", "Not relevant to me", "I never signed up", "Something else"];
const FN = `${SUPABASE_URL}/functions/v1/unsubscribe`;

async function call(token: string, body?: Record<string, unknown>): Promise<{ ok: boolean; data: { email?: string; status?: string; test?: boolean; error?: string } }> {
  try {
    const res = await fetch(body ? FN : `${FN}?t=${encodeURIComponent(token)}`, body
      ? { method: "POST", headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY }, body: JSON.stringify({ token, ...body }) }
      : { headers: { apikey: SUPABASE_KEY } });
    return { ok: res.ok, data: await res.json().catch(() => ({})) };
  } catch { return { ok: false, data: {} }; }
}

function UnsubscribePage() {
  const { t = "" } = Route.useSearch();
  const [phase, setPhase] = useState<Phase>("loading");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!t) { setPhase("bad"); return; }
    void call(t).then(({ ok, data }) => {
      if (data.test) return setPhase("test");
      if (!ok) return setPhase(data.error ? "bad" : "error");
      setEmail(data.email ?? "");
      setPhase(data.status === "active" ? "ready" : data.status === "unsubscribed" ? "already" : "blocked");
    });
  }, [t]);

  const act = useCallback(async (action: "unsubscribe" | "resubscribe") => {
    setBusy(true);
    const { ok, data } = await call(t, { action, reason });
    setBusy(false);
    if (!ok) return setPhase("error");
    setPhase(action === "unsubscribe" ? "done" : data.status === "active" ? "back" : "blocked");
  }, [t, reason]);

  const Icon = phase === "done" || phase === "already" ? MailX : phase === "back" ? Gift : CircleCheck;
  return <SiteShell><main className="brand-pattern-ivory">
    <div className="mx-auto flex min-h-[70vh] max-w-xl items-center px-5 py-16">
      <div className="w-full overflow-hidden rounded-3xl bg-white shadow-[0_40px_80px_-50px_rgba(41,40,40,.55)]">
        <div className="h-2 bg-gradient-to-r from-[#E7B93B] via-[#EB826C] to-[#86BAA3]" />
        <div className="p-8 md:p-10">
          <div className={cn("grid size-14 place-items-center rounded-full", phase === "back" ? "bg-[#E7B93B]/25" : "bg-[#F4EFE5]")}><Icon className="size-7 text-nero" /></div>
          {phase === "loading" && <p className="mt-6 text-muted-foreground" role="status">One moment…</p>}
          {phase === "bad" && <Msg title="This link is not valid" body="It may be incomplete or out of date. If you want to stop our emails, reply to any of them or write to hello@boxedbydweenie.com and we will take care of it." />}
          {phase === "error" && <Msg title="We could not reach our servers" body="Please check your connection and try again in a moment." />}
          {phase === "test" && <Msg title="This is a test email" body="In a real email, this page lets the reader unsubscribe. Nothing has been changed." />}
          {phase === "ready" && <>
            <h1 className="mt-6 text-3xl">Unsubscribe from our emails?</h1>
            <p className="mt-3 text-muted-foreground">We will stop sending news and offers to <b className="text-nero">{email}</b>. You will still get order updates if you shop with us.</p>
            <fieldset className="mt-6"><legend className="text-sm font-semibold">Mind telling us why? (optional)</legend>
              <div className="mt-3 flex flex-wrap gap-2">{REASONS.map((r) => <button key={r} type="button" aria-pressed={reason === r} onClick={() => setReason(reason === r ? "" : r)} className={cn("min-h-10 rounded-full border px-4 text-sm transition", reason === r ? "border-nero bg-nero text-white" : "border-nero/20 bg-white hover:border-nero/50")}>{r}</button>)}</div></fieldset>
            <div className="mt-8 flex flex-wrap gap-3"><Button onClick={() => void act("unsubscribe")} disabled={busy}>{busy ? "One moment…" : "Yes, unsubscribe me"}</Button><Button asChild variant="ghost"><Link to="/">Keep me subscribed</Link></Button></div>
          </>}
          {phase === "done" && <>
            <Msg title="You are unsubscribed" body={`We have stopped marketing emails to ${email}. We are sorry to see you go.`} />
            <p className="mt-6 text-sm text-muted-foreground">Clicked by mistake?</p><Button className="mt-2" variant="outline" disabled={busy} onClick={() => void act("resubscribe")}>Re-subscribe me</Button>
          </>}
          {phase === "already" && <>
            <Msg title="You are already unsubscribed" body={`${email} is not on our marketing list.`} />
            <Button className="mt-6" variant="outline" disabled={busy} onClick={() => void act("resubscribe")}>Re-subscribe me</Button>
          </>}
          {phase === "back" && <Msg title="Welcome back" body={`${email} is back on our list. Thank you.`} />}
          {phase === "blocked" && <Msg title="Nothing more to do" body={`We are not sending marketing emails to ${email}. To change that, write to hello@boxedbydweenie.com.`} />}
        </div>
      </div>
    </div>
  </main></SiteShell>;
}

function Msg({ title, body }: { title: string; body: string }) {
  return <><h1 className="mt-6 text-3xl">{title}</h1><p className="mt-3 text-muted-foreground">{body}</p></>;
}
