import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { removeFile } from "@/lib/storage";

export async function DELETE(_: Request, ctx: RouteContext<"/api/documents/[id]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const doc = await db.document.findFirst({ where: { id, ownerId: user.id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.document.delete({ where: { id } });
  await removeFile(doc.key);
  return NextResponse.json({ ok: true });
}
