import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { APPROVED_PHOTO, canSeeMakers, LISTED_COMPANY } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth/session";
import { COMPANY_KINDS } from "@/lib/constants";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/utils";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("The Journal"), description: tr("An evolving view of what the creative industry is looking for, shaped by real-time activity on SEFIKH.") };
}

/** Projets réalisés : les réalisations nommées (projet renseigné) des ateliers en ligne, les plus récentes d'abord. */
async function realisedProjects() {
  const photos = await db.portfolioImage.findMany({
    where: { ...APPROVED_PHOTO, projectName: { not: null }, company: LISTED_COMPANY },
    orderBy: { createdAt: "desc" },
    take: 24,
    select: { id: true, key: true, thumbKey: true, width: true, height: true, projectName: true, location: true, year: true, company: { select: { name: true, slug: true, kind: true, city: true, country: true } } },
  });
  // Une seule photo par projet.
  const seen = new Set<string>();
  return photos.filter((p) => {
    const k = `${p.company.slug}:${p.projectName}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 9);
}

/** Journal (v2) : SEFIKH Projects — projets réalisés et appels d'offres. Les articles « Stories of materials » sont retirés. */
export default async function JournalPage() {
  const tr = await getT();
  const [projects, user] = await Promise.all([realisedProjects(), getCurrentUser()]);
  const access = canSeeMakers(user);
  const kindLabel = (k: string) => tr(COMPANY_KINDS.find((x) => x.value === k)?.label ?? k);

  return (
    <div className="container-x pb-24 pt-12 sm:pt-16">
      <header className="mx-auto max-w-2xl text-center">
        <p className="kicker self-start">{tr("The Journal")}</p>
        <h1 className="display mt-4 text-3xl sm:text-4xl">{tr("An evolving view of what the creative industry is looking for, shaped by real-time activity on SEFIKH.")}</h1>
      </header>

      <section className="mt-16 border-t border-ink/70 pt-8">
        <p className="kicker self-start">{tr("Section 1")}</p>
        <h2 className="display mt-2 text-3xl">{tr("SEFIKH Projects")}</h2>

        <div className="mt-10">
          <h3 className="font-mono text-[11.5px] uppercase tracking-[0.06em] text-ink">{tr("Realised projects")}</h3>
          {projects.length === 0 ? (
            <p className="mt-5 border border-dashed border-line p-10 text-center text-[14px] text-muted">{tr("The first projects realised through SEFIKH will be published here.")}</p>
          ) : (
            <div className="mt-6 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => {
                const body = (
                  <>
                    <div className="relative aspect-[4/3] overflow-hidden bg-sand">
                      <Image src={fileUrl(p.thumbKey ?? p.key)!} alt={p.projectName ?? ""} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover transition duration-[900ms] group-hover:scale-[1.03]" />
                    </div>
                    <div className="mt-3 border-t border-ink/70 pt-2.5">
                      <p className="folio">{[p.location, p.year].filter(Boolean).join(" · ") || tr("Project")}</p>
                      <h4 className="display mt-1 text-xl transition-colors group-hover:text-brass">{p.projectName}</h4>
                      <p className="mt-1 text-[13px] text-muted">
                        {access ? p.company.name : `${kindLabel(p.company.kind)} · ${[p.company.city, p.company.country].filter(Boolean).join(", ")}`}
                      </p>
                    </div>
                  </>
                );
                return access ? (
                  <Link key={p.id} href={`/makers/${p.company.slug}`} className="group block">
                    {body}
                  </Link>
                ) : (
                  <div key={p.id} className="group">
                    {body}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-16">
          <h3 className="font-mono text-[11.5px] uppercase tracking-[0.06em] text-ink">{tr("Requests for proposal (RFP)")}</h3>
          <div className="mt-5 border border-line bg-paper p-8 sm:p-10">
            <p className="max-w-xl text-[14.5px] leading-relaxed text-ink-soft">{tr("Calls for tenders from architects, interior designers and hospitality groups looking for artisans and workshops. This section opens soon.")}</p>
            <Link href="/contact" className="folio mt-4 inline-block underline underline-offset-4 hover:text-ink">
              {tr("Have a project to submit? Contact us")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
