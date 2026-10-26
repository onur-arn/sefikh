import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { participantWhere } from "@/lib/messaging";
import { getFile, isPublicKey, MIME_BY_EXT } from "@/lib/storage";
import { visitorId } from "@/lib/visitor";

/** Sert les fichiers stockés. Les pièces jointes et documents privés exigent un accès autorisé. */
export async function GET(request: Request, ctx: RouteContext<"/files/[...key]">) {
  const { key: parts } = await ctx.params;
  const key = parts.map(decodeURIComponent).join("/");
  if (key.includes("..")) return new NextResponse("Not found", { status: 404 });

  const isPublic = isPublicKey(key);
  if (key.startsWith("queries/")) {
    // Image déposée pour une recherche : visible par son auteur (compte ou visiteur anonyme).
    const [user, vid] = await Promise.all([getCurrentUser(), visitorId()]);
    const owner = await db.searchLog.findFirst({ where: { imageKey: key }, select: { userId: true, visitorId: true } });
    if (!owner || !((user && owner.userId === user.id) || (vid && owner.visitorId === vid))) return new NextResponse("Not found", { status: 404 });
  } else if (!isPublic) {
    const user = await getCurrentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });
    let allowed = false;
    if (key.startsWith("attachments/")) {
      allowed = !!(await db.attachment.findFirst({ where: { key, message: { conversation: participantWhere(user) } }, select: { id: true } }));
    } else if (key.startsWith("documents/")) {
      allowed = !!(await db.document.findFirst({ where: { key, ownerId: user.id }, select: { id: true } }));
    }
    if (!allowed) return new NextResponse("Not found", { status: 404 });
  }

  const file = await getFile(key);
  if (!file) return new NextResponse("Not found", { status: 404 });
  const ext = key.split(".").pop()!.toLowerCase();
  const download = new URL(request.url).searchParams.get("download");
  const name = download ? download.replace(/[^\w.\- ]/g, "_") : null;
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": MIME_BY_EXT[ext] ?? "application/octet-stream",
      "Content-Length": String(file.size),
      "Cache-Control": isPublic ? "public, max-age=31536000, immutable" : "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      ...(name ? { "Content-Disposition": `attachment; filename="${name}"` } : {}),
    },
  });
}
