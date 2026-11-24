import { getCurrentUser } from "@/lib/auth/session";
import { eventsSince, RETRY_MS } from "@/lib/realtime-poll";

// Réponse immédiate : jamais de connexion longue (facturée à la durée sur Vercel).
export const maxDuration = 10;

/**
 * Temps réel de l'utilisateur connecté, en interrogations courtes compatibles EventSource :
 * renvoie les événements depuis le dernier passage (en-tête Last-Event-ID), indique le prochain
 * point de reprise (`id:`) et le délai avant la prochaine interrogation (`retry:`), puis ferme.
 */
export async function GET(request: Request) {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });

  const now = Date.now();
  const last = Number(request.headers.get("last-event-id") ?? new URL(request.url).searchParams.get("since"));
  // Premier passage : rien à rejouer, on fixe seulement le point de départ.
  const events = Number.isFinite(last) && last > 0 && last <= now ? await eventsSince(me.id, new Date(last)) : [];

  const body = [`retry: ${RETRY_MS}\n\n`, ...events.map((e) => `data: ${JSON.stringify(e)}\n\n`), `id: ${now}\nevent: cursor\ndata: {}\n\n`].join("");
  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
