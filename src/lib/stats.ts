import "server-only";
import { db } from "@/lib/db";
import { getT } from "@/i18n/server";
import { parseList } from "@/lib/utils";
import { LISTED_COMPANY } from "@/lib/access";

export type Range = { from: Date; to: Date };

export function currentQuarter(now = new Date()): Range {
  const q = Math.floor(now.getMonth() / 3);
  return { from: new Date(now.getFullYear(), q * 3, 1), to: now };
}

export function lastDays(days: number): Range {
  return { from: new Date(Date.now() - days * 86400_000), to: new Date() };
}

/** Indicateurs clés « SEFIKH market data » calculés en direct depuis la base. */
export async function marketKpis(range: Range) {
  const where = { createdAt: { gte: range.from, lte: range.to } };
  const [searches, activePros, matches, connections, uniqueUsers, uniqueVisitors] = await Promise.all([
    db.searchLog.count({ where }),
    db.company.count({ where: LISTED_COMPANY }),
    db.profileView.count({ where: { ...where, source: { in: ["SEARCH", "IMAGE"] } } }),
    db.conversation.count({ where }),
    db.searchLog.groupBy({ by: ["userId"], where: { ...where, userId: { not: null } } }).then((r) => r.length),
    db.searchLog.groupBy({ by: ["visitorId"], where: { ...where, userId: null, visitorId: { not: null } } }).then((r) => r.length),
  ]);
  return { searches, activePros, matches, connections, uniqueSearchers: uniqueUsers + uniqueVisitors };
}

/** Termes les plus recherchés par catégorie (à partir des recherches journalisées). */
export async function topTerms(range: Range, limit = 6) {
  const logs = await db.searchLog.findMany({ where: { createdAt: { gte: range.from, lte: range.to } }, select: { terms: true, location: true, mode: true, query: true } });
  const counters: Record<string, Map<string, number>> = { SKILL: new Map(), MATERIAL: new Map(), TECHNIQUE: new Map(), SECTOR: new Map(), LOCATION: new Map() };
  for (const l of logs) {
    for (const t of parseList(l.terms)) {
      const [kind, name] = String(t).split(":");
      if (kind && name && counters[kind]) counters[kind]!.set(name, (counters[kind]!.get(name) ?? 0) + 1);
    }
    if (l.location) counters.LOCATION!.set(l.location, (counters.LOCATION!.get(l.location) ?? 0) + 1);
  }
  const top = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name, count]) => ({ name, count }));
  return {
    skills: top(counters.SKILL!),
    materials: top(counters.MATERIAL!),
    techniques: top(counters.TECHNIQUE!),
    sectors: top(counters.SECTOR!),
    locations: top(counters.LOCATION!),
    byMode: logs.reduce<Record<string, number>>((acc, l) => ((acc[l.mode] = (acc[l.mode] ?? 0) + 1), acc), {}),
  };
}

/** Série mensuelle des recherches et mises en relation (12 derniers mois). */
export async function monthlySeries(months = 12) {
  const from = new Date(new Date().getFullYear(), new Date().getMonth() - (months - 1), 1);
  const [logs, convs] = await Promise.all([
    db.searchLog.findMany({ where: { createdAt: { gte: from } }, select: { createdAt: true } }),
    db.conversation.findMany({ where: { createdAt: { gte: from } }, select: { createdAt: true } }),
  ]);
  const tr = await getT();
  const buckets = Array.from({ length: months }, (_, i) => {
    const d = new Date(from.getFullYear(), from.getMonth() + i, 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: tr.date(d, { month: "short" }), searches: 0, connections: 0 };
  });
  const idx = new Map(buckets.map((b, i) => [b.key, i]));
  const bucketOf = (d: Date) => buckets[idx.get(`${d.getFullYear()}-${d.getMonth()}`) ?? -1];
  for (const l of logs) {
    const b = bucketOf(l.createdAt);
    if (b) b.searches++;
  }
  for (const c of convs) {
    const b = bucketOf(c.createdAt);
    if (b) b.connections++;
  }
  return buckets.map(({ label, searches, connections }) => ({ label, searches, connections }));
}

