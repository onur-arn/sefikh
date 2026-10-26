import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { unreadConversationCount } from "@/lib/messaging";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ messages: 0, notifications: 0 }, { status: 401 });
  const [messages, notifications] = await Promise.all([unreadConversationCount(user), db.notification.count({ where: { userId: user.id, readAt: null } })]);
  return NextResponse.json({ messages, notifications });
}
