import type { Metadata } from "next";
import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/misc";

export const metadata: Metadata = { title: "My projects", robots: { index: false } };

export default async function ProjectsPage() {
  const user = await requireRole("CLIENT", "/dashboard/projects");
  const projects = await db.project.findMany({
    where: { ownerId: user.id },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: { _count: { select: { conversations: true, files: true } } },
  });
  return (
    <>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl sm:text-5xl">My projects</h1>
          <p className="mt-2 text-sm text-muted">Describe each project once: we match it with the right makers and keep every conversation attached to it.</p>
        </div>
        <ButtonLink href="/dashboard/projects/new">
          <Plus className="size-4" /> I have a new project
        </ButtonLink>
      </header>
      {projects.length === 0 ? (
        <EmptyState icon={<FolderKanban className="size-8" strokeWidth={1.3} />} title="No project yet" action={<ButtonLink href="/dashboard/projects/new">Describe my first project</ButtonLink>}>
          A clear brief — type, location, style, materials, timeline and budget — gets you better matches and better answers.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <li key={p.id}>
              <Link href={`/dashboard/projects/${p.id}`} className="block h-full rounded-2xl border border-line bg-paper p-6 transition hover:border-ink/30">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="display text-2xl">{p.title}</h2>
                  <Badge tone={p.status === "ACTIVE" ? "success" : "neutral"}>{p.status === "ACTIVE" ? "Active" : "Archived"}</Badge>
                </div>
                <p className="mt-2 text-[13px] text-muted">{[p.projectType, [p.city, p.country].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}</p>
                <dl className="mt-5 grid grid-cols-3 gap-3 text-[12.5px]">
                  <div>
                    <dt className="text-muted">Timeline</dt>
                    <dd className="mt-0.5">{p.timeline ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Budget</dt>
                    <dd className="mt-0.5">{p.budget ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Conversations</dt>
                    <dd className="mt-0.5">{p._count.conversations}</dd>
                  </div>
                </dl>
                <p className="mt-5 text-[11.5px] text-muted">Updated {formatDate(p.updatedAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
