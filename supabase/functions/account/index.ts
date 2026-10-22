// Account API for boxedbydweenie.com
// POST { action: "signup", email, password, name, phone }  -> creates a confirmed customer account (the browser then signs in)
// POST { action: "subscribe", email }                      -> newsletter sign-up
// POST { action: "gift-card", code }                       -> balance check for a gift card code
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://boxedbydweenie.boxedbydweenie.workers.dev";
const ALLOWED = [
  "https://boxedbydweenie.boxedbydweenie.workers.dev", "https://boxedbydweenie.com", "https://www.boxedbydweenie.com",
  ...(Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
];
function cors(origin: string | null) {
  const ok = origin && (ALLOWED.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
  return { "Access-Control-Allow-Origin": ok ? origin! : SITE_URL, "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" };
}
const json = (b: unknown, status: number, h: Record<string, string>) => new Response(JSON.stringify(b), { status, headers: { ...h, "Content-Type": "application/json" } });
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

Deno.serve(async (req) => {
  const h = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, h);
  try {
    const b = await req.json();
    if (b.action === "signup") {
      const email = str(b.email, 160).toLowerCase(), password = typeof b.password === "string" ? b.password : "";
      const name = str(b.name, 120), phone = str(b.phone, 40);
      if (name.length < 2) return json({ error: "Please enter your name." }, 400, h);
      if (!isEmail(email)) return json({ error: "Please enter a valid email address." }, 400, h);
      if (password.length < 8 || password.length > 72) return json({ error: "Choose a password of at least 8 characters." }, 400, h);
      const { error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name, phone } });
      if (error) {
        if (/already|registered|exists/i.test(error.message)) return json({ error: "An account with this email already exists. Please sign in." }, 409, h);
        throw error;
      }
      if (b.marketing === true) await db.rpc("marketing_subscribe", { p_email: email, p_source: "signup", p_first_name: name.split(" ")[0] || null }); // only when the person ticked the box
      return json({ ok: true }, 200, h);
    }
    if (b.action === "subscribe") {
      const email = str(b.email, 160).toLowerCase();
      if (!isEmail(email)) return json({ error: "Please enter a valid email address." }, 400, h);
      await db.from("newsletter_subscribers").upsert({ email, source: str(b.source, 40) || "footer" }, { onConflict: "email", ignoreDuplicates: true });
      await db.rpc("marketing_subscribe", { p_email: email, p_source: str(b.source, 40) || "footer", p_first_name: str(b.name, 60).split(" ")[0] || null }); // consent record for email marketing
      return json({ ok: true }, 200, h);
    }
    if (b.action === "gift-card") {
      const code = str(b.code, 40).toUpperCase().replace(/\s+/g, "");
      const { data } = await db.from("gift_cards").select("balance,status").eq("code", code).maybeSingle();
      if (!data || data.status !== "active") return json({ error: "We could not find an active gift card with that code." }, 404, h);
      return json({ balance: data.balance }, 200, h);
    }
    return json({ error: "Unknown action." }, 400, h);
  } catch (e) {
    console.error(e);
    return json({ error: "Something went wrong. Please try again." }, 500, h);
  }
});
