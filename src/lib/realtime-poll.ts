import "server-only";
import { db } from "@/lib/db";
import type { RealtimeEvent } from "@/lib/realtime";

// Temps réel par interrogations courtes (v2, 24/11/2026).
// Sur Vercel, une connexion ouverte est facturée pendant toute sa durée : un flux SSE permanent coûtait
// 300 s × 2 Go par reconnexion. Chaque requête lit donc la base depuis le dernier passage (Last-Event-ID),
// répond et se ferme ; le navigateur (EventSource) se reconnecte seul après RETRY_MS.

/** Délai de reconnexion demandé au navigateur entre deux interrogations (millisecondes). */
export const RETRY_MS = 4_000;
/** Marge de recouvrement : absorbe les écarts d'horloge entre l'application et la base. */
const OVERLAP_MS = 10_000;

/**
 * Événements survenus depuis `since` pour cet utilisateur (sans état : une requête = une lecture).
 * Les doublons sont sans effet : la messagerie ignore un message dont elle connaît déjà l'identifiant,
 * et un accusé de lecture rejoué ne change rien.
 */
export async function eventsSince(userId: string, since: Date): Promise<RealtimeEvent[]> {
  const from = new Date(since.getTime() - OVERLAP_MS);
  const mine = { OR: [{ clientId: userId }, { company: { userId } }] };
  const [messages, reads, notifications] = await Promise.all([
    // Les messages de l'utilisateur lui-même arrivent déjà par la réponse à son envoi.
    db.message.findMany({
      where: { createdAt: { gt: from }, senderId: { not: userId }, conversation: mine },
      include: { attachments: true, sender: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
      take: 50,
    }),
    db.conversation.findMany({
      where: {
        OR: [
          { clientId: userId, proLastReadAt: { gt: from } },
          { company: { userId }, clientLastReadAt: { gt: from } },
        ],
      },
      select: { id: true, clientId: true, clientLastReadAt: true, proLastReadAt: true },
    }),
    db.notification.count({ where: { userId, createdAt: { gt: from } } }),
  ]);

  const events: RealtimeEvent[] = messages.map((m) => ({
    type: "message",
    conversationId: m.conversationId,
    message: {
      id: m.id,
      body: m.body,
      createdAt: m.createdAt,
      mine: false,
      senderName: m.sender.name,
      attachments: m.attachments.map((a) => ({ id: a.id, name: a.name, mime: a.mime, size: a.size, url: `/files/${a.key}`, width: a.width, height: a.height })),
    },
  }));
  for (const c of reads) {
    // Accusé de lecture de l'interlocuteur.
    const at = c.clientId === userId ? c.proLastReadAt : c.clientLastReadAt;
    if (at) events.push({ type: "read", conversationId: c.id, at: at.toISOString() });
  }
  if (messages.length || notifications) events.push({ type: "conversations" }, { type: "counts" });
  return events;
}
