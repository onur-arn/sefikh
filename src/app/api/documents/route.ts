import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { UPLOAD_LIMITS } from "@/lib/constants";
import { processImage, UploadError } from "@/lib/images";
import { rateLimit } from "@/lib/rate-limit";
import { newKey, putFile } from "@/lib/storage";

const STORAGE_QUOTA = 500 * 1024 * 1024; // 500 Mo par compte

/** Documents « cloud » (moodboards, plans, devis) — images ré-encodées, PDF vérifiés. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rl = rateLimit(`docs:${user.id}`, 40, 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many uploads." }, { status: 429 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const projectId = form?.get("projectId");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file." }, { status: 400 });
  if (file.size > UPLOAD_LIMITS.documentBytes) return NextResponse.json({ error: "File is larger than 15 MB." }, { status: 413 });

  const used = await db.document.aggregate({ where: { ownerId: user.id }, _sum: { size: true } });
  if ((used._sum.size ?? 0) + file.size > STORAGE_QUOTA) return NextResponse.json({ error: "Storage quota reached (500 MB)." }, { status: 413 });

  const project = typeof projectId === "string" && projectId ? await db.project.findFirst({ where: { id: projectId, ownerId: user.id } }) : null;
  const name = file.name.replace(/[^\w.\- ()]/g, "_").slice(0, 120) || "document";
  const buf = Buffer.from(await file.arrayBuffer());
  try {
    let key: string;
    let mime = file.type;
    let size = file.size;
    if (file.type.startsWith("image/")) {
      const img = await processImage(buf, "documents", { maxSize: 2600 });
      key = img.key;
      mime = "image/webp";
      size = img.buffer.length;
    } else if (file.type === "application/pdf" && buf.subarray(0, 4).toString() === "%PDF") {
      key = await putFile(newKey("documents", "pdf"), buf);
    } else {
      return NextResponse.json({ error: "Only images and PDF documents are accepted." }, { status: 400 });
    }
    const doc = await db.document.create({ data: { ownerId: user.id, projectId: project?.id ?? null, key, name, mime, size } });
    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (e) {
    if (e instanceof UploadError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
