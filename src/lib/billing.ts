import "server-only";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { ensureInvoiceNumber } from "@/lib/invoices";
import { translatorFor } from "@/i18n/server";
import { env, simulatedPayments } from "@/lib/env";
import { sendEmail } from "@/lib/mail";
import { paymentFailedTemplate, subscriptionTemplate } from "@/lib/mail/templates";
import { notify } from "@/lib/notifications";
import { defaultPlanFor, getPlan, LAUNCH_DISCOUNT, planName, planPrice, PLANS, type PlanId, type Term } from "@/lib/plans";
import { hasListedPlan } from "@/lib/access";

let stripe: Stripe | null = null;
export function getStripe() {
  if (!env.stripeSecretKey) return null;
  stripe ??= new Stripe(env.stripeSecretKey, { appInfo: { name: "SEFIKH" } });
  return stripe;
}

export class BillingError extends Error {}

const TERM_LABEL: Record<Term, string> = { ANNUAL: "annual billing", MONTHLY: "monthly billing" };

/** Montant TTC en centimes pour une période de facturation (un mois ou un an). */
export function priceFor(planId: PlanId, term: Term, independent = false) {
  const euros = planPrice(PLANS[planId], term, independent);
  if (euros == null) throw new BillingError("This plan is not available for this billing term.");
  return euros * 100;
}

/** Les artisans indépendants paient le tarif réduit de leur offre. */
export async function isIndependent(userId: string) {
  const c = await db.company.findUnique({ where: { userId }, select: { independent: true } });
  return !!c?.independent;
}

/** Montant affiché avec sa période (« 149 € / mois », « 1 490 € / an »). */
export function amountWithPeriod(tr: ReturnType<typeof translatorFor>, cents: number, term: Term) {
  return `${tr.money(cents)} / ${term === "ANNUAL" ? tr("year") : tr("month")}`;
}

/** Coupon Stripe de l'offre de lancement (−20 % sur les 2 premiers mois), créé à la volée. */
async function ensureLaunchCoupon(s: Stripe) {
  const id = `sefikh_launch_${LAUNCH_DISCOUNT.percent}_${LAUNCH_DISCOUNT.months}m`;
  try {
    return (await s.coupons.retrieve(id)).id;
  } catch {
    return (await s.coupons.create({ id, percent_off: LAUNCH_DISCOUNT.percent, duration: "repeating", duration_in_months: LAUNCH_DISCOUNT.months, name: "SEFIKH — launch offer" })).id;
  }
}

/** Les produits/prix Stripe sont créés à la volée (lookup_key stable) : aucune config manuelle du dashboard. */
const priceCache = new Map<string, string>();
async function ensureStripePrice(s: Stripe, planId: PlanId, term: Term, independent: boolean) {
  const lookup = `sefikh_${planId}_${term}_${independent ? "independent" : "standard"}_v2`.toLowerCase();
  const cached = priceCache.get(lookup);
  if (cached) return cached;
  const existing = await s.prices.list({ lookup_keys: [lookup], active: true, limit: 1 });
  let id = existing.data[0]?.id;
  if (!id) {
    const plan = PLANS[planId];
    const created = await s.prices.create({
      currency: "eur",
      unit_amount: priceFor(planId, term, independent),
      recurring: { interval: term === "ANNUAL" ? "year" : "month" },
      lookup_key: lookup,
      product_data: { name: `SEFIKH ${plan.audience === "PRO" ? "Business" : "Creative"} — ${plan.name} (${TERM_LABEL[term]})`, metadata: { planId, term } },
      metadata: { planId, term },
    });
    id = created.id;
  }
  priceCache.set(lookup, id);
  return id;
}

