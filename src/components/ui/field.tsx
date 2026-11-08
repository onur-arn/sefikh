"use client";

import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";

export function Field({ label, hint, error, children, className, required }: { label?: ReactNode; hint?: ReactNode; error?: string | string[]; children: ReactNode; className?: string; required?: boolean }) {
  const tr = useT();
  const err = Array.isArray(error) ? error[0] : error;
  return (
    <label className={cn("block", className)}>
      {label && (
        <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">
          {label}
          {required && <span className="text-brass"> *</span>}
        </span>
      )}
      {children}
      {err ? <span className="mt-1.5 block text-xs text-danger">{tr(err)}</span> : hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn("field", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn("field min-h-28 resize-y leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn("field appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2212%22%20height=%2212%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%23776c61%22%20stroke-width=%222%22%3E%3Cpath%20d=%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')] bg-[position:right_0.9rem_center] bg-no-repeat pr-9", className)} {...props}>
      {children}
    </select>
  );
}

export function FormMessage({ state }: { state?: { error?: string; success?: string } | null }) {
  const tr = useT();
  if (!state?.error && !state?.success) return null;
  return (
    <p role={state.error ? "alert" : "status"} className={cn("rounded-lg px-4 py-3 text-sm", state.error ? "bg-danger/10 text-danger" : "bg-success/10 text-success")}>
      {tr(state.error ?? state.success)}
    </p>
  );
}
