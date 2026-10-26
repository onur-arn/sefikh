"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { logSearch, runSearch } from "@/lib/search";
import { toList } from "@/lib/utils";
import { formToObject } from "@/lib/validation";
import { projectQuery } from "@/lib/projects";

const opt = (max = 300) => z.string().trim().max(max).optional().transform((v) => v || null);

const projectSchema = z.object({
  id: z.string().optional(),
  title: opt(140),
  projectType: z.string().trim().min(1, "Please choose a project type.").max(80),
  description: opt(4000),
  clientType: opt(40),
  country: z.string().trim().min(1, "Please indicate the country.").max(100),
  region: opt(100),
  city: z.string().trim().min(1, "Please indicate the city.").max(100),
  size: opt(200),
  spaceTypes: z.array(z.string().max(60)).max(20),
  style: opt(200),
  materials: z.array(z.string().max(60)).max(20),
  colorsFinishes: opt(1000),
  lookingFor: opt(300),
  productionType: opt(120),
  quantities: opt(500),
  technicalReqs: opt(2000),
  timeline: z.string().trim().min(1, "Please choose a timeline.").max(60),
  budget: z.string().trim().min(1, "Please choose a budget range.").max(60),
  completionDate: z.string().optional().transform((v) => (v ? new Date(v) : null)),
  professionalTypes: z.array(z.string().max(60)).max(10),
  services: z.array(z.string().max(60)).max(10),
  reach: opt(60),
  notes: opt(3000),
});

export type ProjectResult = { id?: string; error?: string; fieldErrors?: Record<string, string[] | undefined> };

export async function saveProject(formData: FormData): Promise<ProjectResult> {
  const user = await requireRole("CLIENT");
  const parsed = projectSchema.safeParse(formToObject(formData, ["spaceTypes", "materials", "professionalTypes", "services"]));
  if (!parsed.success) {
    const fe = z.flattenError(parsed.error).fieldErrors as Record<string, string[] | undefined>;
    return { error: Object.values(fe)[0]?.[0] ?? "Please check the form.", fieldErrors: fe };
  }
  const { id, ...d } = parsed.data;
  const data = {
    ...d,
    title: d.title ?? `${d.projectType} — ${d.city}`,
    completionDate: d.completionDate && !isNaN(d.completionDate.getTime()) ? d.completionDate : null,
    spaceTypes: toList(d.spaceTypes),
    materials: toList(d.materials),
    professionalTypes: toList(d.professionalTypes),
    services: toList(d.services),
  };

  let projectId: string;
  if (id) {
    const existing = await db.project.findFirst({ where: { id, ownerId: user.id } });
    if (!existing) return { error: "Project not found." };
    await db.project.update({ where: { id }, data });
    projectId = id;
  } else {
    const p = await db.project.create({ data: { ...data, ownerId: user.id } });
    projectId = p.id;
    // La recherche « par projet » alimente aussi les statistiques de marché.
    const { results, detected } = await runSearch(projectQuery(p));
    await logSearch({
      userId: user.id,
      mode: "PROJECT",
      query: p.title,
      terms: detected.tags.map((t) => `${t.kind}:${t.name}`),
      location: detected.city ?? detected.country,
      results,
    });
  }
  revalidatePath("/dashboard", "layout");
  return { id: projectId };
}

export async function setProjectStatus(id: string, status: "ACTIVE" | "ARCHIVED") {
  const user = await requireRole("CLIENT");
  await db.project.updateMany({ where: { id, ownerId: user.id }, data: { status } });
  revalidatePath("/dashboard", "layout");
}

export async function deleteProject(id: string) {
  const user = await requireRole("CLIENT");
  await db.project.deleteMany({ where: { id, ownerId: user.id } });
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/projects");
}
