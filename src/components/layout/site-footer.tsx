import Link from "next/link";
import { Logo } from "@/components/ui/misc";
import { LocaleSwitcher } from "./locale-switcher";
import { NewsletterForm } from "./newsletter-form";
import { getT } from "@/i18n/server";

const COLUMNS = [
  { title: "Platform", links: [["Explore makers", "/search"], ["Trends & Insights", "/insights"], ["Pricing", "/pricing"]] },
  { title: "For makers", links: [["Join as a maker", "/join"], ["Business plans", "/pricing?for=pro"], ["Brand visibility", "/pricing?for=pro"]] },
  { title: "Company", links: [["About us", "/about"], ["Journal", "/journal"], ["Join our team", "/contact?topic=Careers"], ["Contact us", "/contact"]] },
  { title: "Resources", links: [["Terms and conditions", "/legal/terms"], ["Privacy policy", "/legal/privacy"], ["Cookie policy", "/legal/cookies"]] },
] as const;

export async function SiteFooter() {
  const tr = await getT();
  return (
    <footer className="mt-auto border-t border-line bg-paper text-ink-soft">
      <div className="container-x grid gap-12 py-16 lg:grid-cols-[1.3fr_2fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
            {tr("Search Engine For Know-How. The sourcing platform connecting architects and designers with artisans, workshops and manufacturers.")}</p>
          <NewsletterForm />
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{tr(col.title)}</p>
              <ul className="space-y-2.5">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="link-underline text-sm text-ink-soft hover:text-ink">
                      {tr(label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{tr("© {v} SEFIKH. All rights reserved.", { v: new Date().getFullYear() })}</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <p>{tr("SEFIKH takes no commission on projects conducted through the platform.")}</p>
            <LocaleSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
