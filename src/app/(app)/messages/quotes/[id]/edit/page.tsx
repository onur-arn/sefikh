import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getQuoteForUser } from "@/lib/quotes-server";
import { parseQuoteData } from "@/lib/quotes";
import { QuoteForm } from "@/components/quotes/quote-form";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Edit quote"), robots: { index: false } };
}

export default async function EditQuotePage({ params }: PageProps<"/messages/quotes/[id]/edit">) {
  const { id } = await params;
  const user = await requireUser(`/messages/quotes/${id}/edit`);
  const found = await getQuoteForUser(user, id);
  if (!found || found.side !== "pro") notFound();
  if (found.quote.status !== "DRAFT") redirect(`/messages/quotes/${id}`);
  const tr = await getT();
  const data = parseQuoteData(found.quote.data);
  return (
    <div className="container-x max-w-5xl py-10 sm:py-14">
      <Link href={`/messages/quotes/${id}`} className="folio inline-flex items-center gap-1.5 hover:text-ink">
        <ArrowLeft className="size-3.5" /> {tr("Back to the quote")}
      </Link>
      <p className="kicker mt-8">{tr("Quote")}</p>
      <h1 className="display mt-3 text-3xl sm:text-4xl">{tr("Quote {number}", { number: found.quote.number })}</h1>
      <div className="mt-10">
        <QuoteForm conversationId={found.quote.conversationId} quoteId={id} number={found.quote.number} initial={data} />
      </div>
    </div>
  );
}
