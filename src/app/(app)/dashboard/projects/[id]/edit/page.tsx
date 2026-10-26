import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { parseList } from "@/lib/utils";
import { ProjectWizard } from "@/components/dashboard/project-wizard";

export const metadata: Metadata = { title: "Modify project", robots: { index: false } };

export default async function EditProjectPage({ params }: PageProps<"/dashboard/projects/[id]/edit">) {
  const { id } = await params;
  const user = await requireRole("CLIENT");
  const p = await db.project.findFirst({ where: { id, ownerId: user.id } });
  if (!p) notFound();
  const s = (v: string | null) => v ?? "";
  return (
    <div className="max-w-3xl">
      <h1 className="display mb-10 text-4xl sm:text-5xl">Modify “{p.title}”</h1>
      <ProjectWizard
        initial={{
          id: p.id, title: p.title, projectType: s(p.projectType), description: s(p.description), clientType: s(p.clientType), country: s(p.country), region: s(p.region), city: s(p.city), size: s(p.size),
          spaceTypes: parseList(p.spaceTypes), style: s(p.style), materials: parseList(p.materials), colorsFinishes: s(p.colorsFinishes), lookingFor: s(p.lookingFor), productionType: s(p.productionType),
          quantities: s(p.quantities), technicalReqs: s(p.technicalReqs), timeline: s(p.timeline), budget: s(p.budget), completionDate: p.completionDate ? p.completionDate.toISOString().slice(0, 10) : "",
          professionalTypes: parseList(p.professionalTypes), services: parseList(p.services), reach: s(p.reach), notes: s(p.notes),
        }}
      />
    </div>
  );
}
