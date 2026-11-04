import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ClientProfileForm } from "@/components/dashboard/client-profile-form";
import { CompanyForm } from "@/components/dashboard/company-form";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Set up your profile"), robots: { index: false } };
}

export default async function OnboardingPage() {
  const tr = await getT();
  const user = await requireUser("/onboarding");
  if (user.role === "PRO" && user.company) redirect("/dashboard");
  const profile = user.role === "CLIENT" ? await db.clientProfile.findUnique({ where: { userId: user.id } }) : null;
  if (profile?.clientType) redirect("/dashboard");

  return (
    <div className="container-x max-w-5xl py-12">
      <Steps role={user.role} />
      <header className="mb-12 mt-10 text-center">
        <p className="eyebrow">{user.role === "PRO" ? tr("Showcase your craft. Get discovered.") : tr("Welcome to SEFIKH")}</p>
        <h1 className="display mt-3 text-5xl sm:text-6xl">{user.role === "PRO" ? tr("I have a skill · I offer a skill") : tr("I am a creative")}</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
          {user.role === "PRO"
            ? tr("Tell us about your skills, materials and capabilities. It only takes a few minutes — you can refine everything later.")
            : tr("A few details so makers know who they're talking to. You can change them at any time.")}
        </p>
      </header>
      {user.role === "PRO" ? <CompanyForm onboarding accountEmail={user.email} company={{ publicEmail: user.email }} /> : <ClientProfileForm onboarding profile={{ ...profile, name: user.name, email: user.email }} />}
    </div>
  );
}

async function Steps({ role }: { role: string }) {
  const tr = await getT();
  const steps = role === "PRO" ? [tr("Account"), tr("Business profile"), tr("Portfolio"), tr("Plan")] : [tr("Account"), tr("Your profile"), tr("First project")];
  return (
    <ol className="mx-auto flex max-w-xl items-center justify-center gap-2 text-[12px]">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span className={i <= 1 ? "flex size-6 items-center justify-center rounded-full bg-ink text-paper" : "flex size-6 items-center justify-center rounded-full border border-line text-muted"}>{i + 1}</span>
          <span className={i === 1 ? "font-medium" : "text-muted"}>{s}</span>
          {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-line" />}
        </li>
      ))}
    </ol>
  );
}
