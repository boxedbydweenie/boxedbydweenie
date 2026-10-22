// Leads API for boxedbydweenie.com
// POST { kind: "contact" | "consultation" | "quote", name, email, phone, company, role, quantity, requiredBy, enquiryType, message }
// Saves the enquiry, then emails the team if RESEND_API_KEY and NOTIFY_EMAIL are set (optional: the enquiry is saved either way).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://boxedbydweenie.boxedbydweenie.workers.dev";
const ALLOWED = [
  "https://boxedbydweenie.boxedbydweenie.workers.dev", "https://boxedbydweenie.com", "https://www.boxedbydweenie.com",
  ...(Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
];
const RESEND = Deno.env.get("RESEND_API_KEY") ?? "";
const envList = (k: string, d: string[]) => { const v = (Deno.env.get(k) ?? "").split(",").map((s) => s.trim()).filter(Boolean); return v.length ? v : d; };
// Team alerts: main inbox + Cc list. Add more Cc addresses here (or set the NOTIFY_CC secret, comma separated).
const NOTIFY = envList("NOTIFY_EMAIL", ["hello@boxedbydweenie.com"]);
const NOTIFY_CC = envList("NOTIFY_CC", ["ibrahimdurosimi@gmail.com"]);
const FROM = "Boxed by Dweenie <hello@mail.boxedbydweenie.com>"; // sending domain verified in Resend

function cors(origin: string | null) {
  const ok = origin && (ALLOWED.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
  return { "Access-Control-Allow-Origin": ok ? origin! : SITE_URL, "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" };
}
const json = (b: unknown, status: number, h: Record<string, string>) => new Response(JSON.stringify(b), { status, headers: { ...h, "Content-Type": "application/json" } });
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

let mailError = "";
async function email(to: string[], subject: string, html: string, replyTo?: string, cc?: string[]) {
  if (!RESEND) { mailError = "RESEND_API_KEY is not set on the server"; console.error(mailError); return false; }
  if (!to.length) { mailError = "no recipient"; console.error(mailError); return false; }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, ...(cc?.length ? { cc } : {}), subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!r.ok) { mailError = `Resend ${r.status}: ${(await r.text().catch(() => "")).slice(0, 200)}`; console.error(mailError); }
  return r.ok;
}

Deno.serve(async (req) => {
  const h = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, h);
  try {
    const b = await req.json();
    if (b.action === "get-quote") {
      const r = str(b.ref, 40);
      const { data } = await db.from("leads").select("ref,created_at,details").eq("kind", "quote").eq("ref", r).maybeSingle();
      if (!data) return json({ error: "Quote not found" }, 404, h);
      return json({ ref: data.ref, createdAt: data.created_at, quote: data.details }, 200, h);
    }
    if (b.action === "email-quote") {
      const r = str(b.ref, 40);
      const { data } = await db.from("leads").select("ref,name,email,details").eq("kind", "quote").eq("ref", r).maybeSingle();
      if (!data) return json({ error: "Quote not found" }, 404, h);
      const to = str(b.email, 160).toLowerCase();
      if (!isEmail(to)) return json({ error: "Please enter a valid email address." }, 400, h);
      const total = data.details?.estimate?.total;
      const ok = await email([to], `Your Boxed by Dweenie quote ${data.ref}`, `<p>Hello ${esc(data.name.split(" ")[0]!)},</p><p>Your corporate gift estimate${total ? ` is between <b>₦${Math.round(total.low).toLocaleString("en-NG")}</b> and <b>₦${Math.round(total.high).toLocaleString("en-NG")}</b>` : " is ready"}.</p><p><a href="${SITE_URL}/corporate/quote/${encodeURIComponent(data.ref)}">View your full quote</a></p><p>A gifting consultant will contact you within one working day.</p><p>Happiness In a Box,<br>Boxed by Dweenie</p>`);
      return json({ sent: ok, ...(ok ? {} : { reason: mailError }) }, 200, h);
    }
    if (str(b.website)) return json({ reference: "BBD-OK" }, 200, h); // honeypot: silently accept bots
    const kind = b.kind === "consultation" ? "consultation" : b.kind === "contact" ? "contact" : b.kind === "quote" ? "quote" : "";
    const name = str(b.name, 120), emailAddr = str(b.email, 160).toLowerCase(), message = str(b.message, 3000);
    if (!kind) return json({ error: "Unknown enquiry type" }, 400, h);
    if (name.length < 2) return json({ error: "Please enter your name." }, 400, h);
    if (!isEmail(emailAddr)) return json({ error: "Please enter a valid email address." }, 400, h);
    if (kind === "contact" && message.length < 3) return json({ error: "Please tell us a little about your enquiry." }, 400, h);

    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await db.from("leads").select("id", { count: "exact", head: true }).ilike("email", emailAddr).gte("created_at", since);
    if ((count ?? 0) >= 5) return json({ error: "We already have your enquiries. We will be in touch shortly." }, 429, h);

    const code = () => { const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; const v = crypto.getRandomValues(new Uint8Array(8)); return Array.from(v, (x) => a[x % a.length]).join(""); };
    const ref = kind === "quote" ? `BBD-Q-${code()}` : `BBD-${kind === "consultation" ? "CORP" : "ENQ"}-${Math.floor(100000 + Math.random() * 900000)}`;
    const quote = kind === "quote" && b.quote && typeof b.quote === "object" ? b.quote : null;
    if (kind === "quote" && (!quote || JSON.stringify(quote).length > 60000)) return json({ error: "Quote details are missing." }, 400, h);
    if (quote) (quote as Record<string, unknown>).ref = ref;
    const requiredBy = /^\d{4}-\d{2}-\d{2}$/.test(str(b.requiredBy, 10)) ? str(b.requiredBy, 10) : null;
    const row = { ref, kind, name, email: emailAddr, phone: str(b.phone, 40) || null, company: str(b.company, 160) || null, role: str(b.role, 120) || null,
      quantity: str(b.quantity, 60) || null, required_by: requiredBy, enquiry_type: str(b.enquiryType, 60) || null, message: message || null, ...(quote ? { details: quote } : {}) };
    const { error } = await db.from("leads").insert(row);
    if (error) throw error;

    const lines = Object.entries({ Reference: ref, Type: kind, "Estimated total": quote?.estimate?.total ? `₦${Math.round(quote.estimate.total.low).toLocaleString("en-NG")} to ₦${Math.round(quote.estimate.total.high).toLocaleString("en-NG")}` : null, Name: name, Email: emailAddr, Phone: row.phone, Company: row.company, Role: row.role, Quantity: row.quantity, "Required by": row.required_by, "Enquiry type": row.enquiry_type, Message: row.message })
      .filter(([, v]) => v).map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${k}</td><td style="padding:4px 0"><b>${esc(String(v))}</b></td></tr>`).join("");
    const sent = await email(NOTIFY, `New ${kind === "consultation" ? "corporate consultation" : kind === "quote" ? "quote request" : "enquiry"} ${ref}: ${name}`, `<table>${lines}</table>`, emailAddr, NOTIFY_CC);
    await email([emailAddr], kind === "quote" ? "Your Boxed by Dweenie quote " + ref : "We have received your enquiry", `<p>Hello ${esc(name.split(" ")[0]!)},</p><p>Thank you for contacting Boxed by Dweenie. Your reference is <b>${ref}</b>.${kind === "quote" ? ` <a href="${SITE_URL}/corporate/quote/${ref}">View your quote</a>.` : ""} We will reply within one working day (we are open 9am to 6pm).</p><p>Happiness In a Box,<br>Boxed by Dweenie</p>`);
    if (sent) await db.from("leads").update({ notified: true }).eq("ref", ref);
    return json({ reference: ref }, 200, h);
  } catch (e) {
    console.error(e);
    return json({ error: "Something went wrong. Please try again or message us on WhatsApp." }, 500, h);
  }
});
