import "server-only";
import { db } from "@/lib/db";

export type NotificationType = "MESSAGE" | "CONTACT_REQUEST" | "BILLING" | "SYSTEM";

export function notify(userId: string, data: { type: NotificationType; title: string; body?: string; link?: string }) {
  return db.notification.create({ data: { userId, ...data } });
}
