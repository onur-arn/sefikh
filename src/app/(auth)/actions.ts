"use server";

import { redirect } from "next/navigation";
import { getLocale } from "@/i18n/server";
import { db } from "@/lib/db";
import { DUMMY_HASH, hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth/session";
import { consumeToken, issueToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/mail";
import { passwordChangedTemplate, resetPasswordTemplate, verifyEmailTemplate } from "@/lib/mail/templates";
import { defaultPlanFor } from "@/lib/plans";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { safeNext } from "@/lib/utils";
import { fieldErrors, loginSchema, registerSchema, resetSchema, emailSchema, type FormState } from "@/lib/validation";

const TOO_MANY = (s: number) => ({ error: `Too many attempts. Please try again in ${Math.ceil(s / 60)} minute(s).` });

export async function registerAction(_: FormState, formData: FormData): Promise<FormState> {
  const ip = await clientIp();
  const rl = rateLimit(`register:${ip}`, 6, 15 * 60_000);
  if (!rl.ok) return TOO_MANY(rl.retryAfter);

  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const { name, email, password, role } = parsed.data;

  const exists = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) return { error: "An account already exists with this e-mail.", fieldErrors: { email: ["Already registered — try logging in."] } };

  const user = await db.user.create({
    data: {
      name,
      email,
      role,
      plan: defaultPlanFor(role),
      passwordHash: await hashPassword(password),
      ...(role === "CLIENT" ? { clientProfile: { create: {} } } : {}),
    },
  });
  const token = await issueToken(user.id, "VERIFY_EMAIL");
  await sendEmail({ to: email, ...verifyEmailTemplate(name, token, await getLocale()) });
  await createSession(user.id);
  redirect("/onboarding");
}

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please enter your e-mail and password.", fieldErrors: fieldErrors(parsed.error) };
  const { email, password } = parsed.data;

  const ip = await clientIp();
  const rl = rateLimit(`login:${ip}:${email}`, 8, 15 * 60_000);
  if (!rl.ok) return TOO_MANY(rl.retryAfter);

  const user = await db.user.findUnique({ where: { email } });
  // Comparaison systématique pour ne pas révéler l'existence d'un compte par le temps de réponse.
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return { error: "Incorrect e-mail or password." };
  if (user.suspendedAt) return { error: "This account has been suspended. Please contact us." };

  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function forgotPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Please enter a valid e-mail address." };
  const ip = await clientIp();
  const rl = rateLimit(`forgot:${ip}`, 5, 15 * 60_000);
  if (!rl.ok) return TOO_MANY(rl.retryAfter);

  const user = await db.user.findUnique({ where: { email: parsed.data } });
  if (user) {
    const token = await issueToken(user.id, "RESET_PASSWORD");
    await sendEmail({ to: user.email, ...resetPasswordTemplate(user.name, token, user.locale) });
  }
  // Réponse identique que le compte existe ou non.
  return { success: "If an account exists for this address, you will receive a reset link within a few minutes." };
}

export async function resetPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const userId = await consumeToken(parsed.data.token, "RESET_PASSWORD");
  if (!userId) return { error: "This reset link is invalid or has expired. Please request a new one." };

  const user = await db.user.update({
    where: { id: userId },
    // Cliquer sur le lien prouve aussi la possession de l'adresse e-mail.
    data: { passwordHash: await hashPassword(parsed.data.password), emailVerifiedAt: new Date() },
  });
  await db.session.deleteMany({ where: { userId } });
  await sendEmail({ to: user.email, ...passwordChangedTemplate(user.name, user.locale) });
  await createSession(userId);
  redirect("/dashboard?notice=password-reset");
}

export async function resendVerificationAction(): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please log in again." };
  if (user.emailVerifiedAt) return { success: "Your e-mail is already confirmed." };
  const rl = rateLimit(`verify:${user.id}`, 3, 30 * 60_000);
  if (!rl.ok) return TOO_MANY(rl.retryAfter);
  const token = await issueToken(user.id, "VERIFY_EMAIL");
  await sendEmail({ to: user.email, ...verifyEmailTemplate(user.name, token, user.locale) });
  return { success: `A new confirmation link has been sent to ${user.email}.` };
}
