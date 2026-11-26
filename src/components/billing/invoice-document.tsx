import type { ReactNode } from "react";
import type { Translator } from "@/i18n/config";
import { eur } from "@/lib/quotes";

type Party = { company: string; contact?: string; address: string; vat: string; siret?: string; email: string; phone?: string };

/** Facture d'abonnement au gabarit du modèle SEFIKH (même mise en page que les devis). */
export function InvoiceDocument(props: {
  tr: Translator;
  number: string;
  issuedAt: Date;
  paidAt: Date | null;
  status: string;
  period: { start: Date; end: Date };
  description: string;
  amounts: { ht: number; vat: number; ttc: number };
  vatRate: number;
  seller: Party & { legal: string };
  client: Party;
  simulated: boolean;
}) {
  const { tr, amounts } = props;
  const money = (n: number) => eur(tr.locale, n);
  const date = (d: Date) => tr.date(d, { day: "2-digit", month: "2-digit", year: "numeric" });
  const periodText = tr("From {start} to {end}", { start: date(props.period.start), end: date(props.period.end) });

  return (
    <article id="invoice-sheet" className="quote-sheet mx-auto bg-white text-[12.5px] leading-relaxed text-ink">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-ink pb-5">
        <div>
          <p className="font-display text-[28px] leading-none tracking-[0.18em]">SEFIKH</p>
          <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-brass">Search Engine For Interior Know-How</p>
        </div>
        <div className="text-right">
          <p className="font-display text-[26px] uppercase leading-none tracking-[0.06em]">{tr("Invoice")}</p>
          <p className="mt-1 text-[12px] text-ink-soft">{tr("SEFIKH subscription")}</p>
        </div>
      </header>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 border-b border-line pb-4 sm:grid-cols-4">
        <Meta label={tr("Invoice no.")} value={props.number} />
        <Meta label={tr("Issue date")} value={date(props.issuedAt)} />
        <Meta label={tr("Billing period")} value={periodText} />
        <Meta label={tr("Status")} value={props.status === "PAID" ? tr("Paid") : props.status === "REFUNDED" ? tr("Refunded") : tr("Unpaid")} />
      </dl>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <PartyBlock title={tr("Issuer")} rows={[[tr("Company"), props.seller.company], [tr("Address"), props.seller.address], [tr("SIRET / VAT"), [props.seller.siret, props.seller.vat].filter(Boolean).join(" · ")], [tr("Contact"), props.seller.email]]} />
        <PartyBlock
          title={tr("Billed to")}
          rows={[
            [tr("Company / studio"), props.client.company],
            [tr("Contact person"), props.client.contact ?? ""],
            [tr("Billing"), props.client.address],
            [tr("SIRET / VAT"), props.client.vat],
            [tr("Contact"), [props.client.email, props.client.phone].filter(Boolean).join(" · ")],
          ]}
        />
      </div>

      <section className="mt-7">
        <h2 className="mb-2 font-display text-[17px]">{tr("Details of services")}</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-ink text-left font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted">
              <th className="py-1.5 pr-2 font-normal">{tr("Ref.")}</th>
              <th className="py-1.5 pr-2 font-normal">{tr("Description")}</th>
              <th className="py-1.5 pr-2 text-right font-normal">{tr("Qty")}</th>
              <th className="py-1.5 pr-2 text-right font-normal">{tr("Unit price excl. VAT")}</th>
              <th className="py-1.5 text-right font-normal">{tr("Total excl. VAT")}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line align-top">
              <td className="py-2 pr-2 font-mono text-[11px] text-muted">01</td>
              <td className="py-2 pr-2">
                {tr(props.description)}
                <span className="block text-[11.5px] text-muted">{periodText}</span>
              </td>
              <td className="py-2 pr-2 text-right tabular-nums">1</td>
              <td className="py-2 pr-2 text-right tabular-nums">{money(amounts.ht)}</td>
              <td className="py-2 text-right tabular-nums">{money(amounts.ht)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mt-7">
        <h2 className="mb-2 font-display text-[17px]">{tr("Financial summary")}</h2>
        <table className="ml-auto w-full max-w-sm tabular-nums">
          <tbody>
            <Sum label={tr("Total excl. VAT")} value={money(amounts.ht)} strong />
            <Sum label={tr("VAT ({rate} %)", { rate: tr.number(props.vatRate) })} value={money(amounts.vat)} />
            <tr className="border-t-2 border-ink">
              <td className="pt-2 font-mono text-[11px] uppercase tracking-[0.08em]">{tr("Total incl. VAT")}</td>
              <td className="pt-2 text-right font-display text-[20px] text-brass">{money(amounts.ttc)}</td>
            </tr>
          </tbody>
        </table>
        {props.status === "PAID" && props.paidAt && <p className="mt-3 text-right text-[12px] text-success">{tr("Paid on {date} by card.", { date: date(props.paidAt) })}</p>}
      </section>

      <section className="mt-7 space-y-1.5 text-[11.5px] text-ink-soft">
        <p>{tr("Subscription payable in advance for the period invoiced. No discount for early payment.")}</p>
        <p>{tr("For professional clients, any late payment incurs penalties at three times the legal interest rate and a fixed recovery fee of €40.")}</p>
        {props.simulated && <p className="text-danger">{tr("Demo invoice: simulated payment, no real charge.")}</p>}
      </section>

      <footer className="quote-footer mt-8 border-t border-line pt-3 text-center font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted">
        {[props.seller.company, props.seller.legal].filter(Boolean).join(" · ")} · {tr("Invoice no.")} {props.number}
      </footer>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

function PartyBlock({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="break-inside-avoid border-t border-ink pt-2">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-brass">{title}</p>
      <dl className="mt-2 space-y-0.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="w-28 shrink-0 text-muted">{k} :</dt>
            <dd className="whitespace-pre-line">{v || "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Sum({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <tr className={strong ? "border-t border-ink" : undefined}>
      <td className={`py-1 pr-4 ${strong ? "font-medium" : "text-ink-soft"}`}>{label}</td>
      <td className={`py-1 text-right ${strong ? "font-medium" : ""}`}>{value}</td>
    </tr>
  );
}
