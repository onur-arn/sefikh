"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { destroyOtherSessions, requireUser } from "@/lib/auth/session";
import { issueToken } from "@/lib/auth/tokens";
import { getStripe } from "@/lib/billing";
import { sendEmail } from "@/lib/mail";
import { passwordChangedTemplate, verifyEmailTemplate } from "@/lib/mail/templates";
import { rateLimit } from "@/lib/rate-limit";
import { removeFile } from "@/lib/storage";
import { emailSchema, fieldErrors, passwordSchema, type FormState } from "@/lib/validation";
import { cookies } from "next/headers";

export async function changeEmailAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = z.object({ email: emailSchema, password: z.string().min(1, "Enter your current password.") }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please check the fields.", fieldErrors: fieldErrors(parsed.error) };
  if (!rateLimit(`email-change:${user.id}`, 5, 60 * 60_000).ok) return { error: "Too many attempts." };
  const full = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(parsed.data.password, full.passwordHash))) return { error: "Incorrect password.", fieldErrors: { password: ["Incorrect password."] } };
  if (parsed.data.email === full.email) return { error: "This is already your e-mail address." };
  if (await db.user.findUnique({ where: { email: parsed.data.email } })) return { error: "This e-mail is already used by another account." };
  await db.user.update({ where: { id: user.id }, data: { email: parsed.data.email, emailVerifiedAt: null } });
  const token = await issueToken(user.id, "VERIFY_EMAIL");
  await sendEmail({ to: parsed.data.email, ...verifyEmailTemplate(full.name, token, full.locale) });
  revalidatePath("/dashboard", "layout");
  return { success: `E-mail updated. Please confirm ${parsed.data.email} with the link we just sent.` };
}

export async function changePasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = z
    .object({ current: z.string().min(1, "Enter your current password."), password: passwordSchema, confirm: z.string() })
    .refine((d) => d.password === d.confirm, { message: "Passwords do not match.", path: ["confirm"] })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please check the fields.", fieldErrors: fieldErrors(parsed.error) };
  if (!rateLimit(`pw-change:${user.id}`, 5, 15 * 60_000).ok) return { error: "Too many attempts." };
  const full = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(parsed.data.current, full.passwordHash))) return { error: "Incorrect current password.", fieldErrors: { current: ["Incorrect password."] } };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password) } });
  await destroyOtherSessions(user.id, user.sessionId);
  await sendEmail({ to: full.email, ...passwordChangedTemplate(full.name, full.locale) });
  return { success: "Password updated. Other devices have been signed out." };
}

export async function notificationsAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  await db.user.update({ where: { id: user.id }, data: { notifyByEmail: formData.get("notifyByEmail") === "on" } });
  return { success: "Preferences saved." };
}

export async function signOutOthersAction(): Promise<FormState> {
  const user = await requireUser();
  await destroyOtherSessions(user.id, user.sessionId);
  revalidatePath("/dashboard/settings");
  return { success: "All other sessions have been signed out." };
}

export async function deleteAccountAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const full = await db.user.findUniqueOrThrow({ where: { id: user.id }, include: { company: { include: { portfolio: true } }, documents: true, subscriptions: true } });
  if (!(await verifyPassword(String(formData.get("password") ?? ""), full.passwordHash))) return { error: "Incorrect password." };
  if (formData.get("confirm") !== "DELETE") return { error: 'Type "DELETE" to confirm.' };

  // Résiliation immédiate des abonnements Stripe en cours.
  const stripe = getStripe();
  for (const s of full.subscriptions) {
    if (s.stripeSubscriptionId && stripe && ["ACTIVE", "PAST_DUE"].includes(s.status)) await stripe.subscriptions.cancel(s.stripeSubscriptionId).catch(() => {});
  }
  // Suppression des fichiers puis des données (cascade Prisma).
  const keys = [full.avatarKey, full.company?.logoKey, ...(full.company?.portfolio.flatMap((p) => [p.key, p.thumbKey]) ?? []), ...full.documents.map((d) => d.key)];
  await Promise.all(keys.map((k) => removeFile(k)));
  await db.user.delete({ where: { id: user.id } });
  (await cookies()).delete("sefikh_session");
  redirect("/?account=deleted");
}
