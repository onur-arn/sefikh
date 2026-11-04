import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getT } from "@/i18n/server";

// Textes juridiques types — à faire valider par un juriste avant la mise en ligne.
const PAGES: Record<string, { title: string; updated: string; sections: [string, string][] }> = {
  terms: {
    title: "Terms and conditions",
    updated: "26 October 2026",
    sections: [
      ["1. Purpose", "These terms govern the use of SEFIKH, a platform connecting creative professionals (architects, designers, hoteliers, private clients) with makers (artisans, workshops, manufacturers, material suppliers)."],
      ["2. Accounts", "You must provide accurate information and keep your password confidential. Each account is personal. Makers guarantee that the work shown in their portfolio is their own or that they hold the rights to publish it."],
      ["3. Role of SEFIKH", "SEFIKH is an intermediary: contracts for the supply of goods or services are concluded directly between creatives and makers. SEFIKH takes no commission on these projects and is not a party to them."],
      ["4. Subscriptions", "Paid plans are billed monthly. Plans with a 12-month commitment are billed monthly over a minimum period of 12 months; cancellation takes effect at the end of the commitment. Plans without commitment can be cancelled at any time and remain active until the end of the paid period. Payments are processed by Stripe."],
      ["5. Acceptable use", "Spam, unsolicited commercial messages, harassment, illegal content and attempts to circumvent usage limits are forbidden and may lead to account suspension."],
      ["6. Content", "You keep ownership of the content you publish and grant SEFIKH a licence to display it on the platform and in its promotion, for as long as it is online."],
      ["7. Liability", "SEFIKH does its best to keep the service available and accurate but cannot guarantee the quality of the work carried out by makers."],
      ["8. Governing law", "These terms are governed by French law. Any dispute will be submitted to the competent courts of Paris, subject to mandatory consumer protection rules."],
    ],
  },
  privacy: {
    title: "Privacy policy",
    updated: "26 October 2026",
    sections: [
      ["Data controller", "SEFIKH is responsible for the processing of your personal data. Contact: privacy@sefikh.com."],
      ["Data we collect", "Account data (name, e-mail, password hash), profile data, projects, messages and files you share, search history, billing data (handled by Stripe — we never store card numbers) and technical logs."],
      ["Why we use it", "To provide the service (contract), to secure the platform and produce anonymised market statistics (legitimate interest), to send transactional e-mails, and to comply with accounting obligations (legal obligation)."],
      ["Retention", "Account data is kept while your account is active and deleted when you delete your account. Invoices are kept 10 years as required by law. Search logs used for statistics are anonymised."],
      ["Your rights", "You can access, correct, export (Settings → Download my data) and delete your data (Settings → Delete my account). You can also object to processing and lodge a complaint with the CNIL."],
      ["Sub-processors", "Hosting provider, Stripe (payments), e-mail delivery provider, Anthropic (automatic translation and assistant: only the text concerned is sent). Data may be transferred outside the EU under appropriate safeguards."],
    ],
  },
  cookies: {
    title: "Cookie policy",
    updated: "26 October 2026",
    sections: [
      ["Strictly necessary cookies", "sefikh_session keeps you logged in (30 days). sefikh_vid is an anonymous identifier used to apply free search quotas and count unique visits. sefikh_locale remembers your language (1 year). These cookies are essential and do not require consent."],
      ["No advertising cookies", "SEFIKH does not use advertising or third-party tracking cookies. If audience measurement is added later, it will be configured to be exempt from consent or a consent banner will be displayed."],
      ["Payment", "When you pay, Stripe may set its own cookies to prevent fraud, on its own pages."],
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((page) => ({ page }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[page]">): Promise<Metadata> {
  const p = PAGES[(await params).page];
  const tr = await getT();
  return p ? { title: tr(p.title) } : {};
}

export default async function LegalPage({ params }: PageProps<"/legal/[page]">) {
  const tr = await getT();
  const p = PAGES[(await params).page];
  if (!p) notFound();
  return (
    <article className="container-x max-w-3xl py-16">
      <p className="eyebrow">{tr("Legal")}</p>
      <h1 className="display mt-3 text-5xl">{tr(p.title)}</h1>
      <p className="mt-2 text-sm text-muted">{tr("Last updated: {updated}", { updated: p.updated })}</p>
      <div className="mt-10 space-y-8">
        {p.sections.map(([h, t]) => (
          <section key={h}>
            <h2 className="text-lg font-semibold">{tr(h)}</h2>
            <p className="mt-2 leading-relaxed text-ink-soft">{tr(t)}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
