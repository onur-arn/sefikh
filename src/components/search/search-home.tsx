import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SearchPanel } from "@/components/search/search-panel";
import { ButtonLink } from "@/components/ui/button";
import { getT } from "@/i18n/server";

/**
 * Page d'entrée du moteur de recherche (lien du logo SEFIKH).
 * Ouverte à tous : un visiteur voit le moteur, et la création de compte n'est demandée qu'au lancement d'une recherche.
 */
export async function SearchHome({ embedded = false }: { embedded?: boolean }) {
  const tr = await getT();
  return (
    <section className={embedded ? "pb-6 pt-4 sm:pt-10" : "container-x pb-24 pt-12 sm:pt-20"}>
      <div className="grid gap-8 lg:grid-cols-12">
        <p className="folio lg:col-span-3">{tr("Search engine")}</p>
        <div className="lg:col-span-9">
          <h1 className="display text-5xl sm:text-[5.2rem]">{tr("What are you looking for?")}</h1>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-ink-soft">{tr("Describe your project, add an image or choose a category.")}</p>
          <div className="mt-10">
            <SearchPanel />
          </div>
          {!embedded && (
            <div className="mt-14 flex flex-col gap-5 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-[15px] text-ink-soft">{tr("Create a free account to search: 3 free searches are included.")}</p>
              <div className="flex shrink-0 flex-wrap items-center gap-4">
                <ButtonLink href="/register?reason=search">
                  {tr("Create an account")} <ArrowRight className="size-3.5" />
                </ButtonLink>
                <Link href="/login?next=/search" className="link-underline font-mono text-[12px] uppercase tracking-[0.05em]">
                  {tr("Log in")}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
