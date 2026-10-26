"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, FileText, Paperclip, X } from "lucide-react";
import { saveProject } from "@/app/(app)/dashboard/projects/actions";
import { Button } from "@/components/ui/button";
import { BUDGETS, CLIENT_TYPES, LOOKING_FOR, MATERIALS, PRODUCTION_TYPES, PROFESSIONAL_TYPES, PROJECT_TYPES, REACH, SERVICES, SPACE_TYPES, STYLES, TIMELINES } from "@/lib/constants";
import { COUNTRIES } from "@/lib/geo";
import { cn, formatBytes } from "@/lib/utils";

export type ProjectDraft = {
  id?: string;
  title: string;
  projectType: string;
  description: string;
  clientType: string;
  country: string;
  region: string;
  city: string;
  size: string;
  spaceTypes: string[];
  style: string;
  materials: string[];
  colorsFinishes: string;
  lookingFor: string;
  productionType: string;
  quantities: string;
  technicalReqs: string;
  timeline: string;
  budget: string;
  completionDate: string;
  professionalTypes: string[];
  services: string[];
  reach: string;
  notes: string;
};

const STEPS = ["The project", "Space & size", "Style & materials", "Your needs", "Timing & budget", "Professionals", "Recap"];

export function ProjectWizard({ initial }: { initial: ProjectDraft }) {
  const [step, setStep] = useState(0);
  const [d, setD] = useState<ProjectDraft>(initial);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof ProjectDraft>(k: K, v: ProjectDraft[K]) => setD((x) => ({ ...x, [k]: v }));
  const toggle = (k: "spaceTypes" | "materials" | "professionalTypes" | "services", v: string) => set(k, d[k].includes(v) ? d[k].filter((x) => x !== v) : [...d[k], v]);

  function validate(s: number) {
    if (s === 0) {
      if (!d.projectType) return "Please choose the type of project.";
      if (!d.country.trim() || !d.city.trim()) return "Please indicate where the project is located.";
    }
    if (s === 4) {
      if (!d.timeline) return "Please choose when you would like to carry out the project.";
      if (!d.budget) return "Please choose a budget range.";
    }
    return null;
  }

  function next() {
    const e = validate(step);
    setError(e);
    if (!e) {
      setStep((s) => Math.min(STEPS.length - 1, s + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function submit() {
    for (const s of [0, 4]) {
      const e = validate(s);
      if (e) {
        setError(e);
        setStep(s);
        return;
      }
    }
    start(async () => {
      const fd = new FormData();
      for (const [k, v] of Object.entries(d)) {
        if (Array.isArray(v)) v.forEach((x) => fd.append(k, x));
        else if (v != null && v !== "") fd.set(k, String(v));
      }
      const res = await saveProject(fd);
      if (res.error || !res.id) return setError(res.error ?? "Could not save the project.");
      // Références (moodboards, plans) rattachées au projet
      for (const f of files) {
        const up = new FormData();
        up.set("file", f);
        up.set("projectId", res.id);
        await fetch("/api/documents", { method: "POST", body: up });
      }
      router.push(`/dashboard/projects/${res.id}${d.id ? "" : "?created=1"}`);
    });
  }

  const recap: [string, string][] = [
    ["Project", `${d.projectType}${d.title ? ` — ${d.title}` : ""}`],
    ["Location", [d.city, d.region, d.country].filter(Boolean).join(", ")],
    ["Project size", d.size],
    ["Spaces", d.spaceTypes.join(", ")],
    ["Style", d.style],
    ["Materials", d.materials.join(" / ")],
    ["Looking for", [d.lookingFor, d.productionType].filter(Boolean).join(" — ")],
    ["Quantities", d.quantities],
    ["Timeline", d.timeline],
    ["Budget", d.budget],
    ["Your needs", [d.professionalTypes.join(", "), d.services.join(", ")].filter(Boolean).join(" · ")],
    ["Reach", d.reach],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <div>
      {/* Progression */}
      <div className="mb-8">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </p>
          <p className="text-[12px] text-muted">Questions in bold are required</p>
        </div>
        <div className="mt-3 flex gap-1">
          {STEPS.map((s, i) => (
            <button key={s} type="button" onClick={() => i < step && setStep(i)} className={cn("h-1 flex-1 rounded-full transition", i <= step ? "bg-ink" : "bg-line")} aria-label={`Step ${i + 1}: ${s}`} />
          ))}
        </div>
      </div>

      <div className="animate-fade-in space-y-4" key={step}>
        {step === 0 && (
          <>
            <Q title="What type of project is it?" required>
              <div className="flex flex-wrap gap-2">
                {PROJECT_TYPES.map((t) => (
                  <Chip key={t} on={d.projectType === t} onClick={() => set("projectType", t)}>
                    {t}
                  </Chip>
                ))}
              </div>
              <input value={d.title} onChange={(e) => set("title", e.target.value)} placeholder="Give it a name (optional) — e.g. Hotel Belle Époque" className="field mt-4" maxLength={140} />
            </Q>
            <Q title="Describe your project" hint="In your own words — our engine extracts skills, materials and places to match makers.">
              <textarea value={d.description} onChange={(e) => set("description", e.target.value)} rows={4} maxLength={4000} className="field resize-none" placeholder="Renovation of a 20-room boutique hotel: warm contemporary atmosphere, custom furniture, brass and stone details…" />
            </Q>
            <Q title="Where is the project located?" required>
              <div className="grid gap-3 sm:grid-cols-3">
                <input value={d.country} onChange={(e) => set("country", e.target.value)} placeholder="Country" list="wiz-countries" className="field" aria-label="Country" />
                <input value={d.region} onChange={(e) => set("region", e.target.value)} placeholder="Region / State" className="field" aria-label="Region" />
                <input value={d.city} onChange={(e) => set("city", e.target.value)} placeholder="City" className="field" aria-label="City" />
              </div>
              <datalist id="wiz-countries">
                {COUNTRIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Q>
            <Q title="Who are you?">
              <div className="flex flex-wrap gap-2">
                {CLIENT_TYPES.map((t) => (
                  <Chip key={t.value} on={d.clientType === t.value} onClick={() => set("clientType", t.value)}>
                    {t.label}
                  </Chip>
                ))}
              </div>
            </Q>
          </>
        )}

        {step === 1 && (
          <>
            <Q title="How large is the project?" hint="Number of rooms, surface area (m²), number of items, or other relevant measure.">
              <input value={d.size} onChange={(e) => set("size", e.target.value)} placeholder="e.g. 20 rooms + lobby bar, 450 m²" className="field" maxLength={200} />
            </Q>
            <Q title="What type of space are you working on?">
              <div className="flex flex-wrap gap-2">
                {SPACE_TYPES.map((t) => (
                  <Chip key={t} on={d.spaceTypes.includes(t)} onClick={() => toggle("spaceTypes", t)}>
                    {t}
                  </Chip>
                ))}
              </div>
            </Q>
          </>
        )}

        {step === 2 && (
          <>
            <Q title="How would you describe your desired style?" hint="Contemporary, minimalist, traditional, organic, industrial, etc.">
              <div className="mb-3 flex flex-wrap gap-2">
                {STYLES.map((t) => (
                  <Chip key={t} on={d.style === t} onClick={() => set("style", d.style === t ? "" : t)}>
                    {t}
                  </Chip>
                ))}
              </div>
              <input value={d.style} onChange={(e) => set("style", e.target.value)} placeholder="Or describe it: contemporary and warm…" className="field" maxLength={200} />
            </Q>
            <Q title="Which materials are you looking for?" hint="Multiple choices possible.">
              <div className="flex flex-wrap gap-2">
                {MATERIALS.map((m) => (
                  <Chip key={m.name} on={d.materials.includes(m.name)} onClick={() => toggle("materials", m.name)}>
                    {m.name}
                  </Chip>
                ))}
              </div>
            </Q>
            <Q title="Are there any specific colours, finishes or details to consider?">
              <textarea value={d.colorsFinishes} onChange={(e) => set("colorsFinishes", e.target.value)} rows={3} className="field resize-none" placeholder="Brushed brass, honed travertine, oak with a smoked finish…" />
            </Q>
            <Q title="Do you have any reference images or moodboards?" hint="Upload images, plans or documents (PDF, JPG, PNG — 15 MB max each).">
              <div className="flex flex-wrap items-center gap-2">
                {files.map((f, i) => (
                  <span key={i} className="flex items-center gap-2 rounded-full bg-sand py-1.5 pl-3 pr-1.5 text-[12.5px]">
                    <FileText className="size-3.5" /> <span className="max-w-44 truncate">{f.name}</span> <span className="text-muted">{formatBytes(f.size)}</span>
                    <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="rounded-full p-0.5 hover:bg-line" aria-label={`Remove ${f.name}`}>
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-full border border-dashed border-ink/40 px-4 py-2 text-[13px] hover:bg-sand">
                  <Paperclip className="size-4" /> Add files
                </button>
                <input ref={fileRef} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={(e) => { setFiles([...files, ...Array.from(e.target.files ?? [])].slice(0, 10)); e.target.value = ""; }} />
              </div>
            </Q>
          </>
        )}

        {step === 3 && (
          <>
            <Q title="What are you looking for?" hint="Furniture, lighting, decorative objects, materials, architectural elements, custom-made pieces, etc.">
              <div className="flex flex-wrap gap-2">
                {LOOKING_FOR.map((t) => (
                  <Chip key={t} on={d.lookingFor === t} onClick={() => set("lookingFor", d.lookingFor === t ? "" : t)}>
                    {t}
                  </Chip>
                ))}
              </div>
            </Q>
            <Q title="What type of production do you need?">
              <div className="flex flex-wrap gap-2">
                {PRODUCTION_TYPES.map((t) => (
                  <Chip key={t} on={d.productionType === t} onClick={() => set("productionType", d.productionType === t ? "" : t)}>
                    {t}
                  </Chip>
                ))}
              </div>
            </Q>
            <Q title="What quantities are required?" hint="Estimated quantities or number of items.">
              <input value={d.quantities} onChange={(e) => set("quantities", e.target.value)} className="field" placeholder="20 bed heads, 20 vanities, 1 bar counter" maxLength={500} />
            </Q>
            <Q title="Do you have specific technical requirements?" hint="Dimensions, finishes, materials, certifications (fire rating, food contact…).">
              <textarea value={d.technicalReqs} onChange={(e) => set("technicalReqs", e.target.value)} rows={3} className="field resize-none" maxLength={2000} />
            </Q>
          </>
        )}

        {step === 4 && (
          <>
            <Q title="When would you like to carry out the project?" required>
              <div className="flex flex-wrap gap-2">
                {TIMELINES.map((t) => (
                  <Chip key={t} on={d.timeline === t} onClick={() => set("timeline", t)}>
                    {t}
                  </Chip>
                ))}
              </div>
            </Q>
            <Q title="What is your estimated budget?" required>
              <div className="flex flex-wrap gap-2">
                {BUDGETS.map((t) => (
                  <Chip key={t} on={d.budget === t} onClick={() => set("budget", t)}>
                    {t}
                  </Chip>
                ))}
              </div>
            </Q>
            <Q title="When would you like the project to be completed?" hint="Optional.">
              <input type="date" value={d.completionDate} onChange={(e) => set("completionDate", e.target.value)} min={new Date().toISOString().slice(0, 10)} className="field w-auto" />
            </Q>
          </>
        )}

        {step === 5 && (
          <>
            <Q title="What kind of professionals are you looking for?">
              <div className="flex flex-wrap gap-2">
                {PROFESSIONAL_TYPES.map((t) => (
                  <Chip key={t} on={d.professionalTypes.includes(t)} onClick={() => toggle("professionalTypes", t)}>
                    {t}
                  </Chip>
                ))}
              </div>
            </Q>
            <Q title="What services do you need?">
              <div className="flex flex-wrap gap-2">
                {SERVICES.map((t) => (
                  <Chip key={t} on={d.services.includes(t)} onClick={() => toggle("services", t)}>
                    {t}
                  </Chip>
                ))}
              </div>
            </Q>
            <Q title="Where should the makers be based?">
              <div className="flex flex-wrap gap-2">
                {REACH.map((t) => (
                  <Chip key={t} on={d.reach === t} onClick={() => set("reach", t)}>
                    {t}
                  </Chip>
                ))}
              </div>
            </Q>
            <Q title="Is there anything else we should know about your project?" hint="Optional.">
              <textarea value={d.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className="field resize-none" maxLength={3000} />
            </Q>
          </>
        )}

        {step === 6 && (
          <div className="rounded-3xl border border-line bg-paper p-6 sm:p-10">
            <p className="inline-block rounded-full bg-ink px-5 py-2 text-sm font-semibold text-paper">Project recap</p>
            <dl className="mt-8 grid gap-x-10 gap-y-4 sm:grid-cols-2">
              {recap.map(([k, v]) => (
                <div key={k} className="border-b border-line pb-3">
                  <dt className="text-[12px] uppercase tracking-[0.14em] text-muted">{k}</dt>
                  <dd className="mt-1 text-[15px]">{v}</dd>
                </div>
              ))}
            </dl>
            {d.description && <p className="mt-6 text-sm italic leading-relaxed text-ink-soft">“{d.description}”</p>}
            {files.length > 0 && <p className="mt-4 text-sm text-muted">{files.length} reference file(s) attached.</p>}
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-5 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
        <Button type="button" variant="ghost" onClick={() => (step === 0 ? router.back() : setStep(step - 1))}>
          <ArrowLeft className="size-4" /> {step === 0 ? "Cancel" : step === STEPS.length - 1 ? "Modify" : "Back"}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next}>
            Continue <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button type="button" size="lg" onClick={submit} loading={pending}>
            {d.id ? "Save the project" : "Confirm & find makers"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={cn("rounded-full border px-3.5 py-2 text-[13px] transition", on ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:border-ink/40")}>
      {children}
    </button>
  );
}

function Q({ title, hint, required, children }: { title: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-5 sm:p-6">
      <p className={cn("text-[15px]", required ? "font-semibold" : "font-medium text-ink-soft")}>
        {title}
        {required && <span className="text-brass"> *</span>}
      </p>
      {hint && <p className="mt-1 text-[12.5px] text-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}
