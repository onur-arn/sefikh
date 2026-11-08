import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BadgeCheck, Building2, CalendarClock, Globe, Lock, Mail, MapPin, Phone, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { COMPANY_KINDS, TAG_KIND_LABEL, type TagKind } from "@/lib/constants";
import { cosine, fromBytes } from "@/lib/images";
import { getPlan } from "@/lib/plans";
import { rateLimit } from "@/lib/rate-limit";
import { fileUrl, parseList } from "@/lib/utils";
import { visitorId } from "@/lib/visitor";
import { AccordionItem } from "@/components/makers/accordion";
import { AvailabilityCalendar } from "@/components/makers/availability";
import { ContactButton, SaveButton, ShareButton } from "@/components/makers/maker-actions";
import { MakerCard } from "@/components/makers/maker-card";
import { PortfolioGallery } from "@/components/makers/portfolio-gallery";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { AutoTranslate } from "@/components/translate/auto-translate";
import { canSeeMakers, hasListedPlan, LISTED_COMPANY } from "@/lib/access";
import { getT } from "@/i18n/server";

async function getCompany(slug: string) {
  return db.company.findUnique({
    where: { slug },
    include: {
      user: { select: { plan: true, id: true } },
      tags: { include: { tag: true } },
      portfolio: { orderBy: { position: "asc" } },
    },
  });
}

export async function generateMetadata({ params }: PageProps<"/makers/[slug]">): Promise<Metadata> {
  const tr = await getT();
  const { slug } = await params;
  const [c, viewer] = await Promise.all([getCompany(slug), getCurrentUser()]);
  if (!c) return { title: tr("Maker not found") };
  if (!canSeeMakers(viewer) && c.userId !== viewer?.id) return { title: tr("Maker profile"), robots: { index: false } };
  const cover = c.portfolio[0];
  return {
    title: `${c.name} — ${c.tagline ?? tr("Maker")}`,
    description: c.about?.slice(0, 160) ?? undefined,
    openGraph: { images: cover ? [{ url: fileUrl(cover.thumbKey ?? cover.key)!, width: cover.width, height: cover.height }] : undefined },
    alternates: { canonical: `/makers/${c.slug}` },
  };
}

/** Makers visuellement proches : similarité moyenne des portfolios (CLIP). */
async function similarMakers(company: NonNullable<Awaited<ReturnType<typeof getCompany>>>) {
  const mine = company.portfolio.map((p) => fromBytes(p.embedding)).filter(Boolean) as Float32Array[];
  const others = await db.company.findMany({
    where: { ...LISTED_COMPANY, NOT: { id: company.id } },
    include: { portfolio: { orderBy: { position: "asc" }, select: { key: true, thumbKey: true, width: true, height: true, title: true, embedding: true } } },
  });
  return others
    .map((o) => {
      let best = 0;
      for (const p of o.portfolio) {
        const e = fromBytes(p.embedding);
        if (e) for (const m of mine) best = Math.max(best, cosine(m, e));
      }
      return { o, best };
    })
    .sort((a, b) => b.best - a.best)
    .slice(0, 4)
    .map(({ o }) => o);
}

