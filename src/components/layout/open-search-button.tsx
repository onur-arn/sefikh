"use client";

import { ArrowRight } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { useT } from "@/i18n/client";

/** Ouvre le panneau de recherche de l'en-tête. */
export function OpenSearchButton() {
  const tr = useT();
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event("sefikh:open-search"))} className={buttonClass("primary", "lg", "mt-6")}>
      {tr("Explore expertise")}
      <ArrowRight className="size-4" />
    </button>
  );
}
