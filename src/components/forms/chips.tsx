"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";

/** Groupe de cases à cocher stylées en « pilules » ; soumet `name` répété pour chaque valeur. */
export function ChipGroup({ name, options, defaultValue = [], max }: { name: string; options: readonly string[]; defaultValue?: string[]; max?: number }) {
  const tr = useT();
  const [values, setValues] = useState<string[]>(defaultValue);
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = values.includes(o);
        const disabled = !on && max != null && values.length >= max;
        return (
          <label key={o} className={cn("cursor-pointer select-none rounded-sm border px-3 py-1.5 text-[12.5px] transition", on ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:border-ink/40", disabled && "cursor-not-allowed opacity-40")}>
            <input type="checkbox" name={name} value={o} checked={on} disabled={disabled} onChange={() => setValues((v) => (on ? v.filter((x) => x !== o) : [...v, o]))} className="sr-only" />
            {tr(o)}
          </label>
        );
      })}
    </div>
  );
}

/** Saisie de mots-clés en bulles (Entrée ou virgule pour valider). */
export function TagInput({ name, defaultValue = [], max = 15, placeholder }: { name: string; defaultValue?: string[]; max?: number; placeholder?: string }) {
  const tr = useT();
  const [tags, setTags] = useState<string[]>(defaultValue);
  const [draft, setDraft] = useState("");
  function commit() {
    const v = draft.trim().replace(/,$/, "").slice(0, 40);
    if (v && !tags.some((t) => t.toLowerCase() === v.toLowerCase()) && tags.length < max) setTags([...tags, v]);
    setDraft("");
  }
  return (
    <div>
      <div className="field flex min-h-12 flex-wrap items-center gap-1.5 py-2">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 rounded-sm bg-brass-light px-2.5 py-1 text-[12.5px] text-brass-dark">
            {t}
            <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={tr("Remove {t}", { t })} className="rounded-sm p-0.5 hover:bg-brass/20">
              <X className="size-3" />
            </button>
            <input type="hidden" name={name} value={t} />
          </span>
        ))}
        {tags.length < max && (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                commit();
              } else if (e.key === "Backspace" && !draft && tags.length) setTags(tags.slice(0, -1));
            }}
            onBlur={commit}
            placeholder={tags.length ? "" : placeholder}
            className="min-w-32 flex-1 bg-transparent text-sm focus:outline-none"
          />
        )}
      </div>
      <p className="mt-1.5 text-xs text-muted">
        {tr("Press Enter to add · {length}/{max}", { length: tags.length, max })}
      </p>
    </div>
  );
}

export function MonthPicker({ name, defaultValue = [] }: { name: string; defaultValue?: number[] }) {
  const tr = useT();
  const [months, setMonths] = useState<number[]>(defaultValue);
  const labels = [tr("Jan"), tr("Feb"), tr("Mar"), tr("Apr"), tr("May"), tr("Jun"), tr("Jul"), tr("Aug"), tr("Sep"), tr("Oct"), tr("Nov"), tr("Dec")];
  return (
    <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
      {labels.map((l, i) => {
        const on = months.includes(i + 1);
        return (
          <label key={l} className={cn("cursor-pointer rounded-lg border py-2 text-center text-[12px] transition", on ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:border-ink/40")}>
            <input type="checkbox" name={name} value={i + 1} checked={on} onChange={() => setMonths((m) => (on ? m.filter((x) => x !== i + 1) : [...m, i + 1]))} className="sr-only" />
            {tr(l)}
          </label>
        );
      })}
    </div>
  );
}

/** Domaines d'expertise (plusieurs) et, pour chacun, ses spécialités (plusieurs). */
export function AreaPicker({ areas, defaultAreas = [], defaultSpecialties = [] }: { areas: { name: string; specialties: string[] }[]; defaultAreas?: string[]; defaultSpecialties?: string[] }) {
  const tr = useT();
  const [picked, setPicked] = useState<string[]>(defaultAreas);
  const [specs, setSpecs] = useState<string[]>(defaultSpecialties);
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  return (
    <div className="divide-y divide-line border-y border-line">
      {areas.map((a) => {
        const on = picked.includes(a.name);
        return (
          <div key={a.name} className="py-3">
            <label className="flex cursor-pointer items-center gap-3 text-[14px]">
              <input type="checkbox" name="areas" value={a.name} checked={on} onChange={() => setPicked((p) => toggle(p, a.name))} className="size-4 accent-ink" />
              <span className={cn(on && "font-medium")}>{tr(a.name)}</span>
            </label>
            {on && (
              <div className="mt-2.5 flex flex-wrap gap-1.5 pl-7">
                {a.specialties.map((s) => {
                  const sOn = specs.includes(s);
                  return (
                    <label key={s} className={cn("cursor-pointer select-none rounded-sm border px-2.5 py-1 text-[12px] transition", sOn ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:border-ink/40")}>
                      <input type="checkbox" name="specialties" value={s} checked={sOn} onChange={() => setSpecs((p) => toggle(p, s))} className="sr-only" />
                      {tr(s)}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
