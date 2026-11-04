import type { Metadata } from "next";
import { Bookmark, Lock } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { MakerCard } from "@/components/makers/maker-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Supplier library"), robots: { index: false } };
}

export default async function LibraryPage() {
  const tr = await getT();
  const user = await requireUser("/dashboard/library");
  const allowed = getPlan(user.plan).limits.savedLibrary;
  const saved = await db.savedCompany.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { company: { include: { portfolio: { orderBy: { position: "asc" }, take: 3, select: { key: true, thumbKey: true, width: true, height: true, title: true } } } } },
  });
  return (
    <>
      <header className="mb-8">
        <h1 className="display text-4xl sm:text-5xl">{tr("Supplier library")}</h1>
        <p className="mt-2 text-sm text-muted">{tr("The makers you've saved, ready for your next project.")}</p>
      </header>
      {!allowed && saved.length === 0 ? (
        <EmptyState icon={<Lock className="size-8" strokeWidth={1.3} />} title={tr("Build your supplier library")} action={<ButtonLink href="/pricing">{tr("Upgrade to Pro")}</ButtonLink>}>
          {tr("Save makers you love and find them in one place. The supplier library is included in Pro and Studio.")}</EmptyState>
      ) : saved.length === 0 ? (
        <EmptyState icon={<Bookmark className="size-8" strokeWidth={1.3} />} title={tr("No saved maker yet")} action={<ButtonLink href="/search">{tr("Explore makers")}</ButtonLink>}>
          {tr("Use the “Save” button on a maker's profile to add it here.")}</EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 xl:grid-cols-4">
          {saved.map(({ company: c }) => (
            <MakerCard
              key={c.id}
              maker={{ ...c, image: c.portfolio[0] ? { key: c.portfolio[0].thumbKey ?? c.portfolio[0].key, width: c.portfolio[0].width, height: c.portfolio[0].height, title: c.portfolio[0].title } : null, gallery: c.portfolio.slice(1).map((p) => p.thumbKey ?? p.key) }}
            />
          ))}
        </div>
      )}
    </>
  );
}
