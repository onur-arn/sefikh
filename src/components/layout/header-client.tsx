"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LayoutGrid, LogOut, Menu, MessageCircle, Settings, CreditCard, User, X, Store, ShieldCheck } from "lucide-react";
import { Avatar, Logo } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/(auth)/actions";
import { isRealtimeConnected, useRealtime } from "@/lib/realtime-client";
import { useT } from "@/i18n/client";
import { LocaleMenu, LocaleRow } from "./locale-switcher";

type HeaderUser = { name: string; role: string; avatarKey: string | null; plan: string; companySlug: string | null };
type Notif = { id: string; title: string; body: string | null; link: string | null; readAt: string | null; createdAt: string };

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About us" },
  { href: "/content", label: "Content" },
  { href: "/insights", label: "Trends & Insights" },
  { href: "/subscription", label: "Subscription" },
];

export function HeaderClient({ user, initialCounts }: { user: HeaderUser | null; initialCounts: { messages: number; notifications: number } }) {
  const tr = useT();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pastIntro, setPastIntro] = useState(false);
  const [counts, setCounts] = useState(initialCounts);

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
    const onScroll = () => {
      setPastIntro(window.scrollY > window.innerHeight - 160);
    };
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

  // Le panneau de recherche se referme en changeant de page ou avec Échap.
  // Accueil : barre transparente sur l'image d'ouverture, blanche au survol et après le défilement.
  const overlay = pathname === "/" && !pastIntro && !hovered && !mobileOpen;
  const navClass = "link-underline font-mono text-[11.5px] uppercase tracking-[0.05em] text-ink-soft hover:text-ink";

  return (
    <header
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn("sticky top-0 z-40 transition-colors duration-300", overlay ? "bg-transparent text-paper [&_.text-ink-soft]:!text-paper" : "border-b border-line bg-ivory")}
    >
      <div className="container-x grid h-[68px] grid-cols-[1fr_auto_1fr] items-center gap-4">
        <nav className="hidden items-center gap-4 lg:flex xl:gap-5" aria-label={tr("Main")}>
          {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={cn(navClass, (n.href === "/" ? pathname === "/" : pathname.startsWith(n.href)) && "text-ink [background-size:100%_1px]")}>
                {tr(n.label)}
              </Link>
          ))}
        </nav>

        <Link href="/" aria-label={tr("SEFIKH — home")} className="col-start-2 shrink-0">
          <Logo light={overlay} />
        </Link>

        <div className="col-start-3 flex items-center justify-end gap-1.5">
          <LocaleMenu tone={overlay ? "dark" : "light"} className="mr-2 hidden sm:block" />
          {user ? (
            <>
              <IconLink href="/messages" label={tr("Messages")} count={counts.messages}>
                <MessageCircle className="size-[19px]" strokeWidth={1.6} />
              </IconLink>
              <NotificationsMenu count={counts.notifications} onRead={() => setCounts((c) => ({ ...c, notifications: 0 }))} />
              <AccountMenu user={user} />
            </>
          ) : (
            <Link href="/login" className="hidden px-1 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-soft hover:text-ink sm:inline">
              {tr("Log in")}
            </Link>
          )}
          <button className="ml-1 inline-flex size-10 items-center justify-center rounded-full hover:bg-sand hover:text-ink lg:hidden" onClick={() => setMobileOpen((o) => !o)} aria-label={tr("Menu")} aria-expanded={mobileOpen}>
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-line bg-paper text-ink lg:hidden">
          <nav className="container-x flex flex-col py-4" aria-label={tr("Mobile")}>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="display border-b border-line/70 py-3 text-2xl">
                {tr(n.label)}
              </Link>
            ))}
            <LocaleRow className="mt-5 sm:hidden" />
            {!user && (
              <div className="mt-5 flex gap-3">
                <ButtonLink href="/login" variant="secondary" className="flex-1">
                  {tr("Log in")}</ButtonLink>
                <ButtonLink href="/register" className="flex-1">
                  {tr("Join SEFIKH")}</ButtonLink>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function IconLink({ href, label, count, children }: { href: string; label: string; count: number; children: React.ReactNode }) {
  const tr = useT();
  return (
    <Link href={href} aria-label={count ? tr("{label} ({count} unread)", { label, count }) : label} className="relative inline-flex size-10 items-center justify-center rounded-full text-ink-soft hover:bg-sand hover:text-ink">
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
  const tr = useT();
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
      <button onClick={toggle} aria-label={tr("Notifications")} aria-expanded={open} className="relative inline-flex size-10 items-center justify-center rounded-full text-ink-soft hover:bg-sand hover:text-ink">
        <Bell className="size-[19px]" strokeWidth={1.6} />
        {count > 0 && <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-brass px-1 text-[10px] font-bold leading-4 text-paper">{count > 9 ? "9+" : count}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-[min(92vw,360px)] animate-fade-in overflow-hidden rounded-2xl border border-line bg-paper shadow-xl shadow-ink/5">
          <p className="border-b border-line px-5 py-3.5 text-sm font-semibold">{tr("Notifications")}</p>
          <div className="scrollbar-thin max-h-96 overflow-y-auto">
            {items === null ? (
              <p className="px-5 py-8 text-center text-sm text-muted">{tr("Loading…")}</p>
            ) : items.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">{tr("You're all caught up.")}</p>
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
                    <span className="block text-[13.5px] font-medium">{tr(n.title)}</span>
                    {n.body && <span className="mt-0.5 block truncate text-[13px] text-muted">{tr(n.body)}</span>}
                    <span className="mt-1 block text-[11px] text-muted">{tr.relative(n.createdAt)}</span>
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
  const tr = useT();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  const links = [
    { href: "/dashboard", label: tr("Dashboard"), icon: LayoutGrid },
    { href: "/dashboard/profile", label: user.role === "PRO" ? "Business profile" : "My profile", icon: User },
    ...(user.companySlug ? [{ href: `/makers/${user.companySlug}`, label: tr("View public page"), icon: Store }] : []),
    { href: "/dashboard/billing", label: tr("Plan & billing"), icon: CreditCard },
    { href: "/dashboard/settings", label: tr("Settings"), icon: Settings },
    ...(user.role === "ADMIN" ? [{ href: "/admin", label: tr("Administration"), icon: ShieldCheck }] : []),
  ];
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={tr("Account menu")} className="ml-1 flex items-center gap-1.5 rounded-sm p-1 pr-2 hover:bg-sand">
        <Avatar name={user.name} imageKey={user.avatarKey} size={32} />
        <ChevronDown className="hidden size-3.5 text-muted sm:block" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-64 animate-fade-in overflow-hidden rounded-2xl border border-line bg-paper py-2 shadow-xl shadow-ink/5">
          <div className="border-b border-line px-4 pb-3 pt-1">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-muted">{user.role === "PRO" ? tr("Maker account") : tr("Project owner account")}</p>
          </div>
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[13.5px] hover:bg-ivory">
              <Icon className="size-4 text-muted" strokeWidth={1.7} />
              {tr(label)}
            </Link>
          ))}
          <form action={logoutAction} className="mt-1 border-t border-line pt-1">
            <button className="flex w-full items-center gap-3 px-4 py-2.5 text-[13.5px] hover:bg-ivory">
              <LogOut className="size-4 text-muted" strokeWidth={1.7} />
              {tr("Log out")}</button>
          </form>
        </div>
      )}
    </div>
  );
}
