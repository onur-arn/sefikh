import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/utils";
import { IntroSlideshow } from "@/components/layout/intro-slideshow";
import { ButtonLink } from "@/components/ui/button";
import { APPROVED_PHOTO, LISTED_COMPANY } from "@/lib/access";
import { AREAS, legacyAreas } from "@/lib/expertise";
import { getT } from "@/i18n/server";

/** Une photo par domaine, prise chez un atelier du domaine (tags v2, ou anciens tags pour les profils d'avant). */
async function getAreas() {
  const companies = await db.company.findMany({
    where: LISTED_COMPANY,
    select: { tags: { select: { tag: { select: { kind: true, name: true } } } }, portfolio: { where: APPROVED_PHOTO, orderBy: { position: "asc" }, take: 1, select: { key: true, thumbKey: true } } },
  });
  return AREAS.map((a) => {
    const match = companies.find((c) => {
      const names = c.tags.map((t) => t.tag.name);
      return c.portfolio.length && (c.tags.some((t) => t.tag.kind === "AREA" && t.tag.name === a.name) || legacyAreas(names).includes(a.name));
    });
    const img = match?.portfolio[0];
    return { ...a, image: img ? img.thumbKey ?? img.key : null };
  });
}

export default async function HomePage() {
  const tr = await getT();
  const areas = await getAreas();

  return (
    <>
      {/* ── Ouverture ──────────────────────────────────────── */}
      <section className="relative -mt-[68px] h-dvh overflow-hidden bg-espresso">
        <IntroSlideshow />
        <div className="container-x absolute inset-x-0 bottom-16 z-10 text-paper sm:bottom-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-paper/80">{tr("Search Engine For Know-How")}</p>
          <h1 className="display mt-3 max-w-3xl text-[2.2rem] sm:text-6xl lg:text-[3.4rem]">{tr("Where Ideas Take Shape")}</h1>
        </div>
        <a href="#site" aria-label={tr("Explore")} className="absolute bottom-14 right-4 z-10 text-paper sm:right-7 lg:right-10">
          <ChevronDown className="size-5 animate-bounce" strokeWidth={1.2} aria-hidden />
        </a>
      </section>

      {/* ── Trouver l'expertise ────────────────────────────── */}
      <section id="site" className="container-x scroll-mt-[68px] py-20 sm:py-24">
        <div className="grid gap-8 lg:grid-cols-12">
          <p className="folio lg:col-span-3">{tr("Find the right expertise")}</p>
          <div className="lg:col-span-9">
            <h2 className="display text-3xl sm:text-4xl">{tr("The right skills make all the difference.")}</h2>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink-soft">
              {tr("Every project requires the right skills. Share your vision and tell us what you're looking for. We'll help you find the artisans and workshops best suited to your needs.")}
            </p>
            <div className="mt-9">
              <ButtonLink href="/search" size="lg">
                {tr("Explore the craft")} <ArrowRight className="size-3.5" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* ── Domaines d'expertise ───────────────────────────── */}
      <section className="border-t border-line">
        <div className="container-x py-16 sm:py-20">
          <div className="grid gap-4 lg:grid-cols-12">
            <p className="folio lg:col-span-3">{tr("Areas of expertise")}</p>
            <p className="max-w-xl text-[15px] leading-relaxed text-ink-soft lg:col-span-9">{tr("Explore a diverse range of skills, techniques and specialities across creative and artisanal fields.")}</p>
          </div>
          <ul className="mt-10 border-t border-ink/70">
            {areas.map((a) => (
              <li key={a.name} className="border-b border-line">
                <Link href={`/search?areas=${encodeURIComponent(a.name)}`} className="group grid items-center gap-x-6 gap-y-1 py-3.5 lg:grid-cols-12">
                  <span className="display text-xl transition-colors group-hover:text-brass sm:text-[1.35rem] lg:col-span-5">{tr(a.name)}</span>
                  <span className="text-[13px] text-muted lg:col-span-5">{tr(a.copy)}</span>
                  <span className="relative hidden h-14 overflow-hidden lg:col-span-2 lg:block">
                    {a.image && <Image src={fileUrl(a.image)!} alt="" fill sizes="16vw" className="object-cover opacity-0 transition duration-500 group-hover:opacity-100" />}
                    <ArrowUpRight className="absolute right-0 top-1/2 size-4 -translate-y-1/2 text-muted transition group-hover:opacity-0" strokeWidth={1.2} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Rejoindre ──────────────────────────────────────── */}
      <section className="grid lg:grid-cols-2">
        <div className="relative min-h-[55vh]">
          <Image src="/images/join-1.webp" alt={tr("A cabinetmaker's hands planing wood")} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="flex flex-col justify-center bg-paper px-4 py-14 sm:px-10 lg:px-16">
          <p className="folio">{tr("Join SEFIKH")}</p>
          <h2 className="display mt-4 text-3xl sm:text-4xl">{tr("Bring your expertise into the spotlight.")}</h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-soft">{tr("Showcase your work and connect with architects, designers and creative professionals seeking exceptional craftsmanship.")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/register?role=pro">
              {tr("Join SEFIKH")} <ArrowRight className="size-3.5" />
            </ButtonLink>
            <ButtonLink href="/subscription?for=pro" variant="secondary">
              {tr("Business solutions")}
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
