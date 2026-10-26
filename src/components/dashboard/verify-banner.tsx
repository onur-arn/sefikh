"use client";

import { useActionState } from "react";
import { MailWarning } from "lucide-react";
import { resendVerificationAction } from "@/app/(auth)/actions";

export function VerifyBanner({ email }: { email: string }) {
  const [state, action, pending] = useActionState(resendVerificationAction, null);
  return (
    <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-brass/30 bg-brass-light/40 p-4 sm:flex-row sm:items-center">
      <MailWarning className="size-5 shrink-0 text-brass-dark" strokeWidth={1.6} />
      <p className="flex-1 text-sm">
        <span className="font-medium">Confirm your e-mail address.</span> We sent a link to {email}. Messaging is unlocked once your address is confirmed.
        {state && <span className={state.error ? " text-danger" : " text-success"}> {state.error ?? state.success}</span>}
      </p>
      <form action={action}>
        <button disabled={pending} className="whitespace-nowrap rounded-full border border-ink/30 px-4 py-1.5 text-[13px] font-medium hover:bg-paper disabled:opacity-50">
          {pending ? "Sending…" : "Resend the link"}
        </button>
      </form>
    </div>
  );
}
