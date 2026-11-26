"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getConversationForUser, notifyNewMessage, otherUserId } from "@/lib/messaging";
import { publish } from "@/lib/realtime";
import { translatorFor } from "@/i18n/server";
import { defaultQuote, formatQuoteNumber, parseQuoteData, quoteSchema, quoteTotals } from "@/lib/quotes";

type State = { error?: string } | null;
type Me = Awaited<ReturnType<typeof requireUser>>;
type Conv = NonNullable<Awaited<ReturnType<typeof getConversationForUser>>>["conv"];

/** Crée le devis avec le prochain numéro libre de l'atelier (DEV-AAAA-NNN). */
async function createWithNumber(data: { conversationId: string; companyId: string; data: string; totalTtc: number }) {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await db.quote.count({ where: { companyId: data.companyId, number: { startsWith: `DEV-${year}-` } } });
    try {
      return await db.quote.create({ data: { ...data, number: formatQuoteNumber(year, count + 1 + attempt) } });
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
    }
  }
  throw new Error("Could not allocate a quote number");
}

/** Message de la conversation lié au devis (carte dans la messagerie), diffusion et notification. */
type QuoteEvent = "sent" | "accepted" | "declined";

async function postQuoteMessage(me: Me, conv: Conv, side: "client" | "pro", quote: { id: string; number: string }, event: QuoteEvent, note?: string | null) {
  const quoteId = quote.id;
  // Texte stocké neutre (numéro + note éventuelle) : la carte du devis est traduite à l'affichage.
  const body = note ? `${quote.number} — ${note}` : quote.number;
  const now = new Date();
  const message = await db.message.create({ data: { conversationId: conv.id, senderId: me.id, body, quoteId } });
  await db.conversation.update({
    where: { id: conv.id },
    data: { lastMessageAt: now, clientArchived: false, proArchived: false, ...(side === "client" ? { clientLastReadAt: now } : { proLastReadAt: now }) },
  });
  const recipientId = otherUserId(conv, side);
  publish([recipientId, me.id], { type: "conversations" });
  const recipient = await db.user.findUnique({ where: { id: recipientId } });
  if (recipient) {
    const tr = translatorFor(recipient.locale);
    await notifyNewMessage({
      conversationId: conv.id,
      senderName: side === "client" ? me.clientProfile?.studioName || me.name : conv.company.name,
      recipient,
      body: (event === "sent" ? tr("Quote {number} sent", { number: quote.number }) : event === "accepted" ? tr("Quote {number} accepted", { number: quote.number }) : tr("Quote {number} declined", { number: quote.number })) + (note ? ` — ${note}` : ""),
      subject: conv.subject,
      isNew: false,
    });
  }
  return message;
}

/** Enregistre un brouillon (intent=draft) ou l'envoie au client (intent=send). Réservé à l'artisan de la conversation. */
export async function saveQuoteAction(_: State, formData: FormData): Promise<State> {
  const me = await requireUser();
  if (!me.emailVerifiedAt) return { error: "Please confirm your e-mail address to send messages." };
  const conversationId = String(formData.get("conversationId") ?? "");
  const quoteId = String(formData.get("quoteId") ?? "") || null;
  const intent = formData.get("intent") === "send" ? "send" : "draft";
  const found = await getConversationForUser(me, conversationId);
  if (!found || found.side !== "pro") return { error: "Only the artisan of this conversation can issue a quote." };
  const { conv } = found;

  let parsed;
  try {
    parsed = quoteSchema.safeParse(JSON.parse(String(formData.get("data") ?? "{}")));
  } catch {
    return { error: "Invalid request." };
  }
  if (!parsed.success) return { error: "Please check the highlighted amounts and dates." };
  const data = parsed.data;
  data.lines = data.lines.filter((l) => l.designation || l.unitPrice);
  data.options = data.options.filter((o) => o.label);
  const totals = quoteTotals(data);

  if (intent === "send") {
    if (!data.lines.length) return { error: "Add at least one line to the quote." };
    if (!data.issuer.company || !data.client.company) return { error: "Fill in the issuer and the client." };
    if (data.payments.length && Math.abs(totals.paymentPctSum - 100) > 0.01) return { error: "The payment schedule must add up to 100 %." };
  }

  let id = quoteId;
  if (id) {
    const existing = await db.quote.findFirst({ where: { id, conversationId, companyId: conv.companyId } });
    if (!existing) return { error: "Not found" };
    if (existing.status !== "DRAFT") return { error: "This quote has already been sent and can no longer be edited." };
    await db.quote.update({ where: { id }, data: { data: JSON.stringify(data), totalTtc: totals.totalTtc } });
  } else {
    const created = await createWithNumber({ conversationId, companyId: conv.companyId, data: JSON.stringify(data), totalTtc: totals.totalTtc });
    id = created.id;
  }

  if (intent === "send") {
    const quote = await db.quote.update({ where: { id }, data: { status: "SENT", sentAt: new Date() } });
    await postQuoteMessage(me, conv, "pro", quote, "sent");
  }
  redirect(`/messages/quotes/${id}`);
}

