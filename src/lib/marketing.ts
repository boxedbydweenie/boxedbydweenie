import { supabase } from "@/lib/supabase";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/api";

/** Calls the staff-only `marketing` function with the signed-in team member's access token. */
export async function callMarketing<T = Record<string, unknown>>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  const { data } = await supabase().auth.getSession();
  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/marketing`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${data.session?.access_token ?? ""}` },
      body: JSON.stringify({ action, ...body }),
    });
  } catch { throw new Error("We could not reach our servers. Check your connection and try again."); }
  const j = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(j.error ?? "Something went wrong. Please try again.");
  return j as T;
}

export type Basis = "opted_in" | "customer" | "contact" | "prospect" | "unverified";
export const BASES: { key: Basis; label: string; hint: string; dot: string }[] = [
  { key: "opted_in", label: "Opted in", hint: "Joined our list themselves (footer, sign-up or checkout tick box).", dot: "bg-[#86BAA3]" },
  { key: "customer", label: "Customers", hint: "People who have bought from us.", dot: "bg-[#E7B93B]" },
  { key: "contact", label: "Gave us their email", hint: "Enquiries, Gift Calendar users, event sign-ups, business cards, chats.", dot: "bg-[#EB826C]" },
  { key: "prospect", label: "Business prospects", hint: "Company contacts from a target list.", dot: "bg-[#192850]" },
  { key: "unverified", label: "Unverified (bought or scraped)", hint: "Highest spam and legal risk. Left out of campaigns unless you choose them.", dot: "bg-[#83252C]" },
];
export const DEFAULT_BASES: Basis[] = ["opted_in", "customer", "contact", "prospect"];

export interface Audience { bases: Basis[]; tags: string[]; exclude_tags: string[] }
export interface Campaign {
  id: string; name: string; subject: string; preheader: string; from_name: string; html: string; audience: Audience;
  status: "draft" | "sending" | "paused" | "sent" | "cancelled"; tested_at: string | null; total: number;
  queued_at: string | null; finished_at: string | null; created_by: string | null; created_at: string; updated_at: string;
}
export interface CampaignStats { campaign_id: string; total: number; queued: number; sent: number; delivered: number; opened: number; clicked: number; bounced: number; complained: number; failed: number }
export interface Contact {
  id: string; email: string; first_name: string | null; last_name: string | null; company: string | null; tags: string[]; basis: Basis;
  consent_source: string | null; consent_at: string; status: "active" | "unsubscribed" | "bounced" | "complained"; status_at: string | null; created_at: string;
}
export interface Send {
  id: string; campaign_id: string; email: string; status: string; is_test: boolean; error: string | null; attempts: number; resend_id: string | null;
  queued_at: string; sent_at: string | null; delivered_at: string | null; opened_at: string | null; clicked_at: string | null; bounced_at: string | null; complained_at: string | null;
  email_campaigns?: { name: string } | null;
}
export interface AudienceSummary { total: number; active: number; unsubscribed: number; bounced: number; complained: number; bases: Record<string, number>; tags: Record<string, number> }

export const SEND_STATUS: Record<string, { label: string; cls: string }> = {
  queued: { label: "Queued", cls: "bg-[#EDE7F6] text-[#39243F]" }, sending: { label: "Sending", cls: "bg-[#EDE7F6] text-[#39243F]" },
  sent: { label: "Sent", cls: "bg-[#E3EBFA] text-[#192850]" }, delivered: { label: "Delivered", cls: "bg-[#DDF0E6] text-[#1D5A3F]" },
  opened: { label: "Opened", cls: "bg-[#F8EBB8] text-[#6B4D00]" }, clicked: { label: "Clicked", cls: "bg-[#E7B93B] text-[#292828]" },
  bounced: { label: "Bounced", cls: "bg-[#FBE0DA] text-[#83252C]" }, complained: { label: "Complained", cls: "bg-[#83252C] text-white" },
  failed: { label: "Failed", cls: "bg-[#F9D3D3] text-[#8B1A1A]" }, suppressed: { label: "Suppressed", cls: "bg-black/5 text-[#292828]/60" },
  cancelled: { label: "Cancelled", cls: "bg-black/5 text-[#292828]/60" },
};
export const CAMPAIGN_STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-[#F4EFE5] text-[#6C432A]" }, sending: { label: "Sending", cls: "bg-[#EDE7F6] text-[#39243F]" },
  paused: { label: "Paused", cls: "bg-[#F8EBB8] text-[#6B4D00]" }, sent: { label: "Sent", cls: "bg-[#DDF0E6] text-[#1D5A3F]" }, cancelled: { label: "Cancelled", cls: "bg-black/5 text-[#292828]/60" },
};

export const fmtWhen = (s: string | null | undefined) => (s ? new Date(s).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");
export const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 1000) / 10}%` : "—");

/** Small, forgiving CSV reader: handles BOM, commas / semicolons / tabs, quoted cells and line breaks inside quotes. */
export function parseCsv(text: string): string[][] {
  const t = text.replace(/^\uFEFF/, "");
  const first = t.split(/\r?\n/, 1)[0] ?? "";
  const delim = [",", ";", "\t"].map((d) => [d, first.split(d).length] as const).sort((a, b) => b[1] - a[1])[0]![0];
  const rows: string[][] = []; let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i]!;
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; continue; }
    if (c === '"') q = true;
    else if (c === delim) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; row.push(cell); cell = ""; if (row.some((x) => x.trim())) rows.push(row); row = []; }
    else cell += c;
  }
  row.push(cell); if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const GUESS = {
  email: ["email", "emailaddress", "mail", "eaddress", "workemail", "contactemail"],
  first_name: ["firstname", "first", "givenname", "fname", "forename"],
  last_name: ["lastname", "last", "surname", "lname", "familyname"],
  name: ["name", "fullname", "contactname", "customername"],
  company: ["company", "companyname", "organisation", "organization", "business", "employer"],
  tags: ["tags", "tag", "segment", "list", "group", "category"],
} satisfies Record<string, string[]>;
export type FieldKey = keyof typeof GUESS;
export function guessMapping(header: string[], rows: string[][]): Record<FieldKey, number> {
  const m = {} as Record<FieldKey, number>;
  for (const k of Object.keys(GUESS) as FieldKey[]) m[k] = header.findIndex((h) => (GUESS[k] as string[]).includes(norm(h)));
  if (m.email < 0) { // no "email" header: use the column where most cells look like an email address
    let best = -1, bestN = 0;
    for (let c = 0; c < header.length; c++) { const n = rows.slice(0, 50).filter((r) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((r[c] ?? "").trim())).length; if (n > bestN) { best = c; bestN = n; } }
    m.email = best;
  }
  return m;
}

/** Uploads an image to the public email-images bucket and returns the https link to paste into an email. */
export async function uploadEmailImage(file: File): Promise<string> {
  if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) throw new Error("Use a PNG, JPG, WebP or GIF image.");
  if (file.size > 5 * 1024 * 1024) throw new Error("That image is over 5 MB. Please shrink it first.");
  const base = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "image";
  const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1]!;
  const path = `${new Date().toISOString().slice(0, 7)}/${Date.now().toString(36)}-${base}.${ext}`;
  const sb = supabase();
  const { error } = await sb.storage.from("email-images").upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) throw new Error("We could not upload that image. Please try again.");
  return sb.storage.from("email-images").getPublicUrl(path).data.publicUrl;
}
