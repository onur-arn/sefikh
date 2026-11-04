"use client";

import { useState, useTransition } from "react";
import { cancelAction, resumeAction } from "@/app/(app)/dashboard/billing/actions";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";

export function BillingControls({ cancelAtPeriodEnd, provider, hasCustomer }: { cancelAtPeriodEnd: boolean; provider: string; hasCustomer: boolean }) {
  const tr = useT();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);

  async function portal() {
    setPortalBusy(true);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) window.location.assign(data.url);
    else {
      setPortalBusy(false);
      setError(data.error);
    }
  }

  return (
    <>
      {provider === "stripe" && hasCustomer && (
        <Button variant="secondary" onClick={portal} loading={portalBusy}>
          {tr("Payment methods & invoices")}</Button>
      )}
      {cancelAtPeriodEnd ? (
        <Button variant="secondary" loading={pending} onClick={() => start(async () => setError((await resumeAction())?.error ?? null))}>
          {tr("Resume subscription")}</Button>
      ) : (
        <Button
          variant="ghost"
          loading={pending}
          onClick={() => {
            if (confirm(tr("Cancel your subscription? You keep your benefits until the end of the current period (or of your 12-month commitment)."))) start(async () => setError((await cancelAction())?.error ?? null));
          }}
        >
          {tr("Cancel subscription")}</Button>
      )}
      {error && <p className="text-[12px] text-danger">{tr(error)}</p>}
    </>
  );
}
