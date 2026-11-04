import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatLimit, getPlan } from "@/lib/plans";
import { PortfolioManager } from "@/components/dashboard/portfolio-manager";
import { ButtonLink } from "@/components/ui/button";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Portfolio"), robots: { index: false } };
}

export default async function PortfolioPage({ searchParams }: PageProps<"/dashboard/portfolio">) {
  const tr = await getT();
  const user = await requireRole("PRO", "/dashboard/portfolio");
  if (!user.company) redirect("/onboarding");
  const { onboarding } = await searchParams;
  const items = await db.portfolioImage.findMany({
    where: { companyId: user.company.id },
    orderBy: { position: "asc" },
    select: { id: true, key: true, thumbKey: true, width: true, height: true, title: true, description: true, projectName: true, location: true, year: true, position: true },
  });
  const limit = getPlan(user.plan).limits.portfolioImages;
  return (
    <>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="display text-4xl sm:text-5xl">{tr("Projects & portfolio")}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            {tr("Add pictures and a description for each one. Every picture is analysed so creatives can find you by searching with an image or a description. {length} / {limit} pictures.", { length: items.length, limit: formatLimit(limit) })}</p>
        </div>
        {onboarding && (
          <ButtonLink href="/upgrade" variant={items.length ? "primary" : "secondary"}>
            {items.length ? tr("Continue") : tr("Skip for now")}
          </ButtonLink>
        )}
      </header>
      {onboarding && (
        <p className="mb-6 rounded-xl bg-brass-light/50 px-4 py-3 text-sm">
          {tr("Last step before going live: add at least one picture of your work, then publish your profile from your")}
          <Link href="/dashboard" className="underline">
            {tr("dashboard")}</Link>
          .
        </p>
      )}
      <PortfolioManager initialItems={items} limit={Number.isFinite(limit) ? limit : 9999} />
    </>
  );
}
