"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Avatar } from "@/components/ui/misc";
import { useT } from "@/i18n/client";

export function AvatarUpload({ kind, name, imageKey, label }: { kind: "avatar" | "logo"; name: string; imageKey: string | null; label: string }) {
  const tr = useT();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("kind", kind);
    const res = await fetch("/api/me/avatar", { method: "POST", body: fd });
    setBusy(false);
    if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Upload failed.");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-5">
      <button type="button" onClick={() => ref.current?.click()} className="group relative rounded-sm" aria-label={tr("Change {v}", { v: label.toLowerCase() })}>
        <Avatar name={name} imageKey={imageKey} size={84} />
        <span className="absolute inset-0 flex items-center justify-center rounded-sm bg-ink/45 text-paper opacity-0 transition group-hover:opacity-100">
          {busy ? <span className="size-5 animate-spin rounded-full border-2 border-paper border-r-transparent" /> : <Camera className="size-5" />}
        </span>
      </button>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[12.5px] text-muted">{tr("Square image, JPG or PNG, 10 MB max.")}</p>
        {error && <p className="mt-1 text-[12.5px] text-danger">{tr(error)}</p>}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
    </div>
  );
}
