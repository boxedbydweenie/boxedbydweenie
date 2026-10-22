// Resend webhook: records delivered / opened / clicked / bounced / complained against each send, and suppresses bad addresses.
// Resend signs every call (Svix): headers svix-id, svix-timestamp, svix-signature; signed text is "<id>.<timestamp>.<raw body>".
// Setup: in Resend > Webhooks add this function's URL, tick the email events, copy the signing secret (whsec_...) into the
// Supabase secret RESEND_WEBHOOK_SECRET. Until that secret exists this function answers 503 and ignores everything.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET") ?? "";
const KINDS = ["sent", "delivered", "opened", "clicked", "bounced", "complained"];

const b64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
function same(a: string, b: string) { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }
async function valid(id: string, ts: string, body: string, header: string) {
  const key = await crypto.subtle.importKey("raw", b64(SECRET.replace(/^whsec_/, "")), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${body}`)));
  let bin = ""; mac.forEach((x) => (bin += String.fromCharCode(x)));
  const expected = btoa(bin);
  return header.split(" ").some((s) => s.startsWith("v1,") && same(s.slice(3), expected));
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!SECRET) return new Response("Webhook secret is not set yet", { status: 503 });
  const body = await req.text();
  const id = req.headers.get("svix-id") ?? "", ts = req.headers.get("svix-timestamp") ?? "", sig = req.headers.get("svix-signature") ?? "";
  if (!id || !ts || !sig || Math.abs(Date.now() / 1000 - Number(ts)) > 300) return new Response("Bad request", { status: 400 });
  let ok = false;
  try { ok = await valid(id, ts, body, sig); } catch { ok = false; }
  if (!ok) return new Response("Invalid signature", { status: 401 });

  try {
    const ev = JSON.parse(body);
    const kind = String(ev.type ?? "").replace(/^email\./, "");
    const d = ev.data ?? {};
    if (!KINDS.includes(kind)) return Response.json({ ignored: kind });
    const at = ev.created_at ?? d.created_at ?? new Date().toISOString();
    const to = (Array.isArray(d.to) ? d.to : [d.to]).filter(Boolean).map((x: unknown) => String(x).toLowerCase());
    const bounceType = String(d.bounce?.type ?? d.bounce?.subType ?? "").toLowerCase();
    const error = kind === "bounced" ? String(d.bounce?.message ?? (bounceType || "Bounced")).slice(0, 300) : kind === "complained" ? "Marked as spam by the recipient" : null;

    const { data: sid } = await db.rpc("apply_email_event", { p_resend_id: String(d.email_id ?? ""), p_kind: kind, p_at: at, p_error: error });

    // A hard bounce or a spam complaint stops all future marketing to that address, whichever email it came from.
    const now = new Date().toISOString();
    if (kind === "bounced" && !bounceType.includes("transient") && to.length) await db.from("marketing_contacts").update({ status: "bounced", status_at: now, updated_at: now }).in("email", to).eq("status", "active");
    if (kind === "complained" && to.length) await db.from("marketing_contacts").update({ status: "complained", status_at: now, updated_at: now }).in("email", to).neq("status", "complained");

    await db.from("email_events").insert({ svix_id: id, send_id: sid ?? null, type: String(ev.type), email: to[0] ?? null, payload: ev }); // duplicate deliveries hit the unique svix_id and are ignored
    return Response.json({ ok: true, matched: !!sid });
  } catch (e) {
    console.error(e);
    return new Response("Error", { status: 500 }); // Resend retries on a non-2xx answer
  }
});
