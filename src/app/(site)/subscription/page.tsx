import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { activeSubscription, foundingSeatsLeft } from "@/lib/billing";
import { simulatedPayments } from "@/lib/env";
import { PlanPicker } from "@/components/marketing/plan-picker";
import { cn } from "@/lib/utils";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return {
  title: tr("Subscription"),
  description: tr("Plans for creatives (Free, Pro, Studio) and makers (Pro, Visibility, Intelligence, Founding Partner)."),
};
}

// Questions par onglet ; les dernières (engagement, paiement, factures) valent pour tous.
const CLIENT_FAQ = [
  ["What does the Free plan include?", "A free account gives you 3 searches in total — by description, image or category — once your e-mail address is confirmed. Results show makers anonymously: craft, city, skills, availability and a selection of their work. Names, contact details and messaging come with Pro and Studio."],
  ["What is the difference between Pro and Studio?", "Pro unlocks unlimited searches, full company profiles with contact details, direct messaging and your supplier library. Studio adds cloud documents for every project, the full Trends & Insights market data, quarterly demand reporting and priority support."],
];
const MAKER_FAQ = [
  ["Why do makers need a subscription to appear?", "SEFIKH is a curated directory: only makers with an active plan appear in search results. Every profile shown is therefore complete, up to date and reachable."],
  ["When does my profile appear in search results?", "As soon as your plan is active and at least one portfolio picture is online. You can prepare your profile beforehand: it stays hidden until then."],
  ["What is the difference between Pro, Visibility and Intelligence?", "Pro gives you a complete profile with a verified badge and visibility analytics. Visibility adds a boosted ranking in search results and a place in the Content section. Intelligence adds advanced demand analysis, full market insights and quarterly demand reporting."],
  ["Who can contact me?", "Clients on the Pro and Studio plans write to you from your profile, and you reply from your SEFIKH inbox. Makers reply to requests; they cannot start new conversations."],
];
const COMMON_FAQ = [
  ["Can I cancel at any time?", "Yes. Without commitment, your plan stays active until the end of the month already paid. With the 12-month commitment, cancellation takes effect at the end of the commitment period."],
  ["What does the 12-month commitment mean?", "You are billed monthly at a reduced price and commit for 12 months. You can cancel at any time; the cancellation takes effect at the end of the commitment period."],
  ["Can I change plan later?", "Yes. Upgrades are applied immediately with a prorated amount; downgrades apply at the end of the current period."],
  ["Which payment methods are accepted?", "Cards (Visa, Mastercard, American Express) everywhere, plus local methods depending on your country such as SEPA Direct Debit, Bancontact or iDEAL. Payments are processed securely by Stripe."],
  ["Will I get invoices?", "Yes, every payment generates an invoice available in your billing space, with your company details and VAT number."],
];

export default async function PricingPage({ searchParams }: PageProps<"/subscription">) {
  const tr = await getT();
  const sp = await searchParams;
  const user = await getCurrentUser();
  const audience = sp.for === "pro" || (!sp.for && user?.role === "PRO") ? "PRO" : "CLIENT";
  const [sub, seats] = await Promise.all([user ? activeSubscription(user.id) : null, foundingSeatsLeft()]);

  return (
    <div className="container-x pb-24 pt-14">
      <header className="grid gap-4 lg:grid-cols-12">
        <p className="folio lg:col-span-3">{tr("Monthly subscription principle")}</p>
        <div className="lg:col-span-9">
          <h1 className="display text-5xl sm:text-7xl">{tr("One platform, two ways to use it.")}</h1>
          <p className="mt-4 max-w-xl text-[16px] text-ink-soft">{tr("Free to explore, search and discover. Pro and Studio to identify, source, save, collaborate and connect.")}</p>
        </div>
      </header>

      {sp.canceled && <p className="mx-auto mt-8 max-w-md rounded-xl bg-sand px-4 py-3 text-center text-sm">{tr("Payment cancelled — you have not been charged.")}</p>}
      {(sp.reason === "limit" || sp.reason === "locked") && (
        <p className="mx-auto mt-8 max-w-md rounded-xl bg-sand px-4 py-3 text-center text-sm">{tr(sp.reason === "limit" ? "You've used your free searches" : "Names and contact details are reserved for Pro and Studio plans. Choose a plan to discover these makers and write to them.")}</p>
      )}

      <div className="mt-12 flex gap-6 border-b border-line">
        {[
          ["CLIENT", tr("For creatives"), "/subscription?for=creative"],
          ["PRO", tr("For makers"), "/subscription?for=pro"],
        ].map(([a, label, href]) => (
          <Link key={a} href={href!} scroll={false} className={cn("-mb-px border-b py-3 font-mono text-[12px] uppercase tracking-[0.05em]", audience === a ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink")}>
            {tr(label)}
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <PlanPicker
          key={audience}
          audience={audience}
          currentPlan={user?.plan ?? null}
          currentTerm={sub?.term ?? null}
          loggedInRole={user?.role ?? null}
          foundingSeatsLeft={seats}
        />
      </div>

      <p className="folio mt-8">
        {tr("Prices include VAT.")}{" "}{simulatedPayments && <span className="mt-1 block text-brass-dark">{tr("Development mode: Stripe is not configured, payments are simulated.")}</span>}
      </p>

      <section className="mt-28 grid gap-10 border-t border-ink/70 pt-10 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <h2 className="display text-4xl sm:text-5xl">{tr("Frequently asked questions")}</h2>
          <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-muted">
            {tr("Another question?")}{" "}
            <Link href="/contact" className="text-ink underline underline-offset-4 hover:text-brass">
              {tr("Contact us")}
            </Link>
          </p>
        </div>
        <div className="border-t border-line lg:col-span-9 lg:border-t-0">
          {[...(audience === "PRO" ? MAKER_FAQ : CLIENT_FAQ), ...COMMON_FAQ].map(([q, a], i) => (
            <details key={q} name="faq" className="group border-b border-line">
              {/* list-none + marqueur webkit masqué : pas de triangle natif (Safari). */}
              <summary className="grid cursor-pointer list-none grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-4 py-6 [&::-webkit-details-marker]:hidden">
                <span className="folio">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display text-2xl leading-snug transition-colors group-hover:text-brass sm:text-[1.7rem]">{tr(q)}</span>
                <span aria-hidden className="relative size-3.5 self-center">
                  <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-ink" />
                  <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-ink transition-transform duration-300 group-open:scale-y-0" />
                </span>
              </summary>
              <p className="-mt-1 max-w-2xl pb-7 pl-[3.5rem] text-[15px] leading-relaxed text-ink-soft">{tr(a)}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
