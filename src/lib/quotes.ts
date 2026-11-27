import { z } from "zod";

/**
 * Outil de devis (lot 2) : un artisan établit un devis dans une conversation, au gabarit du modèle
 * « Devis-type-artisan-décorateur ». Le contenu est stocké en JSON dans Quote.data ; les montants sont en euros HT.
 */

export type QuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "DECLINED";
export const INSTALLATION = ["included", "not_included", "optional"] as const;

const text = (max: number) => z.string().trim().max(max).default("");
const num = (min: number, max: number) => z.coerce.number().min(min).max(max).default(0);

const party = z.object({ company: text(160), contact: text(160), address: text(300), siret: text(60), email: text(160), phone: text(60) });

export const quoteSchema = z.object({
  subtitle: text(160),
  issueDate: text(10),
  validUntil: text(10),
  issuer: party,
  client: party,
  project: z.object({ ref: text(80), name: text(200), location: text(160), deliveryAddress: text(300), desiredDelivery: text(10), brief: text(2000) }),
  lines: z
    .array(z.object({ designation: text(500), qty: num(0, 1_000_000), unit: text(30), unitPrice: num(0, 100_000_000) }))
    .max(60)
    .default([]),
  options: z.array(z.object({ label: text(300), priceImpact: num(-100_000_000, 100_000_000), delay: text(60) })).max(20).default([]),
  discountPct: num(0, 100),
  packaging: num(0, 100_000_000),
  transport: num(0, 100_000_000),
  incoterm: text(40),
  vatRate: num(0, 100),
  validationDays: text(20),
  productionWeeks: text(20),
  deliveryWeeks: text(20),
  installation: z.enum(INSTALLATION).default("not_included"),
  payments: z.array(z.object({ label: text(160), pct: num(0, 100) })).max(6).default([]),
  paymentDays: text(20),
  iban: text(80),
  bic: text(20),
  latePenaltyPct: text(20),
  toleranceMm: text(20),
  receptionDays: text(20),
  warrantyMonths: text(20),
  law: text(60),
  courtCity: text(80),
  notes: text(3000),
});

export type QuoteData = z.infer<typeof quoteSchema>;
export type QuoteLine = QuoteData["lines"][number];

const round = (n: number) => Math.round(n * 100) / 100;

export function quoteTotals(d: Pick<QuoteData, "lines" | "discountPct" | "packaging" | "transport" | "vatRate" | "payments">) {
  const lineTotals = d.lines.map((l) => round(l.qty * l.unitPrice));
  const subtotal = round(lineTotals.reduce((a, b) => a + b, 0));
  const discount = round((subtotal * d.discountPct) / 100);
  const totalHt = round(subtotal - discount + d.packaging + d.transport);
  const vat = round((totalHt * d.vatRate) / 100);
  const totalTtc = round(totalHt + vat);
  const payments = d.payments.map((p) => ({ ...p, amount: round((totalTtc * p.pct) / 100) }));
  return { lineTotals, subtotal, discount, totalHt, vat, totalTtc, payments, paymentPctSum: d.payments.reduce((a, p) => a + p.pct, 0) };
}

export function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Textes par défaut du modèle (clés anglaises, traduites à l'affichage). */
const DEFAULT_SUBTITLE = { subtitle: "Custom manufacturing and supply" };
const DEFAULT_PAYMENTS = [
  { label: "On order (signed quote)", pct: 0 },
  { label: "On approval of end of production", pct: 0 },
  { label: "Before shipment / on delivery", pct: 0 },
];

/** Valeurs par défaut du modèle : échéancier à compléter (0 %), TVA 20 %, validité 30 jours. */
export function defaultQuote(prefill: { issuer: Partial<QuoteData["issuer"]>; client: Partial<QuoteData["client"]>; project: Partial<QuoteData["project"]> }): QuoteData {
  const now = new Date();
  return quoteSchema.parse({
    subtitle: DEFAULT_SUBTITLE.subtitle,
    issueDate: isoDate(now),
    validUntil: isoDate(new Date(now.getTime() + 30 * 86400_000)),
    issuer: prefill.issuer,
    client: prefill.client,
    project: prefill.project,
    lines: [{ designation: "", qty: 1, unit: "piece", unitPrice: 0 }],
    options: [],
    vatRate: 20,
    incoterm: "DAP",
    payments: DEFAULT_PAYMENTS,
    paymentDays: "30",
    latePenaltyPct: "10",
    receptionDays: "8",
    warrantyMonths: "12",
    law: "French",
    installation: "not_included",
  });
}

export function parseQuoteData(json: string): QuoteData {
  return quoteSchema.parse(JSON.parse(json));
}

/** Prochain numéro DEV-AAAA-NNN pour cet atelier. */
export function formatQuoteNumber(year: number, seq: number) {
  return `DEV-${year}-${String(seq).padStart(3, "0")}`;
}

/** Montant en euros, toujours avec centimes (format du modèle : « 0,00 € »). */
export function eur(locale: string, n: number) {
  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : locale, { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

/** Mention légale de la plateforme en pied de devis (renseignée par variable d'environnement, sinon nom seul). */
export function platformLegal() {
  return process.env.QUOTE_PLATFORM_LEGAL?.trim() || "";
}
