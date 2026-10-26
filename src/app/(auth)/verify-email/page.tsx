import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { consumeToken } from "@/lib/auth/tokens";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Confirm your e-mail", robots: { index: false } };

export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const { token } = await searchParams;
  const userId = typeof token === "string" ? await consumeToken(token, "VERIFY_EMAIL") : null;
  if (userId) await db.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });

  return userId ? (
    <div className="text-center">
      <CheckCircle2 className="mx-auto size-12 text-success" strokeWidth={1.4} />
      <h1 className="display mt-6 text-5xl">E-mail confirmed</h1>
      <p className="mt-3 text-sm text-muted">Thank you — your account is fully activated. You can now contact makers and receive requests.</p>
      <ButtonLink href="/dashboard" className="mt-8" size="lg">
        Go to my dashboard
      </ButtonLink>
    </div>
  ) : (
    <div className="text-center">
      <XCircle className="mx-auto size-12 text-danger" strokeWidth={1.4} />
      <h1 className="display mt-6 text-5xl">Link invalid</h1>
      <p className="mt-3 text-sm text-muted">This confirmation link has expired or was already used. Log in and request a new one from your dashboard.</p>
      <ButtonLink href="/dashboard" className="mt-8" size="lg" variant="secondary">
        Go to my dashboard
      </ButtonLink>
    </div>
  );
}
