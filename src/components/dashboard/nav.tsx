"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bookmark, CreditCard, FileStack, FolderKanban, Images, LayoutGrid, LineChart, MessageCircle, Settings, Store, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";

export function DashboardNav({ role, planName, insights, analytics }: { role: string; planName: string; insights: boolean; analytics: boolean }) {
  const tr = useT();
  const pathname = usePathname();
  const items =
    role === "PRO"
      ? [
          { href: "/dashboard", label: tr("Overview"), icon: LayoutGrid },
          { href: "/dashboard/profile", label: tr("Business profile"), icon: Store },
          { href: "/dashboard/portfolio", label: tr("Portfolio"), icon: Images },
          { href: "/dashboard/analytics", label: tr("Analytics"), icon: BarChart3, locked: !analytics },
          { href: "/messages", label: tr("Messages"), icon: MessageCircle },
          { href: "/insights", label: tr("Market insights"), icon: LineChart, locked: !insights },
          { href: "/dashboard/billing", label: tr("Plan & billing"), icon: CreditCard },
          { href: "/dashboard/settings", label: tr("Settings"), icon: Settings },
        ]
      : [
          { href: "/dashboard", label: tr("Overview"), icon: LayoutGrid },
          { href: "/dashboard/projects", label: tr("My projects"), icon: FolderKanban },
          { href: "/dashboard/library", label: tr("Supplier library"), icon: Bookmark },
          { href: "/dashboard/documents", label: tr("Documents"), icon: FileStack },
          { href: "/messages", label: tr("Messages"), icon: MessageCircle },
          { href: "/dashboard/profile", label: tr("My profile"), icon: User },
          { href: "/insights", label: tr("Market insights"), icon: LineChart, locked: !insights },
          { href: "/dashboard/billing", label: tr("Plan & billing"), icon: CreditCard },
          { href: "/dashboard/settings", label: tr("Settings"), icon: Settings },
        ];
  const isActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));
  return (
    <nav aria-label={tr("Dashboard")} className="lg:sticky lg:top-24 lg:self-start">
      <div className="mb-5 hidden rounded-2xl bg-espresso p-4 text-paper lg:block">
        <p className="text-[10px] uppercase tracking-[0.2em] text-paper/50">{role === "PRO" ? tr("Maker account") : tr("Project owner account")}</p>
        <p className="display mt-1 text-2xl">{tr(planName)}</p>
        <Link href="/pricing" className="mt-2 inline-block text-[12px] text-brass-light underline-offset-4 hover:underline">
          {tr("Compare plans →")}</Link>
      </div>
      <ul className="scrollbar-thin -mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:px-0">
        {items.map(({ href, label, icon: Icon, locked }) => (
          <li key={href} className="shrink-0">
            <Link href={href} className={cn("flex items-center gap-3 whitespace-nowrap rounded-sm px-4 py-2.5 text-[13.5px] transition lg:rounded-xl", isActive(href) ? "bg-ink text-paper" : "text-ink-soft hover:bg-sand")}>
              <Icon className="size-4" strokeWidth={1.7} />
              {tr(label)}
              {locked && <span className="ml-auto rounded-sm bg-brass-light px-1.5 text-[9px] font-bold uppercase tracking-wider text-brass-dark">{tr("Pro")}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
