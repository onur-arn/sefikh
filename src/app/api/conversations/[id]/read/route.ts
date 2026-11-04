import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getConversationForUser, markConversationRead } from "@/lib/messaging";

/** Accusé de lecture lorsqu'un message arrive en direct dans la conversation ouverte. */
export async function POST(_request: Request, ctx: RouteContext<"/api/conversations/[id]/read">) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const found = await getConversationForUser(me, id);
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const at = await markConversationRead(me, found.conv, found.side);
  return NextResponse.json({ at });
}
