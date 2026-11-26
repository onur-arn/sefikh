import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { activeSubscription } from "@/lib/billing";
import { db } from "@/lib/db";
import { simulatedPayments } from "@/lib/env";
import { PlanPicker } from "@/components/marketing/plan-picker";
import { cn } from "@/lib/utils";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return {
    title: tr("Memberships"),
    description: tr("Plans for creatives (Free, Pro, Studio) and artisans (Pro, Visibility, Intelligence)."),
  };
}

/** Abonnements (v2) : la FAQ a sa propre page, accessible depuis le pied de page. */
export default async function PricingPage({ searchParams }: PageProps<"/subscription">) {
  const tr = await getT();
  const sp = await searchParams;
  const user = await getCurrentUser();
  const audience = sp.for === "pro" || (!sp.for && user?.role === "PRO") ? "PRO" : "CLIENT";
  const [sub, company] = await Promise.all([
    user ? activeSubscription(user.id) : null,
    user?.role === "PRO" ? db.company.findUnique({ where: { userId: user.id }, select: { independent: true } }) : null,
  ]);

  return (
    <div className="container-x pb-24 pt-14">
      <header className="grid gap-4 lg:grid-cols-12">
        <p className="kicker self-start lg:col-span-3">{tr("Memberships")}</p>
        <div className="lg:col-span-9">
          <h1 className="display text-5xl">{tr("Find your place within SEFIKH.")}</h1>
          <p className="mt-4 max-w-xl text-[15px] text-ink-soft">
            {audience === "CLIENT"
              ? tr("For architects, interior designers and creative professionals: free to explore, then Pro and Studio to identify, source, save and connect.")
              : tr("For artisans, workshops and manufacturers: a complete professional presence, seen by the creatives who are looking for your know-how.")}
          </p>
        </div>
      </header>

      {sp.canceled && <p className="mx-auto mt-8 max-w-md bg-sand px-4 py-3 text-center text-sm">{tr("Payment cancelled — you have not been charged.")}</p>}
      {(sp.reason === "limit" || sp.reason === "locked") && (
        <p className="mx-auto mt-8 max-w-md bg-sand px-4 py-3 text-center text-sm">{tr(sp.reason === "limit" ? "You've used your free searches" : "Names and contact details are reserved for Pro and Studio plans. Choose a plan to discover these makers and write to them.")}</p>
      )}

      <div className="mt-12 flex gap-6 border-b border-line">
        {[
          ["CLIENT", tr("For creatives"), "/subscription?for=creative"],
          ["PRO", tr("For artisans"), "/subscription?for=pro"],
        ].map(([a, label, href]) => (
          <Link key={a} href={href!} scroll={false} className={cn("-mb-px border-b py-3 font-mono text-[11.5px] uppercase tracking-[0.05em]", audience === a ? "border-brass text-ink" : "border-transparent text-muted hover:text-ink")}>
            {label}
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <PlanPicker key={audience} audience={audience} currentPlan={user?.plan ?? null} currentTerm={sub?.term ?? null} loggedInRole={user?.role ?? null} independent={!!company?.independent} />
      </div>

      <p className="folio mt-8">
        {tr("All prices include VAT.")}{" "}
        <Link href="/faq" className="underline underline-offset-4 hover:text-ink">
          {tr("Questions? Read our FAQ")}
        </Link>
        {simulatedPayments && <span className="mt-1 block text-brass-dark">{tr("Development mode: Stripe is not configured, payments are simulated.")}</span>}
      </p>
    </div>
  );
}
