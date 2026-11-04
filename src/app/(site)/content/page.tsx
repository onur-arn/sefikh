import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SearchPanel } from "@/components/search/search-panel";
import { ARTICLES } from "@/lib/journal";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Content"), description: tr("Find the right skills, materials and makers to bring your ideas to life.") };
}

/** Contenus : la recherche, puis les articles du journal. */
export default async function ContentPage() {
  const tr = await getT();
  return (
    <>
      <section className="container-x py-12 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-12">
          <p className="folio lg:col-span-3">{tr("Content")}</p>
          <div className="lg:col-span-9">
            <h1 className="display text-5xl sm:text-[5.2rem]">{tr("What are you looking for?")}</h1>
            <div className="mt-10">
              <SearchPanel />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-paper">
        <div className="container-x py-14 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="display text-4xl sm:text-5xl">{tr("Stories of materials & makers.")}</h2>
            <Link href="/journal" className="link-underline inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.05em]">
              {tr("Journal")} <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="mt-10 grid gap-x-5 gap-y-10 md:grid-cols-3">
            {ARTICLES.slice(0, 3).map((a) => (
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
