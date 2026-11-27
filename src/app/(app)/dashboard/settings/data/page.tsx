import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { myData } from "@/lib/my-data";
import { getT } from "@/i18n/server";
import { PdfButtons } from "@/components/ui/pdf-buttons";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("My data"), robots: { index: false } };
}

/** Données personnelles présentées lisiblement, téléchargeables en PDF « vrai texte » (comme les factures) ou imprimables. */
export default async function MyDataPage() {
  const tr = await getT();
  const me = await requireUser("/dashboard/settings/data");
  const { sections, billing } = await myData(me.id, tr);

  return (
    <div id="my-data" className="max-w-3xl bg-ivory">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{tr("Settings")}</p>
          <h1 className="display mt-1 text-4xl">{tr("My data")}</h1>
          <p className="mt-2 text-sm text-muted">{tr("Summary of the personal data SEFIKH keeps about you, as of {date}.", { date: tr.date(new Date()) })}</p>
        </div>
        <PdfButtons targetId="my-data" filename="sefikh-mes-donnees.pdf" href="/api/me/data/pdf" />
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

      {billing.length > 0 && (
        <section className="mt-10 break-inside-avoid">
          <h2 className="display border-b border-ink/70 pb-2 text-2xl">{tr("Subscriptions & payments")}</h2>
          <ul className="divide-y divide-line text-[13.5px]">
            {billing.map(([label, detail], i) => (
              <li key={i} className="flex flex-wrap justify-between gap-2 py-2.5">
                <span>{label}</span>
                <span className="text-muted">{detail}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="mt-10 text-[12.5px] text-muted">{tr("Your messages, documents and pictures stay available in your dashboard. To exercise your rights (correction, deletion), write to contact@sefikh.com.")}</p>
    </div>
  );
}
