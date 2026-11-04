"use client";

import { useRef, useState } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";

type Doc = { id: string; name: string; mime: string; size: number; url: string; createdAt: string; project: { id: string; title: string } | null };

export function DocumentsManager({ initialDocs, projects, initialProject, used }: { initialDocs: Doc[]; projects: { id: string; title: string }[]; initialProject: string; used: number }) {
  const tr = useT();
  const [docs, setDocs] = useState(initialDocs);
  const [projectId, setProjectId] = useState(initialProject);
  const [filter, setFilter] = useState(initialProject || "all");
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState(used);
  const ref = useRef<HTMLInputElement>(null);

  async function upload(files: File[]) {
    setError(null);
    for (const f of files) {
      setBusy((b) => b + 1);
      const fd = new FormData();
      fd.set("file", f);
      if (projectId) fd.set("projectId", projectId);
      const res = await fetch("/api/documents", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      setBusy((b) => b - 1);
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        continue;
      }
      const d = data.document;
      setUsage((u) => u + d.size);
      setDocs((x) => [{ id: d.id, name: d.name, mime: d.mime, size: d.size, url: `/files/${d.key}`, createdAt: d.createdAt, project: projects.find((p) => p.id === d.projectId) ?? null }, ...x]);
    }
  }

  async function remove(doc: Doc) {
    if (!confirm(tr("Delete “{name}”?", { name: doc.name }))) return;
    setDocs((x) => x.filter((d) => d.id !== doc.id));
    setUsage((u) => u - doc.size);
    await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
  }

  const visible = docs.filter((d) => filter === "all" || (filter === "none" ? !d.project : d.project?.id === filter));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-5 sm:flex-row sm:items-center">
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="field sm:w-64" aria-label={tr("Attach to project")}>
          <option value="">{tr("No project")}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {tr(p.title)}
            </option>
          ))}
        </select>
        <button onClick={() => ref.current?.click()} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-paper hover:bg-ink-soft">
          {busy ? <span className="size-4 animate-spin rounded-full border-2 border-paper border-r-transparent" /> : <Upload className="size-4" />} {" "}{tr("Upload files")}</button>
        <input ref={ref} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={(e) => { upload(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
        <div className="sm:ml-auto sm:w-56">
          <div className="flex justify-between text-[11.5px] text-muted">
            <span>{tr("Storage")}</span>
            <span>{tr.bytes(usage)} / 500 MB</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand">
            <div className="h-full bg-brass" style={{ width: `${Math.min(100, (usage / (500 * 1024 * 1024)) * 100)}%` }} />
          </div>
        </div>
      </div>
      {error && <p className="text-sm text-danger">{tr(error)}</p>}

      <div className="flex flex-wrap gap-1.5">
        {[{ id: "all", title: tr("All") }, ...projects, { id: "none", title: tr("Unassigned") }].map((p) => (
          <button key={p.id} onClick={() => setFilter(p.id)} className={cn("rounded-full px-3 py-1 text-[12.5px]", filter === p.id ? "bg-ink text-paper" : "bg-paper text-muted ring-1 ring-line hover:text-ink")}>
            {tr(p.title)}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-12 text-center text-sm text-muted">{tr("No document here yet.")}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((d) => (
            <li key={d.id} className="group overflow-hidden rounded-2xl border border-line bg-paper">
              <a href={d.url} target="_blank" rel="noopener" className="block aspect-[16/10] bg-sand">
                {d.mime.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.url} alt="" className="size-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex size-full items-center justify-center">
                    <FileText className="size-10 text-brass" strokeWidth={1.2} />
                  </span>
                )}
              </a>
              <div className="flex items-start gap-2 p-4">
                <div className="min-w-0 flex-1">
                  <a href={`${d.url}?download=${encodeURIComponent(d.name)}`} className="block truncate text-[13.5px] font-medium hover:underline">
                    {d.name}
                  </a>
                  <p className="truncate text-[11.5px] text-muted">
                    {tr.bytes(d.size)} · {tr.date(d.createdAt)}
                    {d.project && ` · ${d.project.title}`}
                  </p>
                </div>
                <button onClick={() => remove(d)} className="rounded-full p-1.5 text-muted hover:bg-sand hover:text-danger" aria-label={tr("Delete {name}", { name: d.name })}>
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
