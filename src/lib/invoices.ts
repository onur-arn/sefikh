import "server-only";
import { db } from "@/lib/db";

/**
 * Factures d'abonnement SEFIKH (gabarit du modèle « Devis-type-artisan-décorateur »).
 * Les montants des paiements sont TTC, en centimes ; la TVA française (20 %) est extraite du TTC.
 */

export const INVOICE_VAT_RATE = 20;

/** Vendeur : la société qui édite SEFIKH. Mentions légales renseignées par variables d'environnement. */
export function seller() {
  const env = (k: string) => process.env[k]?.trim() || "";
  return {
    name: env("INVOICE_SELLER_NAME") || "SEFIKH",
    address: env("INVOICE_SELLER_ADDRESS"),
    siret: env("INVOICE_SELLER_SIRET"),
    vat: env("INVOICE_SELLER_VAT"),
    email: env("INVOICE_SELLER_EMAIL") || process.env.CONTACT_INBOX || "contact@sefikh.com",
    legal: env("INVOICE_SELLER_LEGAL"), // ex. « SAS 4S au capital de 1 000 € · RCS Caen 000 000 000 »
  };
}

/**
 * Numéro séquentiel FAC-AAAA-NNNN, attribué une seule fois et dans l'ordre chronologique des paiements :
 * les paiements plus anciens encore sans numéro (tous comptes confondus) sont numérotés d'abord.
 */
export async function ensureInvoiceNumber(payment: { id: string; invoiceNumber: string | null; createdAt: Date }) {
  if (payment.invoiceNumber) return payment.invoiceNumber;
  const older = await db.payment.findMany({
    where: { invoiceNumber: null, status: { not: "FAILED" }, createdAt: { lte: payment.createdAt }, id: { not: payment.id } },
    orderBy: { createdAt: "asc" },
    select: { id: true, createdAt: true },
  });
  for (const o of older) await assignNumber(o);
  return assignNumber(payment);
}

async function assignNumber(payment: { id: string; createdAt: Date }) {
  const year = payment.createdAt.getFullYear();
  const counter = await db.invoiceCounter.upsert({ where: { year }, create: { year, last: 1 }, update: { last: { increment: 1 } } });
  const number = `FAC-${year}-${String(counter.last).padStart(4, "0")}`;
  // Ne remplace jamais un numéro attribué entre-temps par une autre requête.
  const updated = await db.payment.updateMany({ where: { id: payment.id, invoiceNumber: null }, data: { invoiceNumber: number } });
  if (updated.count === 0) return (await db.payment.findUnique({ where: { id: payment.id }, select: { invoiceNumber: true } }))!.invoiceNumber!;
  return number;
}

const join = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(", ");

/** Coordonnées de facturation de l'abonné : saisies dans « Offre et facturation », sinon reprises du profil. */
export async function billingParty(userId: string) {
  const u = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      billingCompany: true,
      billingAddress: true,
      billingVat: true,
      clientProfile: { select: { studioName: true, phone: true, street: true, street2: true, city: true, region: true, country: true } },
      company: { select: { name: true, phone: true, street: true, street2: true, city: true, region: true, country: true } },
    },
  });
  const p = u.company ?? u.clientProfile;
  const profileCompany = u.company?.name ?? u.clientProfile?.studioName ?? "";
  return {
    company: u.billingCompany || profileCompany || u.name,
    contact: u.name,
    address: u.billingAddress || join(p?.street, p?.street2, p?.city, p?.region, p?.country),
    vat: u.billingVat ?? "",
    email: u.email,
    phone: p?.phone ?? "",
    defaults: { company: profileCompany || u.name, address: join(p?.street, p?.street2, p?.city, p?.region, p?.country) },
  };
}

export function invoiceAmounts(amountCents: number, vatRate = INVOICE_VAT_RATE) {
  const ttc = amountCents / 100;
  const ht = Math.round((ttc / (1 + vatRate / 100)) * 100) / 100;
  return { ht, vat: Math.round((ttc - ht) * 100) / 100, ttc };
}

/** Période facturée : enregistrée avec le paiement, sinon un mois (ou un an pour un paiement annuel) à partir de la date de paiement. */
export function invoicePeriod(p: { createdAt: Date; periodStart: Date | null; periodEnd: Date | null; description: string | null }) {
  const start = p.periodStart ?? p.createdAt;
  if (p.periodEnd) return { start, end: p.periodEnd };
  const end = new Date(start);
  end.setMonth(end.getMonth() + (/year|annual|an\b|année|anno|año|年/i.test(p.description ?? "") ? 12 : 1));
  return { start, end };
}
