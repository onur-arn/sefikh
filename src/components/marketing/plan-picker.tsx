"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LAUNCH_DISCOUNT, planName, planPrice, PLANS, type Audience, type PlanId, type Term } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";

type Props = {
  audience: Audience;
  currentPlan: string | null;
  currentTerm: string | null;
  loggedInRole: string | null;
  independent?: boolean; // artisan connecté déclaré indépendant
  initialTerm?: Term;
};

const IDS: Record<Audience, PlanId[]> = {
  CLIENT: ["CLIENT_FREE", "CLIENT_PRO", "CLIENT_STUDIO"],
  PRO: ["PRO_PRO", "PRO_VISIBILITY", "PRO_INTELLIGENCE"],
};

export function PlanPicker({ audience, currentPlan, currentTerm, loggedInRole, independent = false, initialTerm = "MONTHLY" }: Props) {
  const tr = useT();
  const [term, setTerm] = useState<Term>(initialTerm);
  const [solo, setSolo] = useState(independent);
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const wrongAudience = loggedInRole && loggedInRole !== "ADMIN" && (loggedInRole === "PRO" ? "PRO" : "CLIENT") !== audience;
  const euros = (n: number) => new Intl.NumberFormat(tr.locale === "en" ? "en-GB" : tr.locale, { maximumFractionDigits: 2 }).format(n);

  async function choose(id: PlanId) {
    setError(null);
    const price = planPrice(PLANS[id], term, solo) ?? 0;
    if (!loggedInRole) return router.push(`/register?role=${audience === "PRO" ? "pro" : "creative"}&plan=${id}`);
    if (price === 0) return router.push("/dashboard");
    setBusy(id);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: id, term }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(null);
      return setError(data.error ?? "Something went wrong.");
    }
    window.location.assign(data.url);
  }

  const toggle = (options: [string, string, boolean, () => void][], label: string) => (
    <div className="flex w-fit border border-line bg-paper p-1" role="radiogroup" aria-label={label}>
      {options.map(([key, text, on, onClick]) => (
        <button key={key} role="radio" aria-checked={on} onClick={onClick} className={cn("px-4 py-1.5 text-[12.5px] font-medium transition sm:px-6", on ? "bg-ink text-paper" : "text-muted hover:text-ink")}>
          {text}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {toggle(
          [
            ["MONTHLY", tr("Monthly"), term === "MONTHLY", () => setTerm("MONTHLY")],
            ["ANNUAL", tr("Annual · 2 months free"), term === "ANNUAL", () => setTerm("ANNUAL")],
          ],
          tr("Billing term"),
        )}
        {audience === "PRO" &&
          toggle(
            [
              ["COMPANY", tr("Company"), !solo, () => setSolo(false)],
              ["SOLO", tr("Independent artisan"), solo, () => setSolo(true)],
            ],
            tr("Legal structure"),
          )}
      </div>
      <p className="mt-4 text-center text-[13px] text-ink-soft">
        <span className="text-brass">{tr("Launch offer")}</span> · {tr("−{percent}% on your first {months} months with monthly billing.", { percent: LAUNCH_DISCOUNT.percent, months: LAUNCH_DISCOUNT.months })}
      </p>
      {wrongAudience && <p className="mt-4 text-center text-sm text-muted">{tr("You are logged in with a")}{" "}{loggedInRole === "PRO" ? tr("maker") : tr("creative")} {" "}{tr("account: these plans are shown for information.")}</p>}
      {error && (
        <p role="alert" className="mt-4 text-center text-sm text-danger">
          {tr(error)}
        </p>
      )}

      <div className="mt-8 border-t border-ink/70">
        {IDS[audience].map((id) => {
          const plan = PLANS[id];
          const price = planPrice(plan, term, solo);
          const monthly = planPrice(plan, "MONTHLY", solo) ?? 0;
          const isCurrent = currentPlan === id && (price === 0 || currentTerm === term);
          const name = planName(plan, tr);
          return (
            <div key={id} className="grid gap-x-8 gap-y-4 border-b border-line py-7 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-3">
                {/* Nom et prix à la même taille : plus petits que le titre, plus grands que le détail. */}
                <p className="display flex flex-wrap items-baseline gap-x-3 text-3xl">
                  {name}
                  {plan.highlight && <span className="font-mono text-[10.5px] uppercase tracking-[0.05em] text-brass">{tr("Our recommendation")}</span>}
                </p>
                <p className="folio mt-1.5">{tr(plan.tagline)}</p>
              </div>
              <ul className="grid gap-x-6 gap-y-1.5 text-[13.5px] text-ink-soft sm:grid-cols-2 lg:col-span-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-brass">—</span>
                    <span>{tr(f)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-end justify-between gap-6 lg:col-span-4 lg:flex-col lg:items-end">
                <div className="lg:text-right">
                  <p className="flex flex-wrap items-baseline gap-x-1.5 lg:justify-end">
                    <span className="display text-3xl">{price == null ? "—" : `${euros(price)} €`}</span>
                    <span className="folio">{tr("incl. VAT")}</span>
                    <span className="folio">{term === "ANNUAL" ? tr("per year") : tr("per month")}</span>
                  </p>
                  <p className="folio mt-1">
                    {!price
                      ? tr("Free forever")
                      : term === "ANNUAL"
                        ? tr("Billed once a year · equivalent to {price} € / month", { price: euros(Math.round((price / 12) * 100) / 100) })
                        : tr("{price} € / month for the first {months} months · cancel at any time", { price: euros((monthly * (100 - LAUNCH_DISCOUNT.percent)) / 100), months: LAUNCH_DISCOUNT.months })}
                  </p>
                </div>
                <button
                  onClick={() => choose(id)}
                  disabled={!!busy || isCurrent || !!wrongAudience}
                  className={cn("inline-flex h-10 shrink-0 items-center justify-center gap-2 px-6 font-mono text-[11.5px] uppercase tracking-[0.06em] transition", isCurrent ? "cursor-default border border-line text-muted" : "bg-ink text-paper hover:bg-brass disabled:opacity-50")}
                >
                  {busy === id && <span className="size-3.5 animate-spin rounded-full border border-current border-r-transparent" />}
                  {isCurrent ? tr("Your current plan") : price === 0 ? (loggedInRole ? tr("Continue for free") : tr("Start for free")) : tr("Choose {name}", { name })}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
