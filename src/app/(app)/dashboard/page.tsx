import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Bookmark, Check, Eye, FolderKanban, MessageCircle, Plus, Search, Sparkles } from "lucide-react";
import { requireUser, type CurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getPlan, formatLimit } from "@/lib/plans";
import { runSearch, searchesUsed } from "@/lib/search";
import { companyStats } from "@/lib/stats";
import { parseList } from "@/lib/utils";
import { unreadConversationCount } from "@/lib/messaging";
import { Avatar, Badge, Card } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { MakerCard } from "@/components/makers/maker-card";
import { PublishToggle } from "@/components/dashboard/publish-toggle";
import { hasListedPlan } from "@/lib/access";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Dashboard"), robots: { index: false } };
}

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const tr = await getT();
  const user = await requireUser("/dashboard");
  const sp = await searchParams;
  const notice = sp.notice === "password-reset" ? "Your password has been updated." : sp.welcome ? "Welcome to SEFIKH — your profile is ready." : null;
  return (
    <>
      {notice && <p className="mb-6 rounded-xl bg-success/10 px-4 py-3 text-sm text-success">{tr(notice)}</p>}
      {user.role === "PRO" ? <ProOverview user={user} /> : <ClientOverview user={user} />}
    </>
  );
}

function Stat({ icon: Icon, label, value, hint, href }: { icon: typeof Eye; label: string; value: string | number; hint?: string; href?: string }) {
  const body = (
    <Card className="h-full p-5 transition hover:border-ink/30">
      <Icon className="size-5 text-brass" strokeWidth={1.5} />
      <p className="display mt-4 text-4xl">{value}</p>
      <p className="mt-1 text-[13px] text-muted">{label}</p>
      {hint && <p className="mt-2 text-[12px] text-ink-soft">{hint}</p>}
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

async function ClientOverview({ user }: { user: CurrentUser }) {
  const tr = await getT();
  const plan = getPlan(user.plan);
  const [profile, projects, saved, unread, used] = await Promise.all([
    db.clientProfile.findUnique({ where: { userId: user.id } }),
    db.project.findMany({ where: { ownerId: user.id }, orderBy: { updatedAt: "desc" }, include: { _count: { select: { conversations: true } } } }),
    db.savedCompany.count({ where: { userId: user.id } }),
    unreadConversationCount(user),
    searchesUsed(user.id),
  ]);
  const active = projects.filter((p) => p.status === "ACTIVE");
  const archived = projects.filter((p) => p.status === "ARCHIVED");

  // Suggestions personnalisées à partir du projet actif le plus récent (offres Pro / Studio).
  let suggestions: Awaited<ReturnType<typeof runSearch>>["results"] = [];
  if (active[0] && plan.limits.savedLibrary) {
    const p = active[0];
    const q = [p.description ?? p.title, p.style, ...parseList(p.materials)].filter(Boolean).join(" ");
    suggestions = (await runSearch({ q, near: p.city ?? p.country ?? undefined })).results.slice(0, 4);
  }

  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Avatar name={profile?.studioName || user.name} imageKey={user.avatarKey} size={72} />
        <div className="flex-1">
          <p className="eyebrow">{tr("Creative space")}</p>
          <h1 className="display mt-1 text-4xl sm:text-5xl">{profile?.studioName || user.name}</h1>
          <p className="mt-1 text-sm text-muted">{[user.name !== profile?.studioName ? user.name : null, profile?.city, profile?.country].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/dashboard/projects/new">
            <Plus className="size-4" /> {" "}{tr("I have a new project")}</ButtonLink>
          <ButtonLink href="/dashboard/profile" variant="secondary">
            {tr("Modify profile")}</ButtonLink>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat icon={FolderKanban} label={tr("Active projects")} value={active.length} href="/dashboard/projects" />
        <Stat icon={MessageCircle} label={tr("Unread conversations")} value={unread} href="/messages" />
        <Stat icon={Bookmark} label={tr("Saved makers")} value={saved} href="/dashboard/library" />
        <Stat
          icon={Search}
          label={tr("Searches")}
          value={used}
          hint={Number.isFinite(plan.limits.freeSearches) ? tr("{count} of {limit} free searches used", { count: used, limit: plan.limits.freeSearches }) : tr("Unlimited on your plan")}
        />
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        {[
          [tr("Active projects"), active],
          [tr("Archived projects"), archived],
        ].map(([title, list]) => (
          <Card key={title as string} className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="display text-2xl">{title as string}</h2>
              <span className="text-sm text-muted">{(list as typeof projects).length}</span>
            </div>
            <ul className="mt-4 divide-y divide-line">
              {(list as typeof projects).length === 0 ? (
                <li className="py-6 text-sm text-muted">{title === tr("Active projects") ? tr("Describe your first project to get matched with makers.") : tr("No archived project.")}</li>
              ) : (
                (list as typeof projects).slice(0, 5).map((p) => (
                  <li key={p.id}>
                    <Link href={`/dashboard/projects/${p.id}`} className="group flex items-center gap-4 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14.5px] font-medium group-hover:underline">{tr(p.title)}</p>
                        <p className="text-[12.5px] text-muted">
                          {[p.city, tr(p.timeline), tr(p._count.conversations === 1 ? "{count} conversation" : "{count} conversations", { count: p._count.conversations })].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <ArrowUpRight className="size-4 text-muted transition group-hover:text-ink" />
                    </Link>
                  </li>
                ))
              )}
            </ul>
            {title === tr("Active projects") && (
              <Link href="/dashboard/projects/new" className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-brass-dark hover:underline">
                <Plus className="size-3.5" /> {" "}{tr("New project")}</Link>
            )}
          </Card>
        ))}
      </section>

      {suggestions.length > 0 ? (
        <section>
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow flex items-center gap-1.5">
                <Sparkles className="size-3.5" /> {" "}{tr("Personalised suggestions")}</p>
              <h2 className="display mt-2 text-3xl">{tr("For “{title}”", { title: active[0]!.title })}</h2>
            </div>
            <Link href={`/dashboard/projects/${active[0]!.id}`} className="text-sm font-medium underline-offset-4 hover:underline">
              {tr("All matches")}</Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 xl:grid-cols-4">
            {suggestions.map((r) => (
              <MakerCard key={r.id} maker={r} source="SEARCH" />
            ))}
          </div>
        </section>
      ) : (
        !plan.limits.savedLibrary && (
          <div className="rounded-2xl grain flex flex-col items-start gap-5 overflow-hidden bg-espresso p-8 text-paper sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="display text-3xl">{tr("Go further with Pro")}</p>
              <p className="mt-2 text-sm text-paper/60">
                {tr("Unlimited searches, full contact details, your supplier library and personalised suggestions — from 39 € per month.")}</p>
            </div>
            <ButtonLink href="/pricing" variant="light">
              {tr("See plans")}{" "}<ArrowRight className="size-4" />
            </ButtonLink>
          </div>
        )
      )}
    </div>
  );
}

async function ProOverview({ user }: { user: CurrentUser }) {
  const tr = await getT();
  const plan = getPlan(user.plan);
  const company = await db.company.findUnique({ where: { userId: user.id }, include: { _count: { select: { portfolio: true, tags: true } } } });
  if (!company) {
    return (
      <Card className="p-10 text-center">
        <h1 className="display text-4xl">{tr("Create your business profile")}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">{tr("Tell us about your skills, materials and capabilities. It only takes a few minutes.")}</p>
        <ButtonLink href="/onboarding" className="mt-6">
          {tr("Start now")}{" "}<ArrowRight className="size-4" />
        </ButtonLink>
      </Card>
    );
  }
  const [stats, requests] = await Promise.all([
    companyStats(company.id, 30),
    db.conversation.findMany({
      where: { companyId: company.id, proArchived: false },
      orderBy: { lastMessageAt: "desc" },
      take: 5,
      include: { client: { select: { name: true, avatarKey: true, clientProfile: { select: { studioName: true } } } }, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
  ]);

  const checklist = [
    { done: !!company.about && company.about.length > 80, label: tr("Describe your company"), href: "/dashboard/profile" },
    { done: company._count.tags >= 3, label: tr("Add skills, materials & techniques"), href: "/dashboard/profile" },
    { done: company._count.portfolio >= 3, label: tr("Publish at least 3 portfolio pictures"), href: "/dashboard/portfolio" },
    { done: parseList(company.availability).length > 0, label: tr("Share your production availability"), href: "/dashboard/profile" },
    { done: company.published, label: tr("Publish your profile"), href: "/dashboard/profile" },
  ];
  const completion = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <div className="flex-1">
          <p className="eyebrow">{tr("Maker space")}</p>
          <h1 className="display mt-1 text-4xl sm:text-5xl">{company.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone={company.published ? "success" : "neutral"}>{company.published ? tr("Published") : tr("Draft")}</Badge>
            <Badge tone="brass">{tr(plan.name)}</Badge>
            {company.verified && <Badge tone="dark">{tr("Verified")}</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasListedPlan(user.plan) ? (
            <PublishToggle published={company.published} />
          ) : (
            <ButtonLink href="/upgrade">{tr("Choose a plan to appear on SEFIKH")}</ButtonLink>
          )}
          <ButtonLink href={`/makers/${company.slug}`} variant="secondary">
            {tr(hasListedPlan(user.plan) ? "View public page" : "Preview my profile")}{" "}<ArrowUpRight className="size-4" />
          </ButtonLink>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat icon={Eye} label={tr("Profile views · 30 days")} value={stats.views} hint={tr("{v}{viewsDelta}% vs previous period", { v: stats.viewsDelta >= 0 ? "+" : "", viewsDelta: stats.viewsDelta })} href={plan.limits.analytics ? "/dashboard/analytics" : undefined} />
        <Stat icon={Search} label={tr("Appearances in search")} value={stats.impressions} hint={tr("{ctr}% click-through", { ctr: stats.ctr })} />
        <Stat icon={MessageCircle} label={tr("New requests · 30 days")} value={stats.conversations} href="/messages" />
        <Stat icon={Bookmark} label={tr("Saved by creatives")} value={stats.saved} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="display text-2xl">{tr("Latest requests")}</h2>
            <Link href="/messages" className="text-[13px] font-medium underline-offset-4 hover:underline">
              {tr("Open inbox")}</Link>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {requests.length === 0 ? (
              <li className="py-8 text-center text-sm text-muted">{tr("No request yet. A complete profile with great pictures gets found faster.")}</li>
            ) : (
              requests.map((r) => (
                <li key={r.id}>
                  <Link href={`/messages?c=${r.id}`} className="flex items-center gap-3 py-3.5 hover:opacity-80">
                    <Avatar name={r.client.clientProfile?.studioName || r.client.name} imageKey={r.client.avatarKey} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[14px] font-medium">{r.client.clientProfile?.studioName || r.client.name}</span>
                        <span className="shrink-0 text-[11px] text-muted">{tr.relative(r.lastMessageAt)}</span>
                      </p>
                      <p className="truncate text-[13px] text-muted">{tr(r.messages[0]?.body)}</p>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="display text-2xl">{tr("Profile strength")}</h2>
            <span className="display text-3xl">{completion}%</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sand">
            <div className="h-full rounded-sm bg-brass transition-all" style={{ width: `${completion}%` }} />
          </div>
          <ul className="mt-5 space-y-2.5">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className="flex items-center gap-3 text-[13.5px] hover:underline">
                  <span className={c.done ? "flex size-5 items-center justify-center rounded-full bg-success text-paper" : "size-5 rounded-full border border-line"}>{c.done && <Check className="size-3" />}</span>
                  <span className={c.done ? "text-muted line-through" : ""}>{tr(c.label)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[12px] text-muted">
            {tr("Portfolio: {portfolio} / {portfolioImages} pictures on your plan.", { portfolio: company._count.portfolio, portfolioImages: formatLimit(plan.limits.portfolioImages) })}</p>
        </Card>
      </div>

    </div>
  );
}
