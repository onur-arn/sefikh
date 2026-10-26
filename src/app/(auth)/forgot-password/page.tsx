import type { Metadata } from "next";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <p className="eyebrow">Account recovery</p>
      <h1 className="display mt-3 text-5xl">Forgot your password?</h1>
      <p className="mt-3 text-sm text-muted">Enter the e-mail you signed up with and we&apos;ll send you a secure link to choose a new one.</p>
      <ForgotForm />
    </>
  );
}
