"use client";

import { useActionState, useState } from "react";
import { signQuoteAction } from "@/app/(app)/messages/quotes/actions";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";

/** Signature en ligne du devis par l'émetteur (l'artisan), après l'envoi. */
export function QuoteIssuerSign({ quoteId, defaultName }: { quoteId: string; defaultName: string }) {
  const tr = useT();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(signQuoteAction, null);
  if (!open) return <Button onClick={() => setOpen(true)}>{tr("Sign the quote")}</Button>;
  return (
    <form action={action} className="max-w-xl space-y-5 border border-line bg-paper p-5">
      <input type="hidden" name="quoteId" value={quoteId} />
      <Field label={tr("Name and position")} required>
        <Input name="name" defaultValue={defaultName} required maxLength={160} />
      </Field>
      <label className="flex items-start gap-3 text-[14px]">
        <input type="checkbox" name="agree" required className="mt-1" />
        <span>{tr("I sign this quote on behalf of my company and commit to its conditions.")}</span>
      </label>
      <FormMessage state={state} />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={pending}>{tr("Confirm signature")}</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>{tr("Cancel")}</Button>
      </div>
    </form>
  );
}
