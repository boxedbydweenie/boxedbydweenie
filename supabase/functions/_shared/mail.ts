// Shared email helper (Resend). Copied into each function that sends email.
export const SITE_URL = Deno.env.get("SITE_URL") ?? "https://boxedbydweenie.boxedbydweenie.workers.dev";
const RESEND = Deno.env.get("RESEND_API_KEY") ?? "";
const list = (k: string, d: string[]) => { const v = (Deno.env.get(k) ?? "").split(",").map((s) => s.trim()).filter(Boolean); return v.length ? v : d; };
// Team alerts: main inbox + Cc list (edit here, or set the NOTIFY_EMAIL / NOTIFY_CC secrets).
export const TEAM = list("NOTIFY_EMAIL", ["hello@boxedbydweenie.com"]);
export const TEAM_CC = list("NOTIFY_CC", ["ibrahimdurosimi@gmail.com"]);
export const FROM = "Boxed by Dweenie <hello@mail.boxedbydweenie.com>"; // sending domain verified in Resend

export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
export const naira = (n: number) => "₦" + Math.round(n).toLocaleString("en-NG");
export const isEmail = (v: unknown) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export async function sendMail(o: { to: string[]; cc?: string[]; subject: string; html: string; replyTo?: string }): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND) return { ok: false, error: "RESEND_API_KEY is not set" };
  if (!o.to.length) return { ok: false, error: "no recipient" };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: o.to, ...(o.cc?.length ? { cc: o.cc } : {}), subject: o.subject, html: o.html, ...(o.replyTo ? { reply_to: o.replyTo } : {}) }),
    });
    if (!r.ok) { const error = `Resend ${r.status}: ${(await r.text().catch(() => "")).slice(0, 200)}`; console.error(error); return { ok: false, error }; }
    return { ok: true };
  } catch (e) { console.error(e); return { ok: false, error: String(e) }; }
}

