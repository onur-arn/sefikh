import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Join as a maker"), description: tr("Showcase your craft and get discovered by architects, interior designers and hoteliers. A subscription, no commission.") };
}

export default async function JoinPage() {
  const tr = await getT();
  return (
    <>
      <section className="container-x grid items-center gap-12 py-16 lg:grid-cols-[1fr_1fr] lg:py-24">
        <div>
          <p className="folio">{tr("Showcase your craft. Get discovered.")}</p>
          <h1 className="display mt-4 text-5xl sm:text-[5rem]">{tr("Create your business profile.")}</h1>
          <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-muted">
            {tr("Join SEFIKH and connect with architects, designers and creative professionals looking for unique skills, materials and expertise. Tell us about your skills, materials and capabilities — it only takes a few minutes.")}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/register?role=pro" size="lg">
              {tr("Join SEFIKH")} <ArrowRight className="size-3.5" />
            </ButtonLink>
            <ButtonLink href="/subscription?for=pro" size="lg" variant="secondary">
              {tr("Business plans")}</ButtonLink>
          </div>
          <p className="mt-4 text-[13px] text-muted">{tr("Subscription required to appear · No commission on projects")}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative aspect-[3/4] overflow-hidden">
            <Image src="/images/join-1.webp" alt={tr("Cabinetmaker at work")} fill priority sizes="25vw" className="object-cover" />
          </div>
          <div className="relative mt-12 aspect-[3/4] overflow-hidden">
            <Image src="/images/join-2.webp" alt={tr("Stone and timber carving")} fill priority sizes="25vw" className="object-cover" />
          </div>
        </div>
      </section>
      <section className="container-x pb-20">
        <div className="grid border-t border-ink/70 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [tr("Be found"), tr("Your skills, materials and techniques are indexed by our search engine.")],
            [tr("By image too"), tr("Each portfolio picture is analysed so creatives find you from a moodboard.")],
            [tr("Qualified requests"), tr("Briefs come with location, quantities, timeline and budget.")],
            [tr("Understand demand"), tr("Analytics and market insights show what the industry is looking for.")],
          ].map(([t, d], i) => (
            <div key={t} className="border-b border-line py-6 lg:border-b-0 lg:border-l lg:px-6 lg:first:border-l-0 lg:first:pl-0">
              <p className="folio">{["i", "ii", "iii", "iv"][i]}</p>
              <h2 className="display mt-3 text-3xl">{t}</h2>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
