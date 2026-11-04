import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getConversationForUser, otherUserId } from "@/lib/messaging";
import { rateLimit } from "@/lib/rate-limit";
import { publish } from "@/lib/realtime";

/** Indicateur « en train d'écrire » (le client l'envoie au plus toutes les 2,5 s pendant la saisie). */
export async function POST(_request: Request, ctx: RouteContext<"/api/conversations/[id]/typing">) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(`typing:${me.id}`, 40, 60_000).ok) return new NextResponse(null, { status: 429 });
  const { id } = await ctx.params;
  const found = await getConversationForUser(me, id);
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });
  publish(otherUserId(found.conv, found.side), { type: "typing", conversationId: id });
  return new NextResponse(null, { status: 204 });
}
