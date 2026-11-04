import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { fromBytes } from "@/lib/images";
import { getPlan } from "@/lib/plans";
import { findRecentSearch, logSearch, runSearch, searchesUsed, type SearchInput, type SearchMode } from "@/lib/search";
import { fileUrl, parseList } from "@/lib/utils";
import { visitorId } from "@/lib/visitor";
import { FilterBar, SortSelect } from "@/components/search/filters";
import { SearchPanel } from "@/components/search/search-panel";
import { MakerCard } from "@/components/makers/maker-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { anonymize, canSeeMakers } from "@/lib/access";
import { getT } from "@/i18n/server";
import { translateText } from "@/lib/ai";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return {
  title: tr("Explore makers"),
  description: tr("Search artisans, workshops and manufacturers by project, image, skills, materials and location."),
};
}

const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const tr = await getT();
  const sp = await searchParams;
  const [user, vid] = await Promise.all([getCurrentUser(), visitorId()]);
  // La recherche est réservée aux comptes : 3 recherches gratuites par compte.
  if (!user) redirect("/register?reason=search");
  const who = { userId: user.id, visitorId: vid };
  const plan = getPlan(user.plan);

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
    months: list(sp.months)?.map(Number).filter((m) => m >= 1 && m <= 12),
    sort: (one(sp.sort) as SearchInput["sort"]) ?? "relevance",
  };

  // Recherche par image : on retrouve l'empreinte calculée lors du dépôt.
  let imageSearch: { id: string; imageKey: string | null } | null = null;
  if (imageId) {
    const log = await db.searchLog.findUnique({ where: { id: imageId } });
    if (log && log.mode === "IMAGE" && log.userId === user.id) {
      imageSearch = { id: log.id, imageKey: log.imageKey };
      input.imageEmbedding = fromBytes(log.embedding);
      if (!input.imageEmbedding && log.query) input.imageColors = parseList<number>(log.query);
    }
  }

  // Quota mensuel, tous modes confondus (offre gratuite et visiteurs). Une recherche par image est décomptée au dépôt.
  const hasCriteria = !!(q || imageSearch || input.skills?.length || input.materials?.length || input.techniques?.length || input.sectors?.length || input.near);
  const mode: SearchMode = imageSearch ? "IMAGE" : q ? "TEXT" : "FILTER";
  const logKey = mode === "TEXT" ? q! : JSON.stringify([q, input.near, input.skills, input.materials, input.techniques, input.sectors]);
  let limited = false;
  if (hasCriteria && !imageSearch && Number.isFinite(plan.limits.freeSearches)) {
    const already = await findRecentSearch(who, mode, logKey);
    if (!already && (await searchesUsed(user.id)) >= plan.limits.freeSearches) limited = true;
  }

  // La recherche comprend l'anglais et le français ; les autres langues passent par la traduction automatique.
  if (q && !["en", "fr"].includes(tr.locale)) input.q = await translateText(q, "en").catch(() => q);

  const { results, detected, usedVisualAI } = limited ? { results: [], detected: { tags: [], city: null, country: null }, usedVisualAI: false } : await runSearch(input);

  // Journalisation (statistiques marché + impressions), sans double comptage des rechargements.
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
      if (!(await findRecentSearch(who, mode, logKey))) {
        await logSearch({ ...who, mode, query: logKey, terms: [...new Set(terms)], location: detected.city ?? detected.country, results });
      }
    }
  }

  const access = canSeeMakers(user);
  const shown = access ? results : results.map(anonymize);
  const source = imageSearch ? "IMAGE" : hasCriteria ? "SEARCH" : undefined;
  const chips = [
    ...detected.tags.map((t) => t.name),
    ...(detected.city ? [detected.city] : detected.country ? [detected.country] : []),
  ];

  return (
    <div className="container-x pb-24 pt-8">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="folio flex flex-wrap items-center gap-3">
            {imageSearch ? tr("Visual search") : q ? tr("Project search") : tr("Explore expertise")}
            {usedVisualAI && <span className="text-brass">{tr("AI visual matching")}</span>}
          </p>
          <h1 className="display mt-3 text-4xl sm:text-[3.4rem]">
            {limited
              ? tr("You've used your free searches")
              : hasCriteria
                ? tr(imageSearch ? (results.length === 1 ? "Here is 1 maker matching your reference." : "Here are {count} makers matching your reference.") : results.length === 1 ? "Here is 1 maker matching your project requirements." : "Here are {count} makers matching your project requirements.", { count: results.length })
                : tr("{length} makers, workshops and manufacturers", { length: results.length })}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            {imageSearch?.imageKey && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fileUrl(imageSearch.imageKey)!} alt={tr("Your reference")} className="size-14 object-cover" />
            )}
            {q && <p className="line-clamp-1 max-w-xl font-display text-xl italic text-muted">“{q}”</p>}
            {chips.map((c) => (
              <span key={c} className="folio">
                {tr(c)}
              </span>
            ))}
          </div>
        </div>
        <div className="lg:col-span-5">
          <SearchPanel compact initial={{ q, near: input.near }} />
        </div>
      </div>

      <div className="mt-10">
        <FilterBar locked={!access} />
        <div className="flex justify-end pt-3">
          <SortSelect />
        </div>
      </div>

      <div className="mt-6">
        {limited ? (
          <div className="border border-line bg-paper p-10 text-center sm:p-16">
            <Lock className="mx-auto size-6 text-muted" strokeWidth={1.2} />
            <h2 className="display mt-4 text-4xl">{tr("Unlock unlimited AI-powered searches")}</h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-muted">{tr("The Free plan includes {limit} searches in total. Upgrade to Pro for unlimited searches, the names of makers and direct messaging.", { limit: plan.limits.freeSearches })}</p>
            <ButtonLink href="/pricing" className="mt-7">
              {tr("See plans")}
            </ButtonLink>
          </div>
        ) : results.length === 0 ? (
          <EmptyState title={tr("No maker matches yet")} action={<ButtonLink href="/search" variant="secondary">{tr("Reset the search")}</ButtonLink>}>
            {tr("Try fewer filters, a broader location or different words. You can also")}{" "}
            <Link href="/dashboard/projects/new" className="text-ink underline">
              {tr("describe your project in detail")}
            </Link>{" "}
            {tr("and we'll match it for you.")}
          </EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-3">
            {shown.map((r, i) => (
              <MakerCard key={r.id} maker={{ ...r, match: hasCriteria ? r.match : undefined }} priority={i < 3} source={source} />
            ))}
          </div>
        )}
        {!access && !limited && results.length > 0 && (
          <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
            <p className="max-w-xl text-[15px] text-ink-soft">{tr("Names and contact details are reserved for Pro and Studio plans. Choose a plan to discover these makers and write to them.")}</p>
            <ButtonLink href="/pricing" size="sm">
              {tr("See plans")}
            </ButtonLink>
          </div>
        )}
      </div>
    </div>
  );
}
