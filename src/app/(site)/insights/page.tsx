import type { Metadata } from "next";
import Link from "next/link";
import { Lock, TrendingUp } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { currentQuarter, emergingTerms, lastDays, marketKpis, monthlySeries, mostDiscovered, topTerms, type Range } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { BarList, TrendChart } from "@/components/charts/charts";
import { ButtonLink } from "@/components/ui/button";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return {
  title: tr("Trends & Insights"),
  description: tr("SEFIKH market data: a live view of what the creative industries are looking for — searched skills, materials, techniques and locations."),
};
}

const PERIODS: Record<string, { label: string; range: () => Range }> = {
  quarter: { label: "This quarter", range: currentQuarter },
  "30d": { label: "Last 30 days", range: () => lastDays(30) },
  "12m": { label: "Last 12 months", range: () => lastDays(365) },
};

export default async function InsightsPage({ searchParams }: PageProps<"/insights">) {
  const tr = await getT();
  const { period: p } = await searchParams;
  const period = typeof p === "string" && PERIODS[p] ? p : "quarter";
  const range = PERIODS[period]!.range();
  const user = await getCurrentUser();
  const full = !!user && getPlan(user.plan).limits.marketInsights;

  const [kpis, terms, series, discovered, emerging, impressions, views] = await Promise.all([
    marketKpis(range),
    topTerms(range),
    monthlySeries(12),
    mostDiscovered(range),
    emergingTerms(),
    db.searchImpression.count({ where: { createdAt: { gte: range.from, lte: range.to } } }),
    db.profileView.count({ where: { createdAt: { gte: range.from, lte: range.to }, source: { in: ["SEARCH", "IMAGE"] } } }),
  ]);
  const searchToProfile = impressions ? Math.round((views / impressions) * 1000) / 10 : 0;
  const matchSuccess = kpis.matches ? Math.round((kpis.connections / kpis.matches) * 1000) / 10 : 0;

  return (
    <div className="pb-24">
      <section className="grain bg-espresso py-16 text-paper sm:py-20">
        <div className="container-x text-center">
          <p className="display text-6xl tracking-[0.18em] sm:text-7xl">{tr("SEFIKH")}</p>
          <p className="mt-2 font-display text-2xl italic text-paper/70">{tr("Search Engine For Know-How")}</p>
          <p className="mx-auto mt-8 max-w-xl text-sm text-paper/60">{tr("A live, anonymised view of what architects, designers and hoteliers are looking for — generated automatically from activity on the platform.")}</p>
        </div>
      </section>

      <div className="container-x mt-12">
        <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="display text-4xl">{tr("SEFIKH market data")}</h1>
            <p className="mt-1 text-sm text-muted">
              {tr("Traffic from {from} to {to}", { from: tr.date(range.from), to: tr.date(range.to) })}
            </p>
          </div>
          <div className="flex gap-1 rounded-full bg-sand p-1">
            {Object.entries(PERIODS).map(([k, v]) => (
              <Link key={k} href={`/insights?period=${k}`} scroll={false} className={cn("rounded-full px-4 py-1.5 text-[13px]", period === k ? "bg-paper font-medium shadow-sm" : "text-muted hover:text-ink")}>
                {tr(v.label)}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            [kpis.searches, tr("Searches")],
            [kpis.activePros, tr("Active professionals")],
            [kpis.matches, tr("Qualified matches")],
            [kpis.connections, tr("Connection requests")],
          ].map(([n, l]) => (
            <div key={l as string} className="rounded-3xl bg-ink p-6 text-paper">
              <p className="display text-5xl">{tr.number(n as number)}</p>
              <p className="mt-1 text-[13px] text-paper/60">{l as string}</p>
            </div>
          ))}
        </div>

        {/* Activité de recherche — public */}
        <section className="mt-16">
          <h2 className="display text-3xl">{tr("Search activity")}</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="rounded-3xl border border-line bg-paper p-6">
              <p className="text-sm font-medium">{tr("Searches per month")}</p>
              <p className="text-[12px] text-muted">{tr("Last 12 months · all search modes")}</p>
              <div className="mt-4">
                <TrendChart data={series} dataKey="searches" unit="searches" />
              </div>
            </div>
            <div className="grid gap-4">
              <div className="rounded-3xl border border-line bg-paper p-6">
                <p className="display text-4xl">{tr.number(kpis.searches)}</p>
                <p className="text-[13px] text-muted">{tr("Total searches")}</p>
                <p className="display mt-4 text-4xl">{tr.number(kpis.uniqueSearchers)}</p>
                <p className="text-[13px] text-muted">{tr("Unique searchers ·")}{" "}{kpis.uniqueSearchers ? (kpis.searches / kpis.uniqueSearchers).toFixed(1) : 0} {" "}{tr("searches each on average")}</p>
              </div>
              <div className="rounded-3xl border border-line bg-paper p-6">
                <p className="mb-3 text-sm font-medium">{tr("How people search")}</p>
                <BarList
                  items={Object.entries(terms.byMode)
                    .map(([k, v]) => ({ name: { TEXT: "Project description", IMAGE: "Image", FILTER: "Skills & materials", PROJECT: "Project brief" }[k] ?? k, count: v }))
                    .sort((a, b) => b.count - a.count)}
                />
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Panel title={tr("Most searched materials")}>
              <BarList items={terms.materials} />
            </Panel>
            <Panel title={tr("Most searched techniques")}>
              <BarList items={terms.techniques} />
            </Panel>
          </div>
        </section>

        {/* Sections détaillées — réservées aux offres Intelligence / Studio */}
        <div className="relative mt-16">
          <div className={cn(!full && "pointer-events-none max-h-[720px] select-none overflow-hidden blur-[6px]")} aria-hidden={!full}>
            <section>
              <h2 className="display text-3xl">{tr("Demand")}</h2>
              <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <Panel title={tr("Most requested expertise")}>
                  <BarList items={terms.skills} />
                </Panel>
                <Panel title={tr("Most requested project types")}>
                  <BarList items={terms.sectors} />
                </Panel>
                <Panel title={tr("Top locations in demand")}>
                  <BarList items={terms.locations} />
                </Panel>
                <Panel title={tr("Emerging demand · 30 days")}>
                  <ul className="space-y-3">
                    {emerging.length === 0 && <li className="text-sm text-muted">{tr("Not enough data yet.")}</li>}
                    {emerging.map((e) => (
                      <li key={e.name} className="flex items-center justify-between text-[13px]">
                        <span>{tr(e.name)}</span>
                        <span className="flex items-center gap-1 font-medium text-success">
                          <TrendingUp className="size-3.5" /> {e.growth > 0 ? "+" : ""}
                          {e.growth}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </div>
            </section>
            <section className="mt-16">
              <h2 className="display text-3xl">{tr("Supply & discovery · Matching")}</h2>
              <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <Panel title={tr("Most discovered makers")}>
                  <ol className="space-y-2.5 text-[13px]">
                    {discovered.map((d, i) => (
                      <li key={d.id} className="flex justify-between gap-2">
                        <span>
                          <span className="mr-2 text-muted">{i + 1}.</span>
                          {d.name} <span className="text-muted">· {d.city}</span>
                        </span>
                        <span className="tabular-nums text-muted">{tr.number(d.views)} views</span>
                      </li>
                    ))}
                  </ol>
                </Panel>
                <Panel title={tr("Connection requests per month")}>
                  <TrendChart data={series} dataKey="connections" unit="requests" height={180} />
                </Panel>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    [`${searchToProfile}%`, tr("Search-to-profile rate")],
                    [`${matchSuccess}%`, tr("Match success rate")],
                    [tr.number(kpis.activePros), tr("Professionals on SEFIKH")],
                    [tr.number(impressions), tr("Profile appearances")],
                  ].map(([v, l]) => (
                    <div key={l} className="rounded-3xl border border-line bg-paper p-5">
                      <p className="display text-3xl">{v}</p>
                      <p className="mt-1 text-[12px] text-muted">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
          {!full && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-ivory/30 via-ivory/80 to-ivory">
              <div className="max-w-md rounded-3xl border border-line bg-paper p-8 text-center shadow-xl shadow-ink/5">
                <Lock className="mx-auto size-7 text-brass" strokeWidth={1.4} />
                <h3 className="display mt-3 text-3xl">{tr("Full market intelligence")}</h3>
                <p className="mt-2 text-sm text-muted">{tr("Demand by expertise, locations, emerging trends, discovery and matching rates are included in the Intelligence plan for makers and the Studio plan for creatives, with detailed quarterly reporting.")}</p>
                <ButtonLink href={user?.role === "PRO" ? "/upgrade" : "/pricing"} className="mt-6">
                  {tr("See plans")}</ButtonLink>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-line bg-paper p-6">
      <p className="mb-4 text-sm font-medium">{title}</p>
      {children}
    </div>
  );
}
