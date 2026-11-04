"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

const SLIDES = ["/images/intro/1.webp", "/images/intro/2.webp", "/images/intro/3.webp", "/images/intro/4.webp", "/images/intro/5.webp"];
const DELAY_MS = 6000;

/** Ouverture de l'accueil : images d'architecture en fondu enchaîné, avec un repère par image. */
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
      {SLIDES.map((src, i) => (
        <Image key={src} src={src} alt="" fill priority={i === 0} sizes="100vw" className={cn("object-cover transition-opacity duration-[1500ms] ease-in-out", i === index ? "opacity-100" : "opacity-0")} />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-espresso/60 via-transparent to-espresso/60" />
      <div className="absolute inset-x-0 bottom-5 z-10 flex justify-center gap-2">
        {SLIDES.map((src, i) => (
          <button key={src} type="button" onClick={() => setIndex(i)} aria-label={tr("Image {v}", { v: i + 1 })} aria-current={i === index} className="flex h-6 w-10 items-center">
            <span className={cn("h-px w-full transition-colors", i === index ? "bg-paper" : "bg-paper/40")} />
          </button>
        ))}
      </div>
    </>
  );
}
