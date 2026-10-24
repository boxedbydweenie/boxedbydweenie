import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Lock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { humanAgo, useAdminData, type Check } from "@/components/admin/AdminData";
import { Hero, LEVEL, LevelPill, StatusDot } from "@/components/admin/AdminBits";
import { Card } from "@/components/admin/EmailBits";
import { route } from "@/components/admin/nav";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/system")({ component: System });

const AREAS = ["Payments", "Orders", "Email", "Catalogue", "Platform"] as const;
const LINKS = [
  ["Supabase (database and functions)", "https://supabase.com/dashboard/project/zstplraslhhkfyiapjdm"],
  ["Resend (email sending)", "https://resend.com/emails"],
  ["Paystack (payments)", "https://dashboard.paystack.com"],
  ["Cloudflare (website hosting)", "https://dash.cloudflare.com"],
  ["GoDaddy (domain and DNS)", "https://dcc.godaddy.com"],
];

function System() {
  const { ready, checks, checklist, status, refresh, refreshing, snap, toggleManual } = useAdminData();
  const done = checklist.filter((c) => c.done).length;
  const areas = [...new Set(checklist.map((c) => c.area))];
  const tick = async (key: string, v: boolean) => { try { await toggleManual(key, v); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save."); } };

  return <div className="space-y-8">
    <Hero eyebrow="System" title="Health & setup" accent="#86BAA3"
      blurb="Live checks on payments, orders, email and the catalogue, plus everything still to set up. Numbers refresh every two minutes."
      aside={<button type="button" onClick={() => void refresh()} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-6 text-sm font-semibold text-nero transition hover:-translate-y-0.5"><RefreshCw className={cn("size-4", refreshing && "animate-spin")} />Check again</button>}>
      <div className="flex flex-wrap items-center gap-3">
        <LevelPill level={ready ? status.level : "off"}>{!ready ? "Checking" : status.level === "ok" ? "All systems healthy" : `${status.bad} need action · ${status.warn} need a look`}</LevelPill>
        {ready && <span className="text-sm text-on-dark-muted">Checked {humanAgo(new Date(snap.loadedAt).toISOString())}</span>}
        {ready && snap.secretsError && <span className="rounded-full bg-[#F8EBB8] px-3 py-1 text-xs font-semibold text-[#6B4D00]">The secrets check could not run, so some items show as not checked.</span>}
      </div>
    </Hero>

    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        {AREAS.map((a) => { const rows = checks.filter((c) => c.area === a); if (!rows.length) return null;
          return <div key={a} id={a.toLowerCase()} className="scroll-mt-24"><Card title={a} accent="from-[#E7B93B] to-[#EB826C]">
            <ul className="divide-y divide-black/5">{rows.map((c) => <CheckRow key={c.id} c={c} />)}</ul></Card></div>; })}
      </div>

      <div className="space-y-6">
        <Card title="Setup checklist" hint={`${done} of ${checklist.length} done. Ticks are shared with the whole team.`} accent="from-[#86BAA3] to-[#E7B93B]">
          <div className="h-2.5 overflow-hidden rounded-full bg-black/5"><div className="h-full rounded-full bg-gradient-to-r from-[#86BAA3] to-[#E7B93B] transition-all" style={{ width: `${checklist.length ? Math.round((done / checklist.length) * 100) : 0}%` }} /></div>
          {!snap.checklistReady && ready && <p className="mt-4 rounded-lg bg-[#F8EBB8] p-3 text-xs text-[#6B4D00]">Ticking is not switched on yet (the checklist table has not been created). Automatic items still work.</p>}
          {areas.map((a) => <div key={a} className="mt-6"><h3 className="text-[11px] font-bold uppercase tracking-[.18em] text-muted-foreground">{a}</h3>
            <ul className="mt-2 space-y-1">{checklist.filter((c) => c.area === a).map((c) => <li key={c.key} className="rounded-xl p-2 hover:bg-[#F7F4EC]">
              <label className={cn("flex gap-3", c.auto ? "cursor-default" : "cursor-pointer")}>
                {c.auto ? <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border", c.done ? "border-[#2E9E6B] bg-[#2E9E6B] text-white" : "border-black/25 bg-white")} title="Ticks itself"><Lock className={cn("size-3", !c.done && "opacity-40")} /></span>
                  : <input type="checkbox" checked={c.done} disabled={!snap.checklistReady} onChange={(e) => void tick(c.key, e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[#263D35]" />}
                <span className="min-w-0"><span className={cn("block text-sm font-semibold", c.done && "text-muted-foreground line-through")}>{c.label}</span>
                  {!c.done && <span className="mt-0.5 block text-xs text-muted-foreground">{c.why}</span>}
                  {c.done && !c.auto && c.doneBy && <span className="mt-0.5 block text-xs text-muted-foreground">Ticked by {c.doneBy} {humanAgo(c.doneAt ?? null)}</span>}
                  {!c.done && c.to && <Link to={route(c.to)} className="mt-1 inline-block text-xs font-semibold underline">Open</Link>}
                </span></label></li>)}</ul></div>)}
        </Card>
        <Card title="Where things live" accent="from-[#192850] to-[#86BAA3]">
          <ul className="space-y-1">{LINKS.map(([l, u]) => <li key={u}><a href={u} target="_blank" rel="noreferrer" className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm font-medium hover:bg-[#F7F4EC]"><ExternalLink className="size-4 opacity-60" />{l}</a></li>)}</ul>
        </Card>
      </div>
    </div>
  </div>;
}

function CheckRow({ c }: { c: Check }) {
  const body = <><StatusDot level={c.level} pulse className="mt-1.5" /><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2 font-semibold">{c.label}<span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", LEVEL[c.level].bg, LEVEL[c.level].text)}>{LEVEL[c.level].label}</span></span><span className="mt-0.5 block text-sm text-muted-foreground">{c.detail}</span></span></>;
  return <li>{c.to ? <Link to={route(c.to)} className="flex gap-3 py-3.5 transition hover:opacity-80">{body}</Link> : <div className="flex gap-3 py-3.5">{body}</div>}</li>;
}

