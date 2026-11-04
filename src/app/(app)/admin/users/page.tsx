import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { getT } from "@/i18n/server";
import { setUserSuspended } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Users"), robots: { index: false } };
}

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const tr = await getT();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const users = await db.user.findMany({
    where: q ? { OR: [{ email: { contains: q } }, { name: { contains: q } }] } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, name: true, email: true, role: true, plan: true, createdAt: true, suspendedAt: true },
  });
  return (
    <>
      <form className="mb-5 max-w-sm">
        <input name="q" defaultValue={q} placeholder={tr("Search by name or e-mail")} aria-label={tr("Search by name or e-mail")} className="field" />
      </form>
      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-paper text-[12px] text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">{tr("Name")}</th>
              <th className="px-4 py-3 font-medium">{tr("E-mail")}</th>
              <th className="px-4 py-3 font-medium">{tr("Role")}</th>
              <th className="px-4 py-3 font-medium">{tr("Plan")}</th>
              <th className="px-4 py-3 font-medium">{tr("Joined")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3 text-ink-soft">{u.email}</td>
                <td className="px-4 py-3">{tr(u.role === "PRO" ? "Maker" : u.role === "ADMIN" ? "Administrator" : "Project owner")}</td>
                <td className="px-4 py-3">{tr(getPlan(u.plan).name)}</td>
                <td className="px-4 py-3 text-ink-soft">{tr.date(u.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  {u.role !== "ADMIN" && (
                    <form action={setUserSuspended}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="suspended" value={String(!u.suspendedAt)} />
                      <button className={u.suspendedAt ? "text-[13px] underline" : "text-[13px] text-danger underline"}>{u.suspendedAt ? tr("Reactivate") : tr("Suspend")}</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
