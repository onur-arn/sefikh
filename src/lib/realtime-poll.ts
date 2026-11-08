import "server-only";
import { db } from "@/lib/db";
import type { RealtimeEvent } from "@/lib/realtime";

// Relais par la base pour le flux temps réel.
// Sur Vercel, l'envoi d'un message et le flux du destinataire tournent souvent sur des instances différentes :
// le bus en mémoire ne suffit pas. Chaque flux relit donc la base toutes les POLL_MS et rejoue
// les nouveaux messages, accusés de lecture et notifications. Les doublons avec le bus en mémoire
// sont sans effet : la messagerie ignore un message dont elle connaît déjà l'identifiant.

export const POLL_MS = 2_000;
/** Marge de recouvrement : absorbe les écarts d'horloge entre l'application et la base. */
const OVERLAP_MS = 10_000;
const MAX_SEEN = 500;

function remember(set: Set<string>, id: string) {
  set.add(id);
  if (set.size > MAX_SEEN) set.delete(set.values().next().value!);
}

export function createDbRelay(userId: string, emit: (event: RealtimeEvent) => void) {
  let since = new Date();
  const seenMessages = new Set<string>();
  const seenNotifications = new Set<string>();
  const readAt = new Map<string, number>();
  const mine = { OR: [{ clientId: userId }, { company: { userId } }] };

  return async function poll() {
    const started = new Date();
    const from = new Date(since.getTime() - OVERLAP_MS);

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
      db.notification.findMany({ where: { userId, createdAt: { gt: from } }, select: { id: true } }),
    ]);

    let changed = false;
    for (const m of messages) {
      if (seenMessages.has(m.id)) continue;
      remember(seenMessages, m.id);
      changed = true;
      emit({
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
      });
    }
    for (const c of reads) {
      // Accusé de lecture de l'interlocuteur.
      const at = c.clientId === userId ? c.proLastReadAt : c.clientLastReadAt;
      if (!at || readAt.get(c.id) === at.getTime()) continue;
      readAt.set(c.id, at.getTime());
      emit({ type: "read", conversationId: c.id, at: at.toISOString() });
    }
    for (const n of notifications) {
      if (seenNotifications.has(n.id)) continue;
      remember(seenNotifications, n.id);
      changed = true;
    }
    if (changed) {
      emit({ type: "conversations" });
      emit({ type: "counts" });
    }
    since = started;
  };
}
