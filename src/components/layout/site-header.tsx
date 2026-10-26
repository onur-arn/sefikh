import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { unreadConversationCount } from "@/lib/messaging";
import { HeaderClient } from "./header-client";

export async function SiteHeader({ variant = "default" }: { variant?: "default" | "overlay" }) {
  const user = await getCurrentUser();
  let unreadMessages = 0;
  let unreadNotifications = 0;
  if (user) {
    [unreadMessages, unreadNotifications] = await Promise.all([
      unreadConversationCount(user),
      db.notification.count({ where: { userId: user.id, readAt: null } }),
    ]);
  }
  return (
    <HeaderClient
      variant={variant}
      user={user ? { name: user.name, role: user.role, avatarKey: user.avatarKey ?? user.company?.logoKey ?? null, plan: user.plan, companySlug: user.company?.slug ?? null } : null}
      initialCounts={{ messages: unreadMessages, notifications: unreadNotifications }}
    />
  );
}
