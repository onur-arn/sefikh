import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { LISTED_COMPANY } from "@/lib/access";
import { db } from "@/lib/db";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("About us"), description: tr("SEFIKH — Search Engine For Know-How. Our mission: connect creative professionals with the makers who bring their ideas to life.") };
}

export default async function AboutPage() {
  const tr = await getT();
  const [makers, countries, portfolioCount] = await Promise.all([
    db.company.count({ where: LISTED_COMPANY }),
    db.company.groupBy({ by: ["country"], where: LISTED_COMPANY }).then((r) => r.length),
    db.portfolioImage.count({ where: { company: LISTED_COMPANY } }),
  ]);
  return (
    <>
      <section className="container-x pb-16 pt-12">
        <div className="grid gap-8 lg:grid-cols-12">
          <p className="folio lg:col-span-3">{tr("About SEFIKH")}</p>
          <div className="lg:col-span-9">
            <h1 className="display text-5xl sm:text-[5.5rem]">{tr("Search Engine For Know-How.")}</h1>
            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ink-soft">{tr("Behind every remarkable interior there is a cabinetmaker, a metalworker, a stone carver or an upholsterer whose know-how rarely appears online. SEFIKH exists to make that know-how searchable.")}</p>
          </div>
        </div>
        <dl className="mt-16 grid grid-cols-3 border-t border-line">
          {[
            [tr.number(makers), tr("Curated makers")],
            [tr.number(countries), tr("Countries")],
            [tr.number(portfolioCount), tr("Portfolio pieces")],
          ].map(([n, l], i) => (
            <div key={l} className={i ? "border-l border-line py-5 pl-5" : "py-5"}>
              <dd className="display text-5xl">{n}</dd>
              <dt className="folio mt-2">{l}</dt>
            </div>
          ))}
        </dl>
      </section>
      <section className="relative h-[70vh] min-h-96 overflow-hidden bg-espresso">
        <Image src="/images/intro/2.webp" alt="" fill priority sizes="100vw" className="object-cover opacity-80" />
        <div className="container-x relative flex h-full items-end pb-10 text-paper">
          <blockquote>
            <p className="display max-w-3xl text-4xl italic sm:text-6xl">{tr("“The details are not the details. They make the design.”")}</p>
            <footer className="mt-4 font-mono text-[11px] uppercase tracking-[0.06em] text-paper/80">{tr("Charles Eames")}</footer>
          </blockquote>
        </div>
      </section>
      <section className="container-x py-16 sm:py-24">
        <div className="grid border-t border-ink/70 md:grid-cols-3">
          {[
            [tr("Our mission"), tr("Give architects, interior designers and hoteliers a professional sourcing tool to identify the right skills, materials and makers — anywhere in the world.")],
            [tr("Our promise to makers"), tr("A business profile that does justice to your craft and qualified requests with clear briefs.")],
            [tr("How we work"), tr("An AI search engine that understands materials, techniques and images — and a team that curates the platform by hand.")],
          ].map(([t, d], i) => (
            <div key={t} className={i ? "border-t border-line py-8 md:border-l md:border-t-0 md:pl-8" : "py-8 md:pr-8"}>
              <p className="folio">{["i", "ii", "iii"][i]}</p>
              <h2 className="display mt-3 text-4xl">{t}</h2>
              <p className="mt-3 leading-relaxed text-ink-soft">{d}</p>
            </div>
          ))}
        </div>
      </section>
      {/* ── Deux chemins ───────────────────────────────────── */}
      <section className="border-t border-line bg-paper">
        <div className="container-x py-16 sm:py-24">
        <p className="folio">{tr("How it works")}</p>
        <div className="mt-8 grid border-t border-ink/70 lg:grid-cols-2">
          {[
            {
              who: tr("I have an idea, I'm looking for the right hands"),
              steps: [
                [tr("Describe your project"), tr("Write it in your own words: our engine understands materials, techniques, sectors and places.")],
                [tr("Search with a picture"), tr("Drop a moodboard image and discover makers whose portfolio looks alike.")],
                [tr("Talk directly to makers"), tr("Share plans and references in a dedicated project inbox, with no middleman.")],
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
        </div>
      </section>
    </>
  );
}
