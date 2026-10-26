import Link from "next/link";
import { Logo } from "@/components/ui/misc";
import { NewsletterForm } from "./newsletter-form";

const COLUMNS = [
  { title: "Platform", links: [["Explore makers", "/search"], ["Search by image", "/search?mode=image"], ["Trends & Insights", "/insights"], ["Pricing", "/pricing"]] },
  { title: "For makers", links: [["Join as a maker", "/join"], ["Business plans", "/pricing?for=pro"], ["Brand visibility", "/pricing?for=pro"]] },
  { title: "Company", links: [["About us", "/about"], ["Journal", "/journal"], ["Join our team", "/contact?topic=Careers"], ["Contact us", "/contact"]] },
  { title: "Resources", links: [["Terms and conditions", "/legal/terms"], ["Privacy policy", "/legal/privacy"], ["Cookie policy", "/legal/cookies"]] },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-espresso text-paper/80">
      <div className="container-x grid gap-12 py-16 lg:grid-cols-[1.3fr_2fr]">
        <div>
          <Logo light />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-paper/60">
            Search Engine For Know-How. The sourcing platform connecting architects and designers with artisans, workshops and manufacturers.
          </p>
          <NewsletterForm />
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-paper/40">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="link-underline text-sm text-paper/75 hover:text-paper">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-paper/10">
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-paper/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SEFIKH. All rights reserved.</p>
          <p>SEFIKH takes no commission on projects conducted through the platform.</p>
        </div>
      </div>
    </footer>
  );
}
