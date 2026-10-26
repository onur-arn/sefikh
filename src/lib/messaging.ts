import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/mail";
import { newMessageTemplate } from "@/lib/mail/templates";
import { notify } from "@/lib/notifications";
import { getPlan } from "@/lib/plans";
import { startOfMonth } from "@/lib/utils";

type Me = { id: string; role: string; company?: { id: string } | null };

/** Conversations dont l'utilisateur est participant (côté client ou côté pro). */
export function participantWhere(me: Me): Prisma.ConversationWhereInput {
  return me.company ? { OR: [{ clientId: me.id }, { companyId: me.company.id }] } : { clientId: me.id };
}

export function sideOf(me: Me, conv: { clientId: string; companyId: string }) {
  if (conv.clientId === me.id) return "client" as const;
  if (me.company && conv.companyId === me.company.id) return "pro" as const;
  return null;
}

export async function getConversationForUser(me: Me, id: string) {
  const conv = await db.conversation.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, avatarKey: true, email: true, lastSeenAt: true, clientProfile: { select: { studioName: true, clientType: true, city: true, country: true } } } },
      company: { select: { id: true, slug: true, name: true, logoKey: true, userId: true, city: true, country: true, publicEmail: true, phone: true, user: { select: { lastSeenAt: true } } } },
      project: { select: { id: true, title: true, city: true, country: true, budget: true, timeline: true } },
    },
  });
  if (!conv) return null;
  const side = sideOf(me, conv);
  return side ? { conv, side } : null;
}

export async function unreadConversationCount(me: Me) {
  const convs = await db.conversation.findMany({
    where: participantWhere(me),
    select: {
      clientId: true,
      companyId: true,
      lastMessageAt: true,
      clientLastReadAt: true,
      proLastReadAt: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { senderId: true } },
    },
  });
  return convs.filter((c) => {
    const last = c.messages[0];
    if (!last || last.senderId === me.id) return false;
    const read = sideOf(me, c) === "client" ? c.clientLastReadAt : c.proLastReadAt;
    return !read || read < c.lastMessageAt;
  }).length;
}

export class MessagingError extends Error {
  constructor(message: string, public status = 400, public code?: string) {
    super(message);
  }
}

/** Vérifie le quota de nouvelles mises en relation (offre gratuite côté créatifs). */
export async function assertCanStartConversation(me: { id: string; role: string; plan: string }) {
  if (me.role === "PRO") throw new MessagingError("Makers reply to requests; they cannot start new conversations.", 403);
  const limit = getPlan(me.plan).limits.newConversationsPerMonth;
  if (!Number.isFinite(limit)) return;
  const used = await db.conversation.count({ where: { clientId: me.id, createdAt: { gte: startOfMonth() } } });
  if (used >= limit) {
    throw new MessagingError(`Your Free plan includes ${limit} new conversations per month. Upgrade to Pro for unlimited messaging.`, 402, "LIMIT");
  }
}

/** Notifie le destinataire (in-app + e-mail, dédupliqué tant que la notification précédente n'est pas lue). */
export async function notifyNewMessage(opts: { conversationId: string; senderName: string; recipient: { id: string; name: string; email: string; notifyByEmail: boolean; lastSeenAt: Date | null }; body: string; subject?: string | null; isNew: boolean }) {
  const link = `/messages?c=${opts.conversationId}`;
  const pending = await db.notification.findFirst({ where: { userId: opts.recipient.id, link, readAt: null } });
  if (pending) return;
  await notify(opts.recipient.id, {
    type: opts.isNew ? "CONTACT_REQUEST" : "MESSAGE",
    title: opts.isNew ? `New request from ${opts.senderName}` : `New message from ${opts.senderName}`,
    body: opts.body.slice(0, 140),
    link,
  });
  const online = opts.recipient.lastSeenAt && Date.now() - opts.recipient.lastSeenAt.getTime() < 2 * 60_000;
  if (opts.recipient.notifyByEmail && !online) {
    await sendEmail({
      to: opts.recipient.email,
      ...newMessageTemplate({ recipientName: opts.recipient.name, senderName: opts.senderName, preview: opts.body, conversationId: opts.conversationId, subject: opts.subject }),
    });
  }
}
