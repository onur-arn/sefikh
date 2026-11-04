"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, Lock, X } from "lucide-react";
import { useT } from "@/i18n/client";
import { COMPANY_KINDS, MATERIALS, SECTORS, SKILLS, TECHNIQUES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

const LIST_GROUPS: { key: string; label: string; options: Option[] }[] = [
  { key: "skills", label: "Skills", options: SKILLS.map((s) => ({ value: s.name, label: s.name })) },
  { key: "materials", label: "Materials", options: MATERIALS.map((s) => ({ value: s.name, label: s.name })) },
  { key: "techniques", label: "Techniques", options: TECHNIQUES.map((s) => ({ value: s.name, label: s.name })) },
  { key: "sectors", label: "Project sectors", options: SECTORS.map((s) => ({ value: s.name, label: s.name })) },
];
const EXTRA_TABS = [
  { key: "kind", label: "Type of maker" },
  { key: "months", label: "Availability" },
  { key: "lead", label: "Lead time" },
  { key: "radius", label: "Distance" },
];
const ALL_KEYS = ["kind", "skills", "materials", "techniques", "sectors", "months", "lead", "radius"];

/** Filtres en bandeau : chaque critère déplie un panneau pleine largeur sous la barre. */
export function FilterBar({ locked = false }: { locked?: boolean }) {
  const tr = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState<string | null>(null);

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
  const setOne = (key: string, value: string) => update((p) => (p.get(key) === value ? p.delete(key) : p.set(key, value)));

  const monthName = (m: number) => tr.date(new Date(2026, m - 1, 1), { month: "long" });
  const tabs = [
    EXTRA_TABS[0]!,
    ...LIST_GROUPS,
    EXTRA_TABS[1]!,
    EXTRA_TABS[2]!,
    ...(params.get("near") ? [EXTRA_TABS[3]!] : []),
  ];
  const active = ALL_KEYS.flatMap((k) => params.getAll(k).map((v) => ({ key: k, value: v })));
  const labelOf = ({ key, value }: { key: string; value: string }) => {
    if (key === "kind") return tr(COMPANY_KINDS.find((k) => k.value === value)?.label ?? value);
    if (key === "months") return monthName(Number(value));
    if (key === "lead") return tr(Number(value) > 1 ? "Can start within {m} months" : "Can start within {m} month", { m: value });
    if (key === "radius") return tr("Within {km} km", { km: tr.number(Number(value)) });
    return tr(value);
  };

  if (locked) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-line py-3">
        <p className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11.5px] uppercase tracking-[0.05em] text-muted">
          <Lock className="size-3.5" strokeWidth={1.4} />
          {tabs.map((t) => (
            <span key={t.key}>{tr(t.label)}</span>
          ))}
        </p>
        <Link href="/pricing" className="link-underline font-mono text-[11.5px] uppercase tracking-[0.05em] text-brass">
          {tr("Filters are included in Pro and Studio")}
        </Link>
      </div>
    );
  }

  const chip = (on: boolean) => cn("border px-3 py-1.5 text-[13px] transition", on ? "border-ink bg-ink text-paper" : "border-line hover:border-ink/50");

  return (
    <div className={cn("border-y border-line transition-opacity", pending && "opacity-60")}>
      <div className="-mx-4 flex gap-6 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label={tr("Filters")}>
        {tabs.map((t) => {
          const count = params.getAll(t.key).length;
          return (
            <button key={t.key} type="button" role="tab" aria-selected={open === t.key} onClick={() => setOpen(open === t.key ? null : t.key)} className={cn("flex shrink-0 items-center gap-1.5 py-3.5 font-mono text-[11.5px] uppercase tracking-[0.05em] transition-colors", open === t.key || count ? "text-ink" : "text-muted hover:text-ink")}>
              {tr(t.label)}
              {count > 0 && <span className="text-brass">{count}</span>}
              <ChevronDown className={cn("size-3 transition", open === t.key && "rotate-180")} strokeWidth={1.5} />
            </button>
          );
        })}
      </div>

      {open && (
        <div className="flex flex-wrap gap-1.5 border-t border-line py-4">
          {open === "kind" && COMPANY_KINDS.map((k) => (
            <button key={k.value} type="button" onClick={() => setOne("kind", k.value)} aria-pressed={params.get("kind") === k.value} className={chip(params.get("kind") === k.value)}>
              {tr(k.label)}
            </button>
          ))}
          {LIST_GROUPS.find((g) => g.key === open)?.options.map((o) => {
            const on = params.getAll(open).includes(o.value);
            return (
              <button key={o.value} type="button" onClick={() => toggle(open, o.value)} aria-pressed={on} className={chip(on)}>
                {tr(o.label)}
              </button>
            );
          })}
          {open === "months" && Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
            const on = params.getAll("months").includes(String(m));
            return (
              <button key={m} type="button" onClick={() => toggle("months", String(m))} aria-pressed={on} className={cn(chip(on), "capitalize")}>
                {monthName(m)}
              </button>
            );
          })}
          {open === "lead" && [1, 2, 3, 6, 12].map((m) => (
            <button key={m} type="button" onClick={() => setOne("lead", String(m))} aria-pressed={params.get("lead") === String(m)} className={chip(params.get("lead") === String(m))}>
              {tr(m > 1 ? "Can start within {m} months" : "Can start within {m} month", { m })}
            </button>
          ))}
          {open === "radius" && [50, 200, 500, 1500].map((km) => (
            <button key={km} type="button" onClick={() => setOne("radius", String(km))} aria-pressed={params.get("radius") === String(km)} className={chip(params.get("radius") === String(km))}>
              {tr("Within {km} km", { km: tr.number(km) })}
            </button>
          ))}
        </div>
      )}

      {active.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line py-3">
          {active.map((a) => (
            <button key={`${a.key}:${a.value}`} type="button" onClick={() => toggle(a.key, a.value)} aria-label={tr("Remove {t}", { t: labelOf(a) })} className="flex items-center gap-1 text-[13px] text-ink-soft hover:text-brass">
              {labelOf(a)}
              <X className="size-3" />
            </button>
          ))}
          <button type="button" onClick={() => update((p) => ALL_KEYS.forEach((k) => p.delete(k)))} className="folio ml-auto underline-offset-2 hover:underline">
            {tr("Clear all ({activeCount})", { activeCount: active.length })}
          </button>
        </div>
      )}
    </div>
  );
}

export function SortSelect() {
  const tr = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <select
      aria-label={tr("Sort results")}
      value={params.get("sort") ?? "relevance"}
      onChange={(e) => {
        const p = new URLSearchParams(params.toString());
        if (e.target.value === "relevance") p.delete("sort");
        else p.set("sort", e.target.value);
        router.replace(`${pathname}?${p}`, { scroll: false });
      }}
      className="cursor-pointer bg-transparent pr-1 font-mono text-[11.5px] uppercase tracking-[0.05em] text-ink-soft outline-none [field-sizing:content]"
    >
      <option value="relevance">{tr("Most relevant")}</option>
      {params.get("near") && <option value="distance">{tr("Nearest")}</option>}
      <option value="recent">{tr("Alphabetical")}</option>
    </select>
  );
}
