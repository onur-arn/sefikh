import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "brass" | "danger" | "light";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-brass",
  secondary: "border border-ink/70 text-ink hover:border-brass hover:text-brass",
  ghost: "text-ink hover:bg-sand",
  brass: "bg-brass text-paper hover:bg-brass-dark",
  danger: "bg-danger text-paper hover:brightness-110",
  light: "bg-paper text-ink hover:bg-ivory",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[11.5px]",
  md: "h-11 px-6 text-[12px]",
  lg: "h-13 px-8 text-[12.5px]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2.5 rounded-sm font-mono uppercase tracking-[0.06em] transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    variants[variant],
    sizes[size],
    className,
  );
}

type Common = { variant?: Variant; size?: Size; className?: string; children: ReactNode };

export function Button({ variant, size, className, children, loading, ...props }: Common & ComponentProps<"button"> & { loading?: boolean }) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={loading || props.disabled} {...props}>
      {loading && <span className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />}
      {children}
    </button>
  );
}

export function ButtonLink({ variant, size, className, children, ...props }: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClass(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
