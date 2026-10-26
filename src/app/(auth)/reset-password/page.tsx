import type { Metadata } from "next";
import Link from "next/link";
import { peekToken } from "@/lib/auth/tokens";
import { ButtonLink } from "@/components/ui/button";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  const valid = typeof token === "string" && (await peekToken(token, "RESET_PASSWORD"));
  if (!valid) {
    return (
      <>
        <h1 className="display text-5xl">Link expired</h1>
        <p className="mt-3 text-sm text-muted">This reset link is invalid, has already been used or has expired (links are valid for 1 hour).</p>
        <ButtonLink href="/forgot-password" className="mt-8">
          Request a new link
        </ButtonLink>
        <p className="mt-6 text-sm">
          <Link href="/login" className="text-muted hover:text-ink">
            ← Back to log in
          </Link>
        </p>
      </>
    );
  }
  return (
    <>
      <p className="eyebrow">Account recovery</p>
      <h1 className="display mt-3 text-5xl">Choose a new password</h1>
      <p className="mt-3 text-sm text-muted">For your security, you will be signed out of all other devices.</p>
      <ResetForm token={token} />
    </>
  );
}
