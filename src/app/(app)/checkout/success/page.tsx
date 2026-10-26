import type { Metadata } from "next";
import { CheckCircle2, Clock } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { activateSubscription, getStripe } from "@/lib/billing";
import { getPlan, type PlanId, type Term } from "@/lib/plans";
import { ButtonLink } from "@/components/ui/button";
import { daysFromNow } from "@/lib/utils";

export const metadata: Metadata = { title: "Payment confirmed", robots: { index: false } };

export default async function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  const user = await requireUser("/dashboard/billing");
  const { session_id, changed } = await searchParams;
  let confirmed = !!changed;

  // Confirmation immédiate côté serveur (le webhook reste la source de vérité, l'activation est idempotente).
  const stripe = getStripe();
  if (stripe && typeof session_id === "string") {
    const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ["subscription"] }).catch(() => null);
    if (session && session.client_reference_id === user.id && session.status === "complete" && session.subscription && typeof session.subscription !== "string") {
      const { planId, term } = session.metadata as { planId: PlanId; term: Term };
      const sub = session.subscription;
      const end = (sub.items.data[0] as unknown as { current_period_end?: number })?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end;
      await activateSubscription({ userId: user.id, planId, term, provider: "stripe", stripeSubscriptionId: sub.id, stripeCheckoutId: session.id, currentPeriodEnd: end ? new Date(end * 1000) : daysFromNow(30) });
      confirmed = true;
    }
  } else if (!stripe) {
    confirmed = true;
  }

  const plan = getPlan(user.plan);
  return (
    <div className="container-x flex min-h-[70vh] max-w-xl flex-col items-center justify-center py-16 text-center">
      {confirmed ? <CheckCircle2 className="size-14 text-success" strokeWidth={1.3} /> : <Clock className="size-14 text-brass" strokeWidth={1.3} />}
      <h1 className="display mt-6 text-5xl">{confirmed ? "Thank you!" : "Payment processing"}</h1>
      <p className="mt-4 text-muted">
        {confirmed
          ? `Your ${plan.name} plan is now active. A confirmation e-mail and your invoice are on their way.`
          : "Your payment is being confirmed by your bank. Your plan will be activated within a few minutes — you'll receive an e-mail."}
      </p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/dashboard">Go to my dashboard</ButtonLink>
        <ButtonLink href="/dashboard/billing" variant="secondary">
          Billing
        </ButtonLink>
      </div>
    </div>
  );
}
