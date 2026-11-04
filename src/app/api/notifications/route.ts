import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canContactMakers } from "@/lib/messaging";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await db.notification.findMany({ where: { userId: user.id, ...(canContactMakers(user) ? {} : { type: { notIn: ["MESSAGE", "CONTACT_REQUEST"] } }) }, orderBy: { createdAt: "desc" }, take: 20 });
  return NextResponse.json({ items });
}

/** Marque toutes les notifications comme lues. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  return NextResponse.json({ ok: true });
}
