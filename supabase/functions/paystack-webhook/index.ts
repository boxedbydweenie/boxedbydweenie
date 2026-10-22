// Paystack webhook: marks orders paid when Paystack reports a successful charge.
// Set this URL in the Paystack dashboard (Settings > API Keys & Webhooks):
//   https://<project-ref>.supabase.co/functions/v1/paystack-webhook
// Every request is checked against Paystack's signature, and the payment is re-verified
// with Paystack's API before an order changes, so a forged call cannot mark an order paid.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { afterPaid } from "../_shared/mail.ts";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const SECRET = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";

async function hmac512(key: string, data: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function sameHex(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST" || !SECRET) return new Response("ignored", { status: 200 });
  const raw = await req.text();
  const given = (req.headers.get("x-paystack-signature") ?? "").toLowerCase();
  if (!sameHex(await hmac512(SECRET, raw), given)) return new Response("bad signature", { status: 401 });

  let event: { event?: string; data?: { reference?: string } };
  try { event = JSON.parse(raw); } catch { return new Response("bad body", { status: 400 }); }
  if (event.event !== "charge.success" || !event.data?.reference) return new Response("ok", { status: 200 });

  const reference = event.data.reference;
  const { data: order } = await db.from("orders").select("id, ref, total, payable, status").eq("paystack_reference", reference).maybeSingle();
  if (!order || order.status === "paid") return new Response("ok", { status: 200 });

  const r = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${SECRET}` } });
  const tx = (await r.json().catch(() => ({})))?.data;
  if (tx?.status === "success" && tx.currency === "NGN" && Number(tx.amount) === (order.payable ?? order.total) * 100) {
    const { data: done } = await db.from("orders").update({ status: "paid", paid_at: tx.paid_at ?? new Date().toISOString() })
      .eq("id", order.id).in("status", ["pending_payment", "payment_failed"]).select("*").maybeSingle();
    if (done) { await db.from("gift_cards").update({ status: "active" }).eq("order_ref", order.ref).eq("status", "pending"); await afterPaid(db, done); }
  }
  return new Response("ok", { status: 200 });
});