/** Branded wrapper: ivory page, white card, gold rule, serif wordmark. Email clients ignore most CSS, so this is table + inline styles. */
export function layout(o: { preheader?: string; heading: string; body: string; cta?: { label: string; url: string } }) {
  const btn = o.cta ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px"><tr><td style="background:#292828;border-radius:999px"><a href="${esc(o.cta.url)}" style="display:inline-block;padding:13px 28px;color:#E7B93B;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;letter-spacing:.04em">${esc(o.cta.label)}</a></td></tr></table>` : "";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#F4EFE5">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(o.preheader ?? "")}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE5"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
<tr><td align="center" style="padding:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:24px;letter-spacing:.02em;color:#292828">Boxed by Dweenie</td></tr>
<tr><td style="background:#ffffff;border-radius:18px;border-top:5px solid #E7B93B;padding:32px 30px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#292828">
<h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;font-weight:normal;color:#292828">${o.heading}</h1>
${o.body}${btn}
</td></tr>
<tr><td align="center" style="padding:18px 8px;font-family:Arial,sans-serif;font-size:12px;color:#7a746a">Happiness In a Box &middot; Boxed by Dweenie, Lagos<br><a href="${SITE_URL}" style="color:#7a746a">boxedbydweenie.com</a></td></tr>
</table></td></tr></table></body></html>`;
}

export const p = (html: string) => `<p style="margin:0 0 12px">${html}</p>`;
export const row = (a: string, b: string, bold = false) => `<tr><td style="padding:6px 0;color:#6b655b">${a}</td><td align="right" style="padding:6px 0;${bold ? "font-weight:bold;" : ""}">${b}</td></tr>`;

/** Order confirmation to the customer plus a heads-up to the team. Call once when an order becomes paid. */
// deno-lint-ignore no-explicit-any
export async function sendOrderEmails(db: any, order: Record<string, any>) {
  const { data: claimed } = await db.from("orders").update({ emailed_at: new Date().toISOString() }).eq("id", order.id).is("emailed_at", null).select("id").maybeSingle();
  if (!claimed) return; // already sent
  const c = order.customer ?? {}, r = order.recipient ?? {};
  const first = esc(String(c.name ?? "there").split(" ")[0]);
  const items = (order.items ?? []) as Record<string, any>[];
  const lines = items.map((i) => `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${esc(i.name)}${i.giftCard ? ` <span style="color:#6b655b">(gift card${i.giftCard.toName ? " for " + esc(i.giftCard.toName) : ""})</span>` : ""} &times; ${i.quantity}</td><td align="right" style="padding:6px 0;border-bottom:1px solid #eee">${naira(i.price * i.quantity)}</td></tr>`).join("");
  const money = `<table width="100%" style="margin:14px 0">${row("Subtotal", naira(order.subtotal))}${order.discount ? row("Discount", "-" + naira(order.discount)) : ""}${row("Delivery", naira(order.delivery_fee))}${order.gift_card_applied ? row("Gift card", "-" + naira(order.gift_card_applied)) : ""}${row("Paid", naira(order.payable ?? order.total), true)}</table>`;
  const onlyCards = items.length > 0 && items.every((i) => i.giftCard);
  const where = onlyCards ? "" : p(`<b>Delivering to:</b> ${esc(r.name)}, ${esc(r.address)}${r.area ? ", " + esc(r.area) : ""}, ${esc(r.state)}<br><b>Delivery date:</b> ${esc(r.deliveryDate)}`);
  await sendMail({
    to: [c.email], replyTo: TEAM[0],
    subject: `Your Boxed by Dweenie order ${order.ref} is confirmed`,
    html: layout({ preheader: "Thank you. We are getting your order ready.", heading: `Thank you, ${first}`, cta: { label: "Track your order", url: `${SITE_URL}/order/${encodeURIComponent(order.ref)}` },
      body: p(`Your order <b>${esc(order.ref)}</b> is confirmed and our team is getting it ready.`) + `<table width="100%">${lines}</table>${money}${where}` + p("Questions? Just reply to this email.") }),
  });
  await sendMail({
    to: TEAM, cc: TEAM_CC, replyTo: c.email,
    subject: `New paid order ${order.ref}: ${naira(order.payable ?? order.total)} from ${c.name}`,
    html: layout({ heading: "New paid order", cta: { label: "Open in admin", url: `${SITE_URL}/team` },
      body: p(`<b>${esc(c.name)}</b><br>${esc(c.email)}<br>${esc(c.phone)}`) + `<table width="100%">${lines}</table>${money}` + (onlyCards ? "" : p(`<b>Deliver to:</b> ${esc(r.name)} (${esc(r.phone)})<br>${esc(r.address)}${r.area ? ", " + esc(r.area) : ""}, ${esc(r.state)}<br><b>Date:</b> ${esc(r.deliveryDate)}${r.notes ? "<br><b>Notes:</b> " + esc(r.notes) : ""}`)) }),
  });
}

/** Gift card email to the recipient (or to the buyer if no recipient email was given). Marks the card sent. */
// deno-lint-ignore no-explicit-any
export async function sendGiftCardEmail(db: any, card: Record<string, any>, buyerName: string, buyerEmail: string) {
  const { data: claimed } = await db.from("gift_cards").update({ sent_at: new Date().toISOString() }).eq("code", card.code).is("sent_at", null).select("code").maybeSingle();
  if (!claimed) return;
  const to = isEmail(card.to_email) ? card.to_email : buyerEmail;
  const toSelf = to !== card.to_email;
  const name = esc(String(card.to_name ?? "").split(" ")[0] || "there");
  const res = await sendMail({
    to: [to], replyTo: TEAM[0],
    subject: toSelf ? `Your Boxed by Dweenie gift card ${card.code}` : `${buyerName} sent you a Boxed by Dweenie gift card`,
    html: layout({ preheader: `A gift card worth ${naira(card.amount)}`, heading: toSelf ? "Your gift card is ready" : `A gift for you, ${name}`, cta: { label: "Choose your gift", url: `${SITE_URL}/shop` },
      body: p(toSelf ? `Here is the gift card${card.to_name ? " for " + esc(card.to_name) : ""} you bought. Forward this email to the lucky person, or hand it over yourself.` : `<b>${esc(buyerName)}</b> has sent you a gift card.`) +
        (card.message ? `<p style="margin:0 0 16px;padding:14px 16px;background:#F4EFE5;border-radius:12px;font-family:Georgia,serif;font-style:italic">&ldquo;${esc(card.message)}&rdquo;</p>` : "") +
        `<table width="100%" style="background:#292828;border-radius:14px"><tr><td align="center" style="padding:22px 12px;color:#E7B93B;font-family:Georgia,serif"><div style="font-size:30px">${naira(card.amount)}</div><div style="margin-top:8px;font-family:Arial,sans-serif;font-size:13px;letter-spacing:.12em;color:#F4EFE5">${esc(card.code)}</div></td></tr></table>` +
        p(`<span style="display:block;margin-top:14px">Enter this code at checkout on our site to pay for any gift. Any balance stays on the card.</span>`) }),
  });
  if (!res.ok) await db.from("gift_cards").update({ sent_at: null }).eq("code", card.code); // retry on the next run
}

/** Lagos is UTC+1 all year. */
export const lagosToday = () => new Date(Date.now() + 3600_000).toISOString().slice(0, 10);

/** Everything that should happen once an order is paid. Never throws: email problems must not affect payment. */
// deno-lint-ignore no-explicit-any
export async function afterPaid(db: any, order: Record<string, any>) {
  try {
    await sendOrderEmails(db, order);
    const { data: cards } = await db.from("gift_cards").select("*").eq("order_ref", order.ref).eq("status", "active").is("sent_at", null);
    for (const c of cards ?? []) if (!c.send_on || c.send_on <= lagosToday()) await sendGiftCardEmail(db, c, order.customer?.name ?? "Someone", order.customer?.email ?? "");
  } catch (e) { console.error("afterPaid", e); }
}
