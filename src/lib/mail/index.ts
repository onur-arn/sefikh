import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

let transporter: Transporter | null = null;

function getTransporter() {
  if (!env.smtp.host) return null;
  transporter ??= nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
  });
  return transporter;
}

export type Email = { to: string; subject: string; html: string; text: string; replyTo?: string };

/**
 * Envoie un e-mail via SMTP. Sans SMTP configuré, l'e-mail est seulement journalisé
 * (consultable sur /dev/mailbox en développement). Ne lève jamais : un échec d'envoi
 * ne doit pas casser le parcours utilisateur.
 */
export async function sendEmail(email: Email) {
  const t = getTransporter();
  let status = "LOGGED";
  let error: string | null = null;
  if (t) {
    try {
      await t.sendMail({ from: env.mailFrom, to: email.to, subject: email.subject, html: email.html, text: email.text, replyTo: email.replyTo });
      status = "SENT";
    } catch (e) {
      status = "FAILED";
      error = e instanceof Error ? e.message : String(e);
      console.error("[mail] échec d'envoi", email.to, error);
    }
  } else if (!env.isProd) {
    console.info(`[mail] (dev) « ${email.subject} » → ${email.to} — voir /dev/mailbox`);
  }
  await db.emailLog
    .create({ data: { to: email.to, subject: email.subject, html: email.html, text: email.text, status, error } })
    .catch(() => {});
  return status !== "FAILED";
}