async function ensureCustomer(s: Stripe, user: { id: string; email: string; name: string; stripeCustomerId: string | null }) {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const customer = await s.customers.create({ email: user.email, name: user.name, metadata: { userId: user.id } });
  await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

export async function activeSubscription(userId: string) {
  return db.subscription.findFirst({
    where: { userId, status: { in: ["ACTIVE", "PAST_DUE"] } },
    orderBy: { createdAt: "desc" },
  });
}

export async function foundingSeatsLeft() {
  const used = await db.subscription.count({ where: { plan: "PRO_FOUNDING", status: { in: ["ACTIVE", "PAST_DUE"] } } });
  return Math.max(0, (PLANS.PRO_FOUNDING.seatsLimit ?? 0) - used);
}

/** Démarre un paiement ; renvoie l'URL vers laquelle rediriger l'utilisateur. */
export async function startCheckout(
  user: { id: string; email: string; name: string; role: string; stripeCustomerId: string | null },
  planId: PlanId,
  term: Term,
) {
  const plan = PLANS[planId];
  if (!plan) throw new BillingError("Unknown plan.");
  if (plan.audience !== (user.role === "PRO" ? "PRO" : "CLIENT")) throw new BillingError("This plan is not available for your account type.");
  const independent = plan.audience === "PRO" && (await isIndependent(user.id));
  const amount = priceFor(planId, term, independent);
  if (amount === 0) throw new BillingError("This plan is free — no payment needed.");
  if (plan.hidden) throw new BillingError("This plan is no longer available.");
  if (planId === "PRO_FOUNDING" && (await foundingSeatsLeft()) === 0) throw new BillingError("The Founding Partner programme is full.");

  const current = await activeSubscription(user.id);
  if (current?.plan === planId && current.term === term) throw new BillingError("You are already subscribed to this plan.");

  const s = getStripe();
  if (!s) {
    if (!simulatedPayments) throw new BillingError("Payments are not configured.");
    return `/checkout/simulate?plan=${planId}&term=${term}`;
  }

  const priceId = await ensureStripePrice(s, planId, term, independent);

  // Changement d'offre sur un abonnement Stripe existant : mise à jour avec prorata.
  if (current?.stripeSubscriptionId && current.provider === "stripe") {
    const sub = await s.subscriptions.retrieve(current.stripeSubscriptionId);
    await s.subscriptions.update(sub.id, {
      items: [{ id: sub.items.data[0]!.id, price: priceId }],
      proration_behavior: "create_prorations",
      cancel_at_period_end: false,
      metadata: { userId: user.id, planId, term },
    });
    await applyPlanChange(current.id, user.id, planId, term, amount);
    return `/checkout/success?changed=1`;
  }

  const customer = await ensureCustomer(s, user);
  // Offre de lancement sur les abonnements mensuels (Stripe n'accepte pas remise + codes promo ensemble).
  const launch = term === "MONTHLY" ? await ensureLaunchCoupon(s) : null;
  const session = await s.checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    ...(launch ? { discounts: [{ coupon: launch }] } : { allow_promotion_codes: true }),
    billing_address_collection: "auto",
    customer_update: { address: "auto", name: "auto" },
    // Les moyens de paiement proposés (CB, SEPA, Bancontact, iDEAL…) s'adaptent au pays du client
    // selon la configuration « automatic payment methods » du dashboard Stripe.
    subscription_data: { metadata: { userId: user.id, planId, term } },
    metadata: { userId: user.id, planId, term },
    success_url: `${env.appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.appUrl}/subscription?canceled=1`,
  });
  await db.subscription.create({
    data: { userId: user.id, plan: planId, term, status: "INCOMPLETE", provider: "stripe", stripeCheckoutId: session.id, amount },
  });
  return session.url!;
}

async function applyPlanChange(subscriptionId: string, userId: string, planId: PlanId, term: Term, amount: number) {
  await db.subscription.update({
    where: { id: subscriptionId },
    data: { plan: planId, term, amount, cancelAtPeriodEnd: false, ...(term === "ANNUAL" ? { commitmentEndsAt: addMonths(new Date(), 12) } : {}) },
  });
  const user = await db.user.update({ where: { id: userId }, data: { plan: planId } });
  const tr = translatorFor(user.locale);
  await notify(userId, { type: "BILLING", title: tr("You are now on {planName}", { planName: planName(PLANS[planId], tr) }), link: "/dashboard/billing" });
}

