import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { translateText, TranslationUnavailable } from "@/lib/ai";
import { getConversationForUser } from "@/lib/messaging";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { visitorId } from "@/lib/visitor";
import { getLocale } from "@/i18n/server";

const Body = z.object({ kind: z.enum(["company", "portfolio", "message"]), id: z.string().min(1).max(64) });

/**
 * Traduction d'un contenu publié, vers la langue de l'utilisateur.
 * Le texte est relu en base : l'API ne traduit jamais un texte fourni par l'appelant.
 */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { kind, id } = parsed.data;

  const me = await getCurrentUser();
  const who = me?.id ?? (await visitorId()) ?? (await clientIp());
  if (!rateLimit(`translate:${who}`, 40, 60 * 60_000).ok) return NextResponse.json({ error: "Too many translations. Please try again later." }, { status: 429 });

  let fields: Record<string, string | null | undefined> | null = null;
  if (kind === "company") {
    const c = await db.company.findFirst({ where: { id, published: true }, select: { tagline: true, about: true, productionCapacity: true } });
    fields = c;
  } else if (kind === "portfolio") {
    const p = await db.portfolioImage.findFirst({ where: { id, company: { published: true } }, select: { title: true, description: true } });
    fields = p;
  } else if (me) {
    const m = await db.message.findUnique({ where: { id }, select: { body: true, conversationId: true } });
    if (m && (await getConversationForUser(me, m.conversationId))) fields = { body: m.body };
  }
  if (!fields) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const target = await getLocale();
  try {
    const entries = await Promise.all(Object.entries(fields).map(async ([k, v]) => [k, v ? await translateText(v, target) : null] as const));
    return NextResponse.json({ fields: Object.fromEntries(entries) });
  } catch (e) {
    if (!(e instanceof TranslationUnavailable)) console.error("[translate]", e);
    return NextResponse.json({ error: "Automatic translation is unavailable for now." }, { status: 503 });
  }
}
