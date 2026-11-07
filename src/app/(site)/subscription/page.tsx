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

const FAQ = [
  ["What does the 12-month commitment mean?", "You are billed monthly at a reduced price and commit for 12 months. You can cancel at any time; the cancellation takes effect at the end of the commitment period."],
  ["Which payment methods are accepted?", "Cards (Visa, Mastercard, American Express) everywhere, plus local methods depending on your country such as SEPA Direct Debit, Bancontact or iDEAL. Payments are processed securely by Stripe."],
  ["Can I change plan later?", "Yes. Upgrades are applied immediately with a prorated amount; downgrades apply at the end of the current period."],
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

      <section className="mt-24 grid gap-8 lg:grid-cols-12">
        <h2 className="display text-4xl lg:col-span-3">{tr("Questions")}</h2>
        <div className="divide-y divide-line border-y border-line lg:col-span-9">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-2xl">
                {tr(q)}
                <span className="text-xl text-muted transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">{tr(a)}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
