import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ProjectWizard } from "@/components/dashboard/project-wizard";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("New project"), robots: { index: false } };
}

export default async function NewProjectPage() {
  const tr = await getT();
  const user = await requireRole("CLIENT", "/dashboard/projects/new");
  const profile = await db.clientProfile.findUnique({ where: { userId: user.id } });
  return (
    <div className="max-w-3xl">
      <h1 className="display text-4xl sm:text-5xl">{tr("I have a new project")}</h1>
      <p className="mb-10 mt-2 text-sm text-muted">{tr("A few questions to understand your project. It takes about 3 minutes and you can modify everything afterwards.")}</p>
      <ProjectWizard
        initial={{
          title: "", projectType: "", description: "", clientType: profile?.clientType ?? "", country: profile?.country ?? "", region: "", city: "", size: "", spaceTypes: [], style: "", materials: [], colorsFinishes: "",
          lookingFor: "", productionType: "", quantities: "", technicalReqs: "", timeline: "", budget: "", completionDate: "", professionalTypes: [], services: [], reach: "", notes: "",
        }}
      />
    </div>
  );
}
