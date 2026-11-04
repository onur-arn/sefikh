import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { embedImage } from "@/lib/clip";
import { UPLOAD_LIMITS } from "@/lib/constants";
import { db } from "@/lib/db";
import { colorVector, processImage, toBytes, UploadError } from "@/lib/images";
import { getPlan } from "@/lib/plans";
import { rateLimit } from "@/lib/rate-limit";
import { searchesUsed } from "@/lib/search";
import { visitorId } from "@/lib/visitor";

/**
 * Recherche par image — étape 1 : réception de l'image, calcul de son empreinte (CLIP + couleur)
 * et création d'une recherche. Le client est ensuite redirigé vers /search?image=<id>.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const vid = await visitorId();
  const rl = rateLimit(`imgsearch:${user.id}`, 20, 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many searches, please wait a moment." }, { status: 429 });

  // Quota du compte, partagé avec les autres modes.
  const limit = getPlan(user.plan).limits.freeSearches;
  if (Number.isFinite(limit) && (await searchesUsed(user.id)) >= limit) {
    return NextResponse.json({ error: "You've used your free searches", code: "LIMIT" }, { status: 402 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof File)) return NextResponse.json({ error: "Please attach an image." }, { status: 400 });
  if (file.size > UPLOAD_LIMITS.imageBytes) return NextResponse.json({ error: "Image is too large (10 MB max)." }, { status: 413 });

  try {
    const img = await processImage(Buffer.from(await file.arrayBuffer()), "queries", { maxSize: 900 });
    const [embedding, colors] = await Promise.all([embedImage(img.buffer), colorVector(img.buffer)]);
    const log = await db.searchLog.create({
      data: {
        userId: user.id,
        visitorId: vid,
        mode: "IMAGE",
        imageKey: img.key,
        embedding: embedding ? new Uint8Array(toBytes(embedding)) : null,
        // Repli couleur stocké dans `query` quand CLIP est indisponible.
        query: embedding ? null : JSON.stringify(colors),
      },
    });
    return NextResponse.json({ id: log.id });
  } catch (e) {
    if (e instanceof UploadError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[search/image]", e);
    return NextResponse.json({ error: "Image search failed. Please try again." }, { status: 500 });
  }
}