function addMonths(d: Date, n: number) {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

/** Active un abonnement (webhook Stripe ou paiement simulé). Idempotent. */
export async function activateSubscription(opts: {
  userId: string;
  planId: PlanId;
  term: Term;
  provider: "stripe" | "simulated";
  stripeSubscriptionId?: string;
  stripeCheckoutId?: string;
  currentPeriodEnd: Date;
}) {
  const amount = priceFor(opts.planId, opts.term, PLANS[opts.planId].audience === "PRO" && (await isIndependent(opts.userId)));
  // Clôture d'un éventuel autre abonnement actif (un seul à la fois).
  const others = await db.subscription.findMany({
    where: { userId: opts.userId, status: { in: ["ACTIVE", "PAST_DUE"] }, NOT: opts.stripeSubscriptionId ? { stripeSubscriptionId: opts.stripeSubscriptionId } : undefined },
  });
  const s = getStripe();
  for (const o of others) {
    if (o.stripeSubscriptionId && s) await s.subscriptions.cancel(o.stripeSubscriptionId).catch(() => {});
    await db.subscription.update({ where: { id: o.id }, data: { status: "CANCELED", canceledAt: new Date() } });
  }

  const data = {
    plan: opts.planId,
    term: opts.term,
    status: "ACTIVE",
    provider: opts.provider,
    amount,
    currentPeriodEnd: opts.currentPeriodEnd,
    commitmentEndsAt: opts.term === "ANNUAL" ? addMonths(new Date(), 12) : null,
  };
  let sub = opts.stripeSubscriptionId ? await db.subscription.findUnique({ where: { stripeSubscriptionId: opts.stripeSubscriptionId } }) : null;
  if (!sub && opts.stripeCheckoutId) sub = await db.subscription.findUnique({ where: { stripeCheckoutId: opts.stripeCheckoutId } });
  if (sub?.status === "ACTIVE" && sub.stripeSubscriptionId === opts.stripeSubscriptionId) return sub; // déjà traité
  sub = sub
    ? await db.subscription.update({ where: { id: sub.id }, data: { ...data, stripeSubscriptionId: opts.stripeSubscriptionId } })
    : await db.subscription.create({ data: { ...data, userId: opts.userId, stripeSubscriptionId: opts.stripeSubscriptionId, stripeCheckoutId: opts.stripeCheckoutId } });

  const user = await db.user.update({ where: { id: opts.userId }, data: { plan: opts.planId } });
  const plan = PLANS[opts.planId];
  if (opts.planId === "PRO_PRO" || opts.planId === "PRO_VISIBILITY" || opts.planId === "PRO_INTELLIGENCE" || opts.planId === "PRO_FOUNDING") {
    await db.company.updateMany({ where: { userId: opts.userId }, data: { verified: true } });
  }
  // Le paiement rend la fiche visible dès qu'elle a au moins une photo.
  if (hasListedPlan(opts.planId)) await db.company.updateMany({ where: { userId: opts.userId, portfolio: { some: { status: "APPROVED" } } }, data: { published: true } });
  const tr = translatorFor(user.locale);
  await notify(opts.userId, { type: "BILLING", title: tr("Welcome to {planName}", { planName: planName(plan, tr) }), body: tr("Your subscription is active."), link: "/dashboard/billing" });
  const tpl = subscriptionTemplate({ name: user.name, planName: planName(plan, tr), amount: amountWithPeriod(tr, amount, opts.term), term: tr(TERM_LABEL[opts.term]) }, user.locale);
  await sendEmail({ to: user.email, ...tpl });
  return sub;
}

/** Délai avant la coupure de l'accès après un paiement refusé (mentionné sur les factures). */
export const UNPAID_GRACE_DAYS = 7;

export const suspensionDate = (pastDueSince: Date) => new Date(pastDueSince.getTime() + UNPAID_GRACE_DAYS * 86_400_000);

/**
 * Coupe l'accès des abonnés dont le paiement est refusé depuis plus de UNPAID_GRACE_DAYS jours :
 * le compte repasse sur l'offre gratuite (profil artisan masqué), l'abonnement reste « PAST_DUE »
 * pour que Stripe continue ses relances. Un paiement réussi rend l'accès (webhook invoice.paid).
 * Lancé chaque jour par le cron Vercel /api/cron/billing.
 */
export async function suspendUnpaid(now = new Date()) {
  const cutoff = new Date(now.getTime() - UNPAID_GRACE_DAYS * 86_400_000);
  const due = await db.subscription.findMany({ where: { status: "PAST_DUE", pastDueSince: { lte: cutoff } }, include: { user: true } });
  let suspended = 0;
  for (const sub of due) {
    if (sub.user.plan === defaultPlanFor(sub.user.role)) continue; // déjà coupé
    await downgrade(sub.userId);
    const tr = translatorFor(sub.user.locale);
    await notify(sub.userId, { type: "BILLING", title: tr("Subscription suspended"), body: tr("Your payment has not gone through for 7 days. Update your payment method to restore access."), link: "/dashboard/billing" });
    suspended++;
  }
  return suspended;
}

async function downgrade(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return;
  await db.user.update({ where: { id: userId }, data: { plan: defaultPlanFor(user.role) } });
}

/** Résiliation : en fin de période, ou à la fin de l'engagement de 12 mois. */
export async function cancelSubscription(userId: string) {
  const sub = await activeSubscription(userId);
  if (!sub) throw new BillingError("No active subscription.");
  const endsAt = sub.commitmentEndsAt && sub.commitmentEndsAt > new Date() ? sub.commitmentEndsAt : sub.currentPeriodEnd;
  const s = getStripe();
  if (sub.provider === "stripe" && sub.stripeSubscriptionId && s) {
    if (sub.commitmentEndsAt && sub.commitmentEndsAt > new Date()) {
      await s.subscriptions.update(sub.stripeSubscriptionId, { cancel_at: Math.floor(sub.commitmentEndsAt.getTime() / 1000) });
    } else {
      await s.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
    }
  }
  await db.subscription.update({ where: { id: sub.id }, data: { cancelAtPeriodEnd: true, currentPeriodEnd: endsAt ?? sub.currentPeriodEnd } });
  return endsAt;
}

export async function resumeSubscription(userId: string) {
  const sub = await activeSubscription(userId);
  if (!sub) throw new BillingError("No active subscription.");
  const s = getStripe();
  if (sub.provider === "stripe" && sub.stripeSubscriptionId && s) {
    await s.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: false, cancel_at: null });
  }
  await db.subscription.update({ where: { id: sub.id }, data: { cancelAtPeriodEnd: false } });
}

