import "server-only";
import { db } from "@/lib/db";
import { randomToken, sha256 } from "./crypto";

export type TokenType = "VERIFY_EMAIL" | "RESET_PASSWORD";

const TTL: Record<TokenType, number> = {
  VERIFY_EMAIL: 48 * 3600_000,
  RESET_PASSWORD: 60 * 60_000,
};

/** Crée un jeton à usage unique (seul son hash est stocké) et invalide les précédents. */
export async function issueToken(userId: string, type: TokenType) {
  const token = randomToken();
  await db.authToken.deleteMany({ where: { userId, type, usedAt: null } });
  await db.authToken.create({
    data: { userId, type, tokenHash: sha256(token), expiresAt: new Date(Date.now() + TTL[type]) },
  });
  return token;
}

/** Vérifie et consomme un jeton ; renvoie l'id utilisateur ou null. */
export async function consumeToken(token: string, type: TokenType) {
  const row = await db.authToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (!row || row.type !== type || row.usedAt || row.expiresAt < new Date()) return null;
  const { count } = await db.authToken.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } });
  return count === 1 ? row.userId : null;
}

export async function peekToken(token: string, type: TokenType) {
  const row = await db.authToken.findUnique({ where: { tokenHash: sha256(token) } });
  return !!row && row.type === type && !row.usedAt && row.expiresAt > new Date();
}
