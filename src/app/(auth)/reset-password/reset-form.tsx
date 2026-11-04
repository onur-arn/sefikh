"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { Button } from "@/components/ui/button";
import { Field, FormMessage } from "@/components/ui/field";
import { PasswordInput } from "@/components/forms/password-input";
import { resetPasswordAction } from "../actions";
import { useT } from "@/i18n/client";

export function ResetForm({ token }: { token: string }) {
  const tr = useT();
  const [state, onSubmit, pending] = useFormAction(resetPasswordAction);
  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <input type="hidden" name="token" value={token} />
      <FormMessage state={state} />
      <Field label={tr("New password")} error={state?.fieldErrors?.password}>
        <PasswordInput name="password" autoComplete="new-password" required withStrength autoFocus />
      </Field>
      <Field label={tr("Confirm password")} error={state?.fieldErrors?.confirm}>
        <PasswordInput name="confirm" autoComplete="new-password" required />
      </Field>
      <Button type="submit" loading={pending} className="w-full" size="lg">
        {tr("Update password")}</Button>
    </form>
  );
}
