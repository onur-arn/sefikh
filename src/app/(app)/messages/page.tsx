import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { Inbox } from "@/components/messages/inbox";
import { ButtonLink } from "@/components/ui/button";
import { canContactMakers } from "@/lib/messaging";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Messages"), robots: { index: false } };
}

export default async function MessagesPage({ searchParams }: PageProps<"/messages">) {
  const user = await requireUser("/messages");
  const { c } = await searchParams;
  if (!canContactMakers(user)) {
    const tr = await getT();
    return (
      <div className="container-x flex min-h-[60vh] items-center justify-center py-20">
        <div className="max-w-md rounded-[1.5rem] border border-line bg-paper p-10 text-center">
          <h1 className="display text-3xl">{tr("Upgrade to Pro to contact makers.")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">{tr("Names and profiles are reserved for Pro and Studio plans. Choose a plan to discover these makers and contact them.")}</p>
          <ButtonLink href="/pricing" className="mt-6">
            {tr("See plans")}
          </ButtonLink>
        </div>
      </div>
    );
  }
  return <Inbox initialId={typeof c === "string" ? c : null} me={{ id: user.id, name: user.name, verified: !!user.emailVerifiedAt, role: user.role }} />;
}
