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
      if (res?.status === 401) return startTransition(() => router.push("/register?reason=search"));
      if (res?.status === 403) return startTransition(() => router.push("/search"));
      if (res?.status === 402) return startTransition(() => router.push("/subscription?reason=limit"));
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
        className={cn("border-b transition", dragging ? "border-ink bg-sand" : "border-ink/60 focus-within:border-ink")}
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
              rows={compact ? 1 : 2}
              maxLength={500}
              placeholder={tr("Describe what you want to create…")}
              className={cn("display w-full resize-none bg-transparent outline-none placeholder:text-muted", compact ? "text-2xl" : "text-3xl sm:text-4xl")}
            />
          </div>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 pb-2">
          <input ref={inputRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-label={tr("Add an image")} onChange={(e) => chooseFile(e.target.files?.[0])} />
          <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex h-8 items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-soft hover:text-brass">
            <ImagePlus className="size-3.5" strokeWidth={1.4} />
            {file ? tr("Choose another image") : tr("Add an image")}
          </button>
          <button
            type="button"
            onClick={() => setShowCategories((v) => !v)}
            aria-expanded={showCategories}
            className="inline-flex h-8 items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-soft hover:text-brass"
          >
            {tr("Skills & Materials")}
            {pickedCount > 0 && <span className="text-brass">{pickedCount}</span>}
            <ChevronDown className={cn("size-3.5 transition", showCategories && "rotate-180")} />
          </button>
          <label className="flex h-8 min-w-36 flex-1 items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-soft">
            <MapPin className="size-3.5 shrink-0" strokeWidth={1.4} aria-hidden />
            <span className="sr-only">{tr("Location (city or country) — optional")}</span>
            <input value={near} onChange={(e) => setNear(e.target.value)} placeholder={tr("City or country")} className="w-full min-w-0 bg-transparent uppercase outline-none placeholder:text-ink-soft" />
          </label>
        </div>

        {showCategories && (
          <div className="space-y-3 border-t border-line py-3">
            {GROUPS.map(([key, label, list]) => (
              <div key={key}>
                <p className="folio mb-1.5">{tr(label)}</p>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((v) => {
                    const on = picked[key]!.includes(v.name);
                    return (
                      <button key={v.name} type="button" onClick={() => toggle(key, v.name)} aria-pressed={on} className={cn("border px-2.5 py-1 text-[13px] transition", on ? "border-ink bg-ink text-paper" : "border-line hover:border-ink/50")}>
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

      <button type="button" onClick={() => void submit()} disabled={pending} className="mt-3 flex h-11 w-full items-center justify-center gap-2.5 rounded-sm bg-ink font-mono text-[12px] uppercase tracking-[0.06em] text-paper transition hover:bg-brass disabled:opacity-60">
        {pending ? tr("Searching…") : tr("Explore expertise")}
        <ArrowRight className="size-3.5" />
      </button>

      {!compact && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => setQ(tr(ex))} className="text-left font-display text-lg italic text-muted hover:text-brass">
              {tr(ex)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
