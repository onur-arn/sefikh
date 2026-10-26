import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { Inbox } from "@/components/messages/inbox";

export const metadata: Metadata = { title: "Messages", robots: { index: false } };

export default async function MessagesPage({ searchParams }: PageProps<"/messages">) {
  const user = await requireUser("/messages");
  const { c } = await searchParams;
  return <Inbox initialId={typeof c === "string" ? c : null} me={{ id: user.id, name: user.name, verified: !!user.emailVerifiedAt, role: user.role }} />;
}
