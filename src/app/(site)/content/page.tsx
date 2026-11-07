import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ARTICLES } from "@/lib/journal";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Content"), description: tr("Stories of materials & makers.") };
}

/** Contenus : les articles du journal (la recherche est sur l'accueil). */
export default async function ContentPage() {
  const tr = await getT();
  return (
    <>
      <section>
        <div className="container-x py-12 sm:py-20">
          <p className="folio">{tr("Content")}</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="display mt-6 text-5xl sm:text-[5.2rem]">{tr("Stories of materials & makers.")}</h1>
            <Link href="/journal" className="link-underline inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.05em]">
              {tr("Journal")} <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="mt-10 grid gap-x-5 gap-y-10 md:grid-cols-3">
            {ARTICLES.map((a) => (
              <Link key={a.slug} href={`/journal/${a.slug}`} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden bg-sand">
                  <Image src={a.image} alt="" fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover transition duration-[900ms] group-hover:scale-[1.03]" />
                </div>
                <div className="mt-3 border-t border-ink/70 pt-2.5">
                  <p className="folio">{tr(a.category)}</p>
                  <h3 className="display mt-1 text-[1.75rem] transition-colors group-hover:text-brass">{tr(a.title)}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