export async function billingPortalUrl(user: { id: string; stripeCustomerId: string | null }) {
  const s = getStripe();
  if (!s || !user.stripeCustomerId) return null;
  const session = await s.billingPortal.sessions.create({ customer: user.stripeCustomerId, return_url: `${env.appUrl}/dashboard/billing` });
  return session.url;
}

/** Abonnements simulés : expiration à échéance (le webhook Stripe s'en charge sinon). */
export async function expireSimulated(userId: string) {
  const due = await db.subscription.findMany({
    where: { userId, provider: "simulated", status: "ACTIVE", currentPeriodEnd: { lt: new Date() } },
  });
  for (const sub of due) {
    if (sub.cancelAtPeriodEnd) {
      await db.subscription.update({ where: { id: sub.id }, data: { status: "CANCELED", canceledAt: new Date() } });
      await downgrade(userId);
    } else {
      // Renouvellement simulé
      const periodEnd = addMonths(sub.currentPeriodEnd!, sub.term === "ANNUAL" ? 12 : 1);
      await db.subscription.update({ where: { id: sub.id }, data: { currentPeriodEnd: periodEnd } });
      await ensureInvoiceNumber(await db.payment.create({ data: { userId, amount: sub.amount, status: "PAID", description: `${getPlan(sub.plan).name} — renewal (simulated)`, periodStart: sub.currentPeriodEnd, periodEnd } }));
    }
  }
}

// ───────────────────────── Webhooks Stripe ─────────────────────────

type AnyObj = Record<string, unknown>;
function periodEnd(sub: Stripe.Subscription) {
  // Selon la version d'API, la fin de période est sur l'abonnement ou sur l'item.
  const raw = (sub as unknown as AnyObj).current_period_end ?? (sub.items.data[0] as unknown as AnyObj | undefined)?.current_period_end;
  return typeof raw === "number" ? new Date(raw * 1000) : addMonths(new Date(), 1);
}

function invoiceSubscriptionId(inv: Stripe.Invoice) {
  const legacy = (inv as unknown as AnyObj).subscription;
  if (typeof legacy === "string") return legacy;
  const parent = (inv as unknown as { parent?: { subscription_details?: { subscription?: string | { id: string } } } }).parent;
  const s = parent?.subscription_details?.subscription;
  return typeof s === "string" ? s : s?.id ?? null;
}

