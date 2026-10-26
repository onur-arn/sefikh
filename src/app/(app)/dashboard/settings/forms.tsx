"use client";

import { useActionState } from "react";
import { useFormAction } from "@/components/forms/use-form-action";
import { PasswordInput } from "@/components/forms/password-input";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { changeEmailAction, changePasswordAction, deleteAccountAction, notificationsAction, signOutOthersAction } from "./actions";

export function ChangeEmailForm() {
  const [state, onSubmit, pending] = useFormAction(changeEmailAction);
  return (
    <form onSubmit={onSubmit} className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <Field label="New e-mail" error={state?.fieldErrors?.email}>
        <Input name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="Current password" error={state?.fieldErrors?.password}>
        <PasswordInput name="password" required autoComplete="current-password" />
      </Field>
      <Button type="submit" loading={pending} variant="secondary">
        Update
      </Button>
      <div className="sm:col-span-3">
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, onSubmit, pending] = useFormAction(changePasswordAction);
  return (
    <form onSubmit={onSubmit} className="mt-5 grid gap-4 sm:grid-cols-3">
      <Field label="Current password" error={state?.fieldErrors?.current}>
        <PasswordInput name="current" required autoComplete="current-password" />
      </Field>
      <Field label="New password" error={state?.fieldErrors?.password}>
        <PasswordInput name="password" required autoComplete="new-password" withStrength />
      </Field>
      <Field label="Confirm new password" error={state?.fieldErrors?.confirm}>
        <PasswordInput name="confirm" required autoComplete="new-password" />
      </Field>
      <div className="flex items-center gap-4 sm:col-span-3">
        <Button type="submit" loading={pending} variant="secondary">
          Change password
        </Button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function NotificationsForm({ notifyByEmail }: { notifyByEmail: boolean }) {
  const [state, onSubmit, pending] = useFormAction(notificationsAction);
  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <label className="flex items-start gap-3">
        <input type="checkbox" name="notifyByEmail" defaultChecked={notifyByEmail} className="mt-0.5 size-4 accent-ink" />
        <span className="text-sm">
          <span className="font-medium">E-mail me when I receive a message</span>
          <span className="block text-muted">Only when you are not already online on SEFIKH, at most once per conversation until you read it.</span>
        </span>
      </label>
      <div className="flex items-center gap-4">
        <Button type="submit" size="sm" variant="secondary" loading={pending}>
          Save preferences
        </Button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function SignOutOthersButton() {
  const [state, action, pending] = useActionState(signOutOthersAction, null);
  return (
    <form action={action} className="flex items-center gap-3">
      {state?.success && <span className="text-[12px] text-success">{state.success}</span>}
      <Button size="sm" variant="ghost" loading={pending}>
        Sign out other devices
      </Button>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, onSubmit, pending] = useFormAction(deleteAccountAction);
  return (
    <form onSubmit={onSubmit} className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <Field label='Type "DELETE"'>
        <Input name="confirm" required autoComplete="off" />
      </Field>
      <Field label="Password">
        <PasswordInput name="password" required autoComplete="current-password" />
      </Field>
      <Button type="submit" variant="danger" loading={pending}>
        Delete my account
      </Button>
      <div className="sm:col-span-3">
        <FormMessage state={state} />
      </div>
    </form>
  );
}
