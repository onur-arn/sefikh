"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, ImagePlus, Star, Trash2 } from "lucide-react";
import { cn, fileUrl } from "@/lib/utils";

type Item = { id: string; key: string; thumbKey: string | null; width: number; height: number; title: string | null; description: string | null; projectName: string | null; location: string | null; year: number | null; position: number };
type Upload = { name: string; status: "uploading" | "error"; error?: string };

export function PortfolioManager({ initialItems, limit }: { initialItems: Item[]; limit: number }) {
  const [items, setItems] = useState(initialItems);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragging, setDragging] = useState(false);
  const [limitHit, setLimitHit] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function uploadFiles(files: File[]) {
    for (const file of files.filter((f) => f.type.startsWith("image/"))) {
      setUploads((u) => [...u, { name: file.name, status: "uploading" }]);
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/portfolio", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setItems((it) => [...it, data.item]);
        setUploads((u) => u.filter((x) => x.name !== file.name));
      } else {
        if (data.code === "LIMIT") setLimitHit(true);
        setUploads((u) => u.map((x) => (x.name === file.name ? { ...x, status: "error", error: data.error } : x)));
      }
    }
    router.refresh();
  }

  async function move(id: string, dir: "up" | "down" | "first") {
    const idx = items.findIndex((i) => i.id === id);
    const next = [...items];
    const [it] = next.splice(idx, 1);
    next.splice(dir === "first" ? 0 : dir === "up" ? Math.max(0, idx - 1) : Math.min(next.length, idx + 1), 0, it!);
    setItems(next);
    await fetch(`/api/portfolio/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ move: dir }) });
  }

  async function remove(id: string) {
    if (!confirm("Delete this picture from your portfolio?")) return;
    setItems((it) => it.filter((i) => i.id !== id));
    await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          uploadFiles(Array.from(e.dataTransfer.files));
        }}
        className={cn("flex flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-12 text-center transition", dragging ? "border-brass bg-brass-light/30" : "border-line bg-paper")}
      >
        <ImagePlus className="size-9 text-brass" strokeWidth={1.3} />
        <p className="mt-3 font-medium">Drop your pictures here</p>
        <p className="mt-1 text-sm text-muted">JPG, PNG, WebP or HEIC — up to 10 MB each. Your best picture should come first.</p>
        <button onClick={() => inputRef.current?.click()} disabled={items.length >= limit} className="mt-5 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-ink-soft disabled:opacity-40">
          Choose pictures
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { uploadFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
        {limitHit && (
          <p className="mt-4 text-sm text-danger">
            Portfolio limit reached on your plan.{" "}
            <Link href="/upgrade" className="font-medium underline">
              Upgrade
            </Link>
          </p>
        )}
      </div>

      {uploads.length > 0 && (
        <ul className="space-y-2">
          {uploads.map((u) => (
            <li key={u.name} className="flex items-center gap-3 rounded-xl border border-line bg-paper px-4 py-3 text-sm">
              {u.status === "uploading" ? <span className="size-4 animate-spin rounded-full border-2 border-ink border-r-transparent" /> : <span className="size-2 rounded-full bg-danger" />}
              <span className="truncate">{u.name}</span>
              <span className={cn("ml-auto text-[12px]", u.status === "error" ? "text-danger" : "text-muted")}>{u.status === "uploading" ? "Optimising & analysing…" : u.error}</span>
            </li>
          ))}
        </ul>
      )}

      <ul className="grid gap-5 md:grid-cols-2">
        {items.map((item, i) => (
          <PortfolioItem key={item.id} item={item} index={i} total={items.length} onMove={move} onRemove={remove} />
        ))}
      </ul>
    </div>
  );
}

function PortfolioItem({ item, index, total, onMove, onRemove }: { item: Item; index: number; total: number; onMove: (id: string, d: "up" | "down" | "first") => void; onRemove: (id: string) => void }) {
  const initial = { title: item.title ?? "", description: item.description ?? "", projectName: item.projectName ?? "", location: item.location ?? "", year: item.year ? String(item.year) : "" };
  const [form, setForm] = useState(initial);
  const [base, setBase] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const dirty = JSON.stringify(form) !== JSON.stringify(base);

  async function save() {
    setState("saving");
    await fetch(`/api/portfolio/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, year: form.year || null }) });
    setBase(form);
    setState("saved");
    setTimeout(() => setState("idle"), 1500);
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <li className="overflow-hidden rounded-2xl border border-line bg-paper">
      <div className="relative aspect-[4/3] bg-sand">
        <Image src={fileUrl(item.thumbKey ?? item.key)!} alt={item.title ?? ""} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
        {index === 0 && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-medium text-paper">
            <Star className="size-3" /> Cover
          </span>
        )}
        <div className="absolute right-3 top-3 flex gap-1">
          {index > 0 && (
            <IconBtn label="Set as cover" onClick={() => onMove(item.id, "first")}>
              <Star className="size-3.5" />
            </IconBtn>
          )}
          <IconBtn label="Move up" onClick={() => onMove(item.id, "up")} disabled={index === 0}>
            <ArrowUp className="size-3.5" />
          </IconBtn>
          <IconBtn label="Move down" onClick={() => onMove(item.id, "down")} disabled={index === total - 1}>
            <ArrowDown className="size-3.5" />
          </IconBtn>
          <IconBtn label="Delete" onClick={() => onRemove(item.id)}>
            <Trash2 className="size-3.5" />
          </IconBtn>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <input value={form.title} onChange={set("title")} placeholder="Title" className="field py-2 font-medium" aria-label="Title" />
        <textarea value={form.description} onChange={set("description")} rows={2} placeholder="Describe the piece: materials, techniques, dimensions…" className="field resize-none py-2 text-[13.5px]" aria-label="Description" />
        <div className="grid grid-cols-[1fr_1fr_80px] gap-2">
          <input value={form.projectName} onChange={set("projectName")} placeholder="Project" className="field py-2 text-[13px]" aria-label="Project" />
          <input value={form.location} onChange={set("location")} placeholder="Location" className="field py-2 text-[13px]" aria-label="Location" />
          <input value={form.year} onChange={set("year")} placeholder="Year" inputMode="numeric" className="field py-2 text-[13px]" aria-label="Year" />
        </div>
        <div className="flex justify-end">
          <button onClick={save} disabled={!dirty || state === "saving"} className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-[12.5px] font-medium text-paper disabled:opacity-30">
            {state === "saved" ? <><Check className="size-3.5" /> Saved</> : state === "saving" ? "Saving…" : "Save details"}
          </button>
        </div>
      </div>
    </li>
  );
}

function IconBtn({ children, label, onClick, disabled }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} title={label} className="flex size-8 items-center justify-center rounded-full bg-paper/90 text-ink backdrop-blur hover:bg-paper disabled:opacity-30">
      {children}
    </button>
  );
}
