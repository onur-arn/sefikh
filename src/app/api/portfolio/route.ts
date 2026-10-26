import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { embedImage } from "@/lib/clip";
import { UPLOAD_LIMITS } from "@/lib/constants";
import { colorVector, processImage, toBytes, UploadError } from "@/lib/images";
import { formatLimit, getPlan } from "@/lib/plans";
import { rateLimit } from "@/lib/rate-limit";

/** Ajout d'une photo au portfolio : optimisation, vignette, empreintes CLIP + couleur. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.company) return NextResponse.json({ error: "Create your business profile first." }, { status: 403 });
  const rl = rateLimit(`portfolio:${user.id}`, 60, 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many uploads, please wait a moment." }, { status: 429 });

  const limit = getPlan(user.plan).limits.portfolioImages;
  const count = await db.portfolioImage.count({ where: { companyId: user.company.id } });
  if (count >= limit) return NextResponse.json({ error: `Your plan includes ${formatLimit(limit)} portfolio pictures. Upgrade to add more.`, code: "LIMIT" }, { status: 402 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file." }, { status: 400 });
  if (file.size > UPLOAD_LIMITS.imageBytes) return NextResponse.json({ error: `${file.name} is larger than 10 MB.` }, { status: 413 });

  try {
    const img = await processImage(Buffer.from(await file.arrayBuffer()), "portfolio", { maxSize: 2000, thumbSize: 720 });
    const [embedding, colors] = await Promise.all([embedImage(img.buffer), colorVector(img.buffer)]);
    const title = String(form?.get("title") ?? "").trim().slice(0, 120) || file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").slice(0, 120);
    const item = await db.portfolioImage.create({
      data: {
        companyId: user.company.id,
        key: img.key,
        thumbKey: img.thumbKey,
        width: img.width,
        height: img.height,
        title,
        embedding: embedding ? new Uint8Array(toBytes(embedding)) : null,
        colorVector: JSON.stringify(colors),
        position: count,
      },
      select: { id: true, key: true, thumbKey: true, width: true, height: true, title: true, description: true, projectName: true, location: true, year: true, position: true },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    if (e instanceof UploadError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[portfolio]", e);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
