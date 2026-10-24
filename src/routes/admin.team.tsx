import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/components/admin/AdminGate";
import { Empty, Hero } from "@/components/admin/AdminBits";
import { Card } from "@/components/admin/EmailBits";

export const Route = createFileRoute("/admin/team")({ component: Team });
interface Member { user_id: string; email: string; role: string; created_at: string }
const ROLE: Record<string, string> = { owner: "Owner", admin: "Admin", staff: "Staff" };

function Team() {
  const { email } = useAdmin();
  const [rows, setRows] = useState<Member[] | null>(null);
  useEffect(() => { void supabase().from("admin_users").select("*").order("created_at").then(({ data }) => setRows((data ?? []) as Member[])); }, []);
  return <div className="space-y-8">
    <Hero eyebrow="System" title="Team & access" accent="#192850" blurb="Everyone who can sign in to this area. Adding or removing someone is done by the owner in Supabase for now, so access stays tightly controlled." />
    <Card title="Who has access" accent="from-[#192850] to-[#86BAA3]">
      {!rows && <p className="text-sm text-muted-foreground">Loading…</p>}
      {rows && rows.length === 0 && <Empty icon={ShieldCheck} title="No one listed" />}
      <ul className="divide-y divide-black/5">{rows?.map((m) => <li key={m.user_id} className="flex min-h-16 items-center gap-4 py-2">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-nero font-heading text-lg text-gold">{(m.email[0] ?? "?").toUpperCase()}</span>
        <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{m.email}{m.email.toLowerCase() === email.toLowerCase() && <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">You</span>}</span>
          <span className="block text-xs text-muted-foreground">Added {new Date(m.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span></span>
        <span className="rounded-full bg-[#F4EFE5] px-3 py-1 text-xs font-bold uppercase tracking-wider">{ROLE[m.role] ?? m.role}</span></li>)}</ul>
    </Card>
  </div>;
}
