"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/mail";
import { contactAckTemplate, contactTemplate } from "@/lib/mail/templates";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { emailSchema, fieldErrors, type FormState } from "@/lib/validation";

export async function subscribeNewsletter(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Please enter a valid e-mail." };
  const rl = rateLimit(`nl:${await clientIp()}`, 5, 60 * 60_000);
  if (!rl.ok) return { error: "Too many attempts, please try later." };
  await db.newsletterSubscriber.upsert({ where: { email: parsed.data }, create: { email: parsed.data }, update: {} });
  return { success: "Thank you — you're on the list." };
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  email: emailSchema,
  topic: z.string().trim().min(2).max(60),
  message: z.string().trim().min(10, "Please write at least a few words.").max(4000),
  website: z.string().max(0).optional(), // pot de miel anti-spam
});

export async function contactAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const rl = rateLimit(`contact:${await clientIp()}`, 4, 60 * 60_000);
  if (!rl.ok) return { error: "Too many messages sent. Please try again later." };
  const { name, email, topic, message } = parsed.data;
  await db.contactRequest.create({ data: { name, email, topic, message } });
  await sendEmail({ to: env.contactInbox, replyTo: email, ...contactTemplate({ name, email, topic, message }) });
  await sendEmail({ to: email, ...contactAckTemplate(name) });
  return { success: "Thank you! Your message has been sent — we'll reply within 2 business days." };
}
