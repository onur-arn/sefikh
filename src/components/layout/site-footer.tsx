import Link from "next/link";
import { LocaleSwitcher } from "./locale-switcher";
import { NewsletterForm } from "./newsletter-form";
import { getT } from "@/i18n/server";

const COLUMNS = [
  { title: "Platform", links: [["Trends & Insights", "/insights"], ["Journal", "/journal"], ["Pricing", "/pricing"]] },
  { title: "For makers", links: [["Join as a maker", "/join"], ["Business plans", "/pricing?for=pro"]] },
  { title: "Company", links: [["About us", "/about"], ["Join our team", "/contact?topic=Careers"], ["Contact us", "/contact"]] },
  { title: "Resources", links: [["Terms and conditions", "/legal/terms"], ["Privacy policy", "/legal/privacy"], ["Cookie policy", "/legal/cookies"]] },
] as const;

export async function SiteFooter() {
  const tr = await getT();
  return (
    <footer className="mt-auto border-t border-line bg-ivory text-ink-soft">
      <div className="container-x grid gap-12 py-14 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="display max-w-xs text-3xl">{tr("A directory of hands, materials and know-how.")}</p>
          <NewsletterForm />
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="eyebrow mb-4">{tr(col.title)}</p>
              <ul className="space-y-2">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="link-underline text-[14px] hover:text-ink">
                      {tr(label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="container-x overflow-hidden border-t border-line pt-4">
        <p aria-hidden className="display select-none text-center text-[23vw] leading-[0.82] tracking-[0.02em] text-ink">
          SEFIKH
        </p>
      </div>
      <div className="container-x folio flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5">
        <p>{tr("© {v} SEFIKH. All rights reserved.", { v: new Date().getFullYear() })}</p>
        <p>{tr("SEFIKH takes no commission on projects conducted through the platform.")}</p>
        <LocaleSwitcher />
      </div>
    </footer>
  );
}
