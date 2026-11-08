"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}
const LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"];

export function PasswordInput({ withStrength, className, ...props }: ComponentProps<"input"> & { withStrength?: boolean }) {
  const tr = useT();
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const s = strength(value);
  return (
    <div>
      <div className="relative">
        <input {...props} type={visible ? "text" : "password"} className={cn("field pr-11", className)} onChange={(e) => setValue(e.target.value)} />
        <button type="button" onClick={() => setVisible((v) => !v)} className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-ink" aria-label={visible ? tr("Hide password") : tr("Show password")}>
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {withStrength && value && (
        <div className="mt-2 flex items-center gap-2" aria-live="polite">
          <div className="flex flex-1 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i < s ? (s <= 1 ? "bg-danger" : s <= 2 ? "bg-brass" : "bg-success") : "bg-line")} />
            ))}
          </div>
          <span className="w-16 text-right text-[11px] text-muted">{tr(LABELS[s])}</span>
        </div>
      )}
    </div>
  );
}
