import "server-only";
import bcrypt from "bcryptjs";

const ROUNDS = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, ROUNDS);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/** Hash factice pour égaliser le temps de réponse quand l'e-mail n'existe pas. */
export const DUMMY_HASH = "$2b$12$jK9UC5dhOrM0SY1VKmPuL.dm/ex9XPCdVPkXF5.Q9yrBK/ht6QUBO";
