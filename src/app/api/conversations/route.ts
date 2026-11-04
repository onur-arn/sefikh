import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { assertCanStartConversation, canContactMakers, MessagingError, notifyNewMessage, participantWhere, sideOf } from "@/lib/messaging";
import { publish } from "@/lib/realtime";
import { rateLimit } from "@/lib/rate-limit";
import { hasListedPlan } from "@/lib/access";

/** Liste des conversations de l'utilisateur (boîte de réception). */
export async function GET(request: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canContactMakers(me)) return NextResponse.json({ error: "Upgrade to Pro to contact makers.", code: "LIMIT" }, { status: 402 });
  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") ?? "all";
  const q = url.searchParams.get("q")?.trim().toLowerCase();

  const convs = await db.conversation.findMany({
    where: participantWhere(me),
    orderBy: { lastMessageAt: "desc" },
    include: {
      client: { select: { id: true, name: true, avatarKey: true, clientProfile: { select: { studioName: true } } } },
      company: { select: { id: true, name: true, logoKey: true, slug: true } },
      project: { select: { id: true, title: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, senderId: true, createdAt: true, _count: { select: { attachments: true } } } },
    },
  });

  const items = convs
    .map((c) => {
      const side = sideOf(me, c)!;
      const last = c.messages[0];
      const readAt = side === "client" ? c.clientLastReadAt : c.proLastReadAt;
      const other = side === "client" ? { name: c.company.name, avatarKey: c.company.logoKey, href: `/makers/${c.company.slug}` } : { name: c.client.clientProfile?.studioName || c.client.name, avatarKey: c.client.avatarKey, href: null };
      return {
        id: c.id,
        side,
        subject: c.subject,
        project: c.project,
        other,
        archived: side === "client" ? c.clientArchived : c.proArchived,
        unread: !!last && last.senderId !== me.id && (!readAt || readAt < c.lastMessageAt),
        lastMessage: last ? { body: last.body || (last._count.attachments ? "📎 Attachment" : ""), mine: last.senderId === me.id, at: last.createdAt } : null,
        lastMessageAt: c.lastMessageAt,
      };
    })
    .filter((c) => (filter === "archived" ? c.archived : !c.archived))
    .filter((c) => (filter === "unread" ? c.unread : true))
    .filter((c) => (q ? `${c.other.name} ${c.subject ?? ""} ${c.project?.title ?? ""}`.toLowerCase().includes(q) : true));

  return NextResponse.json({ items });
}

const startSchema = z.object({
  companyId: z.string().min(1),
  projectId: z.string().nullish(),
  body: z.string().trim().min(10, "Please write a slightly longer message.").max(5000),
});

/** Nouvelle mise en relation créatif → maker (ou reprise d'une conversation existante). */
export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (!me.emailVerifiedAt) return NextResponse.json({ error: "Please confirm your e-mail address first." }, { status: 403 });
  if (!canContactMakers(me)) return NextResponse.json({ error: "Upgrade to Pro to contact makers.", code: "LIMIT" }, { status: 402 });
  const rl = rateLimit(`conv:${me.id}`, 10, 60 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many new conversations. Please try again later." }, { status: 429 });

  const parsed = startSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  const { companyId, projectId, body } = parsed.data;

  const company = await db.company.findUnique({ where: { id: companyId }, include: { user: true } });
  if (!company || !company.published || !hasListedPlan(company.user.plan)) return NextResponse.json({ error: "Maker not found." }, { status: 404 });
  if (company.userId === me.id) return NextResponse.json({ error: "You cannot message your own company." }, { status: 400 });
  const project = projectId ? await db.project.findFirst({ where: { id: projectId, ownerId: me.id } }) : null;

  let conv = await db.conversation.findFirst({ where: { clientId: me.id, companyId, projectId: project?.id ?? null } });
  const isNew = !conv;
  try {
    if (!conv) {
      await assertCanStartConversation(me);
      conv = await db.conversation.create({
        data: { clientId: me.id, companyId, projectId: project?.id ?? null, subject: project?.title ?? `Enquiry for ${company.name}` },
      });
    }
  } catch (e) {
    if (e instanceof MessagingError) return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    throw e;
  }

  const now = new Date();
  const message = await db.message.create({ data: { conversationId: conv.id, senderId: me.id, body } });
  await db.conversation.update({ where: { id: conv.id }, data: { lastMessageAt: now, clientLastReadAt: now, clientArchived: false, proArchived: false } });
  const wire = { id: message.id, body, createdAt: message.createdAt, senderName: me.name, attachments: [] };
  publish(company.userId, { type: "message", conversationId: conv.id, message: { ...wire, mine: false } });
  publish(me.id, { type: "message", conversationId: conv.id, message: { ...wire, mine: true } });
  publish([company.userId, me.id], { type: "conversations" });
  await notifyNewMessage({ conversationId: conv.id, senderName: me.clientProfile?.studioName || me.name, recipient: company.user, body, subject: conv.subject, isNew });

  return NextResponse.json({ id: conv.id }, { status: isNew ? 201 : 200 });
}
