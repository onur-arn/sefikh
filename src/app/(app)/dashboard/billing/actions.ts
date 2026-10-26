"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { activateSubscription, BillingError, cancelSubscription, priceFor, resumeSubscription } from "@/lib/billing";
import { db } from "@/lib/db";
import { simulatedPayments } from "@/lib/env";
import { PLANS, type PlanId, type Term } from "@/lib/plans";

export async function simulateCheckoutAction(planId: PlanId, term: Term) {
  if (!simulatedPayments) return { error: "Simulated payments are disabled." };
  const user = await requireUser();
  const plan = PLANS[planId];
  if (!plan || plan.audience !== (user.role === "PRO" ? "PRO" : "CLIENT")) return { error: "Invalid plan." };
  const amount = priceFor(planId, term);
  await activateSubscription({ userId: user.id, planId, term, provider: "simulated", currentPeriodEnd: new Date(Date.now() + 30 * 86400_000) });
  await db.payment.create({ data: { userId: user.id, amount, status: "PAID", description: `SEFIKH ${plan.name} — first month (simulated)` } });
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
