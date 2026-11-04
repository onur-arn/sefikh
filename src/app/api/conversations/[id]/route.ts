import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getConversationForUser, markConversationRead, otherUserId } from "@/lib/messaging";
import { isOnline } from "@/lib/realtime";
import { getPlan } from "@/lib/plans";

/** Détail d'une conversation + messages. `?after=<ISO>` pour ne récupérer que les nouveaux (polling). */
export async function GET(request: Request, ctx: RouteContext<"/api/conversations/[id]">) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const found = await getConversationForUser(me, id);
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { conv, side } = found;

  const after = new URL(request.url).searchParams.get("after");
  const messages = await db.message.findMany({
    where: { conversationId: id, ...(after ? { createdAt: { gt: new Date(after) } } : {}) },
    orderBy: { createdAt: "asc" },
    take: after ? undefined : 200,
    include: { attachments: true, sender: { select: { id: true, name: true } } },
  });

  // Accusé de lecture
  const last = messages.at(-1);
  if (last && last.senderId !== me.id) await markConversationRead(me, conv, side);

  const otherReadAt = side === "client" ? conv.proLastReadAt : conv.clientLastReadAt;
  const otherId = otherUserId(conv, side);
  const showContact = side === "pro" || getPlan(me.plan).limits.seeContactDetails;

  return NextResponse.json({
    conversation: after
      ? undefined
      : {
          id: conv.id,
          side,
          subject: conv.subject,
          archived: side === "client" ? conv.clientArchived : conv.proArchived,
          project: conv.project,
          other:
            side === "client"
              ? { userId: otherId, name: conv.company.name, avatarKey: conv.company.logoKey, href: `/makers/${conv.company.slug}`, location: [conv.company.city, conv.company.country].filter(Boolean).join(", "), email: showContact ? conv.company.publicEmail : null, phone: showContact ? conv.company.phone : null, role: "Maker" }
              : { userId: otherId, name: conv.client.clientProfile?.studioName || conv.client.name, contactName: conv.client.name, avatarKey: conv.client.avatarKey, href: null, location: [conv.client.clientProfile?.city, conv.client.clientProfile?.country].filter(Boolean).join(", "), email: conv.client.email, phone: null, role: conv.client.clientProfile?.clientType ?? "Creative" },
        },
    otherReadAt,
    otherOnline: isOnline(otherId),
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt,
      mine: m.senderId === me.id,
      senderName: m.sender.name,
      attachments: m.attachments.map((a) => ({ id: a.id, name: a.name, mime: a.mime, size: a.size, url: `/files/${a.key}`, width: a.width, height: a.height })),
    })),
  });
}

/** Archiver / désarchiver. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/conversations/[id]">) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const found = await getConversationForUser(me, id);
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { archived } = (await request.json().catch(() => ({}))) as { archived?: boolean };
  await db.conversation.update({ where: { id }, data: found.side === "client" ? { clientArchived: !!archived } : { proArchived: !!archived } });
  return NextResponse.json({ ok: true });
}
