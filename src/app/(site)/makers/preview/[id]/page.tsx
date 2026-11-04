import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { BadgeCheck, Globe, Lock, MapPin } from "lucide-react";
import { AvailabilityCalendar } from "@/components/makers/availability";
import { ButtonLink } from "@/components/ui/button";
import { canSeeMakers, LISTED_COMPANY } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth/session";
import { COMPANY_KINDS, TAG_KIND_LABEL, type TagKind } from "@/lib/constants";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { fileUrl, parseList } from "@/lib/utils";
import { getT } from "@/i18n/server";

const PREVIEW_PHOTOS = 4;

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Maker profile"), robots: { index: false } };
}

/**
 * Fiche anonyme d'un compte gratuit : uniquement ce qui ne permet pas d'identifier l'entreprise.
 * Les textes libres (présentation, accroche, titres de réalisations) peuvent contenir le nom : ils ne sont pas envoyés.
 */
export default async function MakerPreviewPage({ params, searchParams }: PageProps<"/makers/preview/[id]">) {
  const tr = await getT();
  const user = await getCurrentUser();
  if (!user) redirect("/register?reason=search");

  const { id } = await params;
  const { src } = await searchParams;
  const company = await db.company.findFirst({
    where: { id, ...LISTED_COMPANY },
    select: {
      id: true,
      slug: true,
      userId: true,
      kind: true,
      city: true,
      country: true,
      verified: true,
      operationAreas: true,
      availability: true,
      leadTimeMin: true,
      leadTimeMax: true,
      tags: { select: { tag: { select: { kind: true, name: true } } } },
      portfolio: { orderBy: { position: "asc" }, take: PREVIEW_PHOTOS, select: { id: true, key: true, thumbKey: true } },
    },
  });
  if (!company) notFound();
  if (canSeeMakers(user) || company.userId === user.id) redirect(`/makers/${company.slug}`);

  if (rateLimit(`pv:${company.id}:${user.id}`, 1, 30 * 60_000).ok) {
    await db.profileView.create({ data: { companyId: company.id, viewerId: user.id, source: src === "IMAGE" || src === "SEARCH" ? src : "DIRECT" } });
  }

  const kind = COMPANY_KINDS.find((k) => k.value === company.kind)?.label ?? company.kind;
  const byKind = (k: TagKind) => company.tags.filter((t) => t.tag.kind === k).map((t) => t.tag.name);
  const areas = parseList(company.operationAreas);
  const availability = parseList<number>(company.availability);

  return (
    <div className="container-x py-12">
      <header className="flex flex-col gap-6 border-b border-line pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">{tr("Anonymous preview")}</p>
          <h1 className="display mt-3 flex items-center gap-3 text-6xl sm:text-7xl">
            {tr(kind)}
            {company.verified && <BadgeCheck className="size-6 text-brass" strokeWidth={1.6} aria-label={tr("Verified maker")} />}
          </h1>
          <p className="folio mt-3 flex items-center gap-1.5">
            <MapPin className="size-4" strokeWidth={1.6} />
            {[company.city, company.country].filter(Boolean).join(", ")}
          </p>
        </div>
        <div className="max-w-sm border-l border-brass pl-5">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Lock className="size-4" strokeWidth={1.6} />
            {tr("Name reserved for Pro and Studio plans")}
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{tr("Upgrade to see this maker's name, full portfolio and contact details, and to write to them.")}</p>
          <ButtonLink href="/pricing" size="sm" className="mt-4">
            {tr("See plans")}
          </ButtonLink>
        </div>
      </header>

      {company.portfolio.length > 0 && (
        <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {company.portfolio.map((p) => (
            <div key={p.id} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand">
              <Image src={fileUrl(p.thumbKey ?? p.key)!} alt="" fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover" />
            </div>
          ))}
        </section>
      )}

      <section className="mt-12 grid gap-12 lg:grid-cols-2">
        <div className="space-y-8">
          {(["SKILL", "MATERIAL", "TECHNIQUE", "SECTOR"] as TagKind[]).map((k) =>
            byKind(k).length ? (
              <div key={k}>
                <h2 className="display text-2xl">{tr(TAG_KIND_LABEL[k])}</h2>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {byKind(k).map((n) => (
                    <span key={n} className="border border-line px-2.5 py-1 text-[13px]">
                      {tr(n)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null,
          )}
        </div>
        <div className="space-y-8">
          {availability.length > 0 && (
            <div>
              <h2 className="display text-2xl">{tr("Availability this year")}</h2>
              <div className="mt-4">
                <AvailabilityCalendar months={availability} />
              </div>
            </div>
          )}
          {company.leadTimeMin != null && (
            <p className="text-sm">
              <span className="text-muted">{tr("Lead time:")}</span> {tr("{min}–{max} months", { min: company.leadTimeMin, max: company.leadTimeMax ?? company.leadTimeMin })}
            </p>
          )}
          {areas.length > 0 && (
            <div>
              <h2 className="display text-2xl">{tr("Areas of operation")}</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {areas.map((a) => (
                  <span key={a} className="flex items-center gap-1.5 bg-sand px-2.5 py-1 text-[13px]">
                    <Globe className="size-3.5 text-muted" /> {tr(a)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
