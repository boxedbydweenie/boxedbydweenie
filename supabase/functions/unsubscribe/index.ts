// Unsubscribe API. Every marketing email carries a personal token (not guessable).
// GET  ?t=TOKEN                       -> { email (masked), status }  (used by the /unsubscribe page)
// POST ?t=TOKEN  (form body)          -> one-click unsubscribe from Gmail / Yahoo / Apple Mail (List-Unsubscribe-Post)
// POST { token, action: "unsubscribe" | "resubscribe", reason? }  -> from the /unsubscribe page
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://boxedbydweenie.boxedbydweenie.workers.dev";
const ALLOWED = [
  "https://boxedbydweenie.boxedbydweenie.workers.dev", "https://boxedbydweenie.com", "https://www.boxedbydweenie.com",
  ...(Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
];
const TEST_TOKEN = "00000000-0000-0000-0000-000000000000";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function cors(origin: string | null) {
  const ok = origin && (ALLOWED.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
  return { "Access-Control-Allow-Origin": ok ? origin! : SITE_URL, "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Vary": "Origin" };
}
const json = (b: unknown, status: number, h: Record<string, string>) => new Response(JSON.stringify(b), { status, headers: { ...h, "Content-Type": "application/json" } });
const mask = (e: string) => { const [u, d] = e.split("@"); return `${u.slice(0, 1)}${"*".repeat(Math.max(2, Math.min(6, u.length - 1)))}@${d}`; };

Deno.serve(async (req) => {
  const h = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });
  if (req.method !== "GET" && req.method !== "POST") return json({ error: "Method not allowed" }, 405, h);
  try {
    const url = new URL(req.url);
    let token = url.searchParams.get("t") ?? "", action = "unsubscribe", reason = "";
    if (req.method === "POST" && (req.headers.get("content-type") ?? "").includes("application/json")) {
      const b = await req.json().catch(() => ({}));
      token = typeof b.token === "string" ? b.token : token;
      action = b.action === "resubscribe" ? "resubscribe" : "unsubscribe";
      reason = typeof b.reason === "string" ? b.reason.trim().slice(0, 200) : "";
    }
    token = token.trim();
    if (token === TEST_TOKEN) return json({ test: true, email: "you@example.com", status: "active" }, 200, h);
    if (!UUID.test(token)) return json({ error: "This link is not valid." }, 404, h);
    const { data: c } = await db.from("marketing_contacts").select("id,email,status").eq("unsub_token", token).maybeSingle();
    if (!c) return json({ error: "This link is not valid." }, 404, h);
    const now = new Date().toISOString();

    if (req.method === "GET") return json({ email: mask(c.email), status: c.status }, 200, h);

    if (action === "unsubscribe") {
      if (c.status === "active") await db.from("marketing_contacts").update({ status: "unsubscribed", status_at: now, unsub_reason: reason || "Unsubscribed by link", updated_at: now }).eq("id", c.id);
      return json({ ok: true, email: mask(c.email), status: c.status === "active" ? "unsubscribed" : c.status }, 200, h);
    }
    // Resubscribe is the person's own fresh choice. Bounced and complained addresses stay blocked.
    if (c.status === "unsubscribed") await db.from("marketing_contacts").update({ status: "active", status_at: now, basis: "opted_in", consent_source: "resubscribe", consent_at: now, unsub_reason: null, updated_at: now }).eq("id", c.id);
    return json({ ok: true, email: mask(c.email), status: c.status === "unsubscribed" ? "active" : c.status }, 200, h);
  } catch (e) {
    console.error(e);
    return json({ error: "Something went wrong. Please try again." }, 500, h);
  }
});
