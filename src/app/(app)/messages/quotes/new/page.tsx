import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getConversationForUser } from "@/lib/messaging";
import { prefilledQuote } from "@/lib/quotes-server";
import { QuoteForm } from "@/components/quotes/quote-form";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("New quote"), robots: { index: false } };
}

export default async function NewQuotePage({ searchParams }: PageProps<"/messages/quotes/new">) {
  const { c } = await searchParams;
  const conversationId = typeof c === "string" ? c : "";
  const user = await requireUser(`/messages/quotes/new?c=${conversationId}`);
  const found = await getConversationForUser(user, conversationId);
  if (!found || found.side !== "pro") notFound();
  const pre = await prefilledQuote(conversationId);
  if (!pre) notFound();
  const tr = await getT();
  return (
    <div className="container-x max-w-5xl py-10 sm:py-14">
      <Link href={`/messages?c=${conversationId}`} className="folio inline-flex items-center gap-1.5 hover:text-ink">
        <ArrowLeft className="size-3.5" /> {tr("Back to the conversation")}
      </Link>
      <h1 className="display mt-8 text-3xl sm:text-4xl">{tr("New quote for {name}", { name: pre.data.client.company })}</h1>
      <p className="mt-3 max-w-2xl text-[14px] text-muted">{tr("Pre-filled from your business profile and the client's profile. Save it as a draft, preview it, then send it: it will appear in the conversation.")}</p>
      <div className="mt-10">
        <QuoteForm conversationId={conversationId} number={pre.nextNumber} initial={pre.data} />
      </div>
    </div>
  );
}
