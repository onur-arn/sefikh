import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { DocumentsManager } from "@/components/dashboard/documents-manager";

export const metadata: Metadata = { title: "Documents", robots: { index: false } };

export default async function DocumentsPage({ searchParams }: PageProps<"/dashboard/documents">) {
  const user = await requireUser("/dashboard/documents");
  const { project } = await searchParams;
  const [docs, projects] = await Promise.all([
    db.document.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" }, include: { project: { select: { id: true, title: true } } } }),
    db.project.findMany({ where: { ownerId: user.id }, select: { id: true, title: true }, orderBy: { updatedAt: "desc" } }),
  ]);
  const used = docs.reduce((a, d) => a + d.size, 0);
  return (
    <>
      <header className="mb-8">
        <h1 className="display text-4xl sm:text-5xl">Documents</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">Your moodboards, plans and quotes, stored securely in the cloud and organised by project. Only you can access them.</p>
      </header>
      <DocumentsManager
        initialDocs={docs.map((d) => ({ id: d.id, name: d.name, mime: d.mime, size: d.size, url: `/files/${d.key}`, createdAt: d.createdAt.toISOString(), project: d.project }))}
        projects={projects}
        initialProject={typeof project === "string" ? project : ""}
        used={used}
      />
    </>
  );
}
