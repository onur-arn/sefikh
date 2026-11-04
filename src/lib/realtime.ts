import "server-only";
import { db } from "@/lib/db";

// Bus d'événements temps réel (Server-Sent Events, /api/realtime).
// En mémoire, dans le processus : suffisant pour une instance unique (Railway, Render…).
// Pour plusieurs instances, remplacer publish/subscribe par Redis pub/sub ou PostgreSQL LISTEN/NOTIFY
// en gardant la même interface.

export type WireAttachment = { id: string; name: string; mime: string; size: number; url: string; width: number | null; height: number | null };
export type WireMessage = { id: string; body: string; createdAt: Date | string; mine: boolean; senderName: string; attachments: WireAttachment[]; nonce?: string };

export type RealtimeEvent =
  | { type: "message"; conversationId: string; message: WireMessage }
  | { type: "read"; conversationId: string; at: string }
  | { type: "typing"; conversationId: string }
  | { type: "presence"; userId: string; online: boolean }
  | { type: "conversations" } // la liste des conversations a changé
  | { type: "counts" }; // les compteurs (non lus, notifications) ont changé

type Listener = (event: RealtimeEvent) => void;

type Bus = { listeners: Map<string, Set<Listener>>; offlineTimers: Map<string, ReturnType<typeof setTimeout>> };

// globalThis : chaque route est un bundle séparé, le bus doit être partagé par tout le processus.
const g = globalThis as typeof globalThis & { __sefikhRealtime?: Bus };
const bus: Bus = (g.__sefikhRealtime ??= { listeners: new Map(), offlineTimers: new Map() });

/** Délai avant d'annoncer une déconnexion (absorbe les rechargements de page et reconnexions). */
const OFFLINE_GRACE_MS = 8_000;

export function publish(userIds: string | string[], event: RealtimeEvent) {
  for (const id of Array.isArray(userIds) ? userIds : [userIds]) {
    bus.listeners.get(id)?.forEach((fn) => {
      try {
        fn(event);
      } catch {
        // flux fermé : nettoyé par son propre abonnement
      }
    });
  }
}

export function isOnline(userId: string) {
  return (bus.listeners.get(userId)?.size ?? 0) > 0;
}

export function subscribe(userId: string, fn: Listener) {
  let set = bus.listeners.get(userId);
  const wasOnline = !!set?.size;
  if (!set) bus.listeners.set(userId, (set = new Set()));
  set.add(fn);

  const pending = bus.offlineTimers.get(userId);
  if (pending) {
    clearTimeout(pending);
    bus.offlineTimers.delete(userId);
  } else if (!wasOnline) {
    void announcePresence(userId, true);
  }

  return () => {
    const current = bus.listeners.get(userId);
    if (!current?.delete(fn) || current.size > 0) return;
    bus.listeners.delete(userId);
    bus.offlineTimers.set(
      userId,
      setTimeout(() => {
        bus.offlineTimers.delete(userId);
        if (!isOnline(userId)) void announcePresence(userId, false);
      }, OFFLINE_GRACE_MS),
    );
  };
}

/** Prévient les interlocuteurs de l'utilisateur qu'il vient de se connecter / déconnecter. */
async function announcePresence(userId: string, online: boolean) {
  try {
    const convs = await db.conversation.findMany({
      where: { OR: [{ clientId: userId }, { company: { userId } }] },
      select: { clientId: true, company: { select: { userId: true } } },
    });
    const peers = new Set(convs.map((c) => (c.clientId === userId ? c.company.userId : c.clientId)));
    peers.delete(userId);
    publish([...peers], { type: "presence", userId, online });
  } catch {
    // présence = information de confort, jamais bloquante
  }
}
