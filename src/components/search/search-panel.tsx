"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ArrowRight, ImagePlus, MapPin, Sparkles, X } from "lucide-react";
import { MATERIALS, SKILLS, TECHNIQUES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Tab = "project" | "image" | "skills";

const TABS: { id: Tab; label: string }[] = [
  { id: "project", label: "Describe a project" },
  { id: "image", label: "Search by image" },
  { id: "skills", label: "Skills & Materials" },
];

const EXAMPLES = ["Hand-patinated brass kitchen fronts for a villa in Nice", "Tufted leather wall panels for a private cinema", "Backlit onyx vanity for a boutique hotel"];

export function SearchPanel({ initialTab = "project", compact = false }: { initialTab?: Tab; compact?: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [q, setQ] = useState("");
  const [near, setNear] = useState("");
  const [picked, setPicked] = useState<Record<string, string[]>>({ skills: [], materials: [], techniques: [] });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function chooseFile(f: File | undefined | null) {
    setError(null);
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError("Please choose an image (JPG, PNG, WebP or HEIC).");
    if (f.size > 10 * 1024 * 1024) return setError("Image is too large (10 MB max).");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function toggle(group: string, value: string) {
    setPicked((p) => ({ ...p, [group]: p[group]!.includes(value) ? p[group]!.filter((v) => v !== value) : [...p[group]!, value] }));
  }

  async function submit() {
    setError(null);
    const params = new URLSearchParams();
    if (near.trim()) params.set("near", near.trim());
    if (tab === "project") {
      if (q.trim().length < 3) return setError("Describe what you want to create in a few words.");
      params.set("q", q.trim());
      startTransition(() => router.push(`/search?${params}`));
    } else if (tab === "skills") {
      for (const [k, vals] of Object.entries(picked)) vals.forEach((v) => params.append(k, v));
      startTransition(() => router.push(`/search?${params}`));
    } else {
      if (!file) return setError("Drop or choose a reference image first.");
      const body = new FormData();
      body.set("image", file);
      startTransition(async () => {
        const res = await fetch("/api/search/image", { method: "POST", body });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "Image search failed, please try again.");
          if (data.code === "LIMIT") router.push("/pricing?reason=image-limit");
          return;
        }
        params.set("image", data.id);
        router.push(`/search?${params}`);
      });
    }
  }

  const pickedCount = Object.values(picked).flat().length;

  return (
    <div className={cn("rounded-[1.6rem] border border-line bg-paper/95 p-2 shadow-[0_30px_80px_-40px_rgba(28,23,20,0.35)] backdrop-blur", compact && "shadow-none")}>
      <div role="tablist" aria-label="Search mode" className="flex gap-1 overflow-x-auto rounded-[1.2rem] bg-ivory p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id);
              setError(null);
            }}
            className={cn("flex-1 whitespace-nowrap rounded-[0.95rem] px-4 py-2.5 text-[13px] font-medium transition", tab === t.id ? "bg-paper text-ink shadow-sm" : "text-muted hover:text-ink")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-3 sm:p-4">
        {tab === "project" && (
          <div>
            <label htmlFor="sp-q" className="sr-only">
              Describe what you want to create
            </label>
            <textarea
              id="sp-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
              }}
              rows={compact ? 2 : 3}
              placeholder="Describe what you want to create…"
              className="w-full resize-none bg-transparent font-display text-xl leading-snug text-ink placeholder:text-[#b3a697] focus:outline-none sm:text-2xl"
            />
            {!compact && (
              <div className="mt-1 flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button key={ex} onClick={() => setQ(ex)} className="rounded-full border border-line px-3 py-1 text-[12px] text-muted transition hover:border-ink/40 hover:text-ink">
                    {ex}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "image" && (
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
            className={cn("flex min-h-[132px] items-center gap-5 rounded-2xl border border-dashed p-4 transition", dragging ? "border-brass bg-brass-light/40" : "border-line")}
          >
            {preview ? (
              <div className="relative size-24 shrink-0 overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Selected reference" className="size-full object-cover" />
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                  }}
                  className="absolute right-1 top-1 rounded-full bg-ink/70 p-1 text-paper"
                  aria-label="Remove image"
                >
                  <X className="size-3" />
                </button>
              </div>
            ) : (
              <span className="flex size-24 shrink-0 items-center justify-center rounded-xl bg-ivory text-brass">
                <ImagePlus className="size-7" strokeWidth={1.4} />
              </span>
            )}
            <div className="text-sm">
              <p className="font-medium">{file ? file.name : "Drop a reference picture"}</p>
              <p className="mt-1 text-muted">A moodboard, a photo of a piece, a texture… We&apos;ll find makers whose work looks alike.</p>
              <button onClick={() => inputRef.current?.click()} className="mt-2 text-[13px] font-medium text-brass-dark underline-offset-4 hover:underline">
                {file ? "Choose another image" : "Browse files"}
              </button>
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => chooseFile(e.target.files?.[0])} />
            </div>
          </div>
        )}

        {tab === "skills" && (
          <div className="scrollbar-thin max-h-56 space-y-4 overflow-y-auto pr-1">
            {[
              ["skills", "Skills", SKILLS],
              ["materials", "Materials", MATERIALS],
              ["techniques", "Techniques", TECHNIQUES],
            ].map(([key, label, list]) => (
              <div key={key as string}>
                <p className="eyebrow mb-2">{label as string}</p>
                <div className="flex flex-wrap gap-1.5">
                  {(list as typeof SKILLS).map((v) => {
                    const on = picked[key as string]!.includes(v.name);
                    return (
                      <button key={v.name} onClick={() => toggle(key as string, v.name)} aria-pressed={on} className={cn("rounded-full border px-3 py-1 text-[12.5px] transition", on ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:border-ink/40")}>
                        {v.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center">
          <label className="flex flex-1 items-center gap-2 rounded-full bg-ivory px-4 py-2.5">
            <MapPin className="size-4 shrink-0 text-muted" strokeWidth={1.6} />
            <span className="sr-only">Location</span>
            <input value={near} onChange={(e) => setNear(e.target.value)} placeholder="Location (city or country) — optional" className="w-full bg-transparent text-sm focus:outline-none" />
          </label>
          <button onClick={submit} disabled={pending} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-7 text-sm font-medium text-paper transition hover:bg-ink-soft disabled:opacity-60">
            {pending ? <span className="size-4 animate-spin rounded-full border-2 border-paper border-r-transparent" /> : <Sparkles className="size-4" strokeWidth={1.6} />}
            {tab === "skills" && pickedCount ? `Explore ${pickedCount} criteria` : "Explore expertise"}
            <ArrowRight className="size-4" />
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
