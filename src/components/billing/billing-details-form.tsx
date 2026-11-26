"use client";

import { useActionState } from "react";
import { saveBillingDetailsAction } from "@/app/(app)/dashboard/billing/actions";
import { Field, FormMessage, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";

/** Coordonnées imprimées sur les factures d'abonnement (préremplies depuis le profil). */
export function BillingDetailsForm({ initial }: { initial: { company: string; address: string; vat: string } }) {
  const tr = useT();
  const [state, action, pending] = useActionState(saveBillingDetailsAction, null);
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      <Field label={tr("Company / studio")}>
        <Input name="company" defaultValue={initial.company} maxLength={160} />
      </Field>
      <Field label={tr("SIRET / VAT")} hint={tr("Intra-community VAT number for professional clients.")}>
        <Input name="vat" defaultValue={initial.vat} maxLength={60} />
      </Field>
      <Field label={tr("Billing address")} className="sm:col-span-2">
        <Textarea name="address" rows={2} className="min-h-0" defaultValue={initial.address} maxLength={300} />
      </Field>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <Button type="submit" variant="secondary" size="sm" loading={pending}>
          {tr("Save billing details")}
        </Button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
