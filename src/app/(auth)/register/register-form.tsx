"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import Link from "next/link";
import { useState } from "react";
import { Hammer, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { PasswordInput } from "@/components/forms/password-input";
import { cn } from "@/lib/utils";
import { registerAction } from "../actions";
import { useT } from "@/i18n/client";

const ROLES = [
  { value: "CLIENT", title: "I am a creative", text: "Architect, designer, hotelier or private client looking for know-how.", icon: Compass },
  { value: "PRO", title: "I offer a skill", text: "Artisan, workshop, manufacturer or material supplier.", icon: Hammer },
] as const;

export function RegisterForm({ initialRole }: { initialRole: "CLIENT" | "PRO" }) {
  const tr = useT();
  const [state, onSubmit, pending] = useFormAction(registerAction);
  const [role, setRole] = useState<"CLIENT" | "PRO">(initialRole);
  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
      <FormMessage state={state} />
      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink-soft">{tr("Your profile")}</legend>
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map(({ value, title, text, icon: Icon }) => (
            <label key={value} className={cn("cursor-pointer rounded-xl border p-4 transition", role === value ? "border-ink bg-paper shadow-sm" : "border-line hover:border-ink/40")}>
              <input type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} className="sr-only" />
              <Icon className={cn("mb-3 size-5", role === value ? "text-brass" : "text-muted")} strokeWidth={1.6} />
              <span className="block text-sm font-semibold">{tr(title)}</span>
              <span className="mt-1 block text-xs leading-snug text-muted">{tr(text)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field label={role === "PRO" ? tr("Your full name") : tr("Full name")} error={state?.fieldErrors?.name}>
        <Input name="name" autoComplete="name" required />
      </Field>
      <Field label={tr("Professional e-mail")} error={state?.fieldErrors?.email}>
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label={tr("Password")} hint={tr("At least 8 characters, with a letter and a number.")} error={state?.fieldErrors?.password}>
        <PasswordInput name="password" autoComplete="new-password" required minLength={8} withStrength />
      </Field>
      <label className="flex items-start gap-3 text-[13px] text-muted">
        <input type="checkbox" name="terms" className="mt-0.5 size-4 accent-ink" required />
        <span>
          {tr("I agree to the")}
          <Link href="/legal/terms" className="text-ink underline" target="_blank">
            {tr("terms")}</Link>{" "}{tr("and the")}
          <Link href="/legal/privacy" className="text-ink underline" target="_blank">
            {tr("privacy policy")}</Link>
          .
        </span>
      </label>
      {state?.fieldErrors?.terms && <p className="-mt-3 text-xs text-danger">{state.fieldErrors.terms[0]}</p>}
      <Button type="submit" loading={pending} className="w-full" size="lg">
        {tr("Create my account")}</Button>
      <p className="text-center text-sm text-muted">
        {tr("Already a member?")}
        <Link href="/login" className="font-medium text-ink underline-offset-4 hover:underline">
          {tr("Log in")}</Link>
      </p>
    </form>
  );
}
