import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlaskConical, Lock } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { simulatedPayments } from "@/lib/env";
import { LAUNCH_DISCOUNT, planName, planPrice, PLANS, type PlanId, type Term } from "@/lib/plans";
import { isIndependent } from "@/lib/billing";
import { SimulatedCheckoutForm } from "./form";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Checkout (test mode)"), robots: { index: false } };
}

/** Paiement simulé : uniquement en développement, quand Stripe n'est pas configuré. */
export default async function SimulateCheckoutPage({ searchParams }: PageProps<"/checkout/simulate">) {
  const tr = await getT();
  if (!simulatedPayments) notFound();
  const user = await requireUser();
  const { plan, term } = await searchParams;
  const p = PLANS[plan as PlanId];
  const t = (term === "MONTHLY" ? "MONTHLY" : "ANNUAL") as Term;
  if (!p || p.hidden) notFound();
  const price = planPrice(p, t, p.audience === "PRO" && (await isIndependent(user.id)));
  if (!price) notFound();
  // Offre de lancement : −20 % sur le premier mois d'un abonnement mensuel.
  const today = t === "MONTHLY" ? (price * (100 - LAUNCH_DISCOUNT.percent)) / 100 : price;
  const name = planName(p, tr);

  return (
    <div className="container-x grid max-w-5xl gap-10 py-14 lg:grid-cols-2">
      <div>
        <p className="eyebrow">{tr("Order summary")}</p>
        <h1 className="display mt-3 text-4xl">{tr("SEFIKH {name}", { name })}</h1>
        <p className="mt-2 text-muted">{tr(p.tagline)}</p>
        <div className="mt-8 border border-line bg-paper p-6">
          <div className="flex justify-between text-sm">
            <span>{name} — {t === "ANNUAL" ? tr("Annual billing") : tr("Monthly billing")}</span>
            <span className="font-semibold">{t === "ANNUAL" ? tr("{amount} / year", { amount: tr.money(price * 100) }) : tr("{amount} / month", { amount: tr.money(price * 100) })}</span>
          </div>
          {t === "MONTHLY" && (
            <div className="mt-3 flex justify-between text-sm text-brass">
              <span>{tr("Launch offer")} · −{LAUNCH_DISCOUNT.percent} %</span>
              <span>−{tr.money(Math.round((price - today) * 100))}</span>
            </div>
          )}
          <div className="mt-3 flex justify-between border-t border-line pt-3 text-sm text-muted">
            <span>{tr("Billed today (incl. VAT)")}</span>
            <span className="font-semibold text-ink">{tr.money(Math.round(today * 100))}</span>
          </div>
        </div>
        <p className="mt-6 flex items-start gap-2 bg-brass-light/50 p-4 text-[13px]">
          <FlaskConical className="mt-0.5 size-4 shrink-0" />
          {tr("Test mode: Stripe keys are not configured, so this checkout is simulated and no real payment is taken. Add STRIPE_SECRET_KEY to .env to use Stripe Checkout.")}</p>
      </div>
      <div className="border border-line bg-paper p-8">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Lock className="size-4" /> {" "}{tr("Payment details")}</p>
        <SimulatedCheckoutForm plan={p.id} term={t} email={user.email} />
      </div>
    </div>
  );
}
