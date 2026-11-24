"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { hasListedPlan } from "@/lib/access";
import { notify } from "@/lib/notifications";
import { translatorFor } from "@/i18n/server";

export async function setUserSuspended(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id"));
  if (id === admin.id) return;
  const suspended = formData.get("suspended") === "true";
  await db.user.update({ where: { id }, data: { suspendedAt: suspended ? new Date() : null } });
  if (suspended) await db.session.deleteMany({ where: { userId: id } });
  revalidatePath("/admin/users");
}

export async function setCompanyFlag(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const value = formData.get("value") === "true";
  const flag = String(formData.get("flag"));
  if (flag === "published") await db.company.update({ where: { id }, data: { published: value } });
  if (flag === "verified") await db.company.update({ where: { id }, data: { verified: value } });
  revalidatePath("/admin/makers");
}

export async function deleteContactRequest(formData: FormData) {
  await requireAdmin();
  await db.contactRequest.deleteMany({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/requests");
}

/** Ferme une session (déconnecte l'appareil concerné), sauf celle de l'admin qui agit. */
export async function revokeSession(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id"));
  if (id === admin.sessionId) return;
  await db.session.deleteMany({ where: { id } });
  revalidatePath("/admin/connexions");
}

// ───────────────────────── Modération (v2) ─────────────────────────

/** Publie la fiche si tout est réuni : profil validé, photo validée, offre payante. */
async function publishIfReady(companyId: string) {
  const c = await db.company.findUnique({ where: { id: companyId }, select: { reviewStatus: true, user: { select: { plan: true } }, _count: { select: { portfolio: { where: { status: "APPROVED" } } } } } });
  if (c && c.reviewStatus === "APPROVED" && c._count.portfolio > 0 && hasListedPlan(c.user.plan)) await db.company.update({ where: { id: companyId }, data: { published: true } });
}

export async function reviewCompany(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const approve = formData.get("decision") === "approve";
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;
  const company = await db.company.update({
    where: { id },
    data: { reviewStatus: approve ? "APPROVED" : "REJECTED", reviewNote: approve ? null : note, reviewedAt: new Date(), ...(approve ? {} : { published: false }) },
    include: { user: true },
  });
  if (approve) await publishIfReady(id);
  const tr = translatorFor(company.user.locale);
  await notify(company.userId, {
    type: "SYSTEM",
    title: approve ? tr("Your profile has been approved") : tr("Your profile needs changes"),
    body: approve ? tr("It appears on SEFIKH as soon as your plan is active and a picture is approved.") : (note ?? tr("Please update your profile and contact us if you have any question.")),
    link: "/dashboard/profile",
  });
  revalidatePath("/admin/moderation");
}

export async function reviewPhoto(formData: FormData) {
  await requireAdmin();
  const ids = formData.getAll("id").map(String);
  const approve = formData.get("decision") === "approve";
  const note = String(formData.get("note") ?? "").trim().slice(0, 300) || null;
  const photos = await db.portfolioImage.findMany({ where: { id: { in: ids } }, select: { id: true, companyId: true, company: { select: { userId: true, user: { select: { locale: true } } } } } });
  await db.portfolioImage.updateMany({ where: { id: { in: ids } }, data: { status: approve ? "APPROVED" : "REJECTED", reviewNote: approve ? null : note } });
  // Une notification par artisan concerné.
  const byCompany = new Map(photos.map((p) => [p.companyId, p.company]));
  for (const [companyId, c] of byCompany) {
    if (approve) await publishIfReady(companyId);
    const tr = translatorFor(c.user.locale);
    const n = photos.filter((p) => p.companyId === companyId).length;
    await notify(c.userId, {
      type: "SYSTEM",
      title: approve ? tr("{n} picture(s) approved", { n }) : tr("{n} picture(s) not approved", { n }),
      body: approve ? tr("They are now visible on your profile.") : (note ?? undefined),
      link: "/dashboard/portfolio",
    });
  }
  revalidatePath("/admin/moderation");
}