/** Sans offre payante : aucune donnée du maker n'est envoyée au navigateur. */
async function LockedMaker() {
  const tr = await getT();
  return (
    <div className="container-x flex min-h-[60vh] items-center justify-center py-20">
      <div className="max-w-md border border-line bg-paper p-10 text-center">
        <Lock className="mx-auto size-7 text-muted" strokeWidth={1.4} />
        <h1 className="display mt-4 text-3xl">{tr("Create an account to continue")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{tr("Names and contact details are reserved for Pro and Studio plans. Choose a plan to discover these makers and write to them.")}</p>
        <ButtonLink href="/subscription" className="mt-6">
          {tr("Choose your monthly subscription")}
        </ButtonLink>
      </div>
    </div>
  );
}

export default async function MakerPage({ params, searchParams }: PageProps<"/makers/[slug]">) {
  const tr = await getT();
  const { slug } = await params;
  const { src } = await searchParams;
  const company = await getCompany(slug);
  const user = await getCurrentUser();
  const isOwner = !!user && company?.userId === user.id;
  const listed = !!company?.published && hasListedPlan(company.user.plan);
  if (!company || (!listed && !isOwner)) notFound();
  if (!isOwner && !canSeeMakers(user)) {
    if (user) redirect(`/makers/preview/${company.id}`);
    return <LockedMaker />;
  }

  // Statistiques de vues (hors propriétaire), dédoublonnées sur 30 min.
  const vid = await visitorId();
  if (!isOwner && rateLimit(`pv:${company.id}:${user?.id ?? vid}`, 1, 30 * 60_000).ok) {
    const source = src === "IMAGE" || src === "SEARCH" ? src : "DIRECT";
    await db.profileView.create({ data: { companyId: company.id, viewerId: user?.id ?? null, source } });
  }

  const [saved, projects, similar] = await Promise.all([
    user ? db.savedCompany.findUnique({ where: { userId_companyId: { userId: user.id, companyId: company.id } } }) : null,
    user?.role === "CLIENT" ? db.project.findMany({ where: { ownerId: user.id, status: "ACTIVE" }, select: { id: true, title: true }, orderBy: { updatedAt: "desc" } }) : [],
    similarMakers(company),
  ]);

  const plan = getPlan(company.user.plan);
  const viewerPlan = getPlan(user?.plan ?? "CLIENT_FREE");
  const canSeeContact = isOwner || (user != null && viewerPlan.limits.seeContactDetails);
  const viewer = { loggedIn: !!user, role: user?.role ?? null, verified: !!user?.emailVerifiedAt, canSave: viewerPlan.limits.savedLibrary };
  const byKind = (k: TagKind) => company.tags.filter((t) => t.tag.kind === k).map((t) => t.tag.name);
  const areas = parseList(company.operationAreas);
  const keywords = parseList(company.keywords);
  const availability = parseList<number>(company.availability);
  const kind = COMPANY_KINDS.find((k) => k.value === company.kind)?.label ?? company.kind;
  const cover = company.portfolio[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: company.name,
    description: company.about,
    image: cover ? fileUrl(cover.key) : undefined,
    address: { "@type": "PostalAddress", addressLocality: company.city, addressCountry: company.country },
    knowsAbout: company.tags.map((t) => t.tag.name),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {isOwner && !listed && (
        <div className="bg-brass-light py-3 text-center text-sm text-brass-dark">
          {tr("Preview — your profile is not published yet.")}{" "}
          <Link href="/dashboard/profile" className="font-semibold underline">
            {tr("Complete and publish it")}</Link>
        </div>
      )}

      {/* ── En-tête ─────────────────────────────── */}
      <section className="container-x pt-10">
        <nav className="folio" aria-label={tr("Breadcrumb")}>
          <Link href="/search" className="hover:text-ink">
            {tr("Explore")}</Link>
          / <span className="text-ink-soft">{company.name}</span>
        </nav>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{tr(kind)}</Badge>
              {company.verified && (
                <Badge tone="brass">
                  <BadgeCheck className="size-3" /> {" "}{tr("Verified")}</Badge>
              )}
              {plan.id === "PRO_FOUNDING" && <Badge tone="dark">{tr("Founding Partner")}</Badge>}
            </div>
            <h1 className="display mt-4 text-5xl sm:text-7xl lg:text-[6rem]">{company.name}</h1>
            {company.tagline && <AutoTranslate kind="company" id={company.id} field="tagline" text={company.tagline} className="mt-3 font-display text-2xl italic text-muted" />}
            <div className="folio mt-5 flex flex-wrap gap-x-6 gap-y-2">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4 text-muted" /> {[company.city, company.country].filter(Boolean).join(", ")}
              </span>
              {company.foundedYear && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="size-4 text-muted" /> {" "}{tr("Since {foundedYear}", { foundedYear: company.foundedYear })}
                </span>
              )}
              {company.teamSize && (
                <span className="flex items-center gap-1.5">
                  <Users className="size-4 text-muted" /> {tr("{teamSize} people", { teamSize: company.teamSize })}</span>
              )}
              {company.leadTimeMin != null && (
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="size-4 text-muted" /> {" "}{tr("Lead time {leadTimeMin}–", { leadTimeMin: company.leadTimeMin })}{company.leadTimeMax ?? company.leadTimeMin} {" "}{tr("months")}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOwner ? (
              <ButtonLink href="/dashboard/profile" size="lg" variant="secondary">
                {tr("Edit my profile")}</ButtonLink>
            ) : (
              <>
                <ShareButton name={company.name} />
                <SaveButton companyId={company.id} initialSaved={!!saved} viewer={viewer} />
                <ContactButton company={{ id: company.id, name: company.name, slug: company.slug }} viewer={viewer} projects={projects} />
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Couverture ─────────────────────────────── */}
      {cover && (
        <section className="container-x mt-10">
          <div className="grid h-[320px] gap-3 sm:h-[440px] sm:grid-cols-[2fr_1fr]">
            <div className="relative overflow-hidden bg-sand">
              <Image src={fileUrl(cover.key)!} alt={cover.title ?? company.name} fill priority sizes="(min-width:640px) 66vw, 100vw" className="object-cover" />
            </div>
            <div className="hidden grid-rows-2 gap-3 sm:grid">
              {company.portfolio.slice(1, 3).map((p) => (
                <div key={p.id} className="relative overflow-hidden bg-sand">
                  <Image src={fileUrl(p.thumbKey ?? p.key)!} alt={p.title ?? ""} fill sizes="33vw" className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Contenu ─────────────────────────────── */}
      <section className="container-x grid gap-14 py-16 lg:grid-cols-[360px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border-t border-line">
            <AccordionItem title={tr("Skills, materials and techniques")} defaultOpen>
              <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1">
                {(["SKILL", "MATERIAL", "TECHNIQUE"] as TagKind[]).map((k) =>
                  byKind(k).length ? (
                    <div key={k}>
                      <p className="mb-2 font-display text-xl">{tr(TAG_KIND_LABEL[k])}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {byKind(k).map((n) => (
                          <Link key={n} href={`/search?${k === "SKILL" ? "skills" : k === "MATERIAL" ? "materials" : "techniques"}=${encodeURIComponent(n)}`} className="rounded-sm border border-line bg-paper px-3 py-1 text-[12.5px] hover:border-ink/40">
                            {tr(n)}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null,
                )}
              </div>
            </AccordionItem>
            <AccordionItem title={tr("Project sectors")}>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1 font-display text-xl">
                {byKind("SECTOR").map((s) => (
                  <li key={s}>{tr(s)}</li>
                ))}
              </ul>
            </AccordionItem>
            <AccordionItem title={tr("Areas of operation")}>
              <p className="text-sm text-muted">{tr("Based in")}{" "}{company.city ?? company.country}{tr(". Delivers and installs in:")}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {areas.map((a) => (
                  <span key={a} className="flex items-center gap-1.5 rounded-sm bg-sand px-3 py-1 text-[12.5px]">
                    <Globe className="size-3.5 text-muted" /> {tr(a)}
                  </span>
                ))}
              </div>
            </AccordionItem>
            <AccordionItem title={tr("Production capabilities")}>
              {company.productionCapacity && <AutoTranslate kind="company" id={company.id} field="productionCapacity" text={company.productionCapacity} className="text-sm leading-relaxed text-ink-soft" />}
              {company.leadTimeMin != null && (
                <p className="mt-3 text-sm">
                  <span className="text-muted">{tr("Lead time:")}</span> {company.leadTimeMin}–{company.leadTimeMax ?? company.leadTimeMin} {" "}{tr("months")}</p>
              )}
              {availability.length > 0 && (
                <div className="mt-5">
                  <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.15em] text-muted">{tr("Availability this year")}</p>
                  <AvailabilityCalendar months={availability} />
                </div>
              )}
            </AccordionItem>
          </div>

          <div className="mt-8 rounded-2xl border border-line bg-paper p-6">
            <p className="text-sm font-semibold">{tr("Contact details")}</p>
            {canSeeContact ? (
              <ul className="mt-4 space-y-2.5 text-sm">
                {company.publicEmail && (
                  <li className="flex items-center gap-2.5">
                    <Mail className="size-4 text-muted" />
                    <a href={`mailto:${company.publicEmail}`} className="hover:underline">
                      {company.publicEmail}
                    </a>
                  </li>
                )}
                {company.phone && (
                  <li className="flex items-center gap-2.5">
                    <Phone className="size-4 text-muted" />
                    <a href={`tel:${company.phone.replace(/\s/g, "")}`} className="hover:underline">
                      {company.phone}
                    </a>
                  </li>
                )}
                {company.website && (
                  <li className="flex items-center gap-2.5">
                    <Globe className="size-4 text-muted" />
                    <a href={company.website} target="_blank" rel="noopener noreferrer nofollow" className="truncate hover:underline">
                      {company.website.replace(/^https?:\/\//, "")}
                    </a>
                  </li>
                )}
              </ul>
            ) : (
              <div className="mt-4">
                <div className="space-y-2 blur-[3px] select-none" aria-hidden>
                  <p className="text-sm">{tr("contact@atelier.example")}</p>
                  <p className="text-sm">+33 0 00 00 00 00</p>
                </div>
                <p className="mt-4 flex items-start gap-2 text-[13px] text-muted">
                  <Lock className="mt-0.5 size-3.5 shrink-0" /> {" "}{tr("Full contact details are available with the Pro plan. You can still send a message.")}</p>
                <Link href={user ? "/subscription" : "/register"} className="mt-3 inline-block text-[13px] font-medium text-brass-dark underline-offset-4 hover:underline">
                  {user ? tr("Upgrade to Pro") : tr("Create an account")} →
                </Link>
              </div>
            )}
          </div>
        </aside>

        <div>
          <p className="eyebrow">{tr("About")}</p>
          <div className="mt-4 max-w-3xl text-[16px] leading-[1.75] text-ink-soft">
            {company.about && <AutoTranslate kind="company" id={company.id} field="about" text={company.about} paragraphClassName="mt-4" />}
          </div>
          {keywords.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-1.5">
              {keywords.map((k) => (
                <span key={k} className="rounded-sm bg-brass-light/60 px-3 py-1 text-[12.5px] text-brass-dark">
                  {tr(k)}
                </span>
              ))}
            </div>
          )}

          <div className="mt-16 flex items-end justify-between">
            <h2 className="display text-4xl">{tr("Projects & portfolio")}</h2>
            <span className="text-sm text-muted">{tr("{length} pieces", { length: company.portfolio.length })}</span>
          </div>
          <div className="mt-8">
            <PortfolioGallery items={company.portfolio.map(({ id, key, thumbKey, width, height, title, description, projectName, location, year }) => ({ id, key, thumbKey, width, height, title, description, projectName, location, year }))} companyName={company.name} />
          </div>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="border-t border-line bg-paper py-20">
          <div className="container-x">
            <p className="eyebrow">{tr("Visually similar")}</p>
            <h2 className="display mt-3 text-4xl">{tr("You may also like")}</h2>
            <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:gap-x-6">
              {similar.map((o) => (
                <MakerCard
                  key={o.id}
                  maker={{ ...o, availability: parseList<number>(o.availability), image: o.portfolio[0] ? { key: o.portfolio[0].thumbKey ?? o.portfolio[0].key, width: o.portfolio[0].width, height: o.portfolio[0].height, title: o.portfolio[0].title } : null }}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
