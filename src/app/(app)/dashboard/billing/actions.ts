"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { activateSubscription, BillingError, cancelSubscription, isIndependent, priceFor, resumeSubscription } from "@/lib/billing";
import { db } from "@/lib/db";
import { simulatedPayments } from "@/lib/env";
import { LAUNCH_DISCOUNT, planName, PLANS, type PlanId, type Term } from "@/lib/plans";
import { getT } from "@/i18n/server";

export async function simulateCheckoutAction(planId: PlanId, term: Term) {
  if (!simulatedPayments) return { error: "Simulated payments are disabled." };
  const user = await requireUser();
  const plan = PLANS[planId];
  if (!plan || plan.hidden || plan.audience !== (user.role === "PRO" ? "PRO" : "CLIENT")) return { error: "Invalid plan." };
  const full = priceFor(planId, term, plan.audience === "PRO" && (await isIndependent(user.id)));
  const end = new Date();
  end.setMonth(end.getMonth() + (term === "ANNUAL" ? 12 : 1));
  await activateSubscription({ userId: user.id, planId, term, provider: "simulated", currentPeriodEnd: end });
  const tr = await getT();
  // Offre de lancement : −20 % sur le premier mois d'un abonnement mensuel (le 2e est remisé au renouvellement).
  const amount = term === "MONTHLY" ? Math.round((full * (100 - LAUNCH_DISCOUNT.percent)) / 100) : full;
  const description = term === "ANNUAL" ? tr("SEFIKH {plan} — first year (simulated)", { plan: planName(plan, tr) }) : tr("SEFIKH {plan} — first month, launch offer −20% (simulated)", { plan: planName(plan, tr) });
  await db.payment.create({ data: { userId: user.id, amount, status: "PAID", description } });
  redirect("/checkout/success");
}

export async function cancelAction() {
  const user = await requireUser();
  try {
    await cancelSubscription(user.id);
  } catch (e) {
    return { error: e instanceof BillingError ? e.message : "Cancellation failed." };
  }
  revalidatePath("/dashboard/billing");
  return { ok: true };
}

export async function resumeAction() {
  const user = await requireUser();
  try {
    await resumeSubscription(user.id);
  } catch (e) {
    return { error: e instanceof BillingError ? e.message : "Could not resume." };
  }
  revalidatePath("/dashboard/billing");
  return { ok: true };
}
