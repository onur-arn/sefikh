"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { COMPANY_KINDS, MATERIALS, SECTORS, SKILLS, TECHNIQUES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const GROUPS = [
  { key: "skills", label: "Skills", items: SKILLS.map((s) => s.name) },
  { key: "materials", label: "Materials", items: MATERIALS.map((s) => s.name) },
  { key: "techniques", label: "Techniques", items: TECHNIQUES.map((s) => s.name) },
  { key: "sectors", label: "Project sectors", items: SECTORS.map((s) => s.name) },
];

export function SearchFilters({ counts }: { counts?: Record<string, number> }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({ skills: true, materials: true });

  function update(mut: (p: URLSearchParams) => void) {
    const p = new URLSearchParams(params.toString());
    mut(p);
    start(() => router.replace(`${pathname}?${p}`, { scroll: false }));
  }

  function toggle(key: string, value: string) {
    update((p) => {
      const values = p.getAll(key);
      p.delete(key);
      (values.includes(value) ? values.filter((v) => v !== value) : [...values, value]).forEach((v) => p.append(key, v));
    });
  }

  const activeCount = GROUPS.reduce((n, g) => n + params.getAll(g.key).length, 0) + (params.get("kind") ? 1 : 0) + (params.get("radius") ? 1 : 0);

  const body = (
    <div className={cn("space-y-1 transition-opacity", pending && "opacity-60")}>
      <div className="flex items-center justify-between pb-3">
        <p className="text-sm font-semibold">Filters</p>
        {activeCount > 0 && (
          <button
            onClick={() =>
              update((p) => {
                ["skills", "materials", "techniques", "sectors", "kind", "radius", "lead"].forEach((k) => p.delete(k));
              })
            }
            className="text-[12px] text-muted underline-offset-2 hover:text-ink hover:underline"
          >
            Clear all ({activeCount})
          </button>
        )}
      </div>

      <div className="border-t border-line py-4">
        <p className="mb-2.5 text-[13px] font-medium">Type of maker</p>
        <div className="flex flex-wrap gap-1.5">
          {COMPANY_KINDS.map((k) => {
            const on = params.get("kind") === k.value;
            return (
              <button key={k.value} onClick={() => update((p) => (on ? p.delete("kind") : p.set("kind", k.value)))} aria-pressed={on} className={cn("rounded-full border px-3 py-1 text-[12px] transition", on ? "border-ink bg-ink text-paper" : "border-line hover:border-ink/40")}>
                {k.label}
              </button>
            );
          })}
        </div>
      </div>

      {params.get("near") && (
        <div className="border-t border-line py-4">
          <p className="mb-2.5 text-[13px] font-medium">Distance from {params.get("near")}</p>
          <select value={params.get("radius") ?? ""} onChange={(e) => update((p) => (e.target.value ? p.set("radius", e.target.value) : p.delete("radius")))} className="field py-2 text-[13px]">
            <option value="">Any distance</option>
            <option value="50">Within 50 km</option>
            <option value="200">Within 200 km</option>
            <option value="500">Within 500 km</option>
            <option value="1500">Within 1,500 km</option>
          </select>
        </div>
      )}

      <div className="border-t border-line py-4">
        <p className="mb-2.5 text-[13px] font-medium">Maximum lead time</p>
        <select value={params.get("lead") ?? ""} onChange={(e) => update((p) => (e.target.value ? p.set("lead", e.target.value) : p.delete("lead")))} className="field py-2 text-[13px]">
          <option value="">Any lead time</option>
          {[1, 2, 3, 6, 12].map((m) => (
            <option key={m} value={m}>
              Can start within {m} month{m > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </div>

      {GROUPS.map((g) => {
        const selected = params.getAll(g.key);
        const isOpen = open[g.key] || selected.length > 0;
        return (
          <div key={g.key} className="border-t border-line py-4">
            <button onClick={() => setOpen((o) => ({ ...o, [g.key]: !isOpen }))} className="flex w-full items-center justify-between text-[13px] font-medium" aria-expanded={isOpen}>
              <span>
                {g.label}
                {selected.length > 0 && <span className="ml-1.5 rounded-full bg-ink px-1.5 text-[10px] text-paper">{selected.length}</span>}
              </span>
              <ChevronDown className={cn("size-4 text-muted transition", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
              <ul className="mt-3 space-y-1.5">
                {g.items.map((item) => (
                  <li key={item}>
                    <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink-soft hover:text-ink">
                      <input type="checkbox" checked={selected.includes(item)} onChange={() => toggle(g.key, item)} className="size-4 rounded accent-ink" />
                      <span className="flex-1">{item}</span>
                      {counts?.[`${g.key}:${item}`] != null && <span className="text-[11px] text-muted">{counts[`${g.key}:${item}`]}</span>}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <button onClick={() => setMobileOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm lg:hidden">
        <SlidersHorizontal className="size-4" /> Filters {activeCount > 0 && `(${activeCount})`}
      </button>
      <aside className="hidden lg:block">{body}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-[min(88vw,380px)] overflow-y-auto bg-ivory p-5">
            <button onClick={() => setMobileOpen(false)} className="mb-3 ml-auto flex size-9 items-center justify-center rounded-full hover:bg-sand" aria-label="Close filters">
              <X className="size-5" />
            </button>
            {body}
          </div>
        </div>
      )}
    </>
  );
}

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <select
      aria-label="Sort results"
      value={params.get("sort") ?? "relevance"}
      onChange={(e) => {
        const p = new URLSearchParams(params.toString());
        if (e.target.value === "relevance") p.delete("sort");
        else p.set("sort", e.target.value);
        router.replace(`${pathname}?${p}`, { scroll: false });
      }}
      className="field w-auto rounded-full py-2 pl-4 text-[13px]"
    >
      <option value="relevance">Most relevant</option>
      {params.get("near") && <option value="distance">Nearest</option>}
      <option value="recent">Alphabetical</option>
    </select>
  );
}
