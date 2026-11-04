import "server-only";
import { db } from "@/lib/db";
import { publish } from "@/lib/realtime";

export type NotificationType = "MESSAGE" | "CONTACT_REQUEST" | "BILLING" | "SYSTEM";

export async function notify(userId: string, data: { type: NotificationType; title: string; body?: string; link?: string }) {
  const notification = await db.notification.create({ data: { userId, ...data } });
  publish(userId, { type: "counts" });
  return notification;
}
