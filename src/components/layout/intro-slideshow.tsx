"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

// Photos portrait cadrées en paysage : `pos` place la partie à garder (mains, outil, motif) au centre du cadre.
const SLIDES = [
  { src: "/images/intro/artisan-1-hd.jpg", pos: "50% 30%" },
  { src: "/images/intro/artisan-2-hd.jpg", pos: "50% 60%" },
  { src: "/images/intro/artisan-3-hd.jpg", pos: "50% 45%" },
];
const DELAY_MS = 6000;

/** Ouverture de l'accueil : planches d'architecture en fondu enchaîné, numérotées comme dans un cahier. */
export function IntroSlideshow() {
  const tr = useT();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % SLIDES.length), DELAY_MS);
    return () => clearTimeout(id);
  }, [index]);

  return (
    <>
      {SLIDES.map(({ src, pos }, i) => (
        <Image key={src} src={src} alt="" fill priority={i === 0} sizes="100vw" style={{ objectPosition: pos }} className={cn("object-cover transition-opacity duration-[1500ms] ease-in-out", i === index ? "opacity-100" : "opacity-0")} />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-espresso/55 via-espresso/5 to-espresso/70" />
      <div className="absolute bottom-6 right-4 z-10 flex items-center gap-3 sm:right-7 lg:right-10">
        <span className="font-mono text-[11px] tracking-[0.05em] text-paper/80">{tr("Pl. {n}/{total}", { n: index + 1, total: SLIDES.length })}</span>
        <div className="flex gap-1">
          {SLIDES.map(({ src }, i) => (
            <button key={src} type="button" onClick={() => setIndex(i)} aria-label={tr("Image {v}", { v: i + 1 })} aria-current={i === index} className="flex h-6 w-7 items-center">
              <span className={cn("h-px w-full transition-colors", i === index ? "bg-paper" : "bg-paper/35")} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
