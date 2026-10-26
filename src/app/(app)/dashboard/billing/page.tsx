import type { Metadata } from "next";
import { ExternalLink, Receipt } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { activeSubscription, expireSimulated } from "@/lib/billing";
import { db } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { formatDate, formatMoney } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/misc";
import { BillingControls } from "@/components/dashboard/billing-controls";

export const metadata: Metadata = { title: "Plan & billing", robots: { index: false } };

export default async function BillingPage() {
  const user = await requireUser("/dashboard/billing");
  await expireSimulated(user.id);
  const [sub, payments] = await Promise.all([activeSubscription(user.id), db.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 24 })]);
  const plan = getPlan(sub?.plan ?? user.plan);
  const inCommitment = !!sub?.commitmentEndsAt && sub.commitmentEndsAt > new Date();

  return (
    <>
      <header className="mb-8">
        <h1 className="display text-4xl sm:text-5xl">Plan & billing</h1>
        <p className="mt-2 text-sm text-muted">Manage your subscription, payment methods and invoices. SEFIKH never takes a commission on your projects.</p>
      </header>

      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex-1">
            <p className="eyebrow">Current plan</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="display text-4xl">{plan.name}</h2>
              {sub && <Badge tone={sub.status === "ACTIVE" ? (sub.cancelAtPeriodEnd ? "neutral" : "success") : "danger"}>{sub.status === "PAST_DUE" ? "Payment due" : sub.cancelAtPeriodEnd ? "Ends soon" : "Active"}</Badge>}
            </div>
            <p className="mt-1 text-sm text-muted">{plan.tagline}</p>
            {sub ? (
              <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted">Price</dt>
                  <dd className="mt-0.5 font-medium">{formatMoney(sub.amount, sub.currency)} / month</dd>
                </div>
                <div>
                  <dt className="text-muted">Term</dt>
                  <dd className="mt-0.5 font-medium">{sub.term === "ANNUAL" ? "12-month commitment" : "No commitment"}</dd>
                </div>
                <div>
                  <dt className="text-muted">{sub.cancelAtPeriodEnd ? "Ends on" : "Next payment"}</dt>
                  <dd className="mt-0.5 font-medium">{sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : "—"}</dd>
                </div>
                {inCommitment && (
                  <div className="sm:col-span-3">
                    <dt className="text-muted">Commitment</dt>
                    <dd className="mt-0.5">Until {formatDate(sub.commitmentEndsAt!)} — cancellation takes effect at that date.</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="mt-6 text-sm">You are on the free plan. Upgrade at any time — no commission, cancel whenever you like on the no-commitment option.</p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:w-56">
            <ButtonLink href={user.role === "PRO" ? "/upgrade" : "/pricing"}>{sub ? "Change plan" : "Upgrade"}</ButtonLink>
            {sub && <BillingControls cancelAtPeriodEnd={sub.cancelAtPeriodEnd} provider={sub.provider} hasCustomer={!!user.stripeCustomerId} />}
          </div>
        </div>
        {sub?.provider === "simulated" && <p className="mt-6 rounded-lg bg-sand px-3 py-2 text-[12px] text-muted">Demo subscription (simulated payment, no real charge).</p>}
      </Card>

      <section className="mt-10">
        <h2 className="display text-3xl">Invoices & payments</h2>
        {payments.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">No payment yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-paper">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[12px] uppercase tracking-[0.12em] text-muted">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-line/60 last:border-0">
                    <td className="px-5 py-3.5 whitespace-nowrap">{formatDate(p.createdAt)}</td>
                    <td className="px-5 py-3.5">{p.description}</td>
                    <td className="px-5 py-3.5 font-medium whitespace-nowrap">{formatMoney(p.amount, p.currency)}</td>
                    <td className="px-5 py-3.5">
                      <Badge tone={p.status === "PAID" ? "success" : p.status === "FAILED" ? "danger" : "neutral"}>{p.status === "PAID" ? "Paid" : p.status === "FAILED" ? "Failed" : "Refunded"}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {p.invoiceUrl ? (
                        <a href={p.invoiceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12.5px] font-medium hover:underline">
                          Invoice <ExternalLink className="size-3" />
                        </a>
                      ) : (
                        <Receipt className="ml-auto size-4 text-line" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
