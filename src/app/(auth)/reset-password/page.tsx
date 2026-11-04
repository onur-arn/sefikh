import type { Metadata } from "next";
import Link from "next/link";
import { peekToken } from "@/lib/auth/tokens";
import { ButtonLink } from "@/components/ui/button";
import { ResetForm } from "./reset-form";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Choose a new password"), robots: { index: false } };
}

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const tr = await getT();
  const { token } = await searchParams;
  const valid = typeof token === "string" && (await peekToken(token, "RESET_PASSWORD"));
  if (!valid) {
    return (
      <>
        <h1 className="display text-5xl">{tr("Link expired")}</h1>
        <p className="mt-3 text-sm text-muted">{tr("This reset link is invalid, has already been used or has expired (links are valid for 1 hour).")}</p>
        <ButtonLink href="/forgot-password" className="mt-8">
          {tr("Request a new link")}</ButtonLink>
        <p className="mt-6 text-sm">
          <Link href="/login" className="text-muted hover:text-ink">
            {tr("← Back to log in")}</Link>
        </p>
      </>
    );
  }
  return (
    <>
      <p className="eyebrow">{tr("Account recovery")}</p>
      <h1 className="display mt-3 text-5xl">{tr("Choose a new password")}</h1>
      <p className="mt-3 text-sm text-muted">{tr("For your security, you will be signed out of all other devices.")}</p>
      <ResetForm token={token} />
    </>
  );
}
