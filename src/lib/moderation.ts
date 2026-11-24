import "server-only";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/mail";

const SUBJECT_PREFIX = "[Modération SEFIKH]";

/**
 * Prévient l'équipe qu'un profil ou une photo attend une validation (engagement : sous 72 h).
 * Au plus un e-mail toutes les 30 minutes : il résume tout ce qui est en attente.
 */
export async function alertModeration() {
  try {
    const recent = await db.emailLog.findFirst({ where: { subject: { startsWith: SUBJECT_PREFIX }, createdAt: { gt: new Date(Date.now() - 30 * 60_000) } }, select: { id: true } });
    if (recent) return;
    const [profiles, photos] = await Promise.all([
      db.company.findMany({ where: { reviewStatus: "PENDING" }, select: { name: true, city: true }, orderBy: { createdAt: "asc" } }),
      db.portfolioImage.count({ where: { status: "PENDING" } }),
    ]);
    if (!profiles.length && !photos) return;
    const url = `${env.appUrl}/admin/moderation`;
    const lines = [
      `${profiles.length} profil(s) et ${photos} photo(s) attendent une validation (engagement : sous 72 h).`,
      ...profiles.slice(0, 10).map((p) => `— ${p.name}${p.city ? ` (${p.city})` : ""}`),
      "",
      `Valider : ${url}`,
    ];
    const esc = (t: string) => t.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
    await sendEmail({
      to: env.contactInbox,
      subject: `${SUBJECT_PREFIX} ${profiles.length} profil(s), ${photos} photo(s) à valider`,
      text: lines.join("\n"),
      html: `<div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#111">${lines.slice(0, -2).map((l) => `<p style="margin:0 0 6px">${esc(l)}</p>`).join("")}<p style="margin:18px 0 0"><a href="${url}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;text-decoration:none">Ouvrir la modération</a></p></div>`,
    });
  } catch (e) {
    console.error("[moderation] alerte non envoyée", e);
  }
}
