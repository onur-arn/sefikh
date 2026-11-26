"use client";

import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { useT } from "@/i18n/client";

/**
 * « Télécharger » : génère un vrai fichier PDF A4 à partir de l'élément `targetId` (sans boîte d'impression).
 * Les sauts de page tombent entre deux blocs (ligne de tableau, paragraphe…) pour ne jamais couper une ligne de texte.
 */
async function downloadPdf(el: HTMLElement, filename: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);
  const scale = 2;
  const canvas = await html2canvas(el, { scale, backgroundColor: "#ffffff", useCORS: true, ignoreElements: (n) => n.classList?.contains("print:hidden") });

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const margin = 12;
  const pageW = 210 - margin * 2;
  const pageH = 297 - margin * 2;
  const pxPerMm = canvas.width / pageW;
  const pagePx = Math.floor(pageH * pxPerMm);

  // Limites possibles de page : bas de chaque bloc, en pixels du canevas.
  const top = el.getBoundingClientRect().top;
  const cuts = Array.from(el.querySelectorAll("tr, p, li, h1, h2, h3, dl > div, section, header, footer, .break-inside-avoid"))
    .map((n) => Math.round((n.getBoundingClientRect().bottom - top) * scale))
    .filter((y) => y > 0 && y < canvas.height)
    .sort((a, b) => a - b);

  let y = 0;
  let first = true;
  while (y < canvas.height - 2) {
    let end = Math.min(y + pagePx, canvas.height);
    if (end < canvas.height) {
      const best = cuts.filter((c) => c > y + pagePx * 0.5 && c <= end).pop();
      if (best) end = best;
    }
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = end - y;
    slice.getContext("2d")!.drawImage(canvas, 0, y, canvas.width, end - y, 0, 0, canvas.width, end - y);
    if (!first) pdf.addPage();
    pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, pageW, (end - y) / pxPerMm);
    first = false;
    y = end;
  }
  pdf.save(filename);
}

export function PdfButtons({ targetId, filename }: { targetId: string; filename: string }) {
  const tr = useT();
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          const el = document.getElementById(targetId);
          if (!el) return;
          setBusy(true);
          try {
            await downloadPdf(el, filename);
          } finally {
            setBusy(false);
          }
        }}
        className={buttonClass("primary", "sm", "h-10")}
      >
        <Download className="size-3.5" /> {busy ? tr("Preparing the PDF…") : tr("Download")}
      </button>
      <button type="button" onClick={() => window.print()} className={buttonClass("secondary", "sm", "h-10")}>
        <Printer className="size-3.5" /> {tr("Print")}
      </button>
    </div>
  );
}
