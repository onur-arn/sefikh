"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";

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
