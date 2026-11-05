import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { subscribe, type RealtimeEvent } from "@/lib/realtime";

const HEARTBEAT_MS = 25_000;

// Sur Vercel le flux est coupé à cette limite ; le navigateur se reconnecte et resynchronise.
export const maxDuration = 300;

/**
 * Flux temps réel de l'utilisateur connecté (Server-Sent Events) : nouveaux messages, accusés de lecture,
 * « en train d'écrire », présence, compteurs. Le navigateur se reconnecte seul en cas de coupure.
 */
export async function GET(request: Request) {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const send = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };
      const unsubscribe = subscribe(me.id, (event: RealtimeEvent) => send(`data: ${JSON.stringify(event)}\n\n`));

      // Battement : garde la connexion ouverte à travers les proxys et coupe le flux si la session a été révoquée.
      const heartbeat = setInterval(async () => {
        const session = await db.session.findUnique({ where: { id: me.sessionId }, select: { expiresAt: true } }).catch(() => undefined);
        if (session === null || (session && session.expiresAt < new Date())) {
          send(`event: unauthorized\ndata: {}\n\n`);
          return cleanup();
        }
        send(`: ping\n\n`);
      }, HEARTBEAT_MS);

      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // déjà fermé
        }
      };
      request.signal.addEventListener("abort", () => cleanup());

      send(`retry: 3000\n: connected\n\n`);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      // no-transform : empêche la compression (qui mettrait les événements en tampon)
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
