import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { RegisterForm } from "./register-form";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Create your account") };
}

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const tr = await getT();
  if (await getCurrentUser()) redirect("/dashboard");
  const { role, reason } = await searchParams;
  return (
    <>
      <p className="eyebrow">{tr("Join SEFIKH")}</p>
      <h1 className="display mt-3 text-5xl">{tr("Create your account")}</h1>
      <p className="mt-3 text-sm text-muted">{tr("It only takes a minute. No commission is ever taken on your projects.")}</p>
      {reason === "search" && <p className="mt-4 rounded-xl bg-sand px-4 py-3 text-sm">{tr("Create a free account to search: 3 free searches are included.")}</p>}
      <RegisterForm initialRole={role === "pro" ? "PRO" : "CLIENT"} />
    </>
  );
}
