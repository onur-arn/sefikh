import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { billingParty, ensureInvoiceNumber, INVOICE_VAT_RATE, invoiceAmounts, invoicePeriod, seller } from "@/lib/invoices";
import { pdfResponse } from "@/lib/pdf/kit";
import { InvoicePdf } from "@/lib/pdf/invoice";
import { getT } from "@/i18n/server";

/** Facture d'abonnement en PDF « vrai texte » (net, sélectionnable). Réservée à l'abonné concerné. */
export async function GET(_: Request, ctx: RouteContext<"/api/invoices/[id]/pdf">) {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const payment = await db.payment.findFirst({ where: { id, userId: me.id } });
  if (!payment || payment.status === "FAILED") return new Response("Not found", { status: 404 });
  const [tr, number, client] = await Promise.all([getT(), ensureInvoiceNumber(payment), billingParty(me.id)]);
  const sl = seller();
  return pdfResponse(
    InvoicePdf({
      tr,
      number,
      issuedAt: payment.createdAt,
      paidAt: payment.status === "PAID" ? payment.createdAt : null,
      status: payment.status,
      period: invoicePeriod(payment),
      description: payment.description ?? "SEFIKH subscription",
      amounts: invoiceAmounts(payment.amount),
      vatRate: INVOICE_VAT_RATE,
      seller: { company: sl.name, address: sl.address, siret: sl.siret, vat: sl.vat, email: sl.email, legal: sl.legal },
      client,
      simulated: !payment.stripeInvoiceId,
    }),
    `SEFIKH-${number}.pdf`,
    `${tr("Invoice")} ${number}`,
  );
}
