"use client";

import { useActionState, useState } from "react";
import { respondQuoteAction } from "@/app/(app)/messages/quotes/actions";
import { Field, FormMessage, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";

/** « Bon pour accord » en ligne ou refus, côté client. */
export function QuoteResponse({ quoteId, defaultName }: { quoteId: string; defaultName: string }) {
  const tr = useT();
  const [mode, setMode] = useState<"accept" | "decline" | null>(null);
  const [state, action, pending] = useActionState(respondQuoteAction, null);
  if (!mode)
    return (
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setMode("accept")}>{tr("Accept the quote")}</Button>
        <Button variant="secondary" onClick={() => setMode("decline")}>
          {tr("Decline")}
        </Button>
      </div>
    );
  return (
    <form action={action} className="max-w-xl space-y-5 border border-line bg-paper p-5">
      <input type="hidden" name="quoteId" value={quoteId} />
      <input type="hidden" name="decision" value={mode} />
      {mode === "accept" ? (
        <>
          <Field label={tr("Name and position")} required>
            <Input name="name" defaultValue={defaultName} required maxLength={160} />
          </Field>
          <label className="flex items-start gap-3 text-[14px]">
            <input type="checkbox" name="agree" required className="mt-1" />
            <span>{tr("« Approved ». I accept this quote and its conditions on behalf of my company.")}</span>
          </label>
        </>
      ) : (
        <Field label={tr("Reason (optional)")}>
          <Textarea name="reason" rows={3} maxLength={1000} />
        </Field>
      )}
      <FormMessage state={state} />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={pending}>
          {mode === "accept" ? tr("Confirm acceptance") : tr("Confirm refusal")}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setMode(null)}>
          {tr("Cancel")}
        </Button>
      </div>
    </form>
  );
}
