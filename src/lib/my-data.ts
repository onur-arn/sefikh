import "server-only";
import { CLIENT_TYPES, COMPANY_KINDS } from "@/lib/constants";
import { db } from "@/lib/db";
import { getPlan, planName } from "@/lib/plans";
import { parseList } from "@/lib/utils";
import type { Translator } from "@/i18n/config";

export type DataSection = { title: string; rows: (readonly [string, string])[] };

/** Données personnelles d'un compte, présentées lisiblement : page « Mes données » et son PDF. */
export async function myData(userId: string, tr: Translator) {
  const u = await db.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      clientProfile: true,
      company: { include: { tags: { include: { tag: true } }, _count: { select: { portfolio: true } } } },
      _count: { select: { projects: true, documents: true, messages: true, savedCompanies: true, searches: true } },
      subscriptions: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  const dash = (v: unknown) => (v == null || v === "" ? "—" : String(v));
  const row = (label: string, value: unknown) => [tr(label), dash(value)] as const;
  const address = (o: { street?: string | null; street2?: string | null; city?: string | null; region?: string | null; country?: string | null }) =>
    [o.street, o.street2, o.city, o.region, o.country].filter(Boolean).join(", ");

  const sections: DataSection[] = [
    {
      title: "Account",
      rows: [
        row("Name", u.name),
        row("E-mail", u.email),
        row("Account type", u.role === "PRO" ? tr("Artisan") : u.role === "ADMIN" ? "Admin" : tr("Creative")),
        row("Created on", tr.date(u.createdAt)),
        row("E-mail confirmed on", u.emailVerifiedAt ? tr.date(u.emailVerifiedAt) : null),
        row("Language", u.locale),
        row("E-mail notifications", u.notifyByEmail ? tr("Yes") : tr("No")),
        row("Current plan", planName(getPlan(u.plan), tr)),
      ],
    },
  ];
  if (u.clientProfile) {
    const p = u.clientProfile;
    sections.push({
      title: "My profile",
      rows: [
        row("Studio / company name", p.studioName),
        row("Who are you?", p.clientType ? tr(CLIENT_TYPES.find((c) => c.value === p.clientType)?.label ?? p.clientType) : null),
        row("Sector", p.sector),
        row("Phone", p.phone),
        row("Address", address(p)),
        row("Website", p.website),
        row("Short presentation", p.bio),
        row("Typical projects", parseList(p.keywords).join(", ")),
      ],
    });
  }
  if (u.company) {
    const c = u.company;
    sections.push({
      title: "Business profile",
      rows: [
        row("Company's name", c.name),
        row("You are", tr(COMPANY_KINDS.find((k) => k.value === c.kind)?.label ?? c.kind)),
        row("Legal structure", c.independent ? tr("Independent artisan") : tr("Company")),
        row("Sector", c.sector),
        row("Tagline", c.tagline),
        row("About you", c.about),
        row("Public e-mail", c.publicEmail),
        row("Phone", c.phone),
        row("Website", c.website),
        row("Address", address(c)),
        row("Areas of operation", parseList(c.operationAreas).map((a) => tr(a)).join(", ")),
        row("Areas of expertise", c.tags.map((t) => tr(t.tag.name)).join(", ")),
        row("Production capacities", c.productionCapacity),
        row("Portfolio pictures", c._count.portfolio),
      ],
    });
  }
  sections.push({
    title: "Activity",
    rows: [row("Projects", u._count.projects), row("Documents", u._count.documents), row("Messages sent", u._count.messages), row("Saved artisans", u._count.savedCompanies), row("Searches", u._count.searches)],
  });


  const billing = [
    ...u.subscriptions.map((s) => [
      `${planName(getPlan(s.plan), tr)} · ${s.term === "ANNUAL" ? tr("Annual billing") : tr("Monthly billing")}`,
      `${s.status} · ${tr.date(s.createdAt)}`,
    ] as const),
    ...u.payments.map((p) => [p.description ?? "", `${tr.money(p.amount, p.currency)} · ${tr.date(p.createdAt)}`] as const),
  ];
  return { sections, billing };
}
