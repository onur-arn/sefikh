"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { forgotPasswordAction } from "../actions";
import { useT } from "@/i18n/client";

export function ForgotForm() {
  const tr = useT();
  const [state, action, pending] = useActionState(forgotPasswordAction, null);
  return (
    <form action={action} className="mt-8 space-y-5">
      <FormMessage state={state} />
      <Field label={tr("E-mail")}>
        <Input name="email" type="email" autoComplete="email" required autoFocus />
      </Field>
      <Button type="submit" loading={pending} className="w-full" size="lg">
        {tr("Send reset link")}</Button>
      <p className="text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-ink underline-offset-4 hover:underline">
          {tr("← Back to log in")}</Link>
      </p>
    </form>
  );
}
