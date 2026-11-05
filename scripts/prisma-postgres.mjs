// Le local reste sur SQLite ; Vercel utilise une copie PostgreSQL du même schéma.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("prisma/schema.prisma", "utf8");
const schema = source.replace(/provider = "sqlite"/, 'provider = "postgresql"');
if (schema === source) throw new Error('provider = "sqlite" introuvable dans prisma/schema.prisma');
mkdirSync("prisma/postgres", { recursive: true });
writeFileSync("prisma/postgres/schema.prisma", schema);
