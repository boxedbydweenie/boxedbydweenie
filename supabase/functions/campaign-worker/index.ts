// Sends queued campaign emails in batches. Called every minute by pg_cron (and once right after a campaign is queued).
// Safe to run at any time: emails are claimed with row locks, so overlapping runs never send the same email twice.
// Resend allows 10 requests/second per team and 100 emails per batch request; we stay well under that.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { REPLY_TO, fromHeader, listHeaders, mergeTags, renderEmail, sendBatch, sendOne, type OutEmail } from "../_shared/marketing.ts";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const MAX_ATTEMPTS = 3;
// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

Deno.serve(async () => {
  const t0 = Date.now();
  let sent = 0, failed = 0, requeued = 0, rounds = 0, note = "";
  try {
    // Emails stuck "sending" for 10+ minutes (a crashed run) go back in the queue.
    await db.from("email_sends").update({ status: "queued", claimed_at: null }).eq("status", "sending").lt("claimed_at", new Date(Date.now() - 600_000).toISOString());

    while (Date.now() - t0 < 60_000 && rounds < 10) {
      rounds++;
      // Safety brake: pauses a campaign whose bounce rate or spam complaints are too high, before more mail goes out.
      await db.rpc("auto_pause_campaigns");
      const { data: claimed, error } = await db.rpc("claim_email_sends", { p_limit: 100 });
      if (error) throw error;
      const rows = (claimed ?? []) as Row[];
      if (!rows.length) break;

      const { data: camps } = await db.from("email_campaigns").select("id,subject,preheader,html,from_name").in("id", [...new Set(rows.map((r) => r.campaign_id))]);
      const { data: contacts } = await db.from("marketing_contacts").select("id,email,first_name,last_name,company,status,unsub_token").in("id", rows.map((r) => r.contact_id).filter(Boolean));
      const C = new Map((camps ?? []).map((c) => [c.id, c])), P = new Map((contacts ?? []).map((c) => [c.id, c]));

      const items: { row: Row; mail: OutEmail }[] = [], suppressed: Row[] = [];
      for (const r of rows) {
        const c = C.get(r.campaign_id), p = P.get(r.contact_id);
        if (!c || !p || p.status !== "active") { suppressed.push({ id: r.id, campaign_id: r.campaign_id, email: r.email, status: "suppressed", error: !p ? "Contact was removed" : `Contact is ${p?.status}`, claimed_at: null }); continue; }
        const rendered = renderEmail({ html: c.html, preheader: c.preheader }, p);
        items.push({ row: r, mail: { from: fromHeader(c.from_name), to: [p.email], subject: mergeTags(c.subject, p, false), html: rendered.html, text: rendered.text,
          reply_to: REPLY_TO, headers: listHeaders(p.unsub_token), tags: [{ name: "campaign_id", value: c.id }, { name: "send_id", value: r.id }] } });
      }
      if (suppressed.length) await db.from("email_sends").upsert(suppressed, { onConflict: "id" });
      if (!items.length) continue;

      const ok: Row[] = [], bad: Row[] = [], retry: Row[] = [];
      const now = new Date().toISOString();
      const fail = (r: Row, error: string) => (r.attempts >= MAX_ATTEMPTS ? bad : retry).push(r.attempts >= MAX_ATTEMPTS
        ? { id: r.id, campaign_id: r.campaign_id, email: r.email, status: "failed", error, failed_at: now, claimed_at: null }
        : { id: r.id, campaign_id: r.campaign_id, email: r.email, status: "queued", error, attempts: r.attempts, not_before: new Date(Date.now() + 120_000).toISOString(), claimed_at: null });
      const hold = (r: Row, minutes: number, error: string) => retry.push({ id: r.id, campaign_id: r.campaign_id, email: r.email, status: "queued", error, attempts: Math.max(0, r.attempts - 1), not_before: new Date(Date.now() + minutes * 60_000).toISOString(), claimed_at: null });
      let stop = false;

      const res = await sendBatch(items.map((i) => i.mail));
      if (res.ok) {
        // Accepted by Resend: never retry (that could double-send), even if an id is missing from the reply.
        items.forEach((i, k) => ok.push({ id: i.row.id, campaign_id: i.row.campaign_id, email: i.row.email, status: "sent", resend_id: res.ids[k] || null, sent_at: now, error: null, claimed_at: null }));
      } else if (!res.ok && res.rateLimited) {
        // Rate limit or daily/monthly quota reached: put everything back and try again later.
        for (const i of items) hold(i.row, res.quota ? 30 : 1, res.error);
        stop = true; note = res.quota ? "Resend sending quota reached. Check your Resend plan limits." : "Rate limited, will retry.";
      } else if (!res.ok && res.status >= 400 && res.status < 500) {
        // One bad address can reject a whole batch, so send this batch one by one to find it.
        for (const i of items) {
          const one = await sendOne(i.mail);
          if (one.ok) ok.push({ id: i.row.id, campaign_id: i.row.campaign_id, email: i.row.email, status: "sent", resend_id: one.ids[0] || null, sent_at: new Date().toISOString(), error: null, claimed_at: null });
          else if (one.rateLimited) { hold(i.row, one.quota ? 30 : 1, one.error); stop = true; }
          else bad.push({ id: i.row.id, campaign_id: i.row.campaign_id, email: i.row.email, status: "failed", error: one.error, failed_at: new Date().toISOString(), claimed_at: null });
          await sleep(120);
        }
      } else {
        for (const i of items) fail(i.row, res.ok ? "Unexpected response" : res.error);
      }
      if (ok.length) await db.from("email_sends").upsert(ok, { onConflict: "id" });
      if (bad.length) await db.from("email_sends").upsert(bad, { onConflict: "id" });
      if (retry.length) await db.from("email_sends").upsert(retry, { onConflict: "id" });
      sent += ok.length; failed += bad.length; requeued += retry.length;
      if (stop) break;
      await sleep(250);
    }
    await db.rpc("finish_campaigns");
    return Response.json({ sent, failed, requeued, rounds, note });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "worker failed", sent, failed, requeued }, { status: 500 });
  }
});
