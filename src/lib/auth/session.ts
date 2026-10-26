import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { randomToken, sha256 } from "./crypto";

export const SESSION_COOKIE = "sefikh_session";
const SESSION_DAYS = 30;
const REFRESH_AFTER_DAYS = 1;

export async function createSession(userId: string) {
  const token = randomToken();
  const h = await headers();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.session.create({
    data: {
      tokenHash: sha256(token),
      userId,
      expiresAt,
      userAgent: h.get("user-agent")?.slice(0, 255) ?? null,
      ip: (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? null)?.trim() || null,
    },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Utilisateur de la requête courante (mémoïsé pour le rendu). */
export const getCurrentUser = cache(async () => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { include: { company: { select: { id: true, slug: true, name: true, published: true, logoKey: true } }, clientProfile: { select: { studioName: true } } } } },
  });
  if (!session || session.expiresAt < new Date()) return null;

  // Prolongation glissante + présence (au plus une écriture par jour / par minute).
  const now = Date.now();
  if (now - session.lastUsedAt.getTime() > REFRESH_AFTER_DAYS * 86400_000) {
    await db.session.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date(), expiresAt: new Date(now + SESSION_DAYS * 86400_000) },
    });
  }
  if (!session.user.lastSeenAt || now - session.user.lastSeenAt.getTime() > 60_000) {
    await db.user.update({ where: { id: session.user.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
  }
  return { ...session.user, sessionId: session.id };
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(next?: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return user;
}

export async function requireRole(role: "CLIENT" | "PRO", next?: string) {
  const user = await requireUser(next);
  if (user.role !== role && user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: sha256(token) } });
  jar.delete(SESSION_COOKIE);
}

export async function destroyOtherSessions(userId: string, keepSessionId: string) {
  await db.session.deleteMany({ where: { userId, NOT: { id: keepSessionId } } });
}
