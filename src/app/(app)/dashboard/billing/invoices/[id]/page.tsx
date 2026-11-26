import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { billingParty, ensureInvoiceNumber, INVOICE_VAT_RATE, invoiceAmounts, invoicePeriod, seller } from "@/lib/invoices";
import { InvoiceDocument } from "@/components/billing/invoice-document";
import { PdfButtons } from "@/components/ui/pdf-buttons";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Invoice"), robots: { index: false } };
}

export default async function InvoicePage({ params }: PageProps<"/dashboard/billing/invoices/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/dashboard/billing/invoices/${id}`);
  const payment = await db.payment.findFirst({ where: { id, userId: user.id } });
  if (!payment || payment.status === "FAILED") notFound();
  const [tr, number, client] = await Promise.all([getT(), ensureInvoiceNumber(payment), billingParty(user.id)]);
  const s = seller();

  return (
    <div className="quote-page">
      <div className="print:hidden">
        <Link href="/dashboard/billing" className="folio inline-flex items-center gap-1.5 hover:text-ink">
          <ArrowLeft className="size-3.5" /> {tr("Plan & billing")}
        </Link>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <h1 className="display text-3xl">{tr("Invoice {number}", { number })}</h1>
          <PdfButtons targetId="invoice-sheet" filename={`SEFIKH-${number}.pdf`} href={`/api/invoices/${id}/pdf`} />
        </div>
        <p className="mt-2 text-[13px] text-muted">
          {tr("Billing details can be changed on the Plan & billing page.")}
        </p>
      </div>
      <div className="mt-8 overflow-x-auto print:mt-0 print:overflow-visible">
        <InvoiceDocument
          tr={tr}
          number={number}
          issuedAt={payment.createdAt}
          paidAt={payment.status === "PAID" ? payment.createdAt : null}
          status={payment.status}
          period={invoicePeriod(payment)}
          description={payment.description ?? "SEFIKH subscription"}
          amounts={invoiceAmounts(payment.amount)}
          vatRate={INVOICE_VAT_RATE}
          seller={{ company: s.name, address: s.address, siret: s.siret, vat: s.vat, email: s.email, legal: s.legal }}
          client={client}
          simulated={!payment.stripeInvoiceId}
        />
      </div>
    </div>
  );
}
