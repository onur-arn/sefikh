import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Hammer, MessageSquareText, ScanSearch, Sparkles, ChevronDown } from "lucide-react";
import { db } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { currentQuarter, marketKpis } from "@/lib/stats";
import { fileUrl, parseList } from "@/lib/utils";
import { IntroSlideshow } from "@/components/layout/intro-slideshow";
import { OpenSearchButton } from "@/components/layout/open-search-button";
import { MakerCard } from "@/components/makers/maker-card";
import { ButtonLink } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/misc";
import { anonymize, canSeeMakers, LISTED_COMPANY } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth/session";
import { getT } from "@/i18n/server";

const CRAFTS = [
  { tag: "Metalwork", param: "skills", label: "Metal & Brass", copy: "Patinated brass, bronze casting, forged steel" },
  { tag: "Cabinetmaking", param: "skills", label: "Cabinetmaking", copy: "Burl veneers, joinery, bespoke furniture" },
  { tag: "Leather", param: "materials", label: "Leather", copy: "Wall panels, tufting, saddlery" },
  { tag: "Natural stone", param: "materials", label: "Stone & Marble", copy: "Onyx, travertine, sculpted marble" },
  { tag: "Upholstery", param: "skills", label: "Upholstery", copy: "Velvet, bouclé, custom seating" },
  { tag: "Ceramics", param: "skills", label: "Ceramics & Tiles", copy: "Zellige, glazed tiles, terracotta" },
];

async function getHomeData() {
  const companies = await db.company.findMany({
    where: LISTED_COMPANY,
    include: { user: { select: { plan: true } }, tags: { include: { tag: true } }, portfolio: { orderBy: { position: "asc" }, take: 3 } },
    orderBy: { updatedAt: "desc" },
  });
  const featured = [...companies]
    .sort((a, b) => Number(getPlan(b.user.plan).limits.featured) - Number(getPlan(a.user.plan).limits.featured) || Number(b.verified) - Number(a.verified))
    .slice(0, 8);
  const crafts = CRAFTS.map((c) => {
    const withTag = companies.filter((co) => co.tags.some((t) => t.tag.name === c.tag) && co.portfolio.length);
    const img = withTag[0]?.portfolio[0];
    return { ...c, count: withTag.length, image: img ? img.thumbKey ?? img.key : null };
  });
  const [kpis, portfolioCount, countries] = await Promise.all([
    marketKpis(currentQuarter()),
    db.portfolioImage.count(),
    db.company.groupBy({ by: ["country"], where: LISTED_COMPANY }).then((r) => r.length),
  ]);
  return { featured, crafts, kpis, portfolioCount, countries, makers: companies.length };
}

