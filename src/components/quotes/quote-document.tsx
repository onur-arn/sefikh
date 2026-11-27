import type { ReactNode } from "react";
import type { Translator } from "@/i18n/config";
import { eur, quoteTotals, type QuoteData } from "@/lib/quotes";

/**
 * Devis au gabarit du modèle « Devis-type-artisan-décorateur » : feuille A4, imprimable en PDF (window.print).
 * Les champs vides restent des lignes à compléter, comme sur le modèle papier.
 */
export function QuoteDocument({ number, data, tr, platformLegal, accepted }: { number: string; data: QuoteData; tr: Translator; platformLegal: string; accepted?: { name: string; at: Date } | null }) {
  const t = quoteTotals(data);
  const money = (n: number) => eur(tr.locale, n);
  const date = (iso: string) => (iso ? tr.date(iso, { day: "2-digit", month: "2-digit", year: "numeric" }) : "—");
  const v = (s: string | number | undefined | null) => (s === "" || s === null || s === undefined ? "—" : s);
  const footer = [tr("Quote issued via SEFIKH"), platformLegal].filter(Boolean).join(" · ");
  const ref = (i: number) => String(i + 1).padStart(2, "0");
  const installation = { included: tr("included"), not_included: tr("not included"), optional: tr("optional") }[data.installation];

  return (
    <article id="quote-sheet" className="quote-sheet mx-auto bg-white text-[12.5px] leading-relaxed text-ink">
      {/* En-tête */}
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-ink pb-5">
        <div>
          <p className="font-display text-[28px] leading-none tracking-[0.18em]">SEFIKH</p>
          <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-brass">Search Engine For Interior Know-How</p>
        </div>
        <div className="text-right">
          <p className="font-display text-[26px] uppercase leading-none tracking-[0.06em]">{tr("Quote")}</p>
          <p className="mt-1 text-[12px] text-ink-soft">{tr(data.subtitle) || "—"}</p>
        </div>
      </header>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 border-b border-line pb-4 sm:grid-cols-4">
        <Meta label={tr("Quote no.")} value={number} />
        <Meta label={tr("Issue date")} value={date(data.issueDate)} />
        <Meta label={tr("Valid until")} value={date(data.validUntil)} />
        <Meta label={tr("Project reference")} value={v(data.project.ref)} />
      </dl>

      {/* Parties */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Party title={tr("Issuer · Manufacturer / artisan")} p={data.issuer} tr={tr} companyLabel={tr("Company")} />
        <Party title={tr("Client · Decorator / interior architect")} p={data.client} tr={tr} companyLabel={tr("Company / studio")} addressLabel={tr("Billing")} />
      </div>

      {/* Projet */}
      <Section title={tr("Project")}>
        <table className="w-full">
          <tbody>
            <Row label={tr("Project name")} value={v(data.project.name)} />
            <Row label={tr("Location")} value={v(data.project.location)} />
            <Row label={tr("Delivery / site address")} value={v(data.project.deliveryAddress)} />
            <Row label={tr("Requested delivery")} value={date(data.project.desiredDelivery)} />
            <Row label={tr("Brief summary")} value={<span className="whitespace-pre-line">{v(data.project.brief)}</span>} />
          </tbody>
        </table>
      </Section>

      {/* Prestations */}
      <Section title={tr("Details of services")}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-ink text-left font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted">
              <th className="py-1.5 pr-2 font-normal">{tr("Ref.")}</th>
              <th className="py-1.5 pr-2 font-normal">{tr("Description (materials, dimensions, finishes)")}</th>
              <th className="py-1.5 pr-2 text-right font-normal">{tr("Qty")}</th>
              <th className="py-1.5 pr-2 font-normal">{tr("Unit")}</th>
              <th className="py-1.5 pr-2 text-right font-normal">{tr("Unit price excl. VAT")}</th>
              <th className="py-1.5 text-right font-normal">{tr("Total excl. VAT")}</th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((l, i) => (
              <tr key={i} className="break-inside-avoid border-b border-line align-top">
                <td className="py-2 pr-2 font-mono text-[11px] text-muted">{ref(i)}</td>
                <td className="whitespace-pre-line py-2 pr-2">{v(l.designation)}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{tr.number(l.qty)}</td>
                <td className="py-2 pr-2">{tr(l.unit)}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{money(l.unitPrice)}</td>
                <td className="py-2 text-right tabular-nums">{money(t.lineTotals[i] ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {data.options.length > 0 && (
        <Section title={tr("Proposed options and variants")}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink text-left font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted">
                <th className="py-1.5 pr-2 font-normal">{tr("Ref.")}</th>
                <th className="py-1.5 pr-2 font-normal">{tr("Option")}</th>
                <th className="py-1.5 pr-2 text-right font-normal">{tr("Price impact excl. VAT")}</th>
                <th className="py-1.5 text-right font-normal">{tr("Lead-time impact")}</th>
              </tr>
            </thead>
            <tbody>
              {data.options.map((o, i) => (
                <tr key={i} className="break-inside-avoid border-b border-line align-top">
                  <td className="py-2 pr-2 font-mono text-[11px] text-muted">{String.fromCharCode(65 + i)}</td>
                  <td className="whitespace-pre-line py-2 pr-2">{o.label}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{(o.priceImpact >= 0 ? "+" : "") + money(o.priceImpact)}</td>
                  <td className="py-2 text-right">{v(o.delay)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* Récapitulatif */}
      <Section title={tr("Financial summary")}>
        <table className="ml-auto w-full max-w-sm tabular-nums">
          <tbody>
            <Sum label={tr("Subtotal excl. VAT")} value={money(t.subtotal)} />
            {data.discountPct > 0 && <Sum label={tr("Trade discount ({pct} %)", { pct: tr.number(data.discountPct) })} value={"− " + money(t.discount)} />}
            <Sum label={tr("Packaging")} value={money(data.packaging)} />
            <Sum label={tr("Transport and insurance ({incoterm})", { incoterm: data.incoterm || "—" })} value={money(data.transport)} />
            <Sum label={tr("Total excl. VAT")} value={money(t.totalHt)} strong />
            <Sum label={tr("VAT ({rate} %)", { rate: tr.number(data.vatRate) })} value={money(t.vat)} />
            <tr className="border-t-2 border-ink">
              <td className="pt-2 font-mono text-[11px] uppercase tracking-[0.08em]">{tr("Total incl. VAT")}</td>
              <td className="pt-2 text-right font-display text-[20px] text-brass">{money(t.totalTtc)}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-[11px] text-muted">{tr("VAT, currency and customs mentions to be adapted for delivery outside France or the European Union.")}</p>
      </Section>

      {/* Calendrier */}
      <Section title={tr("Schedule and production terms")}>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>{tr("Approval of drawings and samples: to be provided by the client before production starts, within {days} days of signature.", { days: v(data.validationDays) })}</li>
          <li>{tr("Production lead time: {weeks} weeks from written approval of the drawings and receipt of the deposit.", { weeks: v(data.productionWeeks) })}</li>
          <li>{tr("Delivery: {weeks} weeks after the end of production, according to the agreed Incoterm ({incoterm}).", { weeks: v(data.deliveryWeeks), incoterm: data.incoterm || "—" })}</li>
          <li>{tr("Installation or fitting: {installation}.", { installation })}</li>
        </ol>
      </Section>

      {/* Paiement */}
      <Section title={tr("Payment terms")}>
        {data.payments.length > 0 && (
          <table className="w-full tabular-nums">
            <thead>
              <tr className="border-b border-ink text-left font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted">
                <th className="py-1.5 pr-2 font-normal">{tr("Due")}</th>
                <th className="py-1.5 pr-2 text-right font-normal">{tr("Share (%)")}</th>
                <th className="py-1.5 text-right font-normal">{tr("Amount incl. VAT")}</th>
              </tr>
            </thead>
            <tbody>
              {t.payments.map((p, i) => (
                <tr key={i} className="border-b border-line">
                  <td className="py-2 pr-2">{tr(p.label)}</td>
                  <td className="py-2 pr-2 text-right">{tr.number(p.pct)} %</td>
                  <td className="py-2 text-right">{money(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-3">
          {tr("Payment by bank transfer, {days} days from receipt of invoice. Bank details: {iban}. Any late payment incurs penalties at a rate of {pct} % and a fixed recovery fee of €40.", { days: v(data.paymentDays), iban: v([data.iban && `IBAN ${data.iban}`, data.bic && `BIC ${data.bic}`].filter(Boolean).join(" · ")), pct: v(data.latePenaltyPct) })}
        </p>
      </Section>

      {/* Conditions particulières */}
      <Section title={tr("Special conditions")} className="break-before-page">
        <div className="space-y-2">
          <Clause title={tr("Changes.")}>{tr("Any change requested after approval of the drawings is subject to an amendment to the quote, with an adjustment of price and lead time.")}</Clause>
          <Clause title={tr("Tolerances.")}>
            {tr("Natural materials (wood, stone, leather, textile) may show variations in colour, grain and texture, which are part of their character and do not constitute a defect. Dimensional tolerances: ± {mm} mm.", { mm: v(data.toleranceMm) })}
          </Clause>
          <Clause title={tr("Acceptance.")}>{tr("The client has {days} days after delivery to report in writing any non-conformity or damage, with photos.", { days: v(data.receptionDays) })}</Clause>
          <Clause title={tr("Warranty.")}>{tr("{months} months against any manufacturing defect, excluding normal wear, misuse and inappropriate maintenance.", { months: v(data.warrantyMonths) })}</Clause>
          <Clause title={tr("Cancellation.")}>{tr("Once production has started, the deposit is retained by the issuer, and items already manufactured or materials ordered are invoiced.")}</Clause>
          <Clause title={tr("Intellectual property and confidentiality.")}>
            {tr("The issuer's drawings, creations and know-how remain its property. The client's drawings and information are not disclosed. Any reproduction without written consent is prohibited.")}
          </Clause>
          <Clause title={tr("References.")}>{tr("Unless the client refuses in writing, the issuer may mention the work as a reference once the project has been delivered and published.")}</Clause>
          <Clause title={tr("Role of the platform.")}>{tr("This quote is an agreement between the issuer and the client. SEFIKH connects the parties and is not a party to the contract.")}</Clause>
          <Clause title={tr("Applicable law and disputes.")}>
            {tr("{law} law. In the event of a dispute, the court of {city} has jurisdiction, after an attempt at amicable settlement.", { law: (data.law === "French" ? tr("French") : data.law) || "—", city: v(data.courtCity) })}
          </Clause>
          {data.notes && <Clause title={tr("Additional notes.")}><span className="whitespace-pre-line">{data.notes}</span></Clause>}
        </div>
      </Section>

      {/* Bon pour accord */}
      <Section title={tr("Approved")}>
        <p>{tr("To accept this quote, the client returns it signed, preceded by the words « Approved », to {email}, together with payment of the deposit. It can also be accepted online from the SEFIKH messaging.", { email: v(data.issuer.email) })}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Signature title={tr("For the client")} tr={tr} accepted={accepted} />
          <Signature title={tr("For the issuer")} tr={tr} />
        </div>
      </Section>

      <footer className="quote-footer mt-8 border-t border-line pt-3 text-center font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted">
        {footer} · {tr("Quote no.")} {number}
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

function Party({ title, p, tr, companyLabel, addressLabel }: { title: string; p: QuoteData["issuer"]; tr: Translator; companyLabel: string; addressLabel?: string }) {
  const rows: [string, string][] = [
    [companyLabel, p.company],
    [tr("Contact person"), p.contact],
    [addressLabel ?? tr("Address"), p.address],
    [tr("SIRET / VAT"), p.siret],
    [tr("Contact"), [p.email, p.phone].filter(Boolean).join(" · ")],
  ];
  return (
    <div className="break-inside-avoid border-t border-ink pt-2">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-brass">{title}</p>
      <dl className="mt-2 space-y-0.5">
        {rows.map(([k, val]) => (
          <div key={k} className="flex gap-2">
            <dt className="w-28 shrink-0 text-muted">{k} :</dt>
            <dd className="whitespace-pre-line">{val || "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Section({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`mt-7 ${className ?? ""}`}>
      <h2 className="mb-2 font-display text-[17px]">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <tr className="border-b border-line align-top">
      <th className="w-48 py-1.5 pr-3 text-left font-normal text-muted">{label}</th>
      <td className="py-1.5">{value}</td>
    </tr>
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

function Clause({ title, children }: { title: string; children: ReactNode }) {
  return (
    <p>
      <span className="font-medium">{title}</span> {children}
    </p>
  );
}

function Signature({ title, tr, accepted }: { title: string; tr: Translator; accepted?: { name: string; at: Date } | null }) {
  return (
    <div className="break-inside-avoid border border-line p-3">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-brass">{title}</p>
      <p className="mt-2">
        {tr("Name and position:")} {accepted ? <span className="font-medium">{accepted.name}</span> : null}
      </p>
      <p>
        {tr("Date:")} {accepted ? <span className="font-medium">{tr.date(accepted.at, { day: "2-digit", month: "2-digit", year: "numeric" })}</span> : null}
      </p>
      <p>{tr("Signature and stamp:")}</p>
      {accepted ? <p className="mt-2 text-[11.5px] text-success">{tr("« Approved » given online on SEFIKH.")}</p> : <div className="h-12" />}
    </div>
  );
}
