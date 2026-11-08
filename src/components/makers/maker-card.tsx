"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BadgeCheck, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { COMPANY_KINDS } from "@/lib/constants";
import { cn, fileUrl } from "@/lib/utils";
import { useT } from "@/i18n/client";
import { TranslateButton, useAutoTranslate } from "@/components/translate/auto-translate";

export type MakerCardData = {
  /** Identifiant de l'entreprise : active la traduction de son accroche. */
  id?: string;
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
  const translation = useAutoTranslate("company", maker.id ?? "");
  const tagline = translation.translated?.tagline ?? maker.tagline;
  const canTranslate = !maker.anonymous && !!maker.id && !!maker.tagline;
  // Photos de la carte : la couverture puis les autres réalisations, à faire défiler.
  const photos = maker.image ? [maker.image.key, ...(maker.gallery ?? []).filter((k) => k !== maker.image!.key)] : [];
  const [index, setIndex] = useState(0);
  // Photos montées (chargées en arrière-plan) et photos prêtes à l'affichage.
  const [mounted, setMounted] = useState<Set<number>>(() => new Set([0]));
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set());
  const [shown, setShown] = useState(0);
  const frame = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const mount = (ids: number[]) => setMounted((m) => (ids.every((i) => m.has(i)) ? m : new Set([...m, ...ids])));
  // Au survol, au toucher ou au clavier : toutes les photos de la carte se chargent, avant même le clic.
  const warmAll = () => photos.length > 1 && mount(photos.map((_, i) => i));
  // On n'affiche une photo qu'une fois prête : la précédente reste visible entre-temps (jamais de gris).
  const go = (step: number) => {
    warmAll();
    const next = (index + step + photos.length) % photos.length;
    setIndex(next);
    if (loaded.has(next)) setShown(next);
  };
  // Carte visible à l'écran : la photo suivante se charge déjà.
  useEffect(() => {
    if (photos.length < 2 || !frame.current) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        mount([1]);
        io.disconnect();
      }
    }, { rootMargin: "200px" });
    io.observe(frame.current);
    return () => io.disconnect();
  }, [photos.length]);
  const arrow = (step: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    go(step);
  };
  // Lien étiré sur toute la carte : le bouton de traduction reste cliquable par-dessus.
  return (
    <div className={cn("group relative", className)}>
      <div
        ref={frame}
        className="relative aspect-[4/5] overflow-hidden bg-sand"
        onMouseEnter={warmAll}
        onFocus={warmAll}
        onTouchStart={(e) => {
          warmAll();
          touchX.current = e.touches[0]!.clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current == null || photos.length < 2) return;
          const dx = e.changedTouches[0]!.clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        {maker.image ? (
          photos.map((key, i) =>
            mounted.has(i) ? (
              <Image
                key={key}
                src={fileUrl(key)!}
                alt={i !== shown ? "" : maker.anonymous ? "" : i === 0 && maker.image!.title ? maker.image!.title : tr("Work by {name}", { name: maker.name })}
                aria-hidden={i !== shown}
                fill
                priority={priority && i === 0}
                sizes="(min-width: 1024px) 33vw, 50vw"
                onLoad={() => {
                  setLoaded((l) => (l.has(i) ? l : new Set([...l, i])));
                  if (i === index) setShown(i);
                }}
                className={cn("object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]", i === shown ? "opacity-100" : "opacity-0")}
              />
            ) : null,
          )
        ) : (
          <div className="flex size-full items-center justify-center font-display text-5xl text-muted">{maker.name[0]}</div>
        )}
        {maker.match != null && maker.match > 0 && <span className="absolute left-0 top-0 bg-ivory px-2 py-1 font-mono text-[11px]">{tr("{match}% match", { match: maker.match })}</span>}
        {photos.length > 1 && (
          <>
            {[-1, 1].map((step) => (
              <button
                key={step}
                type="button"
                onClick={arrow(step)}
                aria-label={tr(step < 0 ? "Previous image" : "Next image")}
                className={cn(
                  "absolute top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center bg-ivory/90 text-ink transition hover:bg-ivory md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100",
                  step < 0 ? "left-2" : "right-2",
                )}
              >
                {step < 0 ? <ChevronLeft className="size-4" strokeWidth={1.5} /> : <ChevronRight className="size-4" strokeWidth={1.5} />}
              </button>
            ))}
            <div className="pointer-events-none absolute inset-x-0 bottom-2.5 z-10 flex justify-center gap-1" aria-hidden>
              {photos.map((k, i) => (
                <span key={k} className={cn("h-0.5 w-4 transition-colors", i === index ? "bg-ivory" : "bg-ivory/45")} />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="mt-3 border-t border-ink/70 pt-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="display truncate text-[1.65rem] transition-colors group-hover:text-brass">
            <Link href={href} className="after:absolute after:inset-0 after:content-['']">{maker.anonymous ? tr(kind) : maker.name}</Link>
          </h3>
          <span className="flex shrink-0 items-center gap-1.5 text-muted">
            {maker.verified && <BadgeCheck className="size-3.5" strokeWidth={1.4} aria-label={tr("Verified maker")} />}
            {maker.anonymous && <Lock className="size-3.5" strokeWidth={1.4} aria-label={tr("Name reserved for Pro and Studio plans")} />}
          </span>
        </div>
        {!maker.anonymous && <p className="mt-0.5 line-clamp-2 text-[14px] text-muted">{tagline ?? tr(kind)}</p>}
        {canTranslate && <TranslateButton state={translation} className="relative z-10 mt-1 text-muted" />}
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
    </div>
  );
}
