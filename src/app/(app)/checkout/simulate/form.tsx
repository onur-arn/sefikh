"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { simulateCheckoutAction } from "@/app/(app)/dashboard/billing/actions";
import type { PlanId, Term } from "@/lib/plans";

export function SimulatedCheckoutForm({ plan, term, email }: { plan: PlanId; term: Term; email: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const card = new FormData(e.currentTarget).get("card")?.toString().replace(/\s/g, "") ?? "";
        if (card === "4000000000000002") return setError("Your card was declined (test card).");
        start(async () => {
          const r = await simulateCheckoutAction(plan, term);
          if (r?.error) setError(r.error);
        });
      }}
    >
      <Field label="E-mail">
        <Input value={email} readOnly />
      </Field>
      <Field label="Card number" hint="Use 4242 4242 4242 4242 (success) or 4000 0000 0000 0002 (declined).">
        <Input name="card" defaultValue="4242 4242 4242 4242" inputMode="numeric" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Expiry">
          <Input defaultValue="12 / 30" />
        </Field>
        <Field label="CVC">
          <Input defaultValue="123" />
        </Field>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Subscribe
      </Button>
    </form>
  );
}
