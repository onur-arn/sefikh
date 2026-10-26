"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bookmark, CreditCard, FileStack, FolderKanban, Images, LayoutGrid, LineChart, MessageCircle, Settings, Store, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardNav({ role, planName, insights, analytics }: { role: string; planName: string; insights: boolean; analytics: boolean }) {
  const pathname = usePathname();
  const items =
    role === "PRO"
      ? [
          { href: "/dashboard", label: "Overview", icon: LayoutGrid },
          { href: "/dashboard/profile", label: "Business profile", icon: Store },
          { href: "/dashboard/portfolio", label: "Portfolio", icon: Images },
          { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, locked: !analytics },
          { href: "/messages", label: "Messages", icon: MessageCircle },
          { href: "/insights", label: "Market insights", icon: LineChart, locked: !insights },
          { href: "/dashboard/billing", label: "Plan & billing", icon: CreditCard },
          { href: "/dashboard/settings", label: "Settings", icon: Settings },
        ]
      : [
          { href: "/dashboard", label: "Overview", icon: LayoutGrid },
          { href: "/dashboard/projects", label: "My projects", icon: FolderKanban },
          { href: "/dashboard/library", label: "Supplier library", icon: Bookmark },
          { href: "/dashboard/documents", label: "Documents", icon: FileStack },
          { href: "/messages", label: "Messages", icon: MessageCircle },
          { href: "/dashboard/profile", label: "My profile", icon: User },
          { href: "/insights", label: "Market insights", icon: LineChart, locked: !insights },
          { href: "/dashboard/billing", label: "Plan & billing", icon: CreditCard },
          { href: "/dashboard/settings", label: "Settings", icon: Settings },
        ];
  const isActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));
  return (
    <nav aria-label="Dashboard" className="lg:sticky lg:top-24 lg:self-start">
      <div className="mb-5 hidden rounded-2xl bg-espresso p-4 text-paper lg:block">
        <p className="text-[10px] uppercase tracking-[0.2em] text-paper/50">{role === "PRO" ? "Maker account" : "Creative account"}</p>
        <p className="display mt-1 text-2xl">{planName}</p>
        <Link href="/pricing" className="mt-2 inline-block text-[12px] text-brass-light underline-offset-4 hover:underline">
          Compare plans →
        </Link>
      </div>
      <ul className="scrollbar-thin -mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:px-0">
        {items.map(({ href, label, icon: Icon, locked }) => (
          <li key={href} className="shrink-0">
            <Link href={href} className={cn("flex items-center gap-3 whitespace-nowrap rounded-full px-4 py-2.5 text-[13.5px] transition lg:rounded-xl", isActive(href) ? "bg-ink text-paper" : "text-ink-soft hover:bg-sand")}>
              <Icon className="size-4" strokeWidth={1.7} />
              {label}
              {locked && <span className="ml-auto rounded-full bg-brass-light px-1.5 text-[9px] font-bold uppercase tracking-wider text-brass-dark">Pro</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
