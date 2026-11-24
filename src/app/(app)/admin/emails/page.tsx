import { db } from "@/lib/db";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

/** Journal des 100 derniers e-mails envoyés : sert à vérifier qu'un e-mail est bien parti (ou pourquoi il a échoué). */
export default async function EmailsPage() {
  const tr = await getT();
  const mails = await db.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, to: true, subject: true, status: true, error: true, createdAt: true } });
  return (
    <div>
      <h1 className="display text-3xl">E-mails</h1>
      <p className="mt-1 text-sm text-muted">SENT = accepté par le serveur d&apos;envoi (Resend) · FAILED = refusé · LOGGED = aucun serveur configuré.</p>
      <div className="mt-6 overflow-x-auto border border-line bg-paper">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead className="bg-sand text-left text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">{tr("To")}</th>
              <th className="px-3 py-2 font-medium">{tr("Subject")}</th>
              <th className="px-3 py-2 font-medium">{tr("Status")}</th>
            </tr>
          </thead>
          <tbody>
            {mails.map((m) => (
              <tr key={m.id} className="border-t border-line align-top">
                <td className="whitespace-nowrap px-3 py-2">{tr.date(m.createdAt, { dateStyle: "short", timeStyle: "short" })}</td>
                <td className="px-3 py-2">{m.to}</td>
                <td className="px-3 py-2">{m.subject}</td>
                <td className={m.status === "FAILED" ? "px-3 py-2 text-danger" : "px-3 py-2"}>
                  {m.status}
                  {m.error && <span className="block text-[11.5px]">{m.error}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
