import "server-only";
import sharp, { type Metadata } from "sharp";
import { newKey, putFile } from "@/lib/storage";

export class UploadError extends Error {}

const MAX_PIXELS = 60_000_000;

/**
 * Valide (par décodage réel, pas par l'extension), redimensionne, supprime les métadonnées EXIF
 * et ré-encode en WebP. Renvoie la clé principale + vignette et les dimensions.
 */
export async function processImage(input: Buffer, prefix: string, opts: { maxSize?: number; thumbSize?: number } = {}) {
  const maxSize = opts.maxSize ?? 2000;
  let meta: Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: MAX_PIXELS }).metadata();
  } catch {
    throw new UploadError("This file is not a valid image.");
  }
  if (!meta.format || !["jpeg", "png", "webp", "avif", "heif", "gif", "tiff"].includes(meta.format)) {
    throw new UploadError("Unsupported image format. Use JPG, PNG, WebP or HEIC.");
  }
  const base = sharp(input, { limitInputPixels: MAX_PIXELS }).rotate(); // applique l'orientation EXIF puis la retire
  const { data, info } = await base
    .clone()
    .resize({ width: maxSize, height: maxSize, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  const key = await putFile(newKey(prefix, "webp"), data);

  let thumbKey: string | null = null;
  if (opts.thumbSize) {
    const thumb = await base.clone().resize({ width: opts.thumbSize, height: opts.thumbSize, fit: "inside" }).webp({ quality: 75 }).toBuffer();
    thumbKey = await putFile(newKey(prefix, "webp"), thumb);
  }
  return { key, thumbKey, width: info.width, height: info.height, buffer: data };
}

/**
 * Empreinte couleur 4×4×4 (64 cases, espace RGB) + luminance moyenne : repli rapide
 * pour la similarité visuelle quand le modèle CLIP n'est pas disponible.
 */
export async function colorVector(input: Buffer): Promise<number[]> {
  const { data } = await sharp(input).resize(48, 48, { fit: "cover" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const bins = new Array(64).fill(0);
  const n = data.length / 3;
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i]! >> 6, g = data[i + 1]! >> 6, b = data[i + 2]! >> 6;
    bins[r * 16 + g * 4 + b] += 1;
  }
  return bins.map((v) => Math.sqrt(v / n));
}

export function cosine(a: ArrayLike<number>, b: ArrayLike<number>) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

export function toBytes(vec: Float32Array) {
  return Buffer.from(vec.buffer, vec.byteOffset, vec.byteLength);
}

export function fromBytes(bytes: Uint8Array | Buffer | null | undefined) {
  if (!bytes || bytes.byteLength === 0) return null;
  const copy = new Uint8Array(bytes); // alignement garanti
  return new Float32Array(copy.buffer, 0, copy.byteLength / 4);
}
