import "server-only";
import { Text, View } from "@react-pdf/renderer";
import type { Translator } from "@/i18n/config";
import { eur, quoteTotals, type QuoteData } from "@/lib/quotes";
import { C, Meta, Party, Sheet, Table, Totals, clean, s } from "./kit";

export function QuotePdf({ number, data, tr, platformLegal, accepted }: { number: string; data: QuoteData; tr: Translator; platformLegal: string; accepted?: { name: string; at: Date } | null }) {
  const t = quoteTotals(data);
  const money = (n: number) => eur(tr.locale, n);
  const date = (iso: string) => (iso ? tr.date(iso, { day: "2-digit", month: "2-digit", year: "numeric" }) : "—");
  const v = (x: string | number | undefined | null) => (x === "" || x === null || x === undefined ? "—" : String(x));
  const installation = { included: tr("included"), not_included: tr("not included"), optional: tr("optional") }[data.installation];
  const footer = [tr("Quote issued via SEFIKH"), platformLegal, `${tr("Quote no.")} ${number}`].filter(Boolean).join(" · ");

  return (
    <Sheet title={tr("Quote")} subtitle={tr(data.subtitle) || "—"} footer={footer}>
      <Meta
        items={[
          [tr("Quote no."), number],
          [tr("Issue date"), date(data.issueDate)],
          [tr("Valid until"), date(data.validUntil)],
          [tr("Project reference"), v(data.project.ref)],
        ]}
      />
      <View style={s.parties}>
        <Party
          title={tr("Issuer · Manufacturer / artisan")}
          rows={[[tr("Company"), data.issuer.company], [tr("Contact person"), data.issuer.contact], [tr("Address"), data.issuer.address], [tr("SIRET / VAT"), data.issuer.siret], [tr("Contact"), [data.issuer.email, data.issuer.phone].filter(Boolean).join(" · ")]]}
        />
        <View style={{ width: 18 }} />
        <Party
          title={tr("Client · Decorator / interior architect")}
          rows={[[tr("Company / studio"), data.client.company], [tr("Contact person"), data.client.contact], [tr("Billing"), data.client.address], [tr("SIRET / VAT"), data.client.siret], [tr("Contact"), [data.client.email, data.client.phone].filter(Boolean).join(" · ")]]}
        />
      </View>

      <Text style={s.h2}>{tr("Project")}</Text>
      {(
        [
          [tr("Project name"), v(data.project.name)],
          [tr("Location"), v(data.project.location)],
          [tr("Delivery / site address"), v(data.project.deliveryAddress)],
          [tr("Requested delivery"), date(data.project.desiredDelivery)],
          [tr("Brief summary"), v(data.project.brief)],
        ] as [string, string][]
      ).map(([k, val]) => (
        <View key={k} style={s.tr} wrap={false}>
          <Text style={{ width: 150, color: C.muted }}>{k}</Text>
          <Text style={{ flex: 1 }}>{clean(val)}</Text>
        </View>
      ))}

      <Text style={s.h2}>{tr("Details of services")}</Text>
      <Table
        cols={[
          { label: tr("Ref."), flex: 0.5 },
          { label: tr("Description (materials, dimensions, finishes)"), flex: 4.4 },
          { label: tr("Qty"), flex: 0.6, right: true },
          { label: tr("Unit"), flex: 0.9 },
          { label: tr("Unit price excl. VAT"), flex: 1.4, right: true },
          { label: tr("Total excl. VAT"), flex: 1.4, right: true },
        ]}
        rows={data.lines.map((l, i) => [String(i + 1).padStart(2, "0"), v(l.designation), tr.number(l.qty), tr(l.unit), money(l.unitPrice), money(t.lineTotals[i] ?? 0)])}
      />

      {data.options.length > 0 && (
        <>
          <Text style={s.h2}>{tr("Proposed options and variants")}</Text>
          <Table
            cols={[
              { label: tr("Ref."), flex: 0.5 },
              { label: tr("Option"), flex: 5 },
              { label: tr("Price impact excl. VAT"), flex: 1.6, right: true },
              { label: tr("Lead-time impact"), flex: 1.4, right: true },
            ]}
            rows={data.options.map((o, i) => [String.fromCharCode(65 + i), o.label, (o.priceImpact >= 0 ? "+" : "") + money(o.priceImpact), v(o.delay)])}
          />
        </>
      )}

      <Text style={s.h2}>{tr("Financial summary")}</Text>
      <Totals
        rows={[
          { label: tr("Subtotal excl. VAT"), value: money(t.subtotal) },
          ...(data.discountPct > 0 ? [{ label: tr("Trade discount ({pct} %)", { pct: tr.number(data.discountPct) }), value: "− " + money(t.discount) }] : []),
          { label: tr("Packaging"), value: money(data.packaging) },
          { label: tr("Transport and insurance ({incoterm})", { incoterm: data.incoterm || "—" }), value: money(data.transport) },
          { label: tr("Total excl. VAT"), value: money(t.totalHt), strong: true },
          { label: tr("VAT ({rate} %)", { rate: tr.number(data.vatRate) }), value: money(t.vat) },
        ]}
        total={{ label: tr("Total incl. VAT"), value: money(t.totalTtc) }}
      />
      <Text style={[s.small, { marginTop: 6 }]}>{tr("VAT, currency and customs mentions to be adapted for delivery outside France or the European Union.")}</Text>

      <View wrap={false}>
        <Text style={s.h2}>{tr("Schedule and production terms")}</Text>
        <P>{"1. " + tr("Approval of drawings and samples: to be provided by the client before production starts, within {days} days of signature.", { days: v(data.validationDays) })}</P>
        <P>{"2. " + tr("Production lead time: {weeks} weeks from written approval of the drawings and receipt of the deposit.", { weeks: v(data.productionWeeks) })}</P>
        <P>{"3. " + tr("Delivery: {weeks} weeks after the end of production, according to the agreed Incoterm ({incoterm}).", { weeks: v(data.deliveryWeeks), incoterm: data.incoterm || "—" })}</P>
        <P>{"4. " + tr("Installation or fitting: {installation}.", { installation })}</P>
      </View>

      <Text style={s.h2}>{tr("Payment terms")}</Text>
      {data.payments.length > 0 && (
        <Table
          cols={[
            { label: tr("Due"), flex: 5 },
            { label: tr("Share (%)"), flex: 1, right: true },
            { label: tr("Amount incl. VAT"), flex: 1.6, right: true },
          ]}
          rows={t.payments.map((p) => [<Text key="l">{clean(tr(p.label))}</Text>, `${tr.number(p.pct)} %`, money(p.amount)])}
        />
      )}
      <Text style={{ marginTop: 6 }}>
        {clean(tr("Payment by bank transfer, {days} days from receipt of invoice. Bank details: {iban}. Any late payment incurs penalties at a rate of {pct} % and a fixed recovery fee of €40.", { days: v(data.paymentDays), iban: v(data.iban), pct: v(data.latePenaltyPct) }))}
      </Text>

      <Text style={s.h2} break>
        {tr("Special conditions")}
      </Text>
      <Clause title={tr("Changes.")}>{tr("Any change requested after approval of the drawings is subject to an amendment to the quote, with an adjustment of price and lead time.")}</Clause>
      <Clause title={tr("Tolerances.")}>{tr("Natural materials (wood, stone, leather, textile) may show variations in colour, grain and texture, which are part of their character and do not constitute a defect. Dimensional tolerances: ± {mm} mm.", { mm: v(data.toleranceMm) })}</Clause>
      <Clause title={tr("Acceptance.")}>{tr("The client has {days} days after delivery to report in writing any non-conformity or damage, with photos.", { days: v(data.receptionDays) })}</Clause>
      <Clause title={tr("Warranty.")}>{tr("{months} months against any manufacturing defect, excluding normal wear, misuse and inappropriate maintenance.", { months: v(data.warrantyMonths) })}</Clause>
      <Clause title={tr("Cancellation.")}>{tr("Once production has started, the deposit is retained by the issuer, and items already manufactured or materials ordered are invoiced.")}</Clause>
      <Clause title={tr("Intellectual property and confidentiality.")}>{tr("The issuer's drawings, creations and know-how remain its property. The client's drawings and information are not disclosed. Any reproduction without written consent is prohibited.")}</Clause>
      <Clause title={tr("References.")}>{tr("Unless the client refuses in writing, the issuer may mention the work as a reference once the project has been delivered and published.")}</Clause>
      <Clause title={tr("Role of the platform.")}>{tr("This quote is an agreement between the issuer and the client. SEFIKH connects the parties and is not a party to the contract.")}</Clause>
      <Clause title={tr("Applicable law and disputes.")}>{tr("{law} law. In the event of a dispute, the court of {city} has jurisdiction, after an attempt at amicable settlement.", { law: (data.law === "French" ? tr("French") : data.law) || "—", city: v(data.courtCity) })}</Clause>
      {data.notes ? <Clause title={tr("Additional notes.")}>{data.notes}</Clause> : null}

      <View wrap={false}>
        <Text style={s.h2}>{tr("Approved")}</Text>
        <P>{tr("To accept this quote, the client returns it signed, preceded by the words « Approved », to {email}, together with payment of the deposit. It can also be accepted online from the SEFIKH messaging.", { email: v(data.issuer.email) })}</P>
        <View style={{ flexDirection: "row", marginTop: 6 }}>
          {[tr("For the client"), tr("For the issuer")].map((title, i) => (
            <View key={title} style={{ flex: 1, borderWidth: 0.5, borderColor: C.line, padding: 8, minHeight: 90, marginRight: i === 0 ? 12 : 0 }}>
              <Text style={s.partyTitle}>{title}</Text>
              <Text>
                {tr("Name and position:")} {i === 0 && accepted ? <Text style={{ fontWeight: 500 }}>{clean(accepted.name)}</Text> : null}
              </Text>
              <Text>
                {tr("Date:")} {i === 0 && accepted ? <Text style={{ fontWeight: 500 }}>{tr.date(accepted.at, { day: "2-digit", month: "2-digit", year: "numeric" })}</Text> : null}
              </Text>
              <Text>{tr("Signature and stamp:")}</Text>
              {i === 0 && accepted ? <Text style={{ marginTop: 6, color: C.success, fontSize: 8 }}>{tr("« Approved » given online on SEFIKH.")}</Text> : null}
            </View>
          ))}
        </View>
      </View>
    </Sheet>
  );
}

function P({ children }: { children: string }) {
  return <Text style={{ marginBottom: 4 }}>{clean(children)}</Text>;
}

function Clause({ title, children }: { title: string; children: string }) {
  return (
    <Text style={{ marginBottom: 4 }}>
      <Text style={{ fontWeight: 500 }}>{title} </Text>
      {clean(children)}
    </Text>
  );
}