/** Makers les plus découverts (vues de profil) sur la période. */
export async function mostDiscovered(range: Range, limit = 5) {
  const rows = await db.profileView.groupBy({ by: ["companyId"], where: { createdAt: { gte: range.from, lte: range.to } }, _count: { _all: true }, orderBy: { _count: { companyId: "desc" } }, take: limit });
  const companies = await db.company.findMany({ where: { ...LISTED_COMPANY, id: { in: rows.map((r) => r.companyId) } }, select: { id: true, name: true, slug: true, city: true } });
  return rows.map((r) => ({ ...companies.find((c) => c.id === r.companyId)!, views: r._count._all })).filter((r) => r.name);
}

/** Statistiques d'un maker (tableau de bord pro). */
export async function companyStats(companyId: string, days = 30) {
  const from = new Date(Date.now() - days * 86400_000);
  const prevFrom = new Date(Date.now() - 2 * days * 86400_000);
  const [views, prevViews, impressions, prevImpressions, conversations, saved, viewRows] = await Promise.all([
    db.profileView.count({ where: { companyId, createdAt: { gte: from } } }),
    db.profileView.count({ where: { companyId, createdAt: { gte: prevFrom, lt: from } } }),
    db.searchImpression.count({ where: { companyId, createdAt: { gte: from } } }),
    db.searchImpression.count({ where: { companyId, createdAt: { gte: prevFrom, lt: from } } }),
    db.conversation.count({ where: { companyId, createdAt: { gte: from } } }),
    db.savedCompany.count({ where: { companyId } }),
    db.profileView.findMany({ where: { companyId, createdAt: { gte: from } }, select: { createdAt: true, source: true } }),
  ]);
  const tr = await getT();
  const daily = Array.from({ length: days }, (_, i) => {
    const d = new Date(from.getTime() + (i + 1) * 86400_000);
    return { date: d.toISOString().slice(0, 10), label: tr.date(d, { day: "numeric", month: "short" }), views: 0 };
  });
  const map = new Map(daily.map((d, i) => [d.date, i]));
  for (const v of viewRows) {
    const i = map.get(v.createdAt.toISOString().slice(0, 10));
    if (i != null) daily[i]!.views++;
  }
  const sources = viewRows.reduce<Record<string, number>>((acc, v) => ((acc[v.source ?? "DIRECT"] = (acc[v.source ?? "DIRECT"] ?? 0) + 1), acc), {});
  const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : a ? 100 : 0);
  return {
    views,
    viewsDelta: pct(views, prevViews),
    impressions,
    impressionsDelta: pct(impressions, prevImpressions),
    conversations,
    saved,
    ctr: impressions ? Math.round((views / impressions) * 1000) / 10 : 0,
    daily,
    sources,
  };
}

/** Demande émergente : termes dont la fréquence progresse le plus (30 derniers jours vs 30 précédents). */
export async function emergingTerms(limit = 5) {
  const [recent, previous] = await Promise.all([topTerms(lastDays(30), 50), topTerms({ from: new Date(Date.now() - 60 * 86400_000), to: new Date(Date.now() - 30 * 86400_000) }, 50)]);
  const flat = (t: Awaited<ReturnType<typeof topTerms>>) => [...t.skills, ...t.materials, ...t.techniques, ...t.sectors];
  const prev = new Map(flat(previous).map((x) => [x.name, x.count]));
  return flat(recent)
    .filter((x) => x.count >= 3)
    .map((x) => ({ name: x.name, count: x.count, growth: Math.round(((x.count - (prev.get(x.name) ?? 0)) / Math.max(1, prev.get(x.name) ?? 0)) * 100) }))
    .sort((a, b) => b.growth - a.growth)
    .slice(0, limit);
}
