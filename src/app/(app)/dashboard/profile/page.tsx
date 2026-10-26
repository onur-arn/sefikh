import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AvatarUpload } from "@/components/dashboard/avatar-upload";
import { ClientProfileForm } from "@/components/dashboard/client-profile-form";
import { CompanyForm } from "@/components/dashboard/company-form";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

export default async function ProfilePage() {
  const user = await requireUser("/dashboard/profile");
  if (user.role === "PRO") {
    const company = await db.company.findUnique({ where: { userId: user.id }, include: { tags: { include: { tag: true } } } });
    return (
      <>
        <PageHead title="Business profile" text="Everything creatives see on your public page. Keep it precise: it drives your search ranking." />
        <div className="mb-10">
          <AvatarUpload kind="logo" name={company?.name ?? user.name} imageKey={company?.logoKey ?? null} label="Company logo" />
        </div>
        <CompanyForm accountEmail={user.email} company={company ? { ...company, tags: company.tags.map((t) => ({ kind: t.tag.kind, name: t.tag.name })) } : {}} />
      </>
    );
  }
  const profile = await db.clientProfile.findUnique({ where: { userId: user.id } });
  return (
    <>
      <PageHead title="My profile" text="These details are visible to the makers you contact, so they can tailor their answer." />
      <div className="mb-10">
        <AvatarUpload kind="avatar" name={user.name} imageKey={user.avatarKey} label="Profile picture" />
      </div>
      <ClientProfileForm profile={{ ...profile, name: user.name, email: user.email }} />
    </>
  );
}

function PageHead({ title, text }: { title: string; text: string }) {
  return (
    <header className="mb-10">
      <h1 className="display text-4xl sm:text-5xl">{title}</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">{text}</p>
    </header>
  );
}
