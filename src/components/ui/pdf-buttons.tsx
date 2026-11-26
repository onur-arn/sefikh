"use client";

import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { useT } from "@/i18n/client";

/**
 * « Télécharger » : génère un vrai fichier PDF A4 à partir de l'élément `targetId` (sans boîte d'impression).
 * Les sauts de page tombent entre deux blocs (ligne de tableau, paragraphe…) pour ne jamais couper une ligne de texte.
 */
const A4_PX = 794; // 210 mm à 96 ppp

async function downloadPdf(el: HTMLElement, filename: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);
  const scale = 2;
  const sheet = el.classList.contains("quote-sheet");
  const BLOCKS = "tr, p, li, h1, h2, h3, dl > div, section, header, footer, .break-inside-avoid";
  // Mesures prises sur la copie rendue (même largeur que le PDF) : limites de blocs et hauteur utile.
  let cutsCss: number[] = [];
  let contentCss = 0;
  const canvas = await html2canvas(el, {
    scale,
    backgroundColor: "#ffffff",
    useCORS: true,
    // N'ignore que les éléments « print:hidden » situés DANS la zone exportée : retirer le menu du tableau de bord
    // dans la copie décalait la mise en page (la feuille passait dans la colonne du menu).
    ignoreElements: (n) => n !== el && el.contains(n) && !!n.classList?.contains("print:hidden"),
    // Feuille A4 (devis, facture) : toujours rendue à 210 mm de large, quel que soit l'écran.
    ...(sheet ? { width: A4_PX, windowWidth: Math.max(window.innerWidth, A4_PX + 64) } : {}),
    onclone: (doc) => {
      const c = doc.getElementById(el.id);
      if (!c) return;
      if (sheet) Object.assign(c.style, { width: `${A4_PX}px`, maxWidth: "none", minHeight: "0", padding: "0", boxShadow: "none" });
      for (let p = c.parentElement; p; p = p.parentElement) p.style.overflow = "visible";
      const top = c.getBoundingClientRect().top;
      contentCss = c.getBoundingClientRect().height;
      cutsCss = Array.from(c.querySelectorAll(BLOCKS)).map((n) => n.getBoundingClientRect().bottom - top);
    },
  });

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const margin = 12;
  const pageW = 210 - margin * 2;
  const pageH = 297 - margin * 2;
  const pxPerMm = canvas.width / pageW;
  const pagePx = Math.floor(pageH * pxPerMm);

  // Limites possibles de page : bas de chaque bloc, en pixels du canevas.
  const total = Math.min(canvas.height, Math.ceil((contentCss || canvas.height / scale) * scale));
  const cuts = cutsCss.map((y) => Math.round(y * scale)).filter((y) => y > 0 && y < total).sort((a, b) => a - b);

  let y = 0;
  let first = true;
  while (y < total - 2) {
    let end = Math.min(y + pagePx, total);
    if (end < total) {
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

/** `href` : PDF « vrai texte » généré par le serveur (net, sélectionnable) ; sinon capture de `targetId`. */
export function PdfButtons({ targetId, filename, href }: { targetId: string; filename: string; href?: string }) {
  const tr = useT();
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      {href ? (
        <a href={href} download={filename} className={buttonClass("primary", "sm", "h-10")}>
          <Download className="size-3.5" /> {tr("Download")}
        </a>
      ) : (
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
      )}
      <button type="button" onClick={() => window.print()} className={buttonClass("secondary", "sm", "h-10")}>
        <Printer className="size-3.5" /> {tr("Print")}
      </button>
    </div>
  );
}
