import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canContactMakers, participantWhere, sideOf } from "@/lib/messaging";

/** Tous les fichiers échangés dans les conversations de l'utilisateur (« Cloud »). */
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canContactMakers(me)) return NextResponse.json({ items: [] });
  const rows = await db.attachment.findMany({
    where: { message: { conversation: participantWhere(me) } },
    orderBy: { message: { createdAt: "desc" } },
    take: 200,
    include: {
      message: {
        select: {
          createdAt: true,
          conversation: { select: { id: true, clientId: true, companyId: true, company: { select: { name: true } }, client: { select: { name: true } } } },
        },
      },
    },
  });
  const items = rows.map((a) => {
    const c = a.message.conversation;
    return {
      id: a.id,
      name: a.name,
      mime: a.mime,
      size: a.size,
      url: `/files/${a.key}`,
      width: a.width,
      height: a.height,
      conversationId: c.id,
      with: sideOf(me, c) === "client" ? c.company.name : c.client.name,
      createdAt: a.message.createdAt,
    };
  });
  return NextResponse.json({ items });
}
