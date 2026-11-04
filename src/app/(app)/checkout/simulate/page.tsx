import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlaskConical, Lock } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { simulatedPayments } from "@/lib/env";
import { PLANS, type PlanId, type Term } from "@/lib/plans";
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
  const price = p?.prices[t];
  if (!p || !price) notFound();

  return (
    <div className="container-x grid max-w-5xl gap-10 py-14 lg:grid-cols-2">
      <div>
        <p className="eyebrow">{tr("Order summary")}</p>
        <h1 className="display mt-3 text-5xl">{tr("SEFIKH {name}", { name: p.name })}</h1>
        <p className="mt-2 text-muted">{tr(p.tagline)}</p>
        <div className="mt-8 rounded-2xl border border-line bg-paper p-6">
          <div className="flex justify-between text-sm">
            <span>{p.name} — {t === "ANNUAL" ? tr("12-month commitment") : tr("no commitment")}</span>
            <span className="font-semibold">{tr.money(price * 100)} / month</span>
          </div>
          <div className="mt-3 flex justify-between border-t border-line pt-3 text-sm text-muted">
            <span>{tr("Billed today")}</span>
            <span>{tr.money(price * 100)}</span>
          </div>
        </div>
        <p className="mt-6 flex items-start gap-2 rounded-xl bg-brass-light/50 p-4 text-[13px]">
          <FlaskConical className="mt-0.5 size-4 shrink-0" />
          {tr("Test mode: Stripe keys are not configured, so this checkout is simulated and no real payment is taken. Add STRIPE_SECRET_KEY to .env to use Stripe Checkout.")}</p>
      </div>
      <div className="rounded-3xl border border-line bg-paper p-8">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Lock className="size-4" /> {" "}{tr("Payment details")}</p>
        <SimulatedCheckoutForm plan={p.id} term={t} email={user.email} />
      </div>
    </div>
  );
}
