import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { COMPANY_KINDS } from "@/lib/constants";
import { fileUrl } from "@/lib/utils";
import { reviewCompany, reviewPhoto } from "../actions";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

const hoursSince = (d: Date) => Math.floor((Date.now() - d.getTime()) / 3_600_000);

/** Validation des profils artisans et des photos publiées (engagement : sous 72 h). */
export default async function ModerationPage() {
  const tr = await getT();
  const [companies, photos] = await Promise.all([
    db.company.findMany({ where: { reviewStatus: "PENDING" }, orderBy: { createdAt: "asc" }, include: { user: { select: { email: true } }, tags: { include: { tag: true } } } }),
    db.portfolioImage.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, take: 120, include: { company: { select: { name: true, slug: true } } } }),
  ]);

  return (
    <div className="space-y-14">
      <section>
        <h1 className="display text-3xl">{tr("Profiles to review")} <span className="folio">({companies.length})</span></h1>
        {companies.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{tr("No profile waiting.")}</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {companies.map((c) => {
              const h = hoursSince(c.createdAt);
              return (
                <li key={c.id} className="border border-line bg-paper p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <p className="display text-xl">
                      {c.name} <span className="folio">· {tr(COMPANY_KINDS.find((k) => k.value === c.kind)?.label ?? c.kind)} · {c.independent ? tr("Independent artisan") : tr("Company")}</span>
                    </p>
                    <span className={h >= 48 ? "folio text-danger" : "folio"}>{tr("Waiting for {h} h", { h })}</span>
                  </div>
                  <p className="mt-1 text-[13px] text-muted">
                    {c.user.email} · {[c.city, c.country].filter(Boolean).join(", ")} · {c.phone}
                  </p>
                  {c.tagline && <p className="mt-3 text-[14px] italic">{c.tagline}</p>}
                  {c.about && <p className="mt-2 line-clamp-4 max-w-3xl text-[13.5px] text-ink-soft">{c.about}</p>}
                  <p className="mt-2 text-[12.5px] text-muted">{c.tags.map((t) => t.tag.name).join(" · ")}</p>
                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <Link href={`/makers/${c.slug}`} target="_blank" className="folio underline">
                      {tr("Open the profile")}
                    </Link>
                    <form action={reviewCompany} className="ml-auto flex flex-wrap items-end gap-2">
                      <input type="hidden" name="id" value={c.id} />
                      <input name="note" placeholder={tr("Reason if refused (sent to the artisan)")} className="field w-72 py-1.5 text-[13px]" />
                      <button name="decision" value="reject" className="border border-line px-4 py-1.5 text-[12.5px] hover:border-danger hover:text-danger">
                        {tr("Refuse")}
                      </button>
                      <button name="decision" value="approve" className="bg-ink px-4 py-1.5 text-[12.5px] text-paper hover:bg-brass">
                        {tr("Approve")}
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="display text-3xl">{tr("Pictures to review")} <span className="folio">({photos.length})</span></h2>
        {photos.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{tr("No picture waiting.")}</p>
        ) : (
          <>
            <form action={reviewPhoto} className="mt-4">
              {photos.map((p) => (
                <input key={p.id} type="hidden" name="id" value={p.id} />
              ))}
              <button name="decision" value="approve" className="bg-ink px-4 py-1.5 text-[12.5px] text-paper hover:bg-brass">
                {tr("Approve all ({n})", { n: photos.length })}
              </button>
            </form>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {photos.map((p) => (
                <li key={p.id} className="border border-line bg-paper">
                  <a href={fileUrl(p.key)!} target="_blank" rel="noreferrer" className="relative block aspect-[4/3] bg-sand">
                    <Image src={fileUrl(p.thumbKey ?? p.key)!} alt={p.title ?? ""} fill sizes="25vw" className="object-cover" />
                  </a>
                  <div className="space-y-2 p-3">
                    <p className="truncate text-[13px] font-medium">{p.company.name}</p>
                    <p className="truncate text-[12px] text-muted">
                      {p.title} · {tr("Waiting for {h} h", { h: hoursSince(p.createdAt) })}
                    </p>
                    <form action={reviewPhoto} className="flex flex-wrap gap-1.5">
                      <input type="hidden" name="id" value={p.id} />
                      <input name="note" placeholder={tr("Reason if refused")} className="field w-full py-1 text-[12px]" />
                      <button name="decision" value="reject" className="flex-1 border border-line py-1 text-[12px] hover:border-danger hover:text-danger">
                        {tr("Refuse")}
                      </button>
                      <button name="decision" value="approve" className="flex-1 bg-ink py-1 text-[12px] text-paper hover:bg-brass">
                        {tr("Approve")}
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
