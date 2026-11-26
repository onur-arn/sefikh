import "server-only";
import { db } from "@/lib/db";
import { getConversationForUser } from "@/lib/messaging";
import { defaultQuote, formatQuoteNumber, type QuoteData } from "@/lib/quotes";
import type { WireQuote } from "@/lib/realtime";

type Me = Parameters<typeof getConversationForUser>[0];

/** Devis + conversation, si l'utilisateur y participe. Un brouillon n'est visible que par l'artisan. */
export async function getQuoteForUser(me: Me, id: string) {
  const quote = await db.quote.findUnique({ where: { id } });
  if (!quote) return null;
  const found = await getConversationForUser(me, quote.conversationId);
  if (!found) return null;
  if (quote.status === "DRAFT" && found.side !== "pro") return null;
  return { quote, ...found };
}

const join = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(", ");

/** Préremplissage d'un nouveau devis à partir de la fiche de l'atelier, du profil du client et du projet. */
export async function prefilledQuote(conversationId: string): Promise<{ data: QuoteData; nextNumber: string } | null> {
  const conv = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      company: { include: { user: { select: { name: true, email: true } } } },
      client: { include: { clientProfile: true } },
      project: true,
    },
  });
  if (!conv) return null;
  const c = conv.company;
  const cp = conv.client.clientProfile;
  const year = new Date().getFullYear();
  const count = await db.quote.count({ where: { companyId: c.id, number: { startsWith: `DEV-${year}-` } } });
  const data = defaultQuote({
    issuer: { company: c.name, contact: c.user.name, address: join(c.street, c.street2, c.city, c.country), email: c.publicEmail || c.user.email, phone: c.phone ?? "" },
    // Côté client : seulement ce que l'artisan voit déjà dans la messagerie (nom, studio, e-mail). Adresse et téléphone restent à compléter.
    client: { company: cp?.studioName || conv.client.name, contact: conv.client.name, email: conv.client.email },
    project: { name: conv.project?.title ?? conv.subject ?? "", location: join(conv.project?.city, conv.project?.country) },
  });
  return { data, nextNumber: formatQuoteNumber(year, count + 1) };
}

/** Carte de devis d'un message : envoyé par l'artisan, ou réponse du client (acceptation / refus). */
export function wireQuote(m: { senderId: string; quote: { id: string; number: string; status: string; totalTtc: number } | null }, proUserId: string): WireQuote | null {
  if (!m.quote) return null;
  const event = m.senderId === proUserId ? "sent" : m.quote.status === "DECLINED" ? "declined" : "accepted";
  return { id: m.quote.id, number: m.quote.number, status: m.quote.status, totalTtc: m.quote.totalTtc, event };
}

export const QUOTE_SELECT = { select: { id: true, number: true, status: true, totalTtc: true } } as const;
