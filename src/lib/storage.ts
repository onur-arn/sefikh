import "server-only";
import { mkdir, readFile, unlink, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { randomToken } from "@/lib/auth/crypto";
import { env } from "@/lib/env";

// Stockage disque local. L'interface (put/get/remove) permet de basculer vers S3 / R2 / Vercel Blob
// sans toucher au reste de l'application.

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
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
  return key;
}

export async function getFile(key: string) {
  try {
    const full = resolveKey(key);
    const [data, info] = await Promise.all([readFile(full), stat(full)]);
    return { data, size: info.size, mtime: info.mtime };
  } catch {
    return null;
  }
}

export async function removeFile(key: string | null | undefined) {
  if (!key) return;
  await unlink(resolveKey(key)).catch(() => {});
}

export const MIME_BY_EXT: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  pdf: "application/pdf",
};