export default async function HomePage() {
  const tr = await getT();
  const [{ featured, crafts, kpis, portfolioCount, countries, makers }, user] = await Promise.all([getHomeData(), getCurrentUser()]);
  const access = canSeeMakers(user);

  return (
    <>
      {/* ── Ouverture : image plein écran, le site commence au défilement ── */}
      <section className="relative -mt-[68px] h-dvh overflow-hidden bg-espresso">
        <IntroSlideshow />
        <a href="#site" className="absolute inset-x-0 bottom-14 z-10 flex flex-col items-center gap-2 text-paper">
          <span className="text-[12px] uppercase tracking-[0.22em]">{tr("Search Engine For Know-How")}</span>
          <ChevronDown className="size-5 animate-bounce" strokeWidth={1.5} aria-hidden />
        </a>
      </section>

      {/* ── Le site ────────────────────────────────────────── */}
      <section id="site" className="container-x scroll-mt-[68px] pt-8">
        <div className="relative h-[38vh] min-h-64 overflow-hidden rounded-[2rem] sm:h-[46vh]">
          <Image src="/images/hero-drape.webp" alt="" fill sizes="100vw" className="object-cover object-[50%_62%]" />
        </div>
        <div className="mx-auto max-w-3xl pb-16 pt-9 text-center">
          <p className="eyebrow">{tr("The sourcing platform for interior professionals")}</p>
          <h1 className="mt-3 text-[1.7rem] font-semibold leading-tight tracking-tight sm:text-4xl">{tr("From inspiration to realization.")}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">{tr("Find the right skills, materials and makers to bring your ideas to life.")}</p>
          <OpenSearchButton />
          <p className="mt-5 text-[12px] tracking-[0.14em] text-muted uppercase">{tr("Artisans · Workshops · Manufacturers · Materials")}</p>
        </div>
      </section>

      {/* ── Chiffres ───────────────────────────────────────── */}
      <section className="border-y border-line bg-paper">
        <div className="container-x grid grid-cols-2 divide-line py-8 md:grid-cols-4 md:divide-x">
          {[
            [tr.number(makers), tr("Curated makers")],
            [tr.number(countries), tr("Countries")],
            [tr.number(portfolioCount), tr("Portfolio pieces")],
            ["0%", tr("Commission on projects")],
          ].map(([n, l]) => (
            <div key={l} className="px-2 py-3 text-center md:px-6">
              <p className="display text-4xl sm:text-5xl">{n}</p>
              <p className="mt-1 text-[12px] uppercase tracking-[0.18em] text-muted">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Savoir-faire ───────────────────────────────────── */}
      <section className="container-x py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionTitle eyebrow={tr("Explore by craft")} title={tr("Know-how, organised.")}>
            {tr("Browse a curated vocabulary of skills, materials and techniques used by the best workshops.")}</SectionTitle>
          <Link href="/search" className="link-underline inline-flex items-center gap-1.5 text-sm font-medium">
            {tr("All expertise")}{" "}<ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
          {crafts.map((c) => (
            <Link key={c.label} href={`/search?${c.param}=${encodeURIComponent(c.tag)}`} className="grain group relative aspect-[4/3] overflow-hidden rounded-2xl bg-espresso">
              {c.image && <Image src={fileUrl(c.image)!} alt="" fill sizes="(min-width:768px) 33vw, 50vw" className="object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-65" />}
              <div className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-paper sm:p-6">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h3 className="display text-2xl sm:text-3xl">{tr(c.label)}</h3>
                    <p className="mt-1 hidden text-[13px] text-paper/70 sm:block">{tr(c.copy)}</p>
                  </div>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-paper/30 transition group-hover:bg-paper group-hover:text-ink">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Makers à la une ────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="bg-paper py-24">
          <div className="container-x">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionTitle eyebrow={tr("Featured makers")} title={tr("Ateliers worth knowing.")} />
              <ButtonLink href="/search" variant="secondary" size="sm">
                {tr("Explore all makers")}</ButtonLink>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
              {featured.map((c, i) => {
                const maker = {
                    ...c,
                    featured: getPlan(c.user.plan).limits.featured,
                    availability: parseList<number>(c.availability),
                    image: c.portfolio[0] ? { key: c.portfolio[0].thumbKey ?? c.portfolio[0].key, width: c.portfolio[0].width, height: c.portfolio[0].height, title: c.portfolio[0].title } : null,
                    gallery: c.portfolio.slice(1).map((p) => p.thumbKey ?? p.key),
                };
                return <MakerCard key={i} priority={i < 4} maker={access ? maker : anonymize(maker, i)} />;
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Comment ça marche ──────────────────────────────── */}
      <section className="container-x py-24">
        <SectionTitle eyebrow={tr("One platform, two ways to use it")} title={tr("Made for those who imagine — and those who make.")} className="mx-auto text-center" />
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {[
            {
              who: tr("For creatives"),
              title: tr("Identify · Source · Save · Connect"),
              steps: [
                [Sparkles, tr("Describe your project"), tr("Write it in your own words: our engine understands materials, techniques, sectors and places.")],
                [ScanSearch, tr("Search with a picture"), tr("Drop a moodboard image and discover makers whose portfolio looks alike.")],
                [MessageSquareText, tr("Talk directly to makers"), tr("Share plans and references in a dedicated project inbox — no middleman, no commission.")],
              ],
              cta: [tr("Start a project"), "/register"],
            },
            {
              who: tr("For makers"),
              title: tr("Showcase your craft. Get discovered."),
              steps: [
                [Hammer, tr("Create your business profile"), tr("Skills, materials, production capacities, lead times and areas of operation.")],
                [ScanSearch, tr("Publish your portfolio"), tr("Every picture you upload becomes searchable by image and by description.")],
                [MessageSquareText, tr("Receive qualified requests"), tr("Architects and designers reach you with a clear brief, budget and timeline.")],
              ],
              cta: [tr("Join as a maker"), "/join"],
            },
          ].map((col, idx) => (
            <div key={col.who} className={idx === 0 ? "rounded-[1.75rem] border border-line bg-paper p-8 sm:p-10" : "rounded-[1.75rem] border border-line bg-sand p-8 text-paper sm:p-10"}>
              <p className={idx === 0 ? "eyebrow" : "eyebrow"}>{tr(col.who)}</p>
              <h3 className="display mt-3 text-3xl sm:text-4xl">{tr(col.title)}</h3>
              <ol className="mt-8 space-y-6">
                {col.steps.map(([Icon, t, d], i) => {
                  const I = Icon as typeof Sparkles;
                  return (
                    <li key={t as string} className="flex gap-4">
                      <span className={idx === 0 ? "flex size-11 shrink-0 items-center justify-center rounded-full bg-ivory text-brass" : "flex size-11 shrink-0 items-center justify-center rounded-full bg-paper/10 text-brass-light"}>
                        <I className="size-5" strokeWidth={1.5} />
                      </span>
                      <div>
                        <p className="text-[15px] font-semibold">
                          <span className="mr-2 font-display text-brass">0{i + 1}</span>
                          {t as string}
                        </p>
                        <p className={idx === 0 ? "mt-1 text-sm leading-relaxed text-muted" : "mt-1 text-sm leading-relaxed text-muted"}>{d as string}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <ButtonLink href={col.cta[1]!} variant="primary" className="mt-9">
                {col.cta[0]} <ArrowRight className="size-4" />
              </ButtonLink>
            </div>
          ))}
        </div>
      </section>

      {/* ── Rejoindre (pros) ───────────────────────────────── */}
      <section className="container-x pb-24">
        <div className="grid overflow-hidden rounded-[2rem] bg-sand lg:grid-cols-[1fr_1.1fr]">
          <div className="grid grid-cols-2 gap-1.5 p-1.5">
            <div className="relative min-h-72 overflow-hidden rounded-[1.6rem]">
              <Image src="/images/join-1.webp" alt={tr("A cabinetmaker's hands planing wood")} fill sizes="25vw" className="object-cover" />
            </div>
            <div className="relative min-h-72 overflow-hidden rounded-[1.6rem]">
              <Image src="/images/join-2.webp" alt={tr("Hand carving a stone and timber sculpture")} fill sizes="25vw" className="object-cover" />
            </div>
          </div>
          <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
            <p className="eyebrow">{tr("Showcase your craft. Get discovered.")}</p>
            <h2 className="display mt-4 text-4xl sm:text-5xl">{tr("Create your business profile.")}</h2>
            <p className="mt-5 max-w-md leading-relaxed text-ink-soft">
              {tr("Join SEFIKH and connect with architects, designers and creative professionals looking for unique skills, materials and expertise.")}</p>
            <p className="mt-4 font-display text-xl italic text-muted">{tr("Tell us about your skills, materials and capabilities — it only takes a few minutes.")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/register?role=pro" size="lg">
                {tr("Join SEFIKH")}{" "}<ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="/pricing?for=pro" variant="secondary" size="lg">
                {tr("Business plans")}</ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* ── Données marché ─────────────────────────────────── */}
      <section className="bg-sand py-24">
        <div className="container-x grid items-center gap-14 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="eyebrow">{tr("SEFIKH market data")}</p>
            <h2 className="display mt-4 text-4xl sm:text-5xl">{tr("A live view of what the creative industries are looking for.")}</h2>
            <p className="mt-5 max-w-md text-muted">{tr("Every search, match and connection feeds an anonymised barometer of demand for craftsmanship.")}</p>
            <ButtonLink href="/insights" variant="light" className="mt-8">
              {tr("Trends & Insights")}{" "}<ArrowRight className="size-4" />
            </ButtonLink>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              [kpis.searches, tr("Searches this quarter")],
              [kpis.activePros, tr("Active professionals")],
              [kpis.matches, tr("Qualified matches")],
              [kpis.connections, tr("Connection requests")],
            ].map(([n, l]) => (
              <div key={l as string} className="rounded-3xl border border-line bg-paper p-6 sm:p-8">
                <p className="display text-5xl sm:text-6xl">{tr.number(n as number)}</p>
                <p className="mt-2 text-[13px] text-muted">{l as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
