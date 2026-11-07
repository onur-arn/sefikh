import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { db } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { currentQuarter, marketKpis } from "@/lib/stats";
import { fileUrl, parseList } from "@/lib/utils";
import { IntroSlideshow } from "@/components/layout/intro-slideshow";
import { MakerCard } from "@/components/makers/maker-card";
import { SearchPanel } from "@/components/search/search-panel";
import { ButtonLink } from "@/components/ui/button";
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
  const plates = featured.slice(0, 6).map((c, i) => {
    const maker = {
      ...c,
      featured: getPlan(c.user.plan).limits.featured,
      availability: parseList<number>(c.availability),
      image: c.portfolio[0] ? { key: c.portfolio[0].thumbKey ?? c.portfolio[0].key, width: c.portfolio[0].width, height: c.portfolio[0].height, title: c.portfolio[0].title } : null,
      gallery: [],
    };
    return access ? maker : anonymize(maker, i);
  });
  // Grille de planches décalées, comme une page de monographie.
  const placement = ["md:col-span-5", "md:col-span-3 md:mt-28", "md:col-span-4", "md:col-span-4 md:col-start-2", "md:col-span-3 md:mt-20", "md:col-span-4"];

  return (
    <>
      {/* ── Ouverture ──────────────────────────────────────── */}
      <section className="relative -mt-[68px] h-dvh overflow-hidden bg-espresso">
        <IntroSlideshow />
        <div className="container-x absolute inset-x-0 bottom-16 z-10 text-paper sm:bottom-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-paper/80">{tr("Search Engine For Know-How")}</p>
          <h1 className="display mt-3 max-w-3xl text-[3.2rem] sm:text-7xl lg:text-[6.2rem]">{tr("Find the right hands.")}</h1>
        </div>
        <a href="#site" aria-label={tr("Explore")} className="absolute bottom-14 right-4 z-10 text-paper sm:right-7 lg:right-10">
          <ChevronDown className="size-5 animate-bounce" strokeWidth={1.2} aria-hidden />
        </a>
      </section>

      {/* ── Recherche ──────────────────────────────────────── */}
      <section id="site" className="container-x scroll-mt-[68px] py-16 sm:py-24">
        <div className="grid gap-8 lg:grid-cols-12">
          <p className="folio lg:col-span-3">{tr("Search")}</p>
          <div className="lg:col-span-9">
            <h2 className="display text-5xl sm:text-[5.2rem]">{tr("What are you looking for?")}</h2>
            <div className="mt-10">
              <SearchPanel />
            </div>
          </div>
        </div>
      </section>

      {/* ── Manifeste ──────────────────────────────────────── */}
      <section className="container-x border-t border-line py-20 sm:py-28">
        <div className="grid gap-8 lg:grid-cols-12">
          <p className="folio lg:col-span-3">{tr("N° 01 — Manifesto")}</p>
          <div className="lg:col-span-9">
            <p className="display text-[2.3rem] sm:text-6xl lg:text-[4.6rem]">{tr("An interior cannot be bought. It is built, by hand, by people you have not met yet.")}</p>
            <p className="mt-8 max-w-xl text-[16px] leading-relaxed text-ink-soft">{tr("SEFIKH brings together the cabinetmakers, metalworkers, stone carvers and weavers that architects keep to themselves. Describe an idea, show an image: we look for who can make it.")}</p>
            <ButtonLink href="#site" size="lg" className="mt-8">
              {tr("Explore expertise")} <ArrowRight className="size-3.5" />
            </ButtonLink>
          </div>
        </div>
        <dl className="mt-20 grid grid-cols-2 border-t border-line lg:grid-cols-4">
          {[
            [tr.number(makers), tr("Curated makers")],
            [tr.number(countries), tr("Countries")],
            [tr.number(portfolioCount), tr("Portfolio pieces")],
            ["0 %", tr("Commission on projects")],
          ].map(([n, l], i) => (
            <div key={l} className={i % 2 ? "border-l border-line py-5 pl-5" : "py-5 lg:border-l lg:border-line lg:pl-5 lg:first:border-l-0 lg:first:pl-0"}>
              <dd className="display text-5xl">{n}</dd>
              <dt className="folio mt-2">{l}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Index des métiers ──────────────────────────────── */}
      <section className="border-t border-line">
        <div className="container-x py-16 sm:py-20">
          <div className="grid gap-4 lg:grid-cols-12">
            <p className="folio lg:col-span-3">{tr("N° 02 — Index of crafts")}</p>
            <h2 className="display text-4xl sm:text-5xl lg:col-span-9">{tr("Know-how, organised.")}</h2>
          </div>
          <ul className="mt-12 border-t border-ink/70">
            {crafts.map((c, i) => (
              <li key={c.label} className="border-b border-line">
                <Link href={`/search?${c.param}=${encodeURIComponent(c.tag)}`} className="group grid items-center gap-x-6 gap-y-1 py-5 lg:grid-cols-12">
                  <span className="folio lg:col-span-1">{String(i + 1).padStart(2, "0")}</span>
                  <span className="display text-3xl transition-colors group-hover:text-brass sm:text-[2.7rem] lg:col-span-5">{tr(c.label)}</span>
                  <span className="text-[14px] text-muted lg:col-span-4">{tr(c.copy)}</span>
                  <span className="relative hidden h-16 overflow-hidden lg:col-span-2 lg:block">
                    {c.image && <Image src={fileUrl(c.image)!} alt="" fill sizes="16vw" className="object-cover opacity-0 transition duration-500 group-hover:opacity-100" />}
                    <ArrowUpRight className="absolute right-0 top-1/2 size-5 -translate-y-1/2 text-muted transition group-hover:opacity-0" strokeWidth={1.2} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Planches ───────────────────────────────────────── */}
      {plates.length > 0 && (
        <section className="border-t border-line bg-paper">
          <div className="container-x py-16 sm:py-24">
            <div className="grid gap-4 lg:grid-cols-12">
              <p className="folio lg:col-span-3">{tr("N° 03 — Plates")}</p>
              <h2 className="display text-4xl sm:text-5xl lg:col-span-9">{tr("Ateliers worth knowing.")}</h2>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-12">
              {plates.map((m, i) => (
                <MakerCard key={i} priority={i < 3} maker={m} className={placement[i]} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Citation ───────────────────────────────────────── */}
      <section className="relative h-[70vh] min-h-96 overflow-hidden bg-espresso">
        <Image src="/images/intro/2.webp" alt="" fill sizes="100vw" className="object-cover opacity-80" />
        <div className="container-x relative flex h-full items-end pb-10 text-paper">
          <blockquote>
            <p className="display max-w-3xl text-4xl italic sm:text-6xl">{tr("“The details are not the details. They make the design.”")}</p>
            <footer className="mt-4 font-mono text-[11px] uppercase tracking-[0.06em] text-paper/80">{tr("Charles Eames")}</footer>
          </blockquote>
        </div>
      </section>

      {/* ── Deux chemins ───────────────────────────────────── */}
      <section className="container-x py-16 sm:py-24">
        <p className="folio">{tr("N° 04 — Two paths")}</p>
        <div className="mt-8 grid border-t border-ink/70 lg:grid-cols-2">
          {[
            {
              who: tr("I have an idea, I'm looking for the right hands"),
              steps: [
                [tr("Describe your project"), tr("Write it in your own words: our engine understands materials, techniques, sectors and places.")],
                [tr("Search with a picture"), tr("Drop a moodboard image and discover makers whose portfolio looks alike.")],
                [tr("Talk directly to makers"), tr("Share plans and references in a dedicated project inbox — no middleman, no commission.")],
              ],
              cta: [tr("Start a project"), "/dashboard/projects/new"],
            },
            {
              who: tr("I have the know-how, I'm looking for great projects"),
              steps: [
                [tr("Create your business profile"), tr("Skills, materials, production capacities, lead times and areas of operation.")],
                [tr("Publish your portfolio"), tr("Every picture you upload becomes searchable by image and by description.")],
                [tr("Receive qualified requests"), tr("Architects and designers reach you with a clear brief, budget and timeline.")],
              ],
              cta: [tr("Join as a maker"), "/join"],
            },
          ].map((col, idx) => (
            <div key={col.who} className={idx ? "border-t border-line py-10 lg:border-l lg:border-t-0 lg:pl-12" : "py-10 lg:pr-12"}>
              <h3 className="display text-4xl sm:text-[2.8rem]">{col.who}</h3>
              <ol className="mt-8">
                {col.steps.map(([t, d], i) => (
                  <li key={t} className="grid grid-cols-[2.5rem_1fr] border-t border-line py-4">
                    <span className="folio pt-1">{["i", "ii", "iii"][i]}</span>
                    <div>
                      <p className="text-[15.5px] font-medium">{t}</p>
                      <p className="mt-1 text-[14px] leading-relaxed text-muted">{d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <ButtonLink href={col.cta[1]!} variant="secondary" className="mt-6">
                {col.cta[0]} <ArrowRight className="size-3.5" />
              </ButtonLink>
            </div>
          ))}
        </div>
      </section>

      {/* ── Registre du marché ─────────────────────────────── */}
      <section className="border-t border-line bg-sand">
        <div className="container-x grid gap-10 py-16 sm:py-20 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="folio">{tr("N° 05 — Register")}</p>
            <h2 className="display mt-4 text-4xl sm:text-5xl">{tr("A live view of what the creative industries are looking for.")}</h2>
            <Link href="/insights" className="link-underline mt-6 inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.05em]">
              {tr("Trends & Insights")} <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <table className="w-full self-end lg:col-span-6 lg:col-start-7">
            <tbody>
              {[
                [kpis.searches, tr("Searches this quarter")],
                [kpis.activePros, tr("Active professionals")],
                [kpis.matches, tr("Qualified matches")],
                [kpis.connections, tr("Connection requests")],
              ].map(([n, l]) => (
                <tr key={l as string} className="border-t border-ink/25">
                  <td className="folio py-3.5 !text-ink-soft">{l as string}</td>
                  <td className="display py-2 text-right text-4xl">{tr.number(n as number)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Rejoindre ──────────────────────────────────────── */}
      <section className="grid lg:grid-cols-2">
        <div className="relative min-h-[60vh]">
          <Image src="/images/join-1.webp" alt={tr("A cabinetmaker's hands planing wood")} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="flex flex-col justify-center bg-paper px-4 py-14 sm:px-10 lg:px-16">
          <p className="folio">{tr("N° 06 — Workshops")}</p>
          <h2 className="display mt-4 text-4xl sm:text-[3.4rem]">{tr("Showcase your craft. Get discovered.")}</h2>
          <p className="mt-5 max-w-md leading-relaxed text-ink-soft">{tr("Join SEFIKH and connect with architects, designers and creative professionals looking for unique skills, materials and expertise.")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/register?role=pro">
              {tr("Join SEFIKH")} <ArrowRight className="size-3.5" />
            </ButtonLink>
            <ButtonLink href="/subscription?for=pro" variant="secondary">
              {tr("Business plans")}
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
