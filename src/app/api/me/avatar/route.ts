import { NextResponse } from "next/server";
import sharp from "sharp";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { UPLOAD_LIMITS } from "@/lib/constants";
import { processImage, UploadError } from "@/lib/images";
import { newKey, putFile, removeFile } from "@/lib/storage";

/** Photo de profil (créatif) ou logo (maker), recadrés en carré 512 px. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const kind = form?.get("kind") === "logo" ? "logo" : "avatar";
  if (!(file instanceof File)) return NextResponse.json({ error: "No file." }, { status: 400 });
  if (file.size > UPLOAD_LIMITS.imageBytes) return NextResponse.json({ error: "Image is too large (10 MB max)." }, { status: 413 });
  try {
    const { buffer, key: tmpKey } = await processImage(Buffer.from(await file.arrayBuffer()), "tmp", { maxSize: 1200 });
    await removeFile(tmpKey);
    const square = await sharp(buffer).resize(512, 512, { fit: "cover", position: "attention" }).webp({ quality: 85 }).toBuffer();
    const key = await putFile(newKey(kind === "logo" ? "logos" : "avatars", "webp"), square);
    if (kind === "logo") {
      if (!user.company) return NextResponse.json({ error: "Create your business profile first." }, { status: 400 });
      const c = await db.company.findUnique({ where: { id: user.company.id } });
      await removeFile(c?.logoKey);
      await db.company.update({ where: { id: user.company.id }, data: { logoKey: key } });
    } else {
      await removeFile(user.avatarKey);
      await db.user.update({ where: { id: user.id }, data: { avatarKey: key } });
    }
    return NextResponse.json({ key });
  } catch (e) {
    if (e instanceof UploadError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
