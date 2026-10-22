// Shared helpers for email marketing: merge tags, compliance footer, unsubscribe headers, Resend sending.
// Used by the `marketing` and `campaign-worker` functions. Self-contained on purpose (does not import mail.ts).
export const SITE_URL = Deno.env.get("SITE_URL") ?? "https://boxedbydweenie.boxedbydweenie.workers.dev";
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

const RESEND = Deno.env.get("RESEND_API_KEY") ?? "";
// Marketing goes out from its own address on the verified domain, so a spam complaint never touches order emails (which use hello@).
export const MARKETING_FROM_ADDRESS = Deno.env.get("MARKETING_FROM_ADDRESS") ?? "news@mail.boxedbydweenie.com";
export const REPLY_TO = "hello@boxedbydweenie.com";
export const POSTAL = "Boxed by Dweenie, a product of The Plug Shop Limited · 8 Wole Ogunjimi Street, Opebi, Ikeja, Lagos, Nigeria";
export const FUNCTIONS_URL = `${Deno.env.get("SUPABASE_URL") ?? "https://zstplraslhhkfyiapjdm.supabase.co"}/functions/v1`;
export const TEST_TOKEN = "00000000-0000-0000-0000-000000000000";
export const fromHeader = (name: string) => `${String(name || "Boxed by Dweenie").replace(/[<>"\r\n]/g, "").slice(0, 60)} <${MARKETING_FROM_ADDRESS}>`;
export const isEmail = (v: unknown) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export interface Recipient { email: string; unsub_token: string; first_name?: string | null; last_name?: string | null; company?: string | null }
export const unsubUrl = (token: string) => `${SITE_URL}/unsubscribe?t=${encodeURIComponent(token)}`;

/** {{first_name}}, {{last_name}}, {{company}}, {{email}}, {{unsubscribe_url}}. Unknown tags vanish; first_name falls back to "there". */
export function mergeTags(text: string, r: Recipient, escapeValues: boolean) {
  const v: Record<string, string> = { first_name: r.first_name?.trim() || "there", last_name: r.last_name?.trim() ?? "", company: r.company?.trim() ?? "", email: r.email, unsubscribe_url: unsubUrl(r.unsub_token) };
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_m, k: string) => { const key = k.toLowerCase(); const val = v[key] ?? ""; return key === "unsubscribe_url" || !escapeValues ? val : esc(val); });
}

const footerHtml = (url: string) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:26px 16px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.7;color:#7a746a">You are receiving this email from Boxed by Dweenie. If you would rather not hear from us, you can <a href="${url}" style="color:#7a746a;text-decoration:underline">unsubscribe</a> at any time.<br>${esc(POSTAL)}<br><a href="${SITE_URL}/privacy" style="color:#7a746a">Privacy policy</a></td></tr></table>`;

/** Plain-text twin of the HTML email. Sending both parts ("multipart/alternative") is what mail filters, Microsoft's especially, expect from real mail. */
export function htmlToText(html: string): string {
  const ENT: Record<string, string> = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', mdash: "-", ndash: "-", hellip: "...", middot: "·", rarr: "->", larr: "<-", copy: "(c)" };
  let t = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(head|style|script|title)[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]+display\s*:\s*none[^>]*>[\s\S]*?<\/(div|span|p|td)>/gi, "")
    .replace(/<img[^>]*alt=["']([^"']+)["'][^>]*>/gi, " $1 ")
    .replace(/<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, label: string) => {
      const l = label.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (!/^https?:\/\//i.test(href) || !l || l === href) return l;
      return `${l} (${href})`;
    })
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|table|h[1-6]|li|ul|ol|blockquote)>/gi, "\n")
    .replace(/<\/td>/gi, " ")
    .replace(/<[^>]+>/g, "");
  t = t.replace(/&#(\d+);/g, (_m, n: string) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_m, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n: string) => ENT[n.toLowerCase()] ?? m);
  return t.split("\n").map((l) => l.replace(/[ \t\u00a0\u200c\u034f]+/g, " ").trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Final HTML for one recipient: merge tags filled, script tags removed, compliance footer added when the file has no unsubscribe link of its own. */
export function renderEmail(o: { html: string; preheader?: string }, r: Recipient): { html: string; text: string; warnings: string[] } {
  const warnings: string[] = [];
  const src = String(o.html ?? "").replace(/<script[\s\S]*?<\/script>/gi, "");
  const hasUnsub = /\{\{\s*unsubscribe_url\s*\}\}/i.test(src);
  let out = mergeTags(src, r, true);
  if (!/<html[\s>]/i.test(out)) out = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0">${out}</body></html>`;
  if (!hasUnsub) {
    const f = footerHtml(unsubUrl(r.unsub_token));
    out = /<\/body>/i.test(out) ? out.replace(/<\/body>/i, f + "</body>") : out + f;
  } else if (!/opebi/i.test(out)) warnings.push("Your file has its own unsubscribe link but not our postal address. Add the address to your footer, or remove your footer and we will add one for you.");
  const pre = String(o.preheader ?? "").trim();
  if (pre) { const span = `<span style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${esc(pre)}</span>`; out = /<body[^>]*>/i.test(out) ? out.replace(/<body[^>]*>/i, (m) => m + span) : span + out; }
  if (/<img[^>]+src=["'](?!https:\/\/)/i.test(src)) warnings.push("Some images do not start with https://. Email apps cannot see images stored on your computer. Upload them in the Images page and use those links.");
  if (out.length > 100_000) warnings.push("This email is large. Gmail cuts off emails over about 100 KB, which can hide the unsubscribe link.");
  if (!/<a\s[^>]*href=/i.test(src)) warnings.push("There are no links in this email. Most campaigns have at least one button or link.");
  return { html: out, text: htmlToText(out), warnings };
}

/** Headers Gmail and Yahoo look for: one-click unsubscribe. */
export const listHeaders = (token: string) => ({
  "List-Unsubscribe": `<${FUNCTIONS_URL}/unsubscribe?t=${token}>, <mailto:${REPLY_TO}?subject=unsubscribe>`,
  "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
});

export interface OutEmail { from: string; to: string[]; subject: string; html: string; text?: string; reply_to: string; headers: Record<string, string>; tags: { name: string; value: string }[] }
export type SendResult = { ok: true; ids: string[] } | { ok: false; status: number; error: string; rateLimited: boolean; quota: boolean };

async function post(path: string, body: unknown): Promise<SendResult> {
  if (!RESEND) return { ok: false, status: 0, error: "RESEND_API_KEY is not set", rateLimited: false, quota: false };
  try {
    const r = await fetch(`https://api.resend.com${path}`, { method: "POST", headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const text = await r.text().catch(() => "");
    if (!r.ok) return { ok: false, status: r.status, error: `Resend ${r.status}: ${text.slice(0, 220)}`, rateLimited: r.status === 429, quota: r.status === 429 && /quota/i.test(text) };
    const j = JSON.parse(text || "{}");
    const ids: string[] = Array.isArray(j.data) ? j.data.map((d: { id?: string }) => String(d?.id ?? "")) : [String(j.id ?? "")];
    return { ok: true, ids };
  } catch (e) { return { ok: false, status: 0, error: String(e).slice(0, 220), rateLimited: false, quota: false }; }
}
/** Up to 100 emails in one request (Resend's batch limit). */
export const sendBatch = (items: OutEmail[]) => post("/emails/batch", items);
export const sendOne = (item: OutEmail) => post("/emails", item);
