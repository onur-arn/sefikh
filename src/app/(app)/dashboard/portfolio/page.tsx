import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatLimit, getPlan } from "@/lib/plans";
import { PortfolioManager } from "@/components/dashboard/portfolio-manager";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Portfolio", robots: { index: false } };

export default async function PortfolioPage({ searchParams }: PageProps<"/dashboard/portfolio">) {
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
          <h1 className="display text-4xl sm:text-5xl">Projects & portfolio</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Add pictures and a description for each one. Every picture is analysed so creatives can find you by searching with an image or a description. {items.length} / {formatLimit(limit)} pictures.
          </p>
        </div>
        {onboarding && (
          <ButtonLink href="/upgrade" variant={items.length ? "primary" : "secondary"}>
            {items.length ? "Continue" : "Skip for now"}
          </ButtonLink>
        )}
      </header>
      {onboarding && (
        <p className="mb-6 rounded-xl bg-brass-light/50 px-4 py-3 text-sm">
          Last step before going live: add at least one picture of your work, then publish your profile from your{" "}
          <Link href="/dashboard" className="underline">
            dashboard
          </Link>
          .
        </p>
      )}
      <PortfolioManager initialItems={items} limit={Number.isFinite(limit) ? limit : 9999} />
    </>
  );
}
