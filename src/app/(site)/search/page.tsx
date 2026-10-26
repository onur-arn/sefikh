import type { Metadata } from "next";
import Link from "next/link";
import { Lock, ScanSearch, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { fromBytes } from "@/lib/images";
import { getPlan } from "@/lib/plans";
import { findRecentSearch, logSearch, runSearch, searchesThisMonth, type SearchInput, type SearchMode } from "@/lib/search";
import { fileUrl, parseList } from "@/lib/utils";
import { visitorId } from "@/lib/visitor";
import { SearchFilters, SortSelect } from "@/components/search/filters";
import { SearchPanel } from "@/components/search/search-panel";
import { MakerCard } from "@/components/makers/maker-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Explore makers",
  description: "Search artisans, workshops and manufacturers by project, image, skills, materials and location.",
};

const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const [user, vid] = await Promise.all([getCurrentUser(), visitorId()]);
  const who = { userId: user?.id ?? null, visitorId: vid };
  const plan = getPlan(user?.plan ?? "CLIENT_FREE");

  const q = one(sp.q)?.slice(0, 500);
  const imageId = one(sp.image);
  const input: SearchInput = {
    q,
    near: one(sp.near),
    skills: list(sp.skills),
    materials: list(sp.materials),
    techniques: list(sp.techniques),
    sectors: list(sp.sectors),
    kind: one(sp.kind),
    radiusKm: Number(one(sp.radius)) || undefined,
    maxLeadTime: Number(one(sp.lead)) || undefined,
    sort: (one(sp.sort) as SearchInput["sort"]) ?? "relevance",
  };

  // Recherche par image : on retrouve l'empreinte calculée lors du dépôt.
  let imageSearch: { id: string; imageKey: string | null } | null = null;
  if (imageId) {
    const log = await db.searchLog.findUnique({ where: { id: imageId } });
    if (log && log.mode === "IMAGE" && ((user && log.userId === user.id) || (vid && log.visitorId === vid))) {
      imageSearch = { id: log.id, imageKey: log.imageKey };
      input.imageEmbedding = fromBytes(log.embedding);
      if (!input.imageEmbedding && log.query) input.imageColors = parseList<number>(log.query);
    }
  }

  // Quota de recherches textuelles (offre gratuite / visiteurs).
  const mode: SearchMode = imageSearch ? "IMAGE" : q ? "TEXT" : "FILTER";
  let limited = false;
  if (mode === "TEXT" && Number.isFinite(plan.limits.textSearchesPerMonth)) {
    const already = await findRecentSearch(who, "TEXT", q!);
    if (!already && (await searchesThisMonth(who, "TEXT")) >= plan.limits.textSearchesPerMonth) limited = true;
  }

  const { results, detected, usedVisualAI } = limited ? { results: [], detected: { tags: [], city: null, country: null }, usedVisualAI: false } : await runSearch(input);

  // Journalisation (statistiques marché + impressions), sans double comptage des rechargements.
  const hasCriteria = !!(q || imageSearch || input.skills?.length || input.materials?.length || input.techniques?.length || input.sectors?.length || input.near);
  if (!limited && hasCriteria) {
    const terms = [
      ...detected.tags.map((t) => `${t.kind}:${t.name}`),
      ...input.skills!.map((v) => `SKILL:${v}`),
      ...input.materials!.map((v) => `MATERIAL:${v}`),
      ...input.techniques!.map((v) => `TECHNIQUE:${v}`),
      ...input.sectors!.map((v) => `SECTOR:${v}`),
    ];
    if (imageSearch) {
      const log = await db.searchLog.findUnique({ where: { id: imageSearch.id }, select: { resultsCount: true, _count: { select: { impressions: true } } } });
      if (log && log._count.impressions === 0 && results.length) {
        await db.searchLog.update({ where: { id: imageSearch.id }, data: { resultsCount: results.length, terms: JSON.stringify(terms), location: detected.city ?? detected.country } });
        await db.searchImpression.createMany({ data: results.slice(0, 24).map((r, i) => ({ searchId: imageSearch!.id, companyId: r.id, rank: i + 1 })) });
      }
    } else {
      const key = JSON.stringify([q, input.near, input.skills, input.materials, input.techniques, input.sectors]);
      if (!(await findRecentSearch(who, mode, mode === "TEXT" ? q! : key))) {
        await logSearch({ ...who, mode, query: mode === "TEXT" ? q : key, terms: [...new Set(terms)], location: detected.city ?? detected.country, results });
      }
    }
  }

  const source = imageSearch ? "IMAGE" : hasCriteria ? "SEARCH" : undefined;
  const chips = [
    ...detected.tags.map((t) => t.name),
    ...(detected.city ? [detected.city] : detected.country ? [detected.country] : []),
  ];

  return (
    <div className="container-x pb-24 pt-10">
      <div className="mx-auto max-w-3xl">
        <SearchPanel compact initialTab={one(sp.mode) === "image" ? "image" : "project"} />
      </div>

      <div className="mt-14 flex flex-col gap-6 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-5">
          {imageSearch?.imageKey && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fileUrl(imageSearch.imageKey)!} alt="Your reference" className="size-20 shrink-0 rounded-xl object-cover ring-4 ring-paper" />
          )}
          <div>
            <p className="eyebrow flex items-center gap-2">
              {imageSearch ? <ScanSearch className="size-3.5" /> : <Sparkles className="size-3.5" />}
              {imageSearch ? "Visual search" : q ? "Project search" : "Explore expertise"}
              {usedVisualAI && <span className="rounded-full bg-brass-light px-2 py-0.5 text-[10px] tracking-normal text-brass-dark normal-case">AI visual matching</span>}
            </p>
            <h1 className="display mt-2 text-3xl sm:text-4xl">
              {limited
                ? "You've reached your free searches for this month"
                : hasCriteria
                  ? `Here ${results.length === 1 ? "is 1 maker" : `are ${results.length} makers`} and specialists matching your ${imageSearch ? "reference" : "project requirements"}.`
                  : `${results.length} makers, workshops and manufacturers`}
            </h1>
            {q && <p className="mt-2 line-clamp-2 max-w-2xl text-sm italic text-muted">“{q}”</p>}
            {chips.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[12px] text-muted">We understood:</span>
                {chips.map((c) => (
                  <span key={c} className="rounded-full border border-line bg-paper px-2.5 py-0.5 text-[12px]">
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SortSelect />
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[250px_1fr]">
        <SearchFilters />
        <div>
          {limited ? (
            <div className="rounded-3xl bg-espresso p-10 text-center text-paper">
              <Lock className="mx-auto size-8 text-brass-light" strokeWidth={1.4} />
              <h2 className="display mt-4 text-3xl">Unlock unlimited AI-powered searches</h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-paper/60">
                The Free plan includes {plan.limits.textSearchesPerMonth} project searches per month. You can keep browsing by skills and materials, or upgrade to Pro for unlimited searches, full profiles and direct messaging.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <ButtonLink href={user ? "/pricing" : "/register"} variant="light">
                  {user ? "See plans" : "Create a free account"}
                </ButtonLink>
                <ButtonLink href="/search" variant="secondary" className="border-paper/40 text-paper hover:bg-paper hover:text-ink">
                  Browse by expertise
                </ButtonLink>
              </div>
            </div>
          ) : results.length === 0 ? (
            <EmptyState icon={<Sparkles className="size-8" strokeWidth={1.3} />} title="No maker matches yet" action={<ButtonLink href="/search" variant="secondary">Reset the search</ButtonLink>}>
              Try fewer filters, a broader location or different words. You can also{" "}
              <Link href="/dashboard/projects/new" className="text-ink underline">
                describe your project in detail
              </Link>{" "}
              and we&apos;ll match it for you.
            </EmptyState>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:gap-x-6">
              {results.map((r, i) => (
                <MakerCard key={r.id} maker={{ ...r, match: hasCriteria ? r.match : undefined }} priority={i < 3} source={source} />
              ))}
            </div>
          )}
          {!user && !limited && results.length > 0 && (
            <div className="mt-16 flex flex-col items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-6 sm:flex-row">
              <p className="text-sm text-ink-soft">Create a free account to contact makers, save your favourites and follow your projects.</p>
              <ButtonLink href="/register" size="sm">
                Join SEFIKH — it&apos;s free
              </ButtonLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
