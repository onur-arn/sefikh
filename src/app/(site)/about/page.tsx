import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("About us"), description: tr("SEFIKH — Search Engine For Know-How. Our mission: connect creative professionals with the makers who bring their ideas to life.") };
}

export default async function AboutPage() {
  const tr = await getT();
  return (
    <>
      <section className="container-x grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="eyebrow">{tr("About SEFIKH")}</p>
          <h1 className="display mt-4 text-5xl sm:text-7xl">{tr("Search Engine For Know-How.")}</h1>
          <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-muted">
            {tr("Behind every remarkable interior there is a cabinetmaker, a metalworker, a stone carver or an upholsterer whose know-how rarely appears online. SEFIKH exists to make that know-how searchable.")}</p>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
          <Image src="/images/about.webp" alt={tr("Hand-cut dovetail joint in walnut")} fill priority sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
        </div>
      </section>
      <section className="bg-paper py-20">
        <div className="container-x grid gap-12 md:grid-cols-3">
          {[
            [tr("Our mission"), tr("Give architects, interior designers and hoteliers a professional sourcing tool to identify the right skills, materials and makers — anywhere in the world.")],
            [tr("Our promise to makers"), tr("A business profile that does justice to your craft, qualified requests with clear briefs, and no commission on the projects you win.")],
            [tr("How we work"), tr("An AI search engine that understands materials, techniques and images — and a team that curates the platform by hand.")],
          ].map(([t, d]) => (
            <div key={t}>
              <h2 className="display text-3xl">{t}</h2>
              <p className="mt-3 leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="container-x py-20 text-center">
        <h2 className="display text-4xl sm:text-5xl">{tr("Join the community.")}</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/register" size="lg">
            {tr("I am a creative")}</ButtonLink>
          <ButtonLink href="/join" size="lg" variant="secondary">
            {tr("I offer a skill")}</ButtonLink>
        </div>
      </section>
    </>
  );
}
