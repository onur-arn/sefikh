"use client";

import { useActionState } from "react";
import { subscribeNewsletter } from "@/app/(site)/actions";
import { useT } from "@/i18n/client";

export function NewsletterForm() {
  const tr = useT();
  const [state, action, pending] = useActionState(subscribeNewsletter, null);
  return (
    <form action={action} className="mt-8 max-w-sm">
      <label htmlFor="nl-email" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-paper/40">
        {tr("The SEFIKH letter — monthly")}</label>
      <div className="mt-3 flex overflow-hidden rounded-full border border-paper/20 focus-within:border-paper/60">
        <input id="nl-email" name="email" type="email" required placeholder={tr("Your e-mail")} className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-paper placeholder:text-paper/40 focus:outline-none" />
        <button disabled={pending} className="bg-paper px-4 text-[13px] font-medium text-ink transition hover:bg-brass-light disabled:opacity-60">
          {pending ? "…" : tr("Subscribe")}
        </button>
      </div>
      {state && <p className={`mt-2 text-xs ${state.error ? "text-red-300" : "text-paper/60"}`}>{state.error ?? tr(state.success)}</p>}
    </form>
  );
}
