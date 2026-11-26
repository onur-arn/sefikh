import Link from "next/link";
import { LocaleRow } from "./locale-switcher";
import { getT } from "@/i18n/server";

// Pied de page v2 (cahier de la cliente du 24/11/2026).
const COLUMNS = [
  { title: "Explore", links: [["Explore the craft", "/search"], ["Trends & Insights", "/insights"], ["The Journal", "/journal"]] },
  { title: "For professionals", links: [["Join as an artisan", "/join"], ["Business solutions", "/subscription?for=pro"]] },
  { title: "About", links: [["Our story", "/about"], ["Contact", "/contact"], ["FAQ", "/faq"]] },
  { title: "Legal", links: [["Terms & Conditions", "/legal/terms"], ["Privacy Policy", "/legal/privacy"], ["Cookie Policy", "/legal/cookies"]] },
] as const;

export async function SiteFooter() {
  const tr = await getT();
  return (
    <footer className="mt-auto border-t border-brass/50 bg-ivory text-ink-soft">
      <div className="container-x grid gap-12 py-14 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="display max-w-xs text-2xl text-ink">{tr("Where Ideas Take Shape")}</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="eyebrow mb-4">{tr(col.title)}</p>
              <ul className="space-y-2">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="link-underline text-[13.5px] hover:text-ink">
                      {tr(label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="container-x folio flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line py-5">
        <p>{tr("© {v} SEFIKH. All rights reserved.", { v: new Date().getFullYear() })}</p>
        <LocaleRow />
      </div>
    </footer>
  );
}
