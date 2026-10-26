"use client";

import { useState, type ReactNode } from "react";
import { Minus, Plus } from "lucide-react";

export function AccordionItem({ title, children, defaultOpen }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="border-b border-line">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-4 py-5 text-left">
        {open ? <Minus className="size-4 shrink-0" strokeWidth={1.5} /> : <Plus className="size-4 shrink-0" strokeWidth={1.5} />}
        <span className={open ? "text-[15px] font-semibold" : "text-[15px]"}>{title}</span>
      </button>
      {open && <div className="animate-fade-in pb-6 pl-8">{children}</div>}
    </div>
  );
}
