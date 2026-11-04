"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ArrowRight, ChevronDown, ImagePlus, MapPin, X } from "lucide-react";
import { useT } from "@/i18n/client";
import { MATERIALS, SKILLS, TECHNIQUES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const GROUPS = [
  ["skills", "Skills", SKILLS],
  ["materials", "Materials", MATERIALS],
  ["techniques", "Techniques", TECHNIQUES],
] as const;

const EXAMPLES = ["Hand-patinated brass kitchen fronts for a villa in Nice", "Tufted leather wall panels for a private cinema", "Backlit onyx vanity for a boutique hotel"];

/** Recherche unique : texte, image de référence et catégories se combinent librement. */
export function SearchPanel({ compact = false, initial }: { compact?: boolean; initial?: { q?: string; near?: string } }) {
  const tr = useT();
  const router = useRouter();
  const [q, setQ] = useState(initial?.q ?? "");
  const [near, setNear] = useState(initial?.near ?? "");
  const [picked, setPicked] = useState<Record<string, string[]>>({ skills: [], materials: [], techniques: [] });
  const [showCategories, setShowCategories] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [navigating, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const pending = uploading || navigating;
  const pickedCount = Object.values(picked).flat().length;

  function chooseFile(f: File | undefined | null) {
    setError(null);
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError("Please choose an image (JPG, PNG, WebP or HEIC).");
    if (f.size > 10 * 1024 * 1024) return setError("Image is too large (10 MB max).");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function removeFile() {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function toggle(group: string, value: string) {
    setPicked((p) => ({ ...p, [group]: p[group]!.includes(value) ? p[group]!.filter((v) => v !== value) : [...p[group]!, value] }));
  }

  async function submit() {
    setError(null);
    if (!q.trim() && !file && !pickedCount) return setError("Describe your project, add an image or choose a category.");
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (near.trim()) params.set("near", near.trim());
    for (const [k, vals] of Object.entries(picked)) vals.forEach((v) => params.append(k, v));

    if (file) {
      const body = new FormData();
      body.set("image", file);
      setUploading(true);
      const res = await fetch("/api/search/image", { method: "POST", body }).catch(() => null);
      const data = await res?.json().catch(() => null);
      setUploading(false);
      if (res?.status === 402) return startTransition(() => router.push("/pricing?reason=limit"));
      if (!res?.ok || !data?.id) return setError(data?.error ?? "Image search failed. Please try again.");
      params.set("image", data.id);
    }
    startTransition(() => router.push(`/search?${params}`));
  }

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          chooseFile(e.dataTransfer.files[0]);
        }}
        className={cn("rounded-[1.5rem] border bg-paper p-3 transition focus-within:border-ink sm:p-4", dragging ? "border-ink bg-sand" : "border-ink/30")}
      >
        <div className="flex items-start gap-3">
          {preview && (
            <span className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt={tr("Selected reference")} className="size-20 rounded-xl object-cover" />
              <button type="button" onClick={removeFile} aria-label={tr("Remove image")} className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-ink text-paper">
                <X className="size-3.5" />
              </button>
            </span>
          )}
          <div className="min-w-0 flex-1">
            <label htmlFor="sp-q" className="sr-only">
              {tr("Describe what you want to create")}
            </label>
            <textarea
              id="sp-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit();
              }}
              rows={compact ? 2 : 3}
              maxLength={500}
              placeholder={tr("Describe what you want to create…")}
              className="w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-muted"
            />
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <input ref={inputRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-label={tr("Add an image")} onChange={(e) => chooseFile(e.target.files?.[0])} />
          <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-[13px] hover:border-ink/50">
            <ImagePlus className="size-4" strokeWidth={1.6} />
            {file ? tr("Choose another image") : tr("Add an image")}
          </button>
          <button
            type="button"
            onClick={() => setShowCategories((v) => !v)}
            aria-expanded={showCategories}
            className={cn("inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px]", pickedCount ? "border-ink" : "border-line hover:border-ink/50")}
          >
            {tr("Skills & Materials")}
            {pickedCount > 0 && <span className="rounded-full bg-ink px-1.5 text-[11px] text-paper">{pickedCount}</span>}
            <ChevronDown className={cn("size-3.5 transition", showCategories && "rotate-180")} />
          </button>
          <label className="flex h-9 min-w-40 flex-1 items-center gap-1.5 rounded-full border border-line px-3 text-[13px] focus-within:border-ink/50">
            <MapPin className="size-4 shrink-0" strokeWidth={1.6} aria-hidden />
            <span className="sr-only">{tr("Location (city or country) — optional")}</span>
            <input value={near} onChange={(e) => setNear(e.target.value)} placeholder={tr("City or country")} className="w-full min-w-0 bg-transparent outline-none placeholder:text-muted" />
          </label>
        </div>

        {showCategories && (
          <div className="mt-3 space-y-3 border-t border-line pt-3">
            {GROUPS.map(([key, label, list]) => (
              <div key={key}>
                <p className="mb-1.5 text-[12px] font-medium text-muted">{tr(label)}</p>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((v) => {
                    const on = picked[key]!.includes(v.name);
                    return (
                      <button key={v.name} type="button" onClick={() => toggle(key, v.name)} aria-pressed={on} className={cn("rounded-full border px-2.5 py-1 text-[12.5px] transition", on ? "border-ink bg-ink text-paper" : "border-line hover:border-ink/50")}>
                        {tr(v.name)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {tr(error)}
        </p>
      )}

      <button type="button" onClick={() => void submit()} disabled={pending} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-[14.5px] font-medium text-paper transition hover:bg-ink-soft disabled:opacity-60">
        {pending ? tr("Searching…") : tr("Explore expertise")}
        <ArrowRight className="size-4" />
      </button>

      {!compact && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => setQ(tr(ex))} className="rounded-full border border-line px-3 py-1 text-[12px] text-muted hover:border-ink/50 hover:text-ink">
              {tr(ex)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
