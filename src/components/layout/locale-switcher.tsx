"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Globe } from "lucide-react";
import { LOCALE_LABELS, LOCALES, isLocale } from "@/i18n/config";
import { setLocaleAction } from "@/i18n/actions";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

/** Sélecteur de langue : applique le choix sans changer de page. */
export function LocaleSwitcher({ tone = "light", compact = false, className }: { tone?: "light" | "dark"; compact?: boolean; className?: string }) {
  const tr = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <label className={cn("relative inline-flex items-center gap-1.5", "font-mono", compact ? "text-[11px]" : "text-[12px]", tone === "dark" ? "text-paper/70 hover:text-paper" : "text-ink-soft hover:text-ink", pending && "opacity-60", className)}>
      {!compact && <Globe className="size-4" aria-hidden />}
      <span className="sr-only">{tr("Language")}</span>
      <select
        value={tr.locale}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          if (isLocale(next)) start(async () => {
            await setLocaleAction(next);
            router.refresh();
          });
        }}
        className="cursor-pointer appearance-none bg-transparent pr-1 outline-none"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l} className="text-ink">
            {compact ? l.toUpperCase() : LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
