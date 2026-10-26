"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import { PLANS, type Audience, type PlanId, type Term } from "@/lib/plans";
import { cn } from "@/lib/utils";

type Props = {
  audience: Audience;
  currentPlan: string | null;
  currentTerm: string | null;
  loggedInRole: string | null;
  foundingSeatsLeft: number;
  initialTerm?: Term;
  compact?: boolean;
};

export function PlanPicker({ audience, currentPlan, currentTerm, loggedInRole, foundingSeatsLeft, initialTerm = "ANNUAL", compact }: Props) {
  const [term, setTerm] = useState<Term>(initialTerm);
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const ids = (audience === "CLIENT" ? ["CLIENT_FREE", "CLIENT_PRO", "CLIENT_STUDIO"] : ["PRO_BASIC", "PRO_PRO", "PRO_VISIBILITY", "PRO_INTELLIGENCE", "PRO_FOUNDING"]) as PlanId[];
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
      <div className="mx-auto flex w-fit rounded-full border border-line bg-paper p-1" role="radiogroup" aria-label="Billing term">
        {(["ANNUAL", "MONTHLY"] as Term[]).map((t) => (
          <button key={t} role="radio" aria-checked={term === t} onClick={() => setTerm(t)} className={cn("rounded-full px-5 py-2 text-[13px] font-medium transition sm:px-7", term === t ? "bg-ink text-paper" : "text-muted hover:text-ink")}>
            {t === "ANNUAL" ? "12-month commitment" : "No commitment"}
            {t === "ANNUAL" && <span className={cn("ml-2 rounded-full px-1.5 py-0.5 text-[10px]", term === t ? "bg-brass text-paper" : "bg-brass-light text-brass-dark")}>Save up to 20%</span>}
          </button>
        ))}
      </div>
      {wrongAudience && <p className="mt-4 text-center text-sm text-muted">You are logged in with a {loggedInRole === "PRO" ? "maker" : "creative"} account: these plans are shown for information.</p>}
      {error && (
        <p role="alert" className="mt-4 text-center text-sm text-danger">
          {error}
        </p>
      )}

      <div className={cn("mt-10 grid gap-4", ids.length === 3 ? "lg:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-4", compact && "xl:grid-cols-4")}>
        {ids
          .filter((id) => !(audience === "PRO" && id === "PRO_FOUNDING"))
          .map((id) => {
            const plan = PLANS[id];
            const price = plan.prices[term];
            const isCurrent = currentPlan === id && (price === 0 || currentTerm === (term === "ANNUAL" ? "ANNUAL" : "MONTHLY"));
            return (
              <div key={id} className={cn("relative flex flex-col rounded-3xl border p-7", plan.highlight ? "border-ink bg-espresso text-paper" : "border-line bg-paper")}>
                {plan.highlight && <span className="absolute -top-3 left-7 rounded-full bg-brass px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-paper">Most popular</span>}
                <p className="text-[12px] font-semibold uppercase tracking-[0.2em] opacity-70">{plan.name}</p>
                <p className="mt-1 text-[13px] opacity-60">{plan.tagline}</p>
                <p className="mt-6 flex items-baseline gap-1">
                  <span className="display text-6xl">{price ?? "—"}</span>
                  <span className="text-lg">€</span>
                  <span className="ml-1 text-[13px] opacity-60">/ month</span>
                </p>
                <p className="mt-1 h-5 text-[12px] opacity-60">{price ? (term === "ANNUAL" ? "Billed monthly · 12-month commitment" : "Cancel at any time") : "Free forever"}</p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2.5 text-[13.5px]">
                      <Check className={cn("mt-0.5 size-4 shrink-0", plan.highlight ? "text-brass-light" : "text-brass")} />
                      <span className="opacity-90">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => choose(id)}
                  disabled={!!busy || isCurrent || !!wrongAudience}
                  className={cn(
                    "mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full text-sm font-medium transition disabled:opacity-50",
                    plan.highlight ? "bg-paper text-ink hover:bg-brass-light" : "bg-ink text-paper hover:bg-ink-soft",
                  )}
                >
                  {busy === id && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
                  {isCurrent ? "Your current plan" : price === 0 ? (loggedInRole ? "Continue for free" : "Start for free") : `Choose ${plan.name}`}
                </button>
              </div>
            );
          })}
      </div>

      {audience === "PRO" && (
        <div className="grain mt-6 flex flex-col gap-6 overflow-hidden rounded-3xl bg-wine p-8 text-paper md:flex-row md:items-center">
          <div className="flex-1">
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-paper/60">Founding Partner Programme · {foundingSeatsLeft} places left</p>
            <p className="display mt-2 text-3xl sm:text-4xl">The full Intelligence package for 149 € / month.</p>
            <p className="mt-2 max-w-xl text-sm text-paper/70">A 12-month partnership reserved for launch-phase supporters: every Intelligence feature, a Founding Partner badge and a price locked for 12 months.</p>
          </div>
          <button
            onClick={() => {
              setTerm("ANNUAL");
              choose("PRO_FOUNDING");
            }}
            disabled={!!busy || foundingSeatsLeft === 0 || currentPlan === "PRO_FOUNDING" || !!wrongAudience}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-paper px-7 text-sm font-medium text-ink hover:bg-brass-light disabled:opacity-50"
          >
            {busy === "PRO_FOUNDING" && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
            {currentPlan === "PRO_FOUNDING" ? "You are a Founding Partner" : foundingSeatsLeft === 0 ? "Programme full" : "Become a Founding Partner"}
          </button>
        </div>
      )}
    </div>
  );
}