/** Réponse du client : « Bon pour accord » (nom et fonction obligatoires) ou refus. */
export async function respondQuoteAction(_: State, formData: FormData): Promise<State> {
  const me = await requireUser();
  const quote = await db.quote.findUnique({ where: { id: String(formData.get("quoteId") ?? "") } });
  if (!quote) return { error: "Not found" };
  const found = await getConversationForUser(me, quote.conversationId);
  if (!found || found.side !== "client") return { error: "Not found" };
  if (quote.status !== "SENT") return { error: "This quote has already been answered." };

  if (formData.get("decision") === "accept") {
    const name = String(formData.get("name") ?? "").trim().slice(0, 160);
    if (!name) return { error: "Enter your name and position." };
    if (formData.get("agree") !== "on") return { error: "Tick « Approved » to accept the quote." };
    await db.quote.update({ where: { id: quote.id }, data: { status: "ACCEPTED", respondedAt: new Date(), acceptedName: name } });
    await postQuoteMessage(me, found.conv, "client", quote, "accepted");
  } else {
    const reason = String(formData.get("reason") ?? "").trim().slice(0, 1000) || null;
    await db.quote.update({ where: { id: quote.id }, data: { status: "DECLINED", respondedAt: new Date(), declineReason: reason } });
    await postQuoteMessage(me, found.conv, "client", quote, "declined", reason);
  }
  redirect(`/messages/quotes/${quote.id}`);
}

/** Nouvelle version : copie un devis envoyé en brouillon (nouveau numéro, dates du jour). */
export async function duplicateQuoteAction(formData: FormData) {
  const me = await requireUser();
  const quote = await db.quote.findUnique({ where: { id: String(formData.get("quoteId") ?? "") } });
  if (!quote) redirect("/messages");
  const found = await getConversationForUser(me, quote.conversationId);
  if (!found || found.side !== "pro") redirect("/messages");
  const data = parseQuoteData(quote.data);
  const fresh = defaultQuote({ issuer: {}, client: {}, project: {} });
  const copy = { ...data, issueDate: fresh.issueDate, validUntil: fresh.validUntil };
  const created = await createWithNumber({ conversationId: quote.conversationId, companyId: quote.companyId, data: JSON.stringify(copy), totalTtc: quoteTotals(copy).totalTtc });
  redirect(`/messages/quotes/${created.id}/edit`);
}

/** Supprime un brouillon (jamais un devis envoyé). */
export async function deleteDraftAction(formData: FormData) {
  const me = await requireUser();
  const quote = await db.quote.findUnique({ where: { id: String(formData.get("quoteId") ?? "") } });
  if (!quote || quote.status !== "DRAFT") redirect("/messages");
  const found = await getConversationForUser(me, quote.conversationId);
  if (!found || found.side !== "pro") redirect("/messages");
  await db.quote.delete({ where: { id: quote.id } });
  redirect(`/messages?c=${quote.conversationId}`);
}

