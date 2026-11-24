// Copie tous les fichiers du magasin Vercel Blob vers le disque du serveur (mêmes clés).
// Usage (sur le serveur, depuis /srv/sefikh/app) :
//   BLOB_READ_WRITE_TOKEN=… STORAGE_DIR=/srv/sefikh/storage node deploy/migrate-blobs.mjs
import { mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { get, list } from "@vercel/blob";

const root = path.resolve(process.env.STORAGE_DIR ?? "/srv/sefikh/storage");
let cursor, copied = 0, skipped = 0;
do {
  const page = await list({ cursor, limit: 1000 });
  for (const b of page.blobs) {
    const dest = path.join(root, b.pathname);
    if (await stat(dest).then((s) => s.size === b.size).catch(() => false)) { skipped++; continue; }
    const res = await get(b.pathname, { access: "private" });
    if (!res || res.statusCode !== 200) { console.error("échec", b.pathname); continue; }
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, Buffer.from(await new Response(res.stream).arrayBuffer()));
    copied++;
  }
  cursor = page.cursor;
} while (cursor);
console.log(`Fichiers copiés : ${copied}, déjà présents : ${skipped}`);
