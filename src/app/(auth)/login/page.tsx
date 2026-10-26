import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNext } from "@/lib/utils";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const target = safeNext(next);
  if (await getCurrentUser()) redirect(target);
  return (
    <>
      <p className="eyebrow">Welcome back</p>
      <h1 className="display mt-3 text-5xl">Log in to SEFIKH</h1>
      <p className="mt-3 text-sm text-muted">Find makers, follow your projects and continue your conversations.</p>
      <LoginForm next={target} />
    </>
  );
}
