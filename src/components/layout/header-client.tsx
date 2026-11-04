"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LayoutGrid, LogOut, Menu, MessageCircle, Settings, CreditCard, User, X, Store } from "lucide-react";
import { Avatar, Logo } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { cn, formatRelative } from "@/lib/utils";
import { logoutAction } from "@/app/(auth)/actions";
import { isRealtimeConnected, useRealtime } from "@/lib/realtime-client";

type HeaderUser = { name: string; role: string; avatarKey: string | null; plan: string; companySlug: string | null };
type Notif = { id: string; title: string; body: string | null; link: string | null; readAt: string | null; createdAt: string };

const NAV = [
  { href: "/search", label: "Explore" },
  { href: "/insights", label: "Trends & Insights" },
  { href: "/journal", label: "Journal" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
];

export function HeaderClient({ user, initialCounts, variant }: { user: HeaderUser | null; initialCounts: { messages: number; notifications: number }; variant: "default" | "overlay" }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [counts, setCounts] = useState(initialCounts);
  const [scrolled, setScrolled] = useState(false);

  // Réinitialisations dérivées des props (pattern « ajuster l'état pendant le rendu »).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
  }
  const [lastCounts, setLastCounts] = useState(initialCounts);
  if (lastCounts !== initialCounts) {
    setLastCounts(initialCounts);
    setCounts(initialCounts);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Compteurs (messagerie / notifications) : mis à jour en direct, interrogation périodique seulement hors connexion temps réel.
  const refreshCounts = async () => {
    const res = await fetch("/api/me/counts", { cache: "no-store" }).catch(() => null);
    if (res?.ok) setCounts(await res.json());
  };
  useRealtime((event) => {
    if (event.type === "counts" || event.type === "reconnected" || (event.type === "message" && !event.message.mine)) void refreshCounts();
  }, !!user);
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => {
      if (!document.hidden && !isRealtimeConnected()) void refreshCounts();
    }, 20_000);
    return () => clearInterval(id);
  }, [user]);

  const overlay = variant === "overlay" && !scrolled && !mobileOpen;

  return (
    <header className={cn("sticky top-0 z-40 transition-colors duration-300", overlay ? "bg-transparent" : "border-b border-line/80 bg-ivory/90 backdrop-blur-md")}>
      <div className="container-x flex h-[68px] items-center gap-6">
        <Link href="/" aria-label="SEFIKH — home" className="shrink-0">
          <Logo />
        </Link>

        <nav className="ml-6 hidden items-center gap-7 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={cn("link-underline text-[13.5px] text-ink-soft hover:text-ink", pathname.startsWith(n.href) && "text-ink [background-size:100%_1px]")}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {user ? (
            <>
              <IconLink href="/messages" label="Messages" count={counts.messages}>
                <MessageCircle className="size-[19px]" strokeWidth={1.6} />
              </IconLink>
              <NotificationsMenu count={counts.notifications} onRead={() => setCounts((c) => ({ ...c, notifications: 0 }))} />
              <AccountMenu user={user} />
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className="px-3 text-[13.5px] text-ink-soft hover:text-ink">
                Log in
              </Link>
              <ButtonLink href="/register" size="sm">
                Join SEFIKH
              </ButtonLink>
            </div>
          )}
          <button className="ml-1 inline-flex size-10 items-center justify-center rounded-full hover:bg-sand lg:hidden" onClick={() => setMobileOpen((o) => !o)} aria-label="Menu" aria-expanded={mobileOpen}>
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-line bg-ivory lg:hidden">
          <nav className="container-x flex flex-col py-4" aria-label="Mobile">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="display border-b border-line/70 py-3 text-2xl">
                {n.label}
              </Link>
            ))}
            {!user && (
              <div className="mt-5 flex gap-3">
                <ButtonLink href="/login" variant="secondary" className="flex-1">
                  Log in
                </ButtonLink>
                <ButtonLink href="/register" className="flex-1">
                  Join SEFIKH
                </ButtonLink>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function IconLink({ href, label, count, children }: { href: string; label: string; count: number; children: React.ReactNode }) {
  return (
    <Link href={href} aria-label={`${label}${count ? ` (${count} unread)` : ""}`} className="relative inline-flex size-10 items-center justify-center rounded-full text-ink-soft hover:bg-sand hover:text-ink">
      {children}
      {count > 0 && <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-brass px-1 text-[10px] font-bold leading-4 text-paper">{count > 9 ? "9+" : count}</span>}
    </Link>
  );
}

function useClickOutside(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onClose();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", esc);
    };
  }, [onClose]);
  return ref;
}

function NotificationsMenu({ count, onRead }: { count: number; onRead: () => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[] | null>(null);
  const router = useRouter();
  const ref = useClickOutside(() => setOpen(false));

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.ok) setItems((await res.json()).items);
      if (count > 0) {
        await fetch("/api/notifications", { method: "POST" });
        onRead();
      }
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} aria-label="Notifications" aria-expanded={open} className="relative inline-flex size-10 items-center justify-center rounded-full text-ink-soft hover:bg-sand hover:text-ink">
        <Bell className="size-[19px]" strokeWidth={1.6} />
        {count > 0 && <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-brass px-1 text-[10px] font-bold leading-4 text-paper">{count > 9 ? "9+" : count}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-[min(92vw,360px)] animate-fade-in overflow-hidden rounded-2xl border border-line bg-paper shadow-xl shadow-ink/5">
          <p className="border-b border-line px-5 py-3.5 text-sm font-semibold">Notifications</p>
          <div className="scrollbar-thin max-h-96 overflow-y-auto">
            {items === null ? (
              <p className="px-5 py-8 text-center text-sm text-muted">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">You&apos;re all caught up.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setOpen(false);
                    if (n.link) router.push(n.link);
                  }}
                  className="flex w-full gap-3 border-b border-line/60 px-5 py-3.5 text-left last:border-0 hover:bg-ivory"
                >
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-brass")} />
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-medium">{n.title}</span>
                    {n.body && <span className="mt-0.5 block truncate text-[13px] text-muted">{n.body}</span>}
                    <span className="mt-1 block text-[11px] text-muted">{formatRelative(n.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AccountMenu({ user }: { user: HeaderUser }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
    { href: "/dashboard/profile", label: user.role === "PRO" ? "Business profile" : "My profile", icon: User },
    ...(user.companySlug ? [{ href: `/makers/${user.companySlug}`, label: "View public page", icon: Store }] : []),
    { href: "/dashboard/billing", label: "Plan & billing", icon: CreditCard },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Account menu" className="ml-1 flex items-center gap-1.5 rounded-full p-1 pr-2 hover:bg-sand">
        <Avatar name={user.name} imageKey={user.avatarKey} size={32} />
        <ChevronDown className="hidden size-3.5 text-muted sm:block" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-64 animate-fade-in overflow-hidden rounded-2xl border border-line bg-paper py-2 shadow-xl shadow-ink/5">
          <div className="border-b border-line px-4 pb-3 pt-1">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-muted">{user.role === "PRO" ? "Maker account" : "Creative account"}</p>
          </div>
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[13.5px] hover:bg-ivory">
              <Icon className="size-4 text-muted" strokeWidth={1.7} />
              {label}
            </Link>
          ))}
          <form action={logoutAction} className="mt-1 border-t border-line pt-1">
            <button className="flex w-full items-center gap-3 px-4 py-2.5 text-[13.5px] hover:bg-ivory">
              <LogOut className="size-4 text-muted" strokeWidth={1.7} />
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
