import type { Metadata } from "next";
import { ForgotForm } from "./forgot-form";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Forgot password") };
}

export default async function ForgotPasswordPage() {
  const tr = await getT();
  return (
    <>
      <p className="eyebrow">{tr("Account recovery")}</p>
      <h1 className="display mt-3 text-5xl">{tr("Forgot your password?")}</h1>
      <p className="mt-3 text-sm text-muted">{tr("Enter the e-mail you signed up with and we'll send you a secure link to choose a new one.")}</p>
      <ForgotForm />
    </>
  );
}
