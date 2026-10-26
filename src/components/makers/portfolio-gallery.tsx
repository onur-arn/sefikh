"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import { cn, fileUrl } from "@/lib/utils";

export type GalleryItem = { id: string; key: string; thumbKey: string | null; width: number; height: number; title: string | null; description: string | null; projectName: string | null; location: string | null; year: number | null };

export function PortfolioGallery({ items, companyName }: { items: GalleryItem[]; companyName: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const close = useCallback(() => setIndex(null), []);
  const move = useCallback((d: number) => setIndex((i) => (i == null ? i : (i + d + items.length) % items.length)), [items.length]);

  useEffect(() => {
    if (index == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, close, move]);

  const current = index != null ? items[index] : null;

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 [&>*]:mb-4">
        {items.map((p, i) => (
          <button key={p.id} onClick={() => setIndex(i)} className="group block w-full break-inside-avoid text-left">
            <div className="relative overflow-hidden rounded-2xl bg-sand" style={{ aspectRatio: `${p.width} / ${p.height}` }}>
              <Image src={fileUrl(p.thumbKey ?? p.key)!} alt={p.title ?? `Work by ${companyName}`} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
            </div>
            {(p.title || p.projectName) && (
              <div className="mt-2.5 flex items-baseline justify-between gap-3">
                <p className="text-[14px] font-medium">{p.title}</p>
                <p className="shrink-0 text-[12px] text-muted">{[p.location, p.year].filter(Boolean).join(" · ")}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {current && (
        <div className="fixed inset-0 z-50 flex animate-fade-in flex-col bg-espresso/97 text-paper lg:flex-row" role="dialog" aria-modal="true" aria-label={current.title ?? "Portfolio image"}>
          <div className="relative flex-1">
            <Image src={fileUrl(current.key)!} alt={current.title ?? ""} fill sizes="75vw" className="object-contain p-4 sm:p-10" priority />
            {items.length > 1 && (
              <>
                <button onClick={() => move(-1)} className="absolute left-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper/10 hover:bg-paper/20" aria-label="Previous image">
                  <ChevronLeft className="size-5" />
                </button>
                <button onClick={() => move(1)} className="absolute right-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper/10 hover:bg-paper/20" aria-label="Next image">
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}
          </div>
          <aside className="w-full shrink-0 border-t border-paper/10 p-6 lg:w-[380px] lg:border-l lg:border-t-0 lg:p-10">
            <button onClick={close} className="mb-8 ml-auto flex size-10 items-center justify-center rounded-full bg-paper/10 hover:bg-paper/20" aria-label="Close">
              <X className="size-5" />
            </button>
            <p className="text-[11px] uppercase tracking-[0.2em] text-paper/50">About the project</p>
            <h3 className="display mt-3 text-3xl">{current.title ?? current.projectName}</h3>
            {current.projectName && current.title && <p className="mt-1 text-sm text-paper/60">{current.projectName}</p>}
            {current.location && (
              <p className="mt-4 flex items-center gap-1.5 text-sm text-paper/70">
                <MapPin className="size-4" /> {current.location}
                {current.year ? ` · ${current.year}` : ""}
              </p>
            )}
            {current.description && <p className="mt-5 leading-relaxed text-paper/80">{current.description}</p>}
            <div className="mt-8 flex gap-1.5">
              {items.map((it, i) => (
                <button key={it.id} onClick={() => setIndex(i)} aria-label={`Image ${i + 1}`} className={cn("h-1 flex-1 rounded-full", i === index ? "bg-paper" : "bg-paper/20")} />
              ))}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
