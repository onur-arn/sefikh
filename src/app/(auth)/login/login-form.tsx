"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { PasswordInput } from "@/components/forms/password-input";
import { loginAction } from "../actions";

export function LoginForm({ next }: { next: string }) {
  const [state, onSubmit, pending] = useFormAction(loginAction);
  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormMessage state={state} />
      <Field label="E-mail" error={state?.fieldErrors?.email}>
        <Input name="email" type="email" autoComplete="email" required autoFocus defaultValue="" />
      </Field>
      <Field
        label={
          <span className="flex justify-between">
            Password
            <Link href="/forgot-password" className="text-[13px] font-normal text-brass-dark hover:underline">
              Forgot password?
            </Link>
          </span>
        }
        error={state?.fieldErrors?.password}
      >
        <PasswordInput name="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" loading={pending} className="w-full" size="lg">
        Log in
      </Button>
      <p className="text-center text-sm text-muted">
        New to SEFIKH?{" "}
        <Link href="/register" className="font-medium text-ink underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
