import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getT } from "@/i18n/server";
import { setCompanyFlag } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Makers"), robots: { index: false } };
}

function FlagButton({ id, flag, value, label }: { id: string; flag: string; value: boolean; label: string }) {
  return (
    <form action={setCompanyFlag}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="flag" value={flag} />
      <input type="hidden" name="value" value={String(value)} />
      <button className="text-[13px] underline">{label}</button>
    </form>
  );
}

export default async function AdminMakersPage() {
  const tr = await getT();
  const companies = await db.company.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, slug: true, name: true, city: true, country: true, published: true, verified: true, user: { select: { email: true } }, _count: { select: { portfolio: true } } },
  });
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-paper text-[12px] text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">{tr("Name")}</th>
            <th className="px-4 py-3 font-medium">{tr("Location")}</th>
            <th className="px-4 py-3 font-medium">{tr("Photos")}</th>
            <th className="px-4 py-3 font-medium">{tr("Status")}</th>
            <th className="px-4 py-3" />
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <tr key={c.id} className="border-t border-line">
              <td className="px-4 py-3">
                <Link href={`/makers/${c.slug}`} className="underline-offset-2 hover:underline">
                  {c.name}
                </Link>
                <span className="block text-[12px] text-muted">{c.user.email}</span>
              </td>
              <td className="px-4 py-3 text-ink-soft">{[c.city, c.country].filter(Boolean).join(", ")}</td>
              <td className="px-4 py-3">{tr.number(c._count.portfolio)}</td>
              <td className="px-4 py-3">
                {c.published ? tr("Published") : tr("Hidden")}
                {c.verified ? ` · ${tr("Verified")}` : ""}
              </td>
              <td className="px-4 py-3">
                <FlagButton id={c.id} flag="published" value={!c.published} label={c.published ? tr("Hide") : tr("Publish")} />
              </td>
              <td className="px-4 py-3">
                <FlagButton id={c.id} flag="verified" value={!c.verified} label={c.verified ? tr("Remove verification") : tr("Verify")} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
