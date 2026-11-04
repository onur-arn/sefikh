import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNext } from "@/lib/utils";
import { LoginForm } from "./login-form";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Log in") };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const tr = await getT();
  const { next } = await searchParams;
  const target = safeNext(next);
  if (await getCurrentUser()) redirect(target);
  return (
    <>
      <p className="eyebrow">{tr("Welcome back")}</p>
      <h1 className="display mt-3 text-5xl">{tr("Log in to SEFIKH")}</h1>
      <p className="mt-3 text-sm text-muted">{tr("Find makers, follow your projects and continue your conversations.")}</p>
      <LoginForm next={target} />
    </>
  );
}
