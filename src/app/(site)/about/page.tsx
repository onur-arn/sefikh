import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("About us"), description: tr("SEFIKH — Search Engine For Know-How. Our mission: connect creative professionals with the makers who bring their ideas to life.") };
}

export default async function AboutPage() {
  const tr = await getT();
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
      </section>
      <div className="relative h-[60vh] min-h-80">
        <Image src="/images/intro/1.webp" alt="" fill priority sizes="100vw" className="object-cover" />
      </div>
      <section className="container-x py-16 sm:py-24">
        <div className="grid border-t border-ink/70 md:grid-cols-3">
          {[
            [tr("Our mission"), tr("Give architects, interior designers and hoteliers a professional sourcing tool to identify the right skills, materials and makers — anywhere in the world.")],
            [tr("Our promise to makers"), tr("A business profile that does justice to your craft, qualified requests with clear briefs, and no commission on the projects you win.")],
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
      <section className="border-t border-line bg-sand">
        <div className="container-x grid gap-px bg-line md:grid-cols-2">
          <Link href="/register" className="group bg-sand py-14 md:pr-10">
            <span className="display block text-4xl transition-colors group-hover:text-brass">{tr("I have an idea, I'm looking for the right hands")}</span>
          </Link>
          <Link href="/join" className="group bg-sand py-14 md:pl-10">
            <span className="display block text-4xl transition-colors group-hover:text-brass">{tr("I have the know-how, I'm looking for great projects")}</span>
          </Link>
        </div>
      </section>
    </>
  );
}
