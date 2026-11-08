"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { setLocaleAction } from "@/i18n/actions";
import { useT } from "@/i18n/client";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const CODES: Record<Locale, string> = { en: "EN", fr: "FR", it: "IT", es: "ES", zh: "中" };

function useSetLocale() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return {
    pending,
    choose: (l: Locale) =>
      start(async () => {
        await setLocaleAction(l);
        router.refresh();
      }),
  };
}

/** En-tête : le code de la langue, qui déplie une courte liste. */
export function LocaleMenu({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  const tr = useT();
  const { pending, choose } = useSetLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const click = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", click);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", click);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label={tr("Language")} onClick={() => setOpen((o) => !o)} className={cn("link-underline font-mono text-[11px] tracking-[0.05em]", tone === "dark" ? "text-paper" : "text-ink-soft hover:text-ink", pending && "opacity-50")}>
        {CODES[tr.locale]}
      </button>
      {open && (
        <ul role="menu" className="absolute right-0 top-full z-50 mt-5 w-20 border border-line bg-ivory py-2 text-ink">
          {LOCALES.map((l) => (
            <li key={l} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={l === tr.locale}
                onClick={() => {
                  setOpen(false);
                  if (l !== tr.locale) choose(l);
                }}
                aria-label={LOCALE_LABELS[l]}
                className={cn("block w-full px-4 py-1.5 text-left font-mono text-[11.5px] tracking-[0.05em] text-ink-soft transition-colors hover:text-ink", l === tr.locale && "font-semibold text-ink")}
              >
                {CODES[l]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Pied de page et menu mobile : toutes les langues sur une ligne. */
export function LocaleRow({ className }: { className?: string }) {
  const tr = useT();
  const { pending, choose } = useSetLocale();
  return (
    <div role="group" aria-label={tr("Language")} className={cn("flex items-center gap-3 font-mono text-[11.5px] tracking-[0.05em]", pending && "opacity-50", className)}>
      {LOCALES.map((l) => (
        <button key={l} type="button" aria-pressed={l === tr.locale} aria-label={LOCALE_LABELS[l]} onClick={() => l !== tr.locale && choose(l)} className={cn("transition-colors", l === tr.locale ? "font-semibold text-ink" : "text-muted hover:text-ink")}>
          {CODES[l]}
        </button>
      ))}
    </div>
  );
}
