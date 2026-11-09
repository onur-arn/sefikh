"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PLANS, type Audience, type PlanId, type Term } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";

type Props = {
  audience: Audience;
  currentPlan: string | null;
  currentTerm: string | null;
  loggedInRole: string | null;
  foundingSeatsLeft: number;
  initialTerm?: Term;
};

export function PlanPicker({ audience, currentPlan, currentTerm, loggedInRole, foundingSeatsLeft, initialTerm = "ANNUAL" }: Props) {
  const tr = useT();
  const [term, setTerm] = useState<Term>(initialTerm);
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const ids = (audience === "CLIENT" ? ["CLIENT_FREE", "CLIENT_PRO", "CLIENT_STUDIO"] : ["PRO_PRO", "PRO_VISIBILITY", "PRO_INTELLIGENCE", "PRO_FOUNDING"]) as PlanId[];
  const wrongAudience = loggedInRole && loggedInRole !== "ADMIN" && (loggedInRole === "PRO" ? "PRO" : "CLIENT") !== audience;

  async function choose(id: PlanId) {
    setError(null);
    const plan = PLANS[id];
    const price = plan.prices[term] ?? plan.prices.ANNUAL ?? 0;
    if (!loggedInRole) return router.push(`/register?role=${audience === "PRO" ? "pro" : "creative"}&plan=${id}`);
    if (price === 0) return router.push("/dashboard");
    setBusy(id);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: id, term: plan.prices[term] != null ? term : "ANNUAL" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(null);
      return setError(data.error ?? "Something went wrong.");
    }
    window.location.assign(data.url);
  }

  return (
    <div>
      <div className="mx-auto flex w-fit rounded-sm border border-line bg-paper p-1" role="radiogroup" aria-label={tr("Billing term")}>
        {(["ANNUAL", "MONTHLY"] as Term[]).map((t) => (
          <button key={t} role="radio" aria-checked={term === t} onClick={() => setTerm(t)} className={cn("rounded-sm px-5 py-2 text-[13px] font-medium transition sm:px-7", term === t ? "bg-ink text-paper" : "text-muted hover:text-ink")}>
            {t === "ANNUAL" ? tr("12-month commitment") : tr("No commitment")}
            {t === "ANNUAL" && <span className={cn("ml-2 rounded-sm px-1.5 py-0.5 text-[10px]", term === t ? "bg-brass text-paper" : "bg-brass-light text-brass-dark")}>{tr("Save up to 20%")}</span>}
          </button>
        ))}
      </div>
      {wrongAudience && <p className="mt-4 text-center text-sm text-muted">{tr("You are logged in with a")}{" "}{loggedInRole === "PRO" ? tr("maker") : tr("creative")} {" "}{tr("account: these plans are shown for information.")}</p>}
      {error && (
        <p role="alert" className="mt-4 text-center text-sm text-danger">
          {tr(error)}
        </p>
      )}

      <div className="mt-8 border-t border-ink/70">
        {ids
          .filter((id) => !(audience === "PRO" && id === "PRO_FOUNDING"))
          .map((id) => {
            const plan = PLANS[id];
            const price = plan.prices[term];
            const isCurrent = currentPlan === id && (price === 0 || currentTerm === (term === "ANNUAL" ? "ANNUAL" : "MONTHLY"));
            return (
              <div key={id} className="grid gap-x-8 gap-y-4 border-b border-line py-8 lg:grid-cols-12 lg:items-start">
                <div className="lg:col-span-3">
                  <p className="display flex items-baseline gap-3 text-5xl">
                    {tr(plan.name)}
                    {plan.highlight && <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-brass">{tr("Our recommendation")}</span>}
                  </p>
                  <p className="folio mt-2">{tr(plan.tagline)}</p>
                </div>
                <ul className="grid gap-x-6 gap-y-1.5 text-[14.5px] text-ink-soft sm:grid-cols-2 lg:col-span-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-brass">—</span>
                      <span>{tr(f)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-end justify-between gap-6 lg:col-span-4 lg:flex-col lg:items-end">
                  <div className="lg:text-right">
                    <p className="flex items-baseline gap-1 lg:justify-end">
                      <span className="display text-6xl">{price ?? "—"}</span>
                      <span className="display text-2xl">€</span>
                      <span className="folio ml-1">{tr("per month")}</span>
                    </p>
                    <p className="folio mt-1">{price ? (term === "ANNUAL" ? tr("Billed monthly · 12-month commitment") : tr("Cancel at any time")) : tr("Free forever")}</p>
                  </div>
                  <button
                    onClick={() => choose(id)}
                    disabled={!!busy || isCurrent || !!wrongAudience}
                    className={cn("inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-sm px-6 font-mono text-[12px] uppercase tracking-[0.06em] transition", isCurrent ? "cursor-default border border-line text-muted" : "bg-ink text-paper hover:bg-brass disabled:opacity-50")}
                  >
                    {busy === id && <span className="size-3.5 animate-spin rounded-full border border-current border-r-transparent" />}
                    {isCurrent ? tr("Your current plan") : price === 0 ? (loggedInRole ? tr("Continue for free") : tr("Start for free")) : tr("Choose {name}", { name: tr(plan.name) })}
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {audience === "PRO" && (
        <div className="mt-8 flex flex-col gap-6 bg-brass p-8 text-paper md:flex-row md:items-center">
          <div className="flex-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.05em] text-paper/80">{tr("Founding Partner Programme · {foundingSeatsLeft} places left", { foundingSeatsLeft })}</p>
            <p className="display mt-2 text-3xl sm:text-4xl">{tr("The full Intelligence package for 149 € / month.")}</p>
            <p className="mt-2 max-w-xl text-sm text-paper/85">{tr("A 12-month partnership reserved for launch-phase supporters: every Intelligence feature, a Founding Partner badge and a price locked for 12 months.")}</p>
          </div>
          <button
            onClick={() => {
              setTerm("ANNUAL");
              choose("PRO_FOUNDING");
            }}
            disabled={!!busy || foundingSeatsLeft === 0 || currentPlan === "PRO_FOUNDING" || !!wrongAudience}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-sm bg-paper px-7 font-mono text-[12px] uppercase tracking-[0.06em] text-ink hover:bg-sand disabled:opacity-50"
          >
            {busy === "PRO_FOUNDING" && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
            {currentPlan === "PRO_FOUNDING" ? tr("You are a Founding Partner") : foundingSeatsLeft === 0 ? tr("Programme full") : tr("Become a Founding Partner")}
          </button>
        </div>
      )}
    </div>
  );
}
