import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/utils";
import { IntroSlideshow } from "@/components/layout/intro-slideshow";
import { SearchPanel } from "@/components/search/search-panel";
import { ButtonLink } from "@/components/ui/button";
import { LISTED_COMPANY } from "@/lib/access";
import { getT } from "@/i18n/server";

const CRAFTS = [
  { tag: "Metalwork", param: "skills", label: "Metal & Brass", copy: "Patinated brass, bronze casting, forged steel" },
  { tag: "Cabinetmaking", param: "skills", label: "Cabinetmaking", copy: "Burl veneers, joinery, bespoke furniture" },
  { tag: "Leather", param: "materials", label: "Leather", copy: "Wall panels, tufting, saddlery" },
  { tag: "Natural stone", param: "materials", label: "Stone & Marble", copy: "Onyx, travertine, sculpted marble" },
  { tag: "Upholstery", param: "skills", label: "Upholstery", copy: "Velvet, bouclé, custom seating" },
  { tag: "Ceramics", param: "skills", label: "Ceramics & Tiles", copy: "Zellige, glazed tiles, terracotta" },
];

async function getCrafts() {
  const companies = await db.company.findMany({
    where: LISTED_COMPANY,
    select: { tags: { select: { tag: { select: { name: true } } } }, portfolio: { orderBy: { position: "asc" }, take: 1, select: { key: true, thumbKey: true } } },
  });
  return CRAFTS.map((c) => {
    const withTag = companies.filter((co) => co.tags.some((t) => t.tag.name === c.tag) && co.portfolio.length);
    const img = withTag[0]?.portfolio[0];
    return { ...c, image: img ? img.thumbKey ?? img.key : null };
  });
}

export default async function HomePage() {
  const tr = await getT();
  const crafts = await getCrafts();

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
          <p className="folio lg:col-span-3">{tr("Manifesto")}</p>
          <div className="lg:col-span-9">
            <p className="display text-[2.3rem] sm:text-6xl lg:text-[4.6rem]">{tr("An interior cannot be bought. It is built, by hand, by people you have not met yet.")}</p>
            <p className="mt-8 max-w-xl text-[16px] leading-relaxed text-ink-soft">{tr("SEFIKH brings together the cabinetmakers, metalworkers, stone carvers and weavers that architects keep to themselves. Describe an idea, show an image: we look for who can make it.")}</p>
            <ButtonLink href="/about" variant="secondary" className="mt-8">
              {tr("About us")} <ArrowRight className="size-3.5" />
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ── Index des métiers ──────────────────────────────── */}
      <section className="border-t border-line">
        <div className="container-x py-16 sm:py-20">
          <div className="grid gap-4 lg:grid-cols-12">
            <p className="folio lg:col-span-3">{tr("Index of crafts")}</p>
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

      {/* ── Rejoindre ──────────────────────────────────────── */}
      <section className="grid lg:grid-cols-2">
        <div className="relative min-h-[60vh]">
          <Image src="/images/join-1.webp" alt={tr("A cabinetmaker's hands planing wood")} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="flex flex-col justify-center bg-paper px-4 py-14 sm:px-10 lg:px-16">
          <p className="folio">{tr("Workshops")}</p>
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
