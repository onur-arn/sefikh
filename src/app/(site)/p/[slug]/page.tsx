import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin } from "lucide-react";
import { APPROVED_PHOTO, LISTED_COMPANY } from "@/lib/access";
import { COMPANY_KINDS } from "@/lib/constants";
import { db } from "@/lib/db";
import { legacyAreas } from "@/lib/expertise";
import { fileUrl } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { getT } from "@/i18n/server";

const PHOTOS = 9;

/** Présentation publique d'un atelier, à partager : nom, savoir-faire et réalisations, sans coordonnées. */
async function getCompany(slug: string) {
  return db.company.findFirst({
    where: { slug, ...LISTED_COMPANY },
    select: {
      name: true,
      slug: true,
      kind: true,
      tagline: true,
      about: true,
      city: true,
      country: true,
      tags: { select: { tag: { select: { kind: true, name: true } } } },
      portfolio: { where: APPROVED_PHOTO, orderBy: { position: "asc" }, take: PHOTOS, select: { id: true, key: true, thumbKey: true, width: true, height: true, title: true } },
    },
  });
}

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const tr = await getT();
  const c = await getCompany((await params).slug);
  if (!c) return { title: tr("Artisan not found") };
  const cover = c.portfolio[0];
  return {
    title: `${c.name} — ${c.tagline ?? tr("Artisan")}`,
    description: c.about?.slice(0, 160) ?? undefined,
    openGraph: { title: `${c.name} · SEFIKH`, description: c.tagline ?? undefined, images: cover ? [{ url: fileUrl(cover.key)!, width: cover.width, height: cover.height }] : undefined },
  };
}

export default async function SharedProfilePage({ params }: PageProps<"/p/[slug]">) {
  const tr = await getT();
  const c = await getCompany((await params).slug);
  if (!c) notFound();
  const names = c.tags.map((t) => t.tag.name);
  const areas = [...new Set([...c.tags.filter((t) => t.tag.kind === "AREA").map((t) => t.tag.name), ...legacyAreas(names)])];
  const specialties = c.tags.filter((t) => t.tag.kind === "SPECIALTY").map((t) => t.tag.name);
  const kind = COMPANY_KINDS.find((k) => k.value === c.kind)?.label ?? c.kind;
  const about = c.about && c.about.length > 600 ? `${c.about.slice(0, 600).trimEnd()}…` : c.about;

  return (
    <div className="container-x pb-24 pt-10 sm:pt-14">
      <p className="folio">{tr("Artisan presented on SEFIKH")}</p>
      <div className="mt-4 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="folio">{tr(kind)}</p>
          <h1 className="display mt-2 text-4xl sm:text-5xl">{c.name}</h1>
          {c.tagline && <p className="mt-3 font-display text-xl italic text-muted">{c.tagline}</p>}
          <p className="folio mt-4 flex items-center gap-1.5">
            <MapPin className="size-3.5" /> {[c.city, c.country].filter(Boolean).join(", ")}
          </p>
          {about && <p className="mt-6 whitespace-pre-line text-[14.5px] leading-relaxed text-ink-soft">{about}</p>}
          {areas.length > 0 && (
            <div className="mt-8 border-t border-line pt-5">
              <p className="eyebrow">{tr("Areas of expertise")}</p>
              <p className="mt-2 font-display text-xl">{areas.map((a) => tr(a)).join(" · ")}</p>
              {specialties.length > 0 && <p className="mt-2 text-[13px] text-muted">{specialties.map((s) => tr(s)).join(", ")}</p>}
            </div>
          )}
          <div className="mt-10 border border-line bg-paper p-6">
            <p className="text-[14px] leading-relaxed text-ink-soft">{tr("Contact details, availability and direct messaging are available to SEFIKH members.")}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <ButtonLink href="/register">
                {tr("Join SEFIKH")} <ArrowRight className="size-3.5" />
              </ButtonLink>
              <Link href="/" className="folio self-center underline underline-offset-4 hover:text-ink">
                {tr("Discover SEFIKH")}
              </Link>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 self-start lg:col-span-7">
          {c.portfolio.map((p, i) => (
            <div key={p.id} className={i === 0 ? "relative col-span-2 aspect-[16/10] overflow-hidden bg-sand" : "relative aspect-[4/3] overflow-hidden bg-sand"}>
              <Image src={fileUrl(i === 0 ? p.key : p.thumbKey ?? p.key)!} alt={p.title ?? c.name} fill priority={i === 0} sizes={i === 0 ? "(min-width:1024px) 58vw, 100vw" : "(min-width:1024px) 29vw, 50vw"} className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
