import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create your account" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { role } = await searchParams;
  return (
    <>
      <p className="eyebrow">Join SEFIKH</p>
      <h1 className="display mt-3 text-5xl">Create your account</h1>
      <p className="mt-3 text-sm text-muted">It only takes a minute. No commission is ever taken on your projects.</p>
      <RegisterForm initialRole={role === "pro" ? "PRO" : "CLIENT"} />
    </>
  );
}
