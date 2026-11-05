import "server-only";
import { mkdir, readFile, unlink, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { del, get, put } from "@vercel/blob";
import { randomToken } from "@/lib/auth/crypto";
import { env } from "@/lib/env";

// Stockage disque en local, Vercel Blob (magasin privé) dès que BLOB_READ_WRITE_TOKEN est défini.
// Tous les fichiers passent par la route /files, qui applique les contrôles d'accès.

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

const root = path.resolve(process.cwd(), env.storageDir);

/** Préfixes publics (servis sans contrôle d'accès). */
export const PUBLIC_PREFIXES = ["portfolio/", "avatars/", "covers/", "logos/"];

export function isPublicKey(key: string) {
  return PUBLIC_PREFIXES.some((p) => key.startsWith(p));
}

function resolveKey(key: string) {
  const full = path.resolve(root, key);
  if (!full.startsWith(root + path.sep)) throw new Error("Invalid storage key");
  return full;
}

export function newKey(prefix: string, ext: string) {
  const d = new Date();
  return `${prefix}/${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}/${randomToken(12)}.${ext}`;
}

export async function putFile(key: string, data: Buffer) {
  const full = resolveKey(key);
  if (useBlob) {
    await put(key, data, { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: MIME_BY_EXT[key.split(".").pop()!.toLowerCase()] });
    return key;
  }
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
  return key;
}

export async function getFile(key: string) {
  try {
    const full = resolveKey(key);
    if (useBlob) {
      const blob = await get(key, { access: "private" });
      if (!blob || blob.statusCode !== 200) return null;
      const data = Buffer.from(await new Response(blob.stream).arrayBuffer());
      return { data, size: data.length, mtime: blob.blob.uploadedAt };
    }
    const [data, info] = await Promise.all([readFile(full), stat(full)]);
    return { data, size: info.size, mtime: info.mtime };
  } catch {
    return null;
  }
}

export async function removeFile(key: string | null | undefined) {
  if (!key) return;
  const full = resolveKey(key);
  await (useBlob ? del(key) : unlink(full)).catch(() => {});
}

export const MIME_BY_EXT: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  pdf: "application/pdf",
};
