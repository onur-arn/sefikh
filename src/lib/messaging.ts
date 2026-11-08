import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { translatorFor } from "@/i18n/server";
import { sendEmail } from "@/lib/mail";
import { newMessageTemplate } from "@/lib/mail/templates";
import { notify } from "@/lib/notifications";
import { getPlan } from "@/lib/plans";
import { isOnline, publish } from "@/lib/realtime";
import { startOfMonth } from "@/lib/utils";

type Me = { id: string; role: string; plan: string; company?: { id: string } | null };

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
      client: { select: { id: true, name: true, plan: true, role: true, avatarKey: true, email: true, lastSeenAt: true, clientProfile: { select: { studioName: true, clientType: true, city: true, country: true } } } },
      company: { select: { id: true, slug: true, name: true, logoKey: true, userId: true, city: true, country: true, publicEmail: true, phone: true, user: { select: { lastSeenAt: true } } } },
      project: { select: { id: true, title: true, city: true, country: true, budget: true, timeline: true } },
    },
  });
  if (!conv) return null;
  const side = sideOf(me, conv);
  return side ? { conv, side } : null;
}

export async function unreadConversationCount(me: Me) {
  if (!canContactMakers(me)) return 0;
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

/** Un créatif sans offre payante ne peut pas écrire aux makers, même dans une conversation existante. */
export function canContactMakers(me: { role: string; plan: string }) {
  return me.role !== "CLIENT" || getPlan(me.plan).limits.newConversationsPerMonth > 0;
}

/** Vérifie le quota de nouvelles mises en relation (offre gratuite côté créatifs). */
export async function assertCanStartConversation(me: { id: string; role: string; plan: string }) {
  if (me.role === "PRO") throw new MessagingError("Makers reply to requests; they cannot start new conversations.", 403);
  const limit = getPlan(me.plan).limits.newConversationsPerMonth;
  if (limit === 0) throw new MessagingError("Upgrade to Pro to contact makers.", 402, "LIMIT");
  if (!Number.isFinite(limit)) return;
  const used = await db.conversation.count({ where: { clientId: me.id, createdAt: { gte: startOfMonth() } } });
  if (used >= limit) throw new MessagingError("Upgrade to Pro to contact makers.", 402, "LIMIT");
}

/** Notifie le destinataire (in-app + e-mail, dédupliqué tant que la notification précédente n'est pas lue). */
export async function notifyNewMessage(opts: { conversationId: string; senderName: string; recipient: { id: string; name: string; email: string; locale?: string | null; notifyByEmail: boolean; lastSeenAt: Date | null }; body: string; subject?: string | null; isNew: boolean }) {
  const link = `/messages?c=${opts.conversationId}`;
  const pending = await db.notification.findFirst({ where: { userId: opts.recipient.id, link, readAt: null } });
  if (pending) return;
  const tr = translatorFor(opts.recipient.locale);
  await notify(opts.recipient.id, {
    type: opts.isNew ? "CONTACT_REQUEST" : "MESSAGE",
    title: tr(opts.isNew ? "New request from {name}" : "New message from {name}", { name: opts.senderName }),
    body: opts.body.slice(0, 140),
    link,
  });
  // Pas d'e-mail si le destinataire a le site ouvert (flux temps réel actif).
  const online = await isOnline(opts.recipient.id);
  if (opts.recipient.notifyByEmail && !online) {
    await sendEmail({
      to: opts.recipient.email,
      ...newMessageTemplate({ recipientName: opts.recipient.name, senderName: opts.senderName, preview: opts.body, conversationId: opts.conversationId, subject: opts.subject }, opts.recipient.locale),
    });
  }
}

/** Identifiant utilisateur de l'interlocuteur. */
export function otherUserId(conv: { client: { id: string }; company: { userId: string } }, side: "client" | "pro") {
  return side === "client" ? conv.company.userId : conv.client.id;
}

/** Marque la conversation comme lue et prévient l'interlocuteur (accusé de lecture en direct). */
export async function markConversationRead(me: { id: string }, conv: { id: string; client: { id: string }; company: { userId: string } }, side: "client" | "pro") {
  const at = new Date();
  await db.conversation.update({ where: { id: conv.id }, data: side === "client" ? { clientLastReadAt: at } : { proLastReadAt: at } });
  await db.notification.updateMany({ where: { userId: me.id, link: `/messages?c=${conv.id}`, readAt: null }, data: { readAt: at } });
  publish(otherUserId(conv, side), { type: "read", conversationId: conv.id, at: at.toISOString() });
  publish(me.id, { type: "counts" });
  return at;
}
