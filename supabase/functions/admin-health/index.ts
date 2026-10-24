// admin-health: tells the signed-in team member which secrets are configured. It never returns a secret, only yes or no.
// Staff only: the caller must be signed in and listed in admin_users (checked with public.is_admin()).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
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
const has = (k: string) => (Deno.env.get(k) ?? "").trim().length > 0;

Deno.serve(async (req) => {
  const h = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, h);

  const auth = req.headers.get("authorization") ?? "";
  const asUser = createClient(URL_, ANON, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: u } = await asUser.auth.getUser();
  if (!u.user) return json({ error: "Please sign in." }, 401, h);
  const { data: ok } = await asUser.rpc("is_admin");
  if (ok !== true) return json({ error: "Staff only." }, 403, h);

  return json({
    checkedAt: new Date().toISOString(),
    secrets: {
      paystackKey: has("PAYSTACK_SECRET_KEY"),
      paystackLive: (Deno.env.get("PAYSTACK_SECRET_KEY") ?? "").startsWith("sk_live_"),
      resendKey: has("RESEND_API_KEY"),
      resendWebhookSecret: has("RESEND_WEBHOOK_SECRET"),
      notifyEmail: has("NOTIFY_EMAIL"),
      marketingFrom: has("MARKETING_FROM_ADDRESS"),
      siteUrl: has("SITE_URL"),
    },
  }, 200, h);
});
