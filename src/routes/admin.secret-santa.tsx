import { createFileRoute } from "@tanstack/react-router";
import { PartyPopper } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatNaira } from "@/lib/format";
import { Empty, Hero, Metric } from "@/components/admin/AdminBits";
import { Card, Pill } from "@/components/admin/EmailBits";

export const Route = createFileRoute("/admin/secret-santa")({ component: Santa });

interface Ex { name?: string; type?: string; organiserName?: string; organisation?: string; budget?: number; status?: string; maxParticipants?: number; dates?: { joinBy?: string; draw?: string; orderBy?: string; exchange?: string } }
interface Row { id: string; code: string; created_at: string; exchange: Ex | null; participants: { status?: string }[] | null; orders: { status?: string }[] | null }
const STATUS: Record<string, string> = { open: "bg-[#DDF0E6] text-[#1D5A3F]", drawn: "bg-[#E3EBFA] text-[#192850]", complete: "bg-[#F8EBB8] text-[#6B4D00]", closed: "bg-black/5 text-[#292828]/60" };
const TYPE: Record<string, string> = { office: "Office", family: "Family", friends: "Friends" };
const fmt = (d?: string) => (d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—");

function Santa() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState(false);
  // Only the exchange details, participant statuses and order statuses are read. The draw results and the organiser's secret link are never loaded here.
  useEffect(() => { void supabase().from("santa_exchanges").select("id,code,created_at,exchange:data->exchange,participants:data->participants,orders:data->orders").order("created_at", { ascending: false }).limit(300)
    .then(({ data, error }) => { if (error) setErr(true); else setRows((data ?? []) as unknown as Row[]); }); }, []);
  const people = (r: Row) => r.participants?.length ?? 0;
  const total = (rows ?? []).reduce((a, r) => a + people(r), 0);
  return <div className="space-y-8">
    <Hero eyebrow="Gifting & Community" title="Secret Santa" accent="#EB826C" blurb="Every exchange customers have set up, how many people joined and where it has got to. Who draws whom stays secret, even from this screen." />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric tone="bg-[#39243F] text-[#F4EFE5]" label="Exchanges" value={rows ? rows.length : "…"} />
      <Metric tone="bg-[#E7B93B] text-nero" label="Still open" value={rows ? rows.filter((r) => r.exchange?.status === "open").length : "…"} sub="Waiting for people to join" />
      <Metric tone="bg-[#263D35] text-[#F4EFE5]" label="People taking part" value={rows ? total : "…"} />
      <Metric tone="bg-[#83252C] text-white" label="Gifts ordered" value={rows ? rows.reduce((a, r) => a + (r.orders?.length ?? 0), 0) : "…"} />
    </section>
    {err && <p role="alert" className="text-destructive">Could not load the exchanges. Refresh and try again.</p>}
    {rows && rows.length === 0 && <Empty icon={PartyPopper} title="No exchanges yet">When a customer or company starts a Secret Santa on the website, it shows up here.</Empty>}
    <div className="grid gap-4 lg:grid-cols-2">{rows?.map((r) => { const ex = r.exchange ?? {}; const n = people(r); const joined = (r.participants ?? []).filter((p) => p.status && p.status !== "invited").length;
      return <Card key={r.id} accent="from-[#39243F] to-[#EB826C]">
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-heading text-2xl">{ex.name ?? "Untitled exchange"}</h2><p className="mt-1 text-sm text-muted-foreground">{[ex.organiserName, ex.organisation].filter(Boolean).join(" · ")}</p></div>
          <div className="flex gap-2"><Pill cls="bg-[#F4EFE5] text-[#6C432A]">{TYPE[ex.type ?? ""] ?? ex.type ?? "Exchange"}</Pill><Pill cls={STATUS[ex.status ?? ""] ?? "bg-black/5"}>{ex.status ?? "unknown"}</Pill></div></div>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-sm"><Stat l="People" v={`${n}${ex.maxParticipants ? ` / ${ex.maxParticipants}` : ""}`} /><Stat l="Joined" v={`${joined}`} /><Stat l="Budget" v={ex.budget ? formatNaira(ex.budget) : "—"} /></dl>
        <ol className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">{([["Join by", ex.dates?.joinBy], ["Draw", ex.dates?.draw], ["Order by", ex.dates?.orderBy], ["Exchange", ex.dates?.exchange]] as const).map(([l, d]) => <li key={l} className="rounded-lg bg-[#F4EFE5]/70 p-2"><span className="block text-[10px] uppercase tracking-wider text-muted-foreground">{l}</span><span className="font-semibold">{fmt(d)}</span></li>)}</ol>
        <p className="mt-3 text-xs text-muted-foreground">Code {r.code} · created {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
      </Card>; })}</div>
  </div>;
}
const Stat = ({ l, v }: { l: string; v: string }) => <div className="rounded-lg bg-[#F4EFE5]/60 p-3"><dt className="text-xs text-muted-foreground">{l}</dt><dd className="mt-1 font-heading text-xl">{v}</dd></div>;
