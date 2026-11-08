import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { revokeSession } from "../actions";

export const metadata: Metadata = { title: "Connexions", robots: { index: false } };

const dateFr = (d: Date) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" }).format(d);

/** Appareil et navigateur lisibles à partir du user-agent. */
function device(ua: string | null) {
  if (!ua) return "—";
  const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "Autre";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Navigateur inconnu";
  return `${browser} · ${os}`;
}

/**
 * Sessions ouvertes : une ligne par connexion à un compte (IP, appareil, dates).
 * Une session disparaît à la déconnexion, au changement de mot de passe ou à son expiration.
 */
export default async function AdminConnexionsPage({ searchParams }: PageProps<"/admin/connexions">) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const sessions = await db.session.findMany({
    where: { expiresAt: { gt: new Date() }, ...(q ? { OR: [{ ip: { contains: q } }, { user: { email: { contains: q } } }] } : {}) },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, ip: true, userAgent: true, createdAt: true, user: { select: { name: true, email: true, role: true, lastSeenAt: true } } },
  });
  const ips = new Set(sessions.map((s) => s.ip).filter(Boolean));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl">Connexions</h1>
          <p className="mt-2 max-w-2xl text-[14px] text-muted">
            {sessions.length} session{sessions.length > 1 ? "s" : ""} ouverte{sessions.length > 1 ? "s" : ""}, depuis {ips.size} adresse{ips.size > 1 ? "s" : ""} IP. Une session disparaît à la déconnexion, au changement de mot de passe ou à son expiration ; les visiteurs non connectés n&apos;apparaissent pas.
          </p>
        </div>
        <form className="w-full max-w-xs">
          <input name="q" defaultValue={q} placeholder="Filtrer par e-mail ou IP" aria-label="Filtrer par e-mail ou IP" className="field" />
        </form>
      </div>
      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-paper text-[12px] text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Compte</th>
              <th className="px-4 py-3 font-medium">Adresse IP</th>
              <th className="px-4 py-3 font-medium">Appareil</th>
              <th className="px-4 py-3 font-medium">Connexion</th>
              <th className="px-4 py-3 font-medium">Dernière activité du compte</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-t border-line align-top">
                <td className="px-4 py-3">
                  <p>{s.user.name}</p>
                  <p className="text-[12px] text-muted">{s.user.email} · {s.user.role === "PRO" ? "Artisan" : s.user.role === "ADMIN" ? "Admin" : "Client"}</p>
                </td>
                <td className="px-4 py-3 font-mono text-[12.5px]">
                  {s.ip ? (
                    <a href={`https://ipinfo.io/${s.ip}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-brass" title="Voir l'opérateur et la localisation approximative">
                      {s.ip}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-ink-soft" title={s.userAgent ?? ""}>{device(s.userAgent)}</td>
                <td className="px-4 py-3 text-ink-soft">{dateFr(s.createdAt)}</td>
                <td className="px-4 py-3 text-ink-soft">{s.user.lastSeenAt ? dateFr(s.user.lastSeenAt) : "—"}</td>
                <td className="px-4 py-3 text-right">
                  {s.id === me.sessionId ? (
                    <span className="text-[12px] text-muted">Cette session</span>
                  ) : (
                    <form action={revokeSession}>
                      <input type="hidden" name="id" value={s.id} />
                      <button className="text-[13px] text-danger underline">Déconnecter</button>
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
