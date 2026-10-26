import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import { COMPANY_KINDS } from "@/lib/constants";
import { cn, fileUrl } from "@/lib/utils";

export type MakerCardData = {
  slug: string;
  name: string;
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
  const kind = COMPANY_KINDS.find((k) => k.value === maker.kind)?.label ?? maker.kind;
  const href = `/makers/${maker.slug}${source ? `?src=${source}` : ""}`;
  return (
    <Link href={href} className={cn("group block", className)}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand">
        {maker.image ? (
          <Image
            src={fileUrl(maker.image.key)!}
            alt={maker.image.title ?? `Work by ${maker.name}`}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 33vw, 50vw"
            className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex size-full items-center justify-center font-display text-4xl text-muted">{maker.name[0]}</div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          {maker.match != null && maker.match > 0 ? (
            <span className="rounded-full bg-paper/90 px-2.5 py-1 text-[11px] font-semibold text-ink backdrop-blur">{maker.match}% match</span>
          ) : (
            <span />
          )}
          {maker.featured && <span className="rounded-full bg-ink/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-paper backdrop-blur">Featured</span>}
        </div>
        {maker.gallery && maker.gallery.length > 0 && (
          <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 transition duration-300 group-hover:opacity-100">
            {maker.gallery.slice(0, 2).map((k) => (
              <span key={k} className="relative size-11 overflow-hidden rounded-lg border-2 border-paper">
                <Image src={fileUrl(k)!} alt="" fill sizes="44px" className="object-cover" />
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="mt-3.5">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-[15px] font-semibold tracking-tight">{maker.name}</h3>
          {maker.verified && <BadgeCheck className="size-4 shrink-0 text-brass" strokeWidth={1.8} aria-label="Verified maker" />}
        </div>
        <p className="mt-0.5 line-clamp-1 text-[13.5px] text-muted">{maker.tagline ?? kind}</p>
        <p className="mt-1.5 flex items-center gap-1 text-[12px] text-muted">
          <MapPin className="size-3.5" strokeWidth={1.6} />
          {[maker.city, maker.country].filter(Boolean).join(", ") || "—"}
          {maker.distance != null && maker.distance > 0 && <span className="text-ink-soft"> · {maker.distance} km</span>}
        </p>
        {maker.reasons && maker.reasons.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {maker.reasons.map((r) => (
              <span key={r} className="rounded-full bg-brass-light/70 px-2 py-0.5 text-[11px] font-medium text-brass-dark">
                {r}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
