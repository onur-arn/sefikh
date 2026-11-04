"use client";

import { useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

type Kind = "company" | "portfolio" | "message";
type Fields = Record<string, string | null>;

/** Bascule entre le texte d'origine et sa traduction automatique vers la langue du visiteur. */
export function useAutoTranslate(kind: Kind, id: string) {
  const [fields, setFields] = useState<Fields | null>(null);
  const [showing, setShowing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setError(null);
    if (showing) return setShowing(false);
    if (fields) return setShowing(true);
    setPending(true);
    const res = await fetch("/api/translate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, id }) }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setPending(false);
    if (!res?.ok || !data?.fields) return setError(data?.error ?? "Automatic translation is unavailable for now.");
    setFields(data.fields);
    setShowing(true);
  }

  return { translated: showing ? fields : null, showing, pending, error, toggle };
}

export function TranslateButton({ state, className }: { state: ReturnType<typeof useAutoTranslate>; className?: string }) {
  const tr = useT();
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-2 text-[12px]", className)}>
      <button type="button" onClick={state.toggle} disabled={state.pending} className="inline-flex items-center gap-1.5 underline-offset-2 opacity-70 transition hover:underline hover:opacity-100 disabled:opacity-50">
        {state.pending ? <Loader2 className="size-3.5 animate-spin" /> : <Languages className="size-3.5" />}
        {state.showing ? tr("Show original") : tr("Translate automatically")}
      </button>
      {state.error && <span role="alert" className="text-danger">{tr(state.error)}</span>}
    </span>
  );
}

/** Texte rédigé par un professionnel, dans sa langue, avec son bouton de traduction. */
export function AutoTranslate({ kind, id, field, text, className, paragraphClassName }: { kind: Kind; id: string; field: string; text: string; className?: string; paragraphClassName?: string }) {
  const state = useAutoTranslate(kind, id);
  const shown = state.translated?.[field] ?? text;
  return (
    <div>
      {shown.split(/\n{2,}/).map((para, i) => (
        <p key={i} className={cn(className, i > 0 && paragraphClassName)}>
          {para}
        </p>
      ))}
      <TranslateButton state={state} className="mt-2" />
    </div>
  );
}
