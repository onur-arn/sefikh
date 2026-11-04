import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { getT } from "@/i18n/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const tr = await getT();
  const nav = [
    ["/admin", tr("Overview")],
    ["/admin/users", tr("Users")],
    ["/admin/makers", tr("Makers")],
    ["/admin/requests", tr("Contact requests")],
  ] as const;
  return (
    <div className="container-x py-10">
      <p className="eyebrow">{tr("Administration")}</p>
      <nav aria-label={tr("Administration")} className="mt-3 flex flex-wrap gap-2 border-b border-line pb-4">
        {nav.map(([href, label]) => (
          <Link key={href} href={href} className="rounded-full border border-line px-4 py-1.5 text-[13px] hover:border-ink/40">
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-8">{children}</div>
    </div>
  );
}
