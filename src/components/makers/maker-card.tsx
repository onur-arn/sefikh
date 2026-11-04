"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Lock } from "lucide-react";
import { COMPANY_KINDS } from "@/lib/constants";
import { cn, fileUrl } from "@/lib/utils";
import { useT } from "@/i18n/client";

export type MakerCardData = {
  slug: string;
  name: string;
  anonymous?: boolean;
  previewId?: string;
  availability?: number[];
  leadTimeMin?: number | null;
  leadTimeMax?: number | null;
  tagline: string | null;
  kind: string;
  city: string | null;
  country: string | null;
  verified: boolean;
  featured?: boolean;
  image: { key: string; width: number; height: number; title?: string | null } | null;
  gallery?: string[];
  match?: number;
  reasons?: string[];
  distance?: number | null;
};

export function MakerCard({ maker, priority, source, className }: { maker: MakerCardData; priority?: boolean; source?: string; className?: string }) {
  const tr = useT();
  const kind = COMPANY_KINDS.find((k) => k.value === maker.kind)?.label ?? maker.kind;
  const href = `/makers/${maker.anonymous ? `preview/${maker.previewId}` : maker.slug}${source ? `?src=${source}` : ""}`;
  // Prochains mois disponibles, à partir du mois en cours.
  const month = new Date().getMonth() + 1;
  const nextMonths = (maker.availability ?? [])
    .map((m) => ({ m, wait: (m - month + 12) % 12 }))
    .sort((a, b) => a.wait - b.wait)
    .slice(0, 3)
    .map(({ m }) => tr.date(new Date(2026, m - 1, 1), { month: "short" }));
  return (
    <Link href={href} className={cn("group block", className)}>
      <div className="relative aspect-[4/5] overflow-hidden bg-sand">
        {maker.image ? (
          <Image
            src={fileUrl(maker.image.key)!}
            alt={maker.anonymous ? "" : (maker.image.title ?? tr("Work by {name}", { name: maker.name }))}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, 50vw"
            className="object-cover transition duration-[900ms] ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center font-display text-5xl text-muted">{maker.name[0]}</div>
        )}
        {maker.match != null && maker.match > 0 && <span className="absolute left-0 top-0 bg-ivory px-2 py-1 font-mono text-[11px]">{tr("{match}% match", { match: maker.match })}</span>}
      </div>
      <div className="mt-3 border-t border-ink/70 pt-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="display truncate text-[1.65rem] transition-colors group-hover:text-brass">{maker.anonymous ? tr(kind) : maker.name}</h3>
          <span className="flex shrink-0 items-center gap-1.5 text-muted">
            {maker.verified && <BadgeCheck className="size-3.5" strokeWidth={1.4} aria-label={tr("Verified maker")} />}
            {maker.anonymous && <Lock className="size-3.5" strokeWidth={1.4} aria-label={tr("Name reserved for Pro and Studio plans")} />}
          </span>
        </div>
        {!maker.anonymous && <p className="mt-0.5 line-clamp-1 text-[14px] text-muted">{maker.tagline ?? tr(kind)}</p>}
        <dl className="folio mt-2 space-y-0.5">
          <div className="flex gap-2">
            <dt className="sr-only">{tr("Location")}</dt>
            <dd>
              {[maker.city, maker.country].filter(Boolean).join(", ") || "—"}
              {maker.distance != null && maker.distance > 0 && tr("· {distance} km", { distance: maker.distance })}
            </dd>
          </div>
          {(nextMonths.length > 0 || maker.leadTimeMin != null) && (
            <div>
              <dt className="sr-only">{tr("Availability")}</dt>
              <dd>
                {[
                  nextMonths.length > 0 ? tr("Available: {months}", { months: nextMonths.join(", ") }) : null,
                  maker.leadTimeMin != null ? tr("{min}–{max} months lead time", { min: maker.leadTimeMin, max: maker.leadTimeMax ?? maker.leadTimeMin }) : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </dd>
            </div>
          )}
          {maker.reasons && maker.reasons.length > 0 && <dd className="text-brass">{maker.reasons.join(" · ")}</dd>}
        </dl>
      </div>
    </Link>
  );
}
