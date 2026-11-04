import "server-only";
import type { Translator } from "@/i18n/config";
import { env } from "@/lib/env";
import { translatorFor } from "@/i18n/server";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type Block = { heading: string; intro: string[]; cta?: { label: string; url: string }; outro?: string[]; quote?: string };

function layout(tr: Translator, { heading, intro, cta, outro = [], quote }: Block) {
  const p = (t: string) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3b342d">${esc(t)}</p>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(heading)}</title></head>
<body style="margin:0;background:#f4efe8;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe8;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdf9;border:1px solid #e6ddd1">
<tr><td style="padding:28px 36px;border-bottom:1px solid #e6ddd1;font-family:Georgia,serif;font-size:22px;letter-spacing:.18em;color:#1c1714">SEFIKH</td></tr>
<tr><td style="padding:36px">
<h1 style="margin:0 0 20px;font-family:Georgia,serif;font-weight:400;font-size:26px;color:#1c1714">${esc(heading)}</h1>
${intro.map(p).join("")}
${quote ? `<div style="margin:0 0 20px;padding:16px 18px;background:#f4efe8;border-left:3px solid #a8794a;font-size:14px;line-height:1.6;color:#3b342d;white-space:pre-wrap">${esc(quote)}</div>` : ""}
${cta ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="background:#1c1714"><a href="${cta.url}" style="display:inline-block;padding:14px 26px;color:#fffdf9;text-decoration:none;font-size:14px;letter-spacing:.04em">${esc(cta.label)} →</a></td></tr></table>` : ""}
${outro.map(p).join("")}
</td></tr>
<tr><td style="padding:20px 36px;border-top:1px solid #e6ddd1;font-size:12px;color:#8a7f73">SEFIKH — Search Engine For Know-How<br>${esc(tr("You receive this e-mail because you have an account on SEFIKH."))} <a href="${env.appUrl}/dashboard/settings" style="color:#8a7f73">${esc(tr("Notification settings"))}</a></td></tr>
</table></td></tr></table></body></html>`;
  const text = [heading, "", ...intro, quote ? `\n"${quote}"\n` : "", cta ? `${cta.label}: ${cta.url}` : "", ...outro, "", "— SEFIKH"].join("\n");
  return { html, text };
}

export function verifyEmailTemplate(name: string, token: string, locale?: string | null) {
  const tr = translatorFor(locale);
  const url = `${env.appUrl}/verify-email?token=${token}`;
  return {
    subject: tr("Confirm your e-mail address"),
    ...layout(tr, {
      heading: tr("Welcome to SEFIKH, {name}", { name }),
      intro: [tr("Please confirm your e-mail address to activate your account and start connecting with makers, workshops and creative professionals.")],
      cta: { label: tr("Confirm my e-mail"), url },
      outro: [tr("This link is valid for 48 hours. If you did not create an account, you can safely ignore this e-mail.")],
    }),
  };
}

export function resetPasswordTemplate(name: string, token: string, locale?: string | null) {
  const tr = translatorFor(locale);
  const url = `${env.appUrl}/reset-password?token=${token}`;
  return {
    subject: tr("Reset your SEFIKH password"),
    ...layout(tr, {
      heading: tr("Reset your password"),
      intro: [tr("Hello {name}, we received a request to reset the password of your SEFIKH account.", { name })],
      cta: { label: tr("Choose a new password"), url },
      outro: [tr("This link expires in 1 hour and can only be used once. If you did not ask for it, ignore this e-mail — your password stays unchanged.")],
    }),
  };
}

export function passwordChangedTemplate(name: string, locale?: string | null) {
  const tr = translatorFor(locale);
  return {
    subject: tr("Your password has been changed"),
    ...layout(tr, {
      heading: tr("Password updated"),
      intro: [tr("Hello {name}, the password of your SEFIKH account has just been changed and other sessions have been signed out.", { name })],
      outro: [tr("If this wasn't you, reset your password immediately and contact us at hello@sefikh.com.")],
      cta: { label: tr("Secure my account"), url: `${env.appUrl}/forgot-password` },
    }),
  };
}

export function newMessageTemplate(opts: { recipientName: string; senderName: string; preview: string; conversationId: string; subject?: string | null }, locale?: string | null) {
  const tr = translatorFor(locale);
  return {
    subject: tr("New message from {senderName}{subject}", { senderName: opts.senderName, subject: opts.subject ? ` — ${opts.subject}` : "" }),
    ...layout(tr, {
      heading: tr("{senderName} sent you a message", { senderName: opts.senderName }),
      intro: [tr("Hello {recipientName},", { recipientName: opts.recipientName })],
      quote: opts.preview.length > 400 ? `${opts.preview.slice(0, 400)}…` : opts.preview,
      cta: { label: tr("Reply on SEFIKH"), url: `${env.appUrl}/messages?c=${opts.conversationId}` },
    }),
  };
}

export function subscriptionTemplate(opts: { name: string; planName: string; amount: string; term: string }, locale?: string | null) {
  const tr = translatorFor(locale);
  return {
    subject: tr("Your {planName} subscription is active", { planName: opts.planName }),
    ...layout(tr, {
      heading: tr("Welcome to {planName}", { planName: opts.planName }),
      intro: [tr("Thank you {name}! Your subscription is now active: {planName} — {amount} / month ({term}).", { name: opts.name, planName: opts.planName, amount: opts.amount, term: opts.term }), tr("Your invoices are available at any time in your billing space.")],
      cta: { label: tr("Open my dashboard"), url: `${env.appUrl}/dashboard/billing` },
    }),
  };
}

export function paymentFailedTemplate(name: string, locale?: string | null) {
  const tr = translatorFor(locale);
  return {
    subject: tr("Payment failed — action needed"),
    ...layout(tr, {
      heading: tr("We couldn't process your payment"),
      intro: [tr("Hello {name}, the latest payment for your SEFIKH subscription failed. Please update your payment method to keep your benefits.", { name })],
      cta: { label: tr("Update payment method"), url: `${env.appUrl}/dashboard/billing` },
    }),
  };
}

export function contactTemplate(opts: { name: string; email: string; topic: string; message: string }, locale?: string | null) {
  const tr = translatorFor(locale);
  return {
    subject: tr("[Contact] {topic} — {name}", { topic: opts.topic, name: opts.name }),
    ...layout(tr, { heading: tr("New contact request: {topic}", { topic: opts.topic }), intro: [tr("From {name} <{email}>", { name: opts.name, email: opts.email })], quote: opts.message }),
  };
}

export function contactAckTemplate(name: string, locale?: string | null) {
  const tr = translatorFor(locale);
  return {
    subject: tr("We received your message"),
    ...layout(tr, { heading: tr("Thank you for reaching out"), intro: [tr("Hello {name}, our team has received your message and will get back to you within 2 business days.", { name })] }),
  };
}
