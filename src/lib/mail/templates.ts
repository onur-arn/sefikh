import "server-only";
import { env } from "@/lib/env";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type Block = { heading: string; intro: string[]; cta?: { label: string; url: string }; outro?: string[]; quote?: string };

function layout({ heading, intro, cta, outro = [], quote }: Block) {
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
<tr><td style="padding:20px 36px;border-top:1px solid #e6ddd1;font-size:12px;color:#8a7f73">SEFIKH — Search Engine For Know-How<br>You receive this e-mail because you have an account on <a href="${env.appUrl}" style="color:#8a7f73">sefikh.com</a>. <a href="${env.appUrl}/dashboard/settings" style="color:#8a7f73">Notification settings</a></td></tr>
</table></td></tr></table></body></html>`;
  const text = [heading, "", ...intro, quote ? `\n"${quote}"\n` : "", cta ? `${cta.label}: ${cta.url}` : "", ...outro, "", "— SEFIKH"].join("\n");
  return { html, text };
}

export function verifyEmailTemplate(name: string, token: string) {
  const url = `${env.appUrl}/verify-email?token=${token}`;
  return {
    subject: "Confirm your e-mail address",
    ...layout({
      heading: `Welcome to SEFIKH, ${name}`,
      intro: ["Please confirm your e-mail address to activate your account and start connecting with makers, workshops and creative professionals."],
      cta: { label: "Confirm my e-mail", url },
      outro: ["This link is valid for 48 hours. If you did not create an account, you can safely ignore this e-mail."],
    }),
  };
}

export function resetPasswordTemplate(name: string, token: string) {
  const url = `${env.appUrl}/reset-password?token=${token}`;
  return {
    subject: "Reset your SEFIKH password",
    ...layout({
      heading: "Reset your password",
      intro: [`Hello ${name}, we received a request to reset the password of your SEFIKH account.`],
      cta: { label: "Choose a new password", url },
      outro: ["This link expires in 1 hour and can only be used once. If you did not ask for it, ignore this e-mail — your password stays unchanged."],
    }),
  };
}

export function passwordChangedTemplate(name: string) {
  return {
    subject: "Your password has been changed",
    ...layout({
      heading: "Password updated",
      intro: [`Hello ${name}, the password of your SEFIKH account has just been changed and other sessions have been signed out.`],
      outro: ["If this wasn't you, reset your password immediately and contact us at hello@sefikh.com."],
      cta: { label: "Secure my account", url: `${env.appUrl}/forgot-password` },
    }),
  };
}

export function newMessageTemplate(opts: { recipientName: string; senderName: string; preview: string; conversationId: string; subject?: string | null }) {
  return {
    subject: `New message from ${opts.senderName}${opts.subject ? ` — ${opts.subject}` : ""}`,
    ...layout({
      heading: `${opts.senderName} sent you a message`,
      intro: [`Hello ${opts.recipientName},`],
      quote: opts.preview.length > 400 ? `${opts.preview.slice(0, 400)}…` : opts.preview,
      cta: { label: "Reply on SEFIKH", url: `${env.appUrl}/messages?c=${opts.conversationId}` },
    }),
  };
}

export function subscriptionTemplate(opts: { name: string; planName: string; amount: string; term: string }) {
  return {
    subject: `Your ${opts.planName} subscription is active`,
    ...layout({
      heading: `Welcome to ${opts.planName}`,
      intro: [`Thank you ${opts.name}! Your subscription is now active: ${opts.planName} — ${opts.amount} / month (${opts.term}).`, "Your invoices are available at any time in your billing space."],
      cta: { label: "Open my dashboard", url: `${env.appUrl}/dashboard/billing` },
    }),
  };
}

export function paymentFailedTemplate(name: string) {
  return {
    subject: "Payment failed — action needed",
    ...layout({
      heading: "We couldn't process your payment",
      intro: [`Hello ${name}, the latest payment for your SEFIKH subscription failed. Please update your payment method to keep your benefits.`],
      cta: { label: "Update payment method", url: `${env.appUrl}/dashboard/billing` },
    }),
  };
}

export function contactTemplate(opts: { name: string; email: string; topic: string; message: string }) {
  return {
    subject: `[Contact] ${opts.topic} — ${opts.name}`,
    ...layout({ heading: `New contact request: ${opts.topic}`, intro: [`From ${opts.name} <${opts.email}>`], quote: opts.message }),
  };
}

export function contactAckTemplate(name: string) {
  return {
    subject: "We received your message",
    ...layout({ heading: "Thank you for reaching out", intro: [`Hello ${name}, our team has received your message and will get back to you within 2 business days.`] }),
  };
}
