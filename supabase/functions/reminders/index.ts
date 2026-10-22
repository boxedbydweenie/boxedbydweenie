// Daily job (07:00 Lagos, scheduled in the database with pg_cron):
//  1. emails gift cards whose send date has arrived
//  2. emails Gift Calendar reminders to signed-in customers whose people have a date coming up
// Safe to call at any time: every email is recorded so nothing is sent twice.
// POST {} for the normal run, or { preview: "you@example.com" } to send one sample reminder to that address only.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { sendMail, sendGiftCardEmail, layout, p, esc, lagosToday, SITE_URL, TEAM } from "../_shared/mail.ts";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const DAY = 86400_000;

function daysUntil(day: number, month: number, today: string) {
  const t = Date.parse(today + "T00:00:00Z");
  const y = new Date(t).getUTCFullYear();
  let d = Date.UTC(y, month - 1, day);
  if (d < t) d = Date.UTC(y + 1, month - 1, day);
  return Math.round((d - t) / DAY);
}

function reminderMail(who: string, person: { id: string; name: string; notes?: Record<string, any> }, label: string, days: number) {
  const when = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
  const likes = person.notes?.likes ? p(`<b>What they like:</b> ${esc(person.notes.likes)}`) : "";
  return {
    subject: `${person.name}'s ${label} is ${when}`,
    html: layout({ preheader: `Time to pick something lovely for ${person.name}`, heading: `${esc(person.name)}'s ${esc(label)} is ${when}`,
      cta: { label: `Find a gift for ${person.name.split(" ")[0]}`, url: `${SITE_URL}/shop` },
      body: p(`Hello ${esc(who)}, a gentle nudge from your Gift Calendar.`) + likes + p(days > 3 ? "Order a few days ahead so delivery is never a rush." : "Order today and we will do our best to make it in time.") }),
  };
}

Deno.serve(async (req) => {
  try {
    const b = await req.json().catch(() => ({}));
    const today = lagosToday();
    if (typeof b.preview === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.preview)) {
      const m = reminderMail("there", { id: "x", name: "Mum", notes: { likes: "Scented candles, fresh flowers" } }, "birthday", 7);
      return Response.json(await sendMail({ to: [b.preview], replyTo: TEAM[0], ...m }));
    }

    let cards = 0, reminders = 0;
    const { data: due } = await db.from("gift_cards").select("*").eq("status", "active").is("sent_at", null).not("send_on", "is", null).lte("send_on", today).limit(200);
    for (const c of due ?? []) {
      const { data: o } = await db.from("orders").select("customer").eq("ref", c.order_ref).maybeSingle();
      await sendGiftCardEmail(db, c, o?.customer?.name ?? "Someone", o?.customer?.email ?? ""); cards++;
    }

    const { data: rows } = await db.from("user_data").select("user_id,value").eq("key", "people").limit(2000);
    for (const r of rows ?? []) {
      const people = Array.isArray(r.value) ? r.value : [];
      let email: string | null = null, name = "there";
      for (const person of people) {
        const rem = person?.reminder;
        if (!rem?.channels?.includes("email") || !Array.isArray(rem.daysBefore)) continue;
        for (const d of Array.isArray(person.dates) ? person.dates : []) {
          if (!d?.day || !d?.month) continue;
          const n = daysUntil(Number(d.day), Number(d.month), today);
          if (!rem.daysBefore.includes(n)) continue;
          const key = `${person.id}:${d.id}:${today.slice(0, 4)}:${n}`;
          const { error } = await db.from("reminder_log").insert({ user_id: r.user_id, key });
          if (error) continue; // already sent
          if (!email) {
            const { data: u } = await db.auth.admin.getUserById(r.user_id);
            email = u?.user?.email ?? null; name = String(u?.user?.user_metadata?.name ?? "there").split(" ")[0];
          }
          if (!email) continue;
          const m = reminderMail(name, person, d.label || (d.type === "anniversary" ? "anniversary" : "special day"), n);
          const res = await sendMail({ to: [email], replyTo: TEAM[0], ...m });
          if (res.ok) reminders++; else await db.from("reminder_log").delete().eq("user_id", r.user_id).eq("key", key);
        }
      }
    }
    return Response.json({ today, cards, reminders });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "failed" }, { status: 500 });
  }
});