const STATUS_MAP: Record<string, string> = {
  active: "ACTIVE",
  trialing: "ACTIVE",
  past_due: "PAST_DUE",
  unpaid: "PAST_DUE",
  canceled: "CANCELED",
  incomplete: "INCOMPLETE",
  incomplete_expired: "CANCELED",
  paused: "CANCELED",
};

export async function handleStripeEvent(event: Stripe.Event) {
  const seen = await db.webhookEvent.findUnique({ where: { id: event.id } });
  if (seen) return;
  const s = getStripe()!;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode !== "subscription" || !session.subscription) break;
      const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
      const sub = await s.subscriptions.retrieve(subId);
      const { userId, planId, term } = (session.metadata ?? {}) as { userId?: string; planId?: PlanId; term?: Term };
      if (!userId || !planId || !term) break;
      await activateSubscription({ userId, planId, term, provider: "stripe", stripeSubscriptionId: sub.id, stripeCheckoutId: session.id, currentPeriodEnd: periodEnd(sub) });
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const row = await db.subscription.findUnique({ where: { stripeSubscriptionId: sub.id } });
      if (!row) break;
      const status = event.type === "customer.subscription.deleted" ? "CANCELED" : STATUS_MAP[sub.status] ?? row.status;
      await db.subscription.update({
        where: { id: row.id },
        data: {
          status,
          currentPeriodEnd: periodEnd(sub),
          cancelAtPeriodEnd: sub.cancel_at_period_end || !!sub.cancel_at,
          canceledAt: status === "CANCELED" ? new Date() : null,
          pastDueSince: status === "PAST_DUE" ? row.pastDueSince ?? new Date() : null,
        },
      });
      if (status === "CANCELED") {
        const stillActive = await activeSubscription(row.userId);
        if (!stillActive) await downgrade(row.userId);
      }
      break;
    }
    case "invoice.paid":
    case "invoice.payment_failed": {
      const inv = event.data.object;
      const subId = invoiceSubscriptionId(inv);
      const row = subId ? await db.subscription.findUnique({ where: { stripeSubscriptionId: subId } }) : null;
      const userId = row?.userId ?? (await db.user.findUnique({ where: { stripeCustomerId: String(inv.customer) } }))?.id;
      if (!userId || !inv.id) break;
      const paid = event.type === "invoice.paid";
      const payment = await db.payment.upsert({
        where: { stripeInvoiceId: inv.id },
        create: {
          userId,
          amount: paid ? inv.amount_paid : inv.amount_due,
          currency: inv.currency,
          status: paid ? "PAID" : "FAILED",
          description: inv.lines.data[0]?.description ?? "SEFIKH subscription",
          stripeInvoiceId: inv.id,
          invoiceUrl: inv.hosted_invoice_url ?? null,
          periodStart: inv.lines.data[0]?.period?.start ? new Date(inv.lines.data[0].period.start * 1000) : null,
          periodEnd: inv.lines.data[0]?.period?.end ? new Date(inv.lines.data[0].period.end * 1000) : null,
        },
        update: { status: paid ? "PAID" : "FAILED", invoiceUrl: inv.hosted_invoice_url ?? null },
      });
      if (paid) {
        await ensureInvoiceNumber(payment);
        // Régularisation : l'abonnement repart, et l'accès revient s'il avait été coupé.
        if (row && row.status !== "CANCELED") {
          await db.subscription.update({ where: { id: row.id }, data: { status: "ACTIVE", pastDueSince: null } });
          await db.user.updateMany({ where: { id: row.userId, NOT: { plan: row.plan } }, data: { plan: row.plan } });
        }
      }
      if (!paid) {
        if (row) await db.subscription.update({ where: { id: row.id }, data: { status: "PAST_DUE", pastDueSince: row.pastDueSince ?? new Date() } });
        const user = await db.user.findUnique({ where: { id: userId } });
        if (user) {
          await notify(userId, { type: "BILLING", title: translatorFor(user.locale)("Payment failed"), body: translatorFor(user.locale)("Please update your payment method."), link: "/dashboard/billing" });
          await sendEmail({ to: user.email, ...paymentFailedTemplate(user.name, user.locale) });
        }
      }
      break;
    }
  }
  await db.webhookEvent.create({ data: { id: event.id, type: event.type } }).catch(() => {});
}
