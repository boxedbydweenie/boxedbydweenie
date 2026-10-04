import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BellRing, Download, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { SantaShell } from "@/components/santa/SantaShell";
import { DrawAnimation, NextDateCountdown, ProgressRing, SantaTimeline } from "@/components/santa/SantaParts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MIN_TO_DRAW } from "@/config/secretSanta";
import { useSanta } from "@/hooks/use-santa";
import { addExclusion, completeExchange, currentStage, dateWarnings, drawNames, exchangeById, exportParticipantsCsv, invitePeople, joinedCount, organiserMatches, parsePeopleList, participantsOf, postAnnouncement, removeExclusion, removeParticipant, updateExchangeSettings } from "@/services/secretSanta";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ExchangeDates, ParticipantStatus } from "@/types/secretSanta";

export const Route = createFileRoute("/secret-santa/$id/manage")({
  head: () => ({ meta: [
    { title: "Organiser dashboard — Secret Santa — Boxed by Dweenie" },
    { name: "description", content: "Manage participants, exclusions, dates and the draw for your Secret Santa." },
    { property: "og:title", content: "Secret Santa organiser dashboard" },
    { property: "og:description", content: "Everything you need to run your gift exchange." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: Manage,
});

export const STATUS_LABEL: Record<ParticipantStatus, string> = { invited: "Invited", joined: "Joined", wishlist: "Wishlist added", ordered: "Gift ordered", delivered: "Delivered" };
const chip = (s: ParticipantStatus) => cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", s === "invited" ? "border border-line-dark text-on-dark-muted" : s === "delivered" || s === "ordered" ? "bg-gold text-nero" : "border border-gold text-on-dark");
const Card = ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => <section className={cn("rounded-md border border-line-dark p-5 md:p-6", className)}><h2 className="text-sm text-on-dark">{title}</h2><div className="mt-4">{children}</div></section>;
const field = "min-h-11 border-line-dark bg-nero-soft text-on-dark";

function Manage() {
  const { id } = Route.useParams();
  const s = useSanta();
  const ex = exchangeById(s, id);
  const people = participantsOf(s, id);
  const [one, setOne] = useState({ name: "", contact: "" });
  const [paste, setPaste] = useState("");
  const [pair, setPair] = useState<[string, string]>(["", ""]);
  const [msg, setMsg] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [dates, setDates] = useState<ExchangeDates | null>(null);

  if (!ex) return <SantaShell><main className="mx-auto max-w-md px-5 py-20 text-center"><h1 className="text-2xl text-on-dark">Exchange not found</h1><p className="mt-3 text-on-dark-muted">It may have been created on another device.</p><Button asChild className="mt-6"><Link to="/secret-santa">Back to Secret Santa</Link></Button></main></SantaShell>;
  const joined = joinedCount(s, id);
  const canDraw = ex.status === "open" && joined >= MIN_TO_DRAW;
  const matches = organiserMatches(s, id);
  const name = (pid: string) => people.find((p) => p.id === pid)?.name ?? "Removed";
  const d = dates ?? ex.dates;

  const doDraw = async () => {
    setConfirm(false);
    const r = await drawNames(id);
    if (!r.ok) return toast(r.message);
    setDrawing(true);
  };

  return <SantaShell title={ex.name}>
    {drawing && <DrawAnimation names={people.filter((p) => p.status !== "invited").map((p) => p.name)} onDone={() => setDrawing(false)} />}
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:py-10">
      <header className="flex items-center gap-5 rounded-md border border-line-dark p-5 md:p-6">
        <ProgressRing value={joined} total={people.length} label="joined" />
        <div className="min-w-0 flex-1"><p className="eyebrow text-gold">Organiser · {ex.status === "open" ? "Open" : ex.status === "drawn" ? "Names drawn" : ex.status === "complete" ? "Complete" : "Closed"}</p><h1 className="mt-2 truncate text-xl text-on-dark md:text-2xl">{ex.name}</h1><div className="mt-1 text-sm"><NextDateCountdown exchange={ex} dark /></div></div>
        <p className="hidden text-right text-sm text-on-dark-muted sm:block">Code<br /><strong className="font-heading text-lg tracking-[0.2em] text-gold">{ex.code}</strong></p>
      </header>

      <Card title="Timeline"><SantaTimeline dates={ex.dates} stage={currentStage(ex)} dark /></Card>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card title={`Participants (${people.length})`}>
          <ul className="divide-y divide-line-dark">{people.map((p) => <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <div className="min-w-0"><p className="truncate font-semibold text-on-dark">{p.name}{p.isOrganiser ? " (organiser)" : ""}</p><p className="truncate text-xs text-on-dark-muted">{p.contact || "No contact"}</p></div>
            <span className={chip(p.status)}>{STATUS_LABEL[p.status]}</span>
            <div className="col-span-2 flex gap-1 sm:col-span-1">
              {(p.status === "invited" || p.status === "joined") && <Button size="sm" variant="ghost" className="text-on-dark" onClick={() => toast(`Nudge sent to ${p.name}.`, { description: "Reminders are a preview for now." })}><BellRing /> Nudge</Button>}
              {ex.status === "open" && !p.isOrganiser && <Button size="icon" variant="ghost" className="text-on-dark-muted" aria-label={`Remove ${p.name}`} onClick={() => removeParticipant(p.id)}><Trash2 /></Button>}
            </div>
          </li>)}</ul>
          {ex.status === "open" && <div className="mt-6 space-y-4 border-t border-line-dark pt-5">
            <form className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]" onSubmit={async (e) => { e.preventDefault(); if (!one.name.trim()) return; await invitePeople(id, [one]); setOne({ name: "", contact: "" }); }}>
              <Input aria-label="Name" placeholder="Name" value={one.name} onChange={(e) => setOne({ ...one, name: e.target.value })} className={field} />
              <Input aria-label="Email or phone" placeholder="Email or phone" value={one.contact} onChange={(e) => setOne({ ...one, contact: e.target.value })} className={field} />
              <Button type="submit">Add</Button>
            </form>
            <div><Label htmlFor="paste" className="text-on-dark">Paste a list (one per line: name, email or phone)</Label><Textarea id="paste" rows={3} value={paste} onChange={(e) => setPaste(e.target.value)} className="mt-2 border-line-dark bg-nero-soft text-on-dark" />
              <div className="mt-2 flex flex-wrap gap-2"><Button size="sm" variant="outline" className="text-on-dark" disabled={!paste.trim()} onClick={async () => { const n = await invitePeople(id, parsePeopleList(paste)); setPaste(""); toast(`${n} people added.`); }}>Add list</Button>
                <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md border border-line-dark px-3 text-sm text-on-dark"><Upload className="size-4" /> Upload CSV<input type="file" accept=".csv,text/csv" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const n = await invitePeople(id, parsePeopleList(await f.text())); toast(`${n} people added from ${f.name}.`); e.target.value = ""; }} /></label></div></div>
          </div>}
        </Card>

        <div className="space-y-6">
          <Card title="The draw">
            {ex.status === "open" ? <>
              <label className="flex min-h-11 items-center justify-between gap-3 text-sm text-on-dark">Let me see matches<Switch checked={ex.showMatches} onCheckedChange={(v) => updateExchangeSettings(id, { showMatches: v })} /></label>
              <p className="mt-1 text-xs text-on-dark-muted">Must be switched on before the draw. Otherwise matches stay secret, even from you.</p>
              <Button className="mt-5 w-full" size="lg" disabled={!canDraw} onClick={() => setConfirm(true)}>Draw names</Button>
              {!canDraw && <p className="mt-2 text-xs text-on-dark-muted">At least {MIN_TO_DRAW} people need to join first. {joined} have joined.</p>}
            </> : <>
              <p className="text-sm text-on-dark">Names have been drawn. Everyone can now see their own match.</p>
              {matches.length > 0 ? <ul className="mt-4 space-y-1 text-sm text-on-dark-muted">{matches.map((m) => <li key={m.giverId}>{name(m.giverId)} → <span className="text-on-dark">{name(m.receiverId)}</span></li>)}</ul> : <p className="mt-2 text-xs text-on-dark-muted">Matches are hidden from the organiser.</p>}
            </>}
          </Card>

          <Card title="Exclusions">
            <p className="text-xs text-on-dark-muted">Pairs who must not draw each other, such as couples, or a manager and a direct report.</p>
            <ul className="mt-3 space-y-2">{ex.exclusions.map(([a, b], i) => <li key={`${a}-${b}`} className="flex items-center justify-between rounded-sm border border-line-dark px-3 py-2 text-sm text-on-dark">{name(a)} &amp; {name(b)}{ex.status === "open" && <Button size="icon" variant="ghost" className="size-8 text-on-dark-muted" aria-label="Remove exclusion" onClick={() => removeExclusion(id, i)}><X /></Button>}</li>)}</ul>
            {ex.status === "open" && <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2">{[0, 1].map((i) => <Select key={i} value={pair[i]} onValueChange={(v) => setPair(i ? [pair[0], v] : [v, pair[1]])}><SelectTrigger className={field} aria-label={`Person ${i + 1}`}><SelectValue placeholder="Person" /></SelectTrigger><SelectContent>{people.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>)}
              <Button disabled={!pair[0] || !pair[1] || pair[0] === pair[1]} onClick={async () => { await addExclusion(id, pair[0], pair[1]); setPair(["", ""]); }}>Add</Button></div>}
          </Card>

          {ex.payer === "company" && <Card title="Company pays" className="border-gold">
            <p className="text-on-dark">{people.length} people × {formatNaira(ex.budget)} = <strong className="text-gold">{formatNaira(people.length * ex.budget)}</strong></p>
            <Button asChild className="mt-4 w-full"><Link to="/corporate/quote" search={{ quantity: people.length, budget: ex.budget }}>Get a quote for this exchange</Link></Button>
          </Card>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Announcements">
          <form onSubmit={async (e) => { e.preventDefault(); if (!msg.trim()) return; await postAnnouncement(id, msg.trim()); setMsg(""); toast("Posted to everyone."); }}>
            <Textarea aria-label="Message to everyone" rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Reminder: wishlists by Friday, please." className="border-line-dark bg-nero-soft text-on-dark" />
            <Button type="submit" className="mt-3">Post to everyone</Button>
          </form>
          <ul className="mt-5 space-y-3">{s.messages.filter((m) => m.exchangeId === id && m.kind === "announcement").reverse().map((m) => <li key={m.id} className="border-l-2 border-gold pl-3 text-sm text-on-dark">{m.body}<span className="mt-1 block text-xs text-on-dark-muted">{new Date(m.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span></li>)}</ul>
        </Card>

        <Card title="Settings">
          <div className="grid grid-cols-2 gap-3">{(["joinBy", "draw", "orderBy", "exchange"] as const).map((k) => <div key={k}><Label htmlFor={`d-${k}`} className="text-xs text-on-dark-muted">{{ joinBy: "Join by", draw: "Draw date", orderBy: "Order by", exchange: "Exchange day" }[k]}</Label><Input id={`d-${k}`} type="date" value={d[k]} onChange={(e) => setDates({ ...d, [k]: e.target.value })} className={cn(field, "mt-1 [color-scheme:dark]")} /></div>)}</div>
          {dates && <>{dateWarnings(dates).map((w) => <p key={w} className="mt-2 text-xs text-gold">{w}</p>)}<Button size="sm" className="mt-3" onClick={async () => { await updateExchangeSettings(id, { dates }); setDates(null); toast("Dates updated."); }}>Save dates</Button></>}
          <label className="mt-5 flex min-h-11 items-center justify-between gap-3 text-sm text-on-dark">Allow "Who was my Santa?" on exchange day<Switch checked={ex.allowReveal} onCheckedChange={(v) => updateExchangeSettings(id, { allowReveal: v })} /></label>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="text-on-dark" onClick={() => exportParticipantsCsv(s, id)}><Download /> Export the list</Button>
            {ex.status === "drawn" && <Button size="sm" variant="outline" className="text-on-dark" onClick={() => completeExchange(id)}>Mark exchange day done</Button>}
            {ex.status !== "closed" && <Button size="sm" variant="ghost" className="text-on-dark-muted" onClick={() => updateExchangeSettings(id, { status: "closed" })}>Close the exchange</Button>}
          </div>
        </Card>
      </div>
    </main>

    <AlertDialog open={confirm} onOpenChange={setConfirm}>
      <AlertDialogContent className="bg-paper">
        <AlertDialogTitle>Draw names now?</AlertDialogTitle>
        <AlertDialogDescription>{joined} people will be matched. People who haven't joined will be left out, and the draw can't be undone.{ex.showMatches ? " You will be able to see the matches." : " Matches will stay secret, even from you."}</AlertDialogDescription>
        <AlertDialogFooter><AlertDialogCancel>Not yet</AlertDialogCancel><AlertDialogAction onClick={doDraw}>Draw names</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </SantaShell>;
}
