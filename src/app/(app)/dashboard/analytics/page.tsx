import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { companyStats } from "@/lib/stats";
import { daysFromNow, formatNumber, parseList } from "@/lib/utils";
import { BarList, ColumnChart } from "@/components/charts/charts";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Analytics", robots: { index: false } };

export default async function AnalyticsPage() {
  const user = await requireRole("PRO", "/dashboard/analytics");
  if (!user.company) redirect("/onboarding");
  if (!getPlan(user.plan).limits.analytics) {
    return (
      <EmptyState icon={<Lock className="size-8" strokeWidth={1.3} />} title="Visibility analytics" action={<ButtonLink href="/upgrade">Upgrade to Pro</ButtonLink>}>
        See how many creatives discover your profile, from which searches, and how your visibility evolves day by day. Included from the Pro business plan.
      </EmptyState>
    );
  }
  const stats = await companyStats(user.company.id, 30);
  // Termes des recherches dans lesquelles le profil est apparu (30 jours)
  const logs = await db.searchLog.findMany({
    where: { impressions: { some: { companyId: user.company.id } }, createdAt: { gte: daysFromNow(-30) } },
    select: { terms: true },
  });
  const counter = new Map<string, number>();
  for (const l of logs) for (const t of parseList(l.terms)) {
    const name = String(t).split(":")[1];
    if (name) counter.set(name, (counter.get(name) ?? 0) + 1);
  }
  const topTerms = [...counter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));
  const sources = [
    { name: "Search results", count: stats.sources.SEARCH ?? 0 },
    { name: "Image search", count: stats.sources.IMAGE ?? 0 },
    { name: "Direct & shared links", count: stats.sources.DIRECT ?? 0 },
  ];

  return (
    <>
      <header className="mb-8">
        <h1 className="display text-4xl sm:text-5xl">Visibility analytics</h1>
        <p className="mt-2 text-sm text-muted">Last 30 days, compared with the previous 30 days.</p>
      </header>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          [formatNumber(stats.views), "Profile views", `${stats.viewsDelta >= 0 ? "+" : ""}${stats.viewsDelta}%`],
          [formatNumber(stats.impressions), "Appearances in search", `${stats.impressionsDelta >= 0 ? "+" : ""}${stats.impressionsDelta}%`],
          [`${stats.ctr}%`, "Search-to-profile rate", null],
          [formatNumber(stats.conversations), "New requests", null],
        ].map(([v, l, d]) => (
          <Card key={l} className="p-5">
            <p className="display text-4xl">{v}</p>
            <p className="mt-1 text-[13px] text-muted">{l}</p>
            {d && <p className={`mt-2 text-[12px] font-medium ${String(d).startsWith("-") ? "text-danger" : "text-success"}`}>{d} vs previous period</p>}
          </Card>
        ))}
      </div>
      <Card className="mt-6 p-6">
        <p className="text-sm font-medium">Profile views per day</p>
        <div className="mt-4">
          <ColumnChart data={stats.daily} dataKey="views" unit="views" />
        </div>
      </Card>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <p className="mb-4 text-sm font-medium">Where your visitors come from</p>
          <BarList items={sources} unit="views" />
        </Card>
        <Card className="p-6">
          <p className="mb-4 text-sm font-medium">Searches you appeared in</p>
          <BarList items={topTerms} />
        </Card>
      </div>
    </>
  );
}
