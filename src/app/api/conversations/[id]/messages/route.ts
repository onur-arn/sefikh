import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { UPLOAD_LIMITS } from "@/lib/constants";
import { processImage, UploadError } from "@/lib/images";
import { canContactMakers, getConversationForUser, notifyNewMessage, otherUserId } from "@/lib/messaging";
import { publish, type WireMessage } from "@/lib/realtime";
import { rateLimit } from "@/lib/rate-limit";
import { newKey, putFile } from "@/lib/storage";

const DOC_TYPES: Record<string, { ext: string; magic: number[] }> = {
  "application/pdf": { ext: "pdf", magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
};

/** Envoi d'un message (texte + pièces jointes : images ré-encodées, PDF vérifiés). */
export async function POST(request: Request, ctx: RouteContext<"/api/conversations/[id]/messages">) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!me.emailVerifiedAt) return NextResponse.json({ error: "Please confirm your e-mail address to send messages." }, { status: 403 });
  const rl = rateLimit(`msg:${me.id}`, 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "You're sending messages too quickly." }, { status: 429 });

  const { id } = await ctx.params;
  const found = await getConversationForUser(me, id);
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { conv, side } = found;

  if (!canContactMakers(me)) return NextResponse.json({ error: "Upgrade to Pro to contact makers.", code: "LIMIT" }, { status: 402 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const body = String(form.get("body") ?? "").trim().slice(0, 5000);
  // Identifiant temporaire choisi par l'onglet émetteur : lui permet de remplacer son message « en cours d'envoi ».
  const nonce = String(form.get("nonce") ?? "").slice(0, 64) || undefined;
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!body && files.length === 0) return NextResponse.json({ error: "Message is empty." }, { status: 400 });
  if (files.length > UPLOAD_LIMITS.attachmentsPerMessage) return NextResponse.json({ error: `Up to ${UPLOAD_LIMITS.attachmentsPerMessage} files per message.` }, { status: 400 });

  const attachments: { key: string; name: string; mime: string; size: number; width?: number; height?: number }[] = [];
  try {
    for (const f of files) {
      const buf = Buffer.from(await f.arrayBuffer());
      const name = f.name.replace(/[^\w.\- ()]/g, "_").slice(0, 120) || "file";
      if (f.type.startsWith("image/")) {
        if (f.size > UPLOAD_LIMITS.imageBytes) throw new UploadError(`${name} is larger than 10 MB.`);
        const img = await processImage(buf, "attachments", { maxSize: 2200 });
        attachments.push({ key: img.key, name: name.replace(/\.\w+$/, ".webp"), mime: "image/webp", size: img.buffer.length, width: img.width, height: img.height });
      } else {
        const doc = DOC_TYPES[f.type];
        if (!doc || !doc.magic.every((b, i) => buf[i] === b)) throw new UploadError(`${name}: only images and PDF documents are accepted.`);
        if (f.size > UPLOAD_LIMITS.documentBytes) throw new UploadError(`${name} is larger than 15 MB.`);
        const key = await putFile(newKey("attachments", doc.ext), buf);
        attachments.push({ key, name, mime: f.type, size: f.size });
      }
    }
  } catch (e) {
    if (e instanceof UploadError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }

  const now = new Date();
  const message = await db.message.create({
    data: { conversationId: id, senderId: me.id, body, attachments: { create: attachments } },
    include: { attachments: true },
  });
  await db.conversation.update({
    where: { id },
    data: { lastMessageAt: now, clientArchived: false, proArchived: false, ...(side === "client" ? { clientLastReadAt: now } : { proLastReadAt: now }) },
  });

  const wire: WireMessage = {
    id: message.id,
    body: message.body,
    createdAt: message.createdAt,
    mine: true,
    senderName: me.name,
    attachments: message.attachments.map((a) => ({ id: a.id, name: a.name, mime: a.mime, size: a.size, url: `/files/${a.key}`, width: a.width, height: a.height })),
    nonce,
  };

  // Diffusion immédiate : au destinataire, et aux autres onglets / appareils de l'expéditeur.
  const recipientId = otherUserId(conv, side);
  publish(recipientId, { type: "message", conversationId: id, message: { ...wire, mine: false, nonce: undefined } });
  publish(me.id, { type: "message", conversationId: id, message: wire });
  publish([recipientId, me.id], { type: "conversations" });

  const recipient = await db.user.findUnique({ where: { id: recipientId } });
  if (recipient) {
    await notifyNewMessage({
      conversationId: id,
      senderName: side === "client" ? me.clientProfile?.studioName || me.name : conv.company.name,
      recipient,
      body: body || `Sent ${attachments.length} attachment(s)`,
      subject: conv.subject,
      isNew: false,
    });
  }

  return NextResponse.json({ message: wire }, { status: 201 });
}
