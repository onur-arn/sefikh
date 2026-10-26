import Image from "next/image";
import type { ReactNode } from "react";
import { cn, fileUrl, initials } from "@/lib/utils";

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "brass" | "dark" | "success" | "danger"; className?: string }) {
  const tones = {
    neutral: "bg-sand text-ink-soft",
    brass: "bg-brass-light text-brass-dark",
    dark: "bg-ink text-paper",
    success: "bg-success/12 text-success",
    danger: "bg-danger/12 text-danger",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide", tones[tone], className)}>{children}</span>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-line bg-paper", className)}>{children}</div>;
}

export function Avatar({ name, imageKey, size = 40, className }: { name: string; imageKey?: string | null; size?: number; className?: string }) {
  const url = fileUrl(imageKey);
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-sand font-semibold text-ink-soft", className)} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {url ? <Image src={url} alt="" fill sizes={`${size}px`} className="object-cover" /> : initials(name) || "·"}
    </span>
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-14 text-center">
      {icon && <div className="mb-4 text-brass">{icon}</div>}
      <h3 className="display text-2xl">{title}</h3>
      {children && <div className="mt-2 max-w-md text-sm text-muted">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, children, className }: { eyebrow?: string; title: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className="display text-4xl sm:text-5xl">{title}</h2>
      {children && <p className="mt-4 text-[15px] leading-relaxed text-muted">{children}</p>}
    </div>
  );
}

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("font-display text-[1.65rem] font-semibold leading-none tracking-[0.28em]", light ? "text-paper" : "text-ink", className)}>
      SEFIKH
    </span>
  );
}
