import "server-only";
import { Text, View } from "@react-pdf/renderer";
import type { Translator } from "@/i18n/config";
import { eur } from "@/lib/quotes";
import { C, Meta, Party, Sheet, Table, Totals, clean, s } from "./kit";

type PartyT = { company: string; contact?: string; address: string; vat: string; siret?: string; email: string; phone?: string };

export function InvoicePdf(p: {
  tr: Translator;
  number: string;
  issuedAt: Date;
  paidAt: Date | null;
  status: string;
  period: { start: Date; end: Date };
  description: string;
  amounts: { ht: number; vat: number; ttc: number };
  vatRate: number;
  seller: PartyT & { legal: string };
  client: PartyT;
  simulated: boolean;
}) {
  const { tr, amounts } = p;
  const money = (n: number) => eur(tr.locale, n);
  const date = (d: Date) => tr.date(d, { day: "2-digit", month: "2-digit", year: "numeric" });
  const periodText = tr("From {start} to {end}", { start: date(p.period.start), end: date(p.period.end) });
  const footer = [p.seller.company, p.seller.legal, `${tr("Invoice no.")} ${p.number}`].filter(Boolean).join(" · ");

  return (
    <Sheet title={tr("Invoice")} subtitle={tr("SEFIKH subscription")} footer={footer}>
      <Meta
        items={[
          [tr("Invoice no."), p.number],
          [tr("Issue date"), date(p.issuedAt)],
          [tr("Billing period"), periodText],
          [tr("Status"), p.status === "PAID" ? tr("Paid") : p.status === "REFUNDED" ? tr("Refunded") : tr("Unpaid")],
        ]}
      />
      <View style={s.parties}>
        <Party title={tr("Issuer")} rows={[[tr("Company"), p.seller.company], [tr("Address"), p.seller.address], [tr("SIRET / VAT"), [p.seller.siret, p.seller.vat].filter(Boolean).join(" · ")], [tr("Contact"), p.seller.email]]} />
        <View style={{ width: 18 }} />
        <Party
          title={tr("Billed to")}
          rows={[
            [tr("Company / studio"), p.client.company],
            [tr("Contact person"), p.client.contact ?? ""],
            [tr("Billing"), p.client.address],
            [tr("SIRET / VAT"), p.client.vat],
            [tr("Contact"), [p.client.email, p.client.phone].filter(Boolean).join(" · ")],
          ]}
        />
      </View>

      <Text style={s.h2}>{tr("Details of services")}</Text>
      <Table
        cols={[
          { label: tr("Ref."), flex: 0.5 },
          { label: tr("Description"), flex: 5 },
          { label: tr("Qty"), flex: 0.6, right: true },
          { label: tr("Unit price excl. VAT"), flex: 1.6, right: true },
          { label: tr("Total excl. VAT"), flex: 1.6, right: true },
        ]}
        rows={[
          [
            "01",
            <View key="d">
              <Text>{clean(tr(p.description))}</Text>
              <Text style={s.small}>{clean(periodText)}</Text>
            </View>,
            "1",
            money(amounts.ht),
            money(amounts.ht),
          ],
        ]}
      />

      <Text style={s.h2}>{tr("Financial summary")}</Text>
      <Totals
        rows={[
          { label: tr("Total excl. VAT"), value: money(amounts.ht), strong: true },
          { label: tr("VAT ({rate} %)", { rate: tr.number(p.vatRate) }), value: money(amounts.vat) },
        ]}
        total={{ label: tr("Total incl. VAT"), value: money(amounts.ttc) }}
      />
      {p.status === "PAID" && p.paidAt && <Text style={{ marginTop: 6, textAlign: "right", color: C.success, fontSize: 8.5 }}>{clean(tr("Paid on {date} by card.", { date: date(p.paidAt) }))}</Text>}

      <View style={{ marginTop: 18 }}>
        <Text style={s.small}>{tr("Subscription payable in advance for the period invoiced. No discount for early payment.")}</Text>
        <Text style={[s.small, { marginTop: 3 }]}>{clean(tr("For professional clients, any late payment incurs penalties at three times the legal interest rate and a fixed recovery fee of €40."))}</Text>
        {p.simulated && <Text style={[s.small, { marginTop: 3, color: C.danger }]}>{tr("Demo invoice: simulated payment, no real charge.")}</Text>}
      </View>
    </Sheet>
  );
}
