import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { COMPANY_KINDS, CLIENT_TYPES } from "@/lib/constants";
import { db } from "@/lib/db";
import { getPlan, planName } from "@/lib/plans";
import { parseList } from "@/lib/utils";
import { getT } from "@/i18n/server";
import { PdfButtons } from "@/components/ui/pdf-buttons";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("My data"), robots: { index: false } };
}

/** Données personnelles présentées lisiblement (v2), téléchargeables en PDF ou imprimables. Le fichier JSON brut a été retiré (26/11/2026). */
export default async function MyDataPage() {
  const tr = await getT();
  const me = await requireUser("/dashboard/settings/data");
  const u = await db.user.findUniqueOrThrow({
    where: { id: me.id },
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

  const sections: { title: string; rows: (readonly [string, string])[] }[] = [
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

  return (
    <div id="my-data" className="max-w-3xl bg-ivory">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{tr("Settings")}</p>
          <h1 className="display mt-1 text-4xl">{tr("My data")}</h1>
          <p className="mt-2 text-sm text-muted">{tr("Summary of the personal data SEFIKH keeps about you, as of {date}.", { date: tr.date(new Date()) })}</p>
        </div>
        <PdfButtons targetId="my-data" filename="sefikh-mes-donnees.pdf" />
      </header>

      {sections.map((s) => (
        <section key={s.title} className="mt-10 break-inside-avoid">
          <h2 className="display border-b border-ink/70 pb-2 text-2xl">{tr(s.title)}</h2>
          <dl className="divide-y divide-line">
            {s.rows.map(([k, v]) => (
              <div key={k} className="grid gap-1 py-2.5 text-[13.5px] sm:grid-cols-[220px_1fr]">
                <dt className="text-muted">{k}</dt>
                <dd className="whitespace-pre-line">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      {(u.subscriptions.length > 0 || u.payments.length > 0) && (
        <section className="mt-10 break-inside-avoid">
          <h2 className="display border-b border-ink/70 pb-2 text-2xl">{tr("Subscriptions & payments")}</h2>
          <ul className="divide-y divide-line text-[13.5px]">
            {u.subscriptions.map((s) => (
              <li key={s.id} className="flex flex-wrap justify-between gap-2 py-2.5">
                <span>
                  {planName(getPlan(s.plan), tr)} · {s.term === "ANNUAL" ? tr("Annual billing") : tr("Monthly billing")}
                </span>
                <span className="text-muted">
                  {s.status} · {tr.date(s.createdAt)}
                </span>
              </li>
            ))}
            {u.payments.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2.5">
                <span>{p.description}</span>
                <span className="text-muted">
                  {tr.money(p.amount, p.currency)} · {tr.date(p.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="mt-10 text-[12.5px] text-muted">{tr("Your messages, documents and pictures stay available in your dashboard. To exercise your rights (correction, deletion), write to contact@sefikh.com.")}</p>
    </div>
  );
}
