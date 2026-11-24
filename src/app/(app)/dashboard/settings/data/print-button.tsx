"use client";

import { useT } from "@/i18n/client";

export function PrintButton() {
  const tr = useT();
  return (
    <button onClick={() => window.print()} className="inline-flex h-10 items-center bg-ink px-5 font-mono text-[11.5px] uppercase tracking-[0.06em] text-paper hover:bg-brass print:hidden">
      {tr("Save as PDF / print")}
    </button>
  );
}
