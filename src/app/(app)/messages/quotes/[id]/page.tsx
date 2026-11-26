import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getQuoteForUser } from "@/lib/quotes-server";
import { parseQuoteData, platformLegal, type QuoteStatus } from "@/lib/quotes";
import { QuoteDocument } from "@/components/quotes/quote-document";
import { QuoteResponse } from "@/components/quotes/quote-response";
import { PdfButtons } from "@/components/ui/pdf-buttons";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { deleteDraftAction, duplicateQuoteAction } from "../actions";
import { getT } from "@/i18n/server";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Quote"), robots: { index: false } };
}

const STATUS: Record<QuoteStatus, { label: string; tone: string }> = {
  DRAFT: { label: "Draft", tone: "border-line text-muted" },
  SENT: { label: "Awaiting response", tone: "border-brass/50 text-brass" },
  ACCEPTED: { label: "Accepted", tone: "border-success/50 text-success" },
  DECLINED: { label: "Declined", tone: "border-danger/50 text-danger" },
};

export default async function QuotePage({ params }: PageProps<"/messages/quotes/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/messages/quotes/${id}`);
  const found = await getQuoteForUser(user, id);
  if (!found) notFound();
  const { quote, side } = found;
  const tr = await getT();
  const data = parseQuoteData(quote.data);
  const status = STATUS[quote.status as QuoteStatus] ?? STATUS.DRAFT;
  const expired = quote.status === "SENT" && data.validUntil && data.validUntil < new Date().toISOString().slice(0, 10);

  return (
    <div className="quote-page bg-paper py-8 sm:py-12">
      <div className="container-x max-w-[230mm] print:hidden">
        <Link href={`/messages?c=${quote.conversationId}`} className="folio inline-flex items-center gap-1.5 hover:text-ink">
          <ArrowLeft className="size-3.5" /> {tr("Back to the conversation")}
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <h1 className="display mr-auto text-3xl">{tr("Quote {number}", { number: quote.number })}</h1>
          <span className={cn("border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em]", status.tone)}>{quote.status === "ACCEPTED" ? tr("Accepted") : quote.status === "DECLINED" ? tr("Declined") : quote.status === "SENT" ? tr("Awaiting response") : tr("Draft")}</span>
        </div>
        {quote.status === "DECLINED" && quote.declineReason && <p className="mt-3 text-[14px] text-ink-soft">{tr("Reason given: {reason}", { reason: quote.declineReason })}</p>}
        {expired && <p className="mt-3 text-[14px] text-danger">{tr("The validity date of this quote has passed.")}</p>}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <PdfButtons targetId="quote-sheet" filename={`SEFIKH-${quote.number}.pdf`} href={`/api/quotes/${id}/pdf`} />
          {side === "pro" && quote.status === "DRAFT" && (
            <>
              <ButtonLink href={`/messages/quotes/${id}/edit`} variant="secondary" size="sm" className="h-10">
                {tr("Edit")}
              </ButtonLink>
              <form action={deleteDraftAction}>
                <input type="hidden" name="quoteId" value={id} />
                <button className={buttonClass("ghost", "sm", "h-10 text-danger")}>{tr("Delete draft")}</button>
              </form>
            </>
          )}
          {side === "pro" && quote.status !== "DRAFT" && (
            <form action={duplicateQuoteAction}>
              <input type="hidden" name="quoteId" value={id} />
              <button className={buttonClass("secondary", "sm", "h-10")}>{tr("New version")}</button>
            </form>
          )}
        </div>
        {side === "pro" && quote.status === "DRAFT" && <p className="mt-3 text-[13px] text-muted">{tr("Only you can see this draft. Edit it, then send it to the client from the edit page.")}</p>}
        {side === "client" && quote.status === "SENT" && (
          <div className="mt-8">
            <QuoteResponse quoteId={id} defaultName={user.name} />
          </div>
        )}
      </div>

      <div className="mt-8 overflow-x-auto px-4 print:mt-0 print:overflow-visible print:px-0">
        <QuoteDocument number={quote.number} data={data} tr={tr} platformLegal={platformLegal()} accepted={quote.status === "ACCEPTED" && quote.respondedAt ? { name: quote.acceptedName ?? "", at: quote.respondedAt } : null} />
      </div>
    </div>
  );
}
