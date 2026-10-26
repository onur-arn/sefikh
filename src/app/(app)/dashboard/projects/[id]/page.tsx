import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, MessageCircle, Pencil, Sparkles } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projectQuery } from "@/lib/projects";
import { runSearch } from "@/lib/search";
import { formatBytes, formatDate, formatRelative, parseList } from "@/lib/utils";
import { MakerCard } from "@/components/makers/maker-card";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/misc";
import { ProjectActions } from "@/components/dashboard/project-actions";

export const metadata: Metadata = { title: "Project", robots: { index: false } };

export default async function ProjectPage({ params, searchParams }: PageProps<"/dashboard/projects/[id]">) {
  const { id } = await params;
  const { created } = await searchParams;
  const user = await requireRole("CLIENT");
  const p = await db.project.findFirst({
    where: { id, ownerId: user.id },
    include: {
      files: { orderBy: { createdAt: "desc" } },
      conversations: { orderBy: { lastMessageAt: "desc" }, include: { company: { select: { name: true, slug: true } }, messages: { orderBy: { createdAt: "desc" }, take: 1 } } },
    },
  });
  if (!p) notFound();
  const { results } = await runSearch(projectQuery(p));
  const matches = results.slice(0, 8);

  const recap: [string, string | null][] = [
    ["Type", p.projectType],
    ["Location", [p.city, p.region, p.country].filter(Boolean).join(", ")],
    ["Size", p.size],
    ["Spaces", parseList(p.spaceTypes).join(", ")],
    ["Style", p.style],
    ["Materials", parseList(p.materials).join(" / ")],
    ["Colours & finishes", p.colorsFinishes],
    ["Looking for", [p.lookingFor, p.productionType].filter(Boolean).join(" — ")],
    ["Quantities", p.quantities],
    ["Technical requirements", p.technicalReqs],
    ["Timeline", p.timeline],
    ["Budget", p.budget],
    ["Completion", p.completionDate ? formatDate(p.completionDate) : null],
    ["Professionals", parseList(p.professionalTypes).join(", ")],
    ["Services", parseList(p.services).join(", ")],
    ["Reach", p.reach],
  ];

  return (
    <div className="space-y-12">
      {created && (
        <p className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
          Your project is saved. Here are the makers and specialists matching your requirements — contact them directly from their profile.
        </p>
      )}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Link href="/dashboard/projects" className="text-[12px] text-muted hover:text-ink">
            ← My projects
          </Link>
          <h1 className="display mt-2 text-4xl sm:text-5xl">{p.title}</h1>
          <div className="mt-3 flex items-center gap-2">
            <Badge tone={p.status === "ACTIVE" ? "success" : "neutral"}>{p.status === "ACTIVE" ? "Active" : "Archived"}</Badge>
            <span className="text-[12px] text-muted">Created {formatDate(p.createdAt)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/dashboard/projects/${p.id}/edit`} variant="secondary">
            <Pencil className="size-4" /> Modify
          </ButtonLink>
          <ProjectActions id={p.id} status={p.status} />
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="p-6 sm:p-8">
          <p className="inline-block rounded-full bg-ink px-4 py-1.5 text-[13px] font-semibold text-paper">Project recap</p>
          {p.description && <p className="mt-6 leading-relaxed text-ink-soft">{p.description}</p>}
          <dl className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {recap
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="border-b border-line pb-2.5">
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">{k}</dt>
                  <dd className="mt-0.5 text-[14px]">{v}</dd>
                </div>
              ))}
          </dl>
          {p.notes && <p className="mt-6 text-sm italic text-muted">“{p.notes}”</p>}
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <MessageCircle className="size-4 text-brass" /> Conversations ({p.conversations.length})
            </h2>
            <ul className="mt-3 divide-y divide-line">
              {p.conversations.length === 0 ? (
                <li className="py-4 text-[13px] text-muted">Contact a maker below — the conversation will be linked to this project.</li>
              ) : (
                p.conversations.map((c) => (
                  <li key={c.id}>
                    <Link href={`/messages?c=${c.id}`} className="block py-3 hover:opacity-75">
                      <p className="flex justify-between text-[13.5px] font-medium">
                        {c.company.name} <span className="text-[11px] font-normal text-muted">{formatRelative(c.lastMessageAt)}</span>
                      </p>
                      <p className="truncate text-[12.5px] text-muted">{c.messages[0]?.body}</p>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </Card>
          <Card className="p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="size-4 text-brass" /> References & documents ({p.files.length})
            </h2>
            <ul className="mt-3 space-y-2">
              {p.files.map((f) => (
                <li key={f.id}>
                  <a href={`/files/${f.key}?download=${encodeURIComponent(f.name)}`} className="flex items-center gap-2 text-[13px] hover:underline">
                    <span className="truncate">{f.name}</span>
                    <span className="ml-auto shrink-0 text-[11px] text-muted">{formatBytes(f.size)}</span>
                  </a>
                </li>
              ))}
            </ul>
            <Link href={`/dashboard/documents?project=${p.id}`} className="mt-3 inline-block text-[13px] font-medium text-brass-dark hover:underline">
              Manage documents
            </Link>
          </Card>
        </div>
      </div>

      <section>
        <p className="eyebrow flex items-center gap-1.5">
          <Sparkles className="size-3.5" /> Matching makers
        </p>
        <h2 className="display mt-2 text-3xl sm:text-4xl">Here are {matches.length} makers and specialists matching your project requirements.</h2>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {matches.map((r) => (
            <MakerCard key={r.id} maker={r} source="SEARCH" />
          ))}
        </div>
      </section>
    </div>
  );
}
