import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ClientProfileForm } from "@/components/dashboard/client-profile-form";
import { CompanyForm } from "@/components/dashboard/company-form";

export const metadata: Metadata = { title: "Set up your profile", robots: { index: false } };

export default async function OnboardingPage() {
  const user = await requireUser("/onboarding");
  if (user.role === "PRO" && user.company) redirect("/dashboard");
  const profile = user.role === "CLIENT" ? await db.clientProfile.findUnique({ where: { userId: user.id } }) : null;
  if (profile?.clientType) redirect("/dashboard");

  return (
    <div className="container-x max-w-5xl py-12">
      <Steps role={user.role} />
      <header className="mb-12 mt-10 text-center">
        <p className="eyebrow">{user.role === "PRO" ? "Showcase your craft. Get discovered." : "Welcome to SEFIKH"}</p>
        <h1 className="display mt-3 text-5xl sm:text-6xl">{user.role === "PRO" ? "I have a skill · I offer a skill" : "I am a creative"}</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
          {user.role === "PRO"
            ? "Tell us about your skills, materials and capabilities. It only takes a few minutes — you can refine everything later."
            : "A few details so makers know who they're talking to. You can change them at any time."}
        </p>
      </header>
      {user.role === "PRO" ? <CompanyForm onboarding accountEmail={user.email} company={{ publicEmail: user.email }} /> : <ClientProfileForm onboarding profile={{ ...profile, name: user.name, email: user.email }} />}
    </div>
  );
}

function Steps({ role }: { role: string }) {
  const steps = role === "PRO" ? ["Account", "Business profile", "Portfolio", "Plan"] : ["Account", "Your profile", "First project"];
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
