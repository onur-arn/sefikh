import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { formatRelative } from "@/lib/utils";

export const metadata: Metadata = { title: "Dev mailbox", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Boîte de réception de développement : e-mails journalisés quand aucun SMTP n'est configuré. */
export default async function DevMailbox({ searchParams }: PageProps<"/dev/mailbox">) {
  if (env.isProd) notFound();
  const { id } = await searchParams;
  const emails = await db.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  const current = emails.find((e) => e.id === id) ?? emails[0];
  return (
    <div className="grid min-h-dvh grid-cols-[340px_1fr] bg-ivory">
      <aside className="overflow-y-auto border-r border-line">
        <p className="border-b border-line p-4 text-sm font-semibold">Dev mailbox · {emails.length} e-mails</p>
        {emails.map((e) => (
          <a key={e.id} href={`/dev/mailbox?id=${e.id}`} className={`block border-b border-line/60 p-4 text-sm ${current?.id === e.id ? "bg-paper" : "hover:bg-paper/60"}`}>
            <p className="font-medium">{e.subject}</p>
            <p className="text-[12px] text-muted">
              → {e.to} · {formatRelative(e.createdAt)} · {e.status}
            </p>
          </a>
        ))}
      </aside>
      <main>{current ? <iframe title="E-mail preview" srcDoc={current.html} className="h-dvh w-full bg-white" sandbox="allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation" /> : <p className="p-10 text-muted">No e-mail yet.</p>}</main>
    </div>
  );
}
