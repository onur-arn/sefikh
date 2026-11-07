import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MakerCard } from "@/components/makers/maker-card";
import { anonymize, canSeeMakers, LISTED_COMPANY } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ARTICLES } from "@/lib/journal";
import { getPlan } from "@/lib/plans";
import { parseList } from "@/lib/utils";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Content"), description: tr("Stories of materials & makers.") };
}

/** Six ateliers mis en avant : offres « à la une » d'abord, puis les fiches vérifiées. */
async function getPlates() {
  const companies = await db.company.findMany({
    where: LISTED_COMPANY,
    include: { user: { select: { plan: true } }, portfolio: { orderBy: { position: "asc" }, take: 1 } },
    orderBy: { updatedAt: "desc" },
  });
  return companies
    .sort((a, b) => Number(getPlan(b.user.plan).limits.featured) - Number(getPlan(a.user.plan).limits.featured) || Number(b.verified) - Number(a.verified))
    .slice(0, 6);
}

/** Contenus : des ateliers à connaître, puis les articles du journal (la recherche est sur l'accueil). */
export default async function ContentPage() {
  const tr = await getT();
  const [featured, user] = await Promise.all([getPlates(), getCurrentUser()]);
  const access = canSeeMakers(user);
  const plates = featured.map((c, i) => {
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
      <section className="container-x py-12 sm:py-20">
        <div className="grid gap-4 lg:grid-cols-12">
          <p className="folio lg:col-span-3">{tr("Content")}</p>
          <h1 className="display text-5xl sm:text-[5.2rem] lg:col-span-9">{tr("Ateliers worth knowing.")}</h1>
        </div>
        {plates.length > 0 && (
          <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-12">
            {plates.map((m, i) => (
              <MakerCard key={i} priority={i < 3} maker={m} className={placement[i]} />
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-line bg-paper">
        <div className="container-x py-14 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="display text-4xl sm:text-5xl">{tr("Stories of materials & makers.")}</h2>
            <Link href="/journal" className="link-underline inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.05em]">
              {tr("Journal")} <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="mt-10 grid gap-x-5 gap-y-10 md:grid-cols-3">
            {ARTICLES.map((a) => (
              <Link key={a.slug} href={`/journal/${a.slug}`} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden bg-sand">
                  <Image src={a.image} alt="" fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover transition duration-[900ms] group-hover:scale-[1.03]" />
                </div>
                <div className="mt-3 border-t border-ink/70 pt-2.5">
                  <p className="folio">{tr(a.category)}</p>
                  <h3 className="display mt-1 text-[1.75rem] transition-colors group-hover:text-brass">{tr(a.title)}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
