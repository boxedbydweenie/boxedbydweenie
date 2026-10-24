import { createFileRoute } from "@tanstack/react-router";
import { CalendarHeart, Gift, PartyPopper, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatNaira } from "@/lib/format";
import { Hero, Metric, Shortcut } from "@/components/admin/AdminBits";

export const Route = createFileRoute("/admin/engagement")({ component: Engagement });

function Engagement() {
  const [n, setN] = useState<{ santa: number; open: number; subs: number; cards: number; balance: number } | null>(null);
  useEffect(() => { void (async () => { const sb = supabase();
    const [s, o, sub, g] = await Promise.all([
      sb.from("santa_exchanges").select("id", { count: "exact", head: true }),
      sb.from("santa_exchanges").select("id", { count: "exact", head: true }).eq("data->exchange->>status", "open"),
      sb.from("newsletter_subscribers").select("email", { count: "exact", head: true }),
      sb.from("gift_cards").select("balance").eq("status", "active"),
    ]);
    setN({ santa: s.count ?? 0, open: o.count ?? 0, subs: sub.count ?? 0, cards: g.data?.length ?? 0, balance: (g.data ?? []).reduce((a, r: { balance: number }) => a + r.balance, 0) });
  })(); }, []);
  return <div className="space-y-8">
    <Hero eyebrow="Gifting & Community" title="Gifting & community" accent="#EB826C" blurb="The things that bring people back: Secret Santa, the Gift Calendar, gift cards and the newsletter." />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric to="/admin/secret-santa" tone="bg-[#39243F] text-[#F4EFE5]" label="Secret Santa exchanges" value={n ? n.santa : "…"} sub={n ? `${n.open} still open` : undefined} icon={PartyPopper} />
      <Metric to="/admin/gift-cards" tone="bg-[#E7B93B] text-nero" label="Active gift cards" value={n ? n.cards : "…"} sub={n ? `${formatNaira(n.balance)} still to spend` : undefined} icon={Gift} />
      <Metric to="/admin/audience" tone="bg-[#263D35] text-[#F4EFE5]" label="Newsletter sign-ups" value={n ? n.subs : "…"} sub="From the website footer" icon={UserCircle} />
    </section>
    <div className="grid gap-4 md:grid-cols-2">
      <Shortcut to="/admin/secret-santa" icon={PartyPopper} title="Secret Santa" desc="Every exchange, its organiser, dates and progress." />
      <Shortcut to="/admin/gift-cards" icon={Gift} title="Gift cards" desc="Cards sold, send dates and balances." />
      <Shortcut to="/admin/soon/gift-calendar" icon={CalendarHeart} title="Gift Calendar" desc="Reminder emails and WhatsApp." soon />
      <Shortcut to="/admin/soon/accounts" icon={UserCircle} title="Customer accounts" desc="Sign-ins and saved details." soon />
    </div>
  </div>;
}
