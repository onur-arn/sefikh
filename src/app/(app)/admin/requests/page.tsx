import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getT } from "@/i18n/server";
import { deleteContactRequest } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Contact requests"), robots: { index: false } };
}

export default async function AdminRequestsPage() {
  const tr = await getT();
  const requests = await db.contactRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  if (!requests.length) return <p className="text-sm text-muted">{tr("No contact requests yet.")}</p>;
  return (
    <ul className="space-y-3">
      {requests.map((r) => (
        <li key={r.id} className="rounded-2xl border border-line bg-paper p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium">
              {r.name} · <a href={`mailto:${r.email}`} className="underline">{r.email}</a>
            </p>
            <p className="text-[12px] text-muted">{tr(r.topic)} · {tr.date(r.createdAt)}</p>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{r.message}</p>
          <form action={deleteContactRequest} className="mt-3">
            <input type="hidden" name="id" value={r.id} />
            <button className="text-[13px] text-danger underline">{tr("Delete")}</button>
          </form>
        </li>
      ))}
    </ul>
  );
}
