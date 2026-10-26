"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getPlan } from "@/lib/plans";

export async function toggleSaveAction(companyId: string): Promise<{ saved?: boolean; error?: string; upgrade?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please log in to save makers." };
  if (!getPlan(user.plan).limits.savedLibrary) return { error: "The supplier library is part of the Pro plan.", upgrade: true };
  const key = { userId_companyId: { userId: user.id, companyId } };
  const existing = await db.savedCompany.findUnique({ where: key });
  if (existing) await db.savedCompany.delete({ where: key });
  else await db.savedCompany.create({ data: { userId: user.id, companyId } });
  revalidatePath("/dashboard/library");
  return { saved: !existing };
}
