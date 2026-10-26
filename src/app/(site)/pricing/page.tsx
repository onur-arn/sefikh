import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { activeSubscription, foundingSeatsLeft } from "@/lib/billing";
import { simulatedPayments } from "@/lib/env";
import { PlanPicker } from "@/components/marketing/plan-picker";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Plans for creatives (Free, Pro, Studio) and makers (Essential, Pro, Visibility, Intelligence, Founding Partner). No commission on projects.",
};

const FAQ = [
  ["Does SEFIKH take a commission on projects?", "Never. SEFIKH does not take any commission or percentage on projects conducted through the platform: you only pay your subscription."],
  ["What does the 12-month commitment mean?", "You are billed monthly at a reduced price and commit for 12 months. You can cancel at any time; the cancellation takes effect at the end of the commitment period."],
  ["Which payment methods are accepted?", "Cards (Visa, Mastercard, American Express) everywhere, plus local methods depending on your country such as SEPA Direct Debit, Bancontact or iDEAL. Payments are processed securely by Stripe."],
  ["Can I change plan later?", "Yes. Upgrades are applied immediately with a prorated amount; downgrades apply at the end of the current period."],
  ["Will I get invoices?", "Yes, every payment generates an invoice available in your billing space, with your company details and VAT number."],
];

export default async function PricingPage({ searchParams }: PageProps<"/pricing">) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const audience = sp.for === "pro" || (!sp.for && user?.role === "PRO") ? "PRO" : "CLIENT";
  const [sub, seats] = await Promise.all([user ? activeSubscription(user.id) : null, foundingSeatsLeft()]);

  return (
    <div className="container-x pb-24 pt-14">
      <header className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Monthly subscription principle</p>
        <h1 className="display mt-4 text-5xl sm:text-6xl">One platform, two ways to use it.</h1>
        <p className="mt-4 text-muted">Free to explore, search and discover. Pro and Studio to identify, source, save, collaborate and connect.</p>
      </header>

      {sp.canceled && <p className="mx-auto mt-8 max-w-md rounded-xl bg-sand px-4 py-3 text-center text-sm">Payment cancelled — you have not been charged.</p>}
      {sp.reason === "image-limit" && <p className="mx-auto mt-8 max-w-md rounded-xl bg-brass-light/60 px-4 py-3 text-center text-sm">You&apos;ve used your free image searches for this month.</p>}

      <div className="mx-auto mt-10 flex w-fit gap-1 rounded-full bg-sand p-1">
        {[
          ["CLIENT", "For creatives", "/pricing?for=creative"],
          ["PRO", "For makers", "/pricing?for=pro"],
        ].map(([a, label, href]) => (
          <Link key={a} href={href!} scroll={false} className={cn("rounded-full px-6 py-2.5 text-sm font-medium", audience === a ? "bg-paper shadow-sm" : "text-muted hover:text-ink")}>
            {label}
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

      <p className="mt-8 text-center text-[13px] text-muted">
        Prices include VAT. *SEFIKH does not take any commission or percentage on projects conducted through the platform.
        {simulatedPayments && <span className="mt-1 block text-brass-dark">Development mode: Stripe is not configured, payments are simulated.</span>}
      </p>

      <section className="mx-auto mt-24 max-w-3xl">
        <h2 className="display text-center text-4xl">Questions</h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium">
                {q}
                <span className="text-xl text-muted transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
