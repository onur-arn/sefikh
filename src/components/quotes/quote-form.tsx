"use client";

import { useActionState, useState, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { saveQuoteAction } from "@/app/(app)/messages/quotes/actions";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import { eur, INSTALLATION, quoteTotals, type QuoteData } from "@/lib/quotes";

type Party = QuoteData["issuer"];

export function QuoteForm({ conversationId, quoteId, number, initial }: { conversationId: string; quoteId?: string; number: string; initial: QuoteData }) {
  const tr = useT();
  const [d, setD] = useState<QuoteData>(initial);
  const [state, action, pending] = useActionState(saveQuoteAction, null);
  const t = quoteTotals(d);
  const money = (n: number) => eur(tr.locale, n);

  const set = <K extends keyof QuoteData>(k: K, value: QuoteData[K]) => setD((prev) => ({ ...prev, [k]: value }));
  const setParty = (who: "issuer" | "client", k: keyof Party, value: string) => setD((prev) => ({ ...prev, [who]: { ...prev[who], [k]: value } }));
  const setProject = (k: keyof QuoteData["project"], value: string) => setD((prev) => ({ ...prev, project: { ...prev.project, [k]: value } }));
  const setRow = <K extends "lines" | "options" | "payments">(k: K, i: number, patch: Partial<QuoteData[K][number]>) =>
    setD((prev) => ({ ...prev, [k]: (prev[k] as QuoteData[K][number][]).map((row, j) => (j === i ? { ...row, ...patch } : row)) }));
  const removeRow = (k: "lines" | "options" | "payments", i: number) => setD((prev) => ({ ...prev, [k]: (prev[k] as unknown[]).filter((_, j) => j !== i) }));

  return (
    <form action={action} className="space-y-12">
      <input type="hidden" name="conversationId" value={conversationId} />
      {quoteId && <input type="hidden" name="quoteId" value={quoteId} />}
      <input type="hidden" name="data" value={JSON.stringify(d)} />

      <Block title={tr("Quote")} hint={tr("Quote no. {number}", { number })}>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label={tr("Title")} className="sm:col-span-3">
            <Input value={tr(d.subtitle)} onChange={(e) => set("subtitle", e.target.value)} maxLength={160} />
          </Field>
          <Field label={tr("Issue date")}>
            <Input type="date" value={d.issueDate} onChange={(e) => set("issueDate", e.target.value)} />
          </Field>
          <Field label={tr("Valid until")}>
            <Input type="date" value={d.validUntil} onChange={(e) => set("validUntil", e.target.value)} />
          </Field>
          <Field label={tr("Project reference")}>
            <Input value={d.project.ref} onChange={(e) => setProject("ref", e.target.value)} maxLength={80} />
          </Field>
        </div>
      </Block>

      <div className="grid gap-12 lg:grid-cols-2">
        <PartyBlock title={tr("Issuer · Manufacturer / artisan")} p={d.issuer} onChange={(k, val) => setParty("issuer", k, val)} />
        <PartyBlock title={tr("Client · Decorator / interior architect")} p={d.client} onChange={(k, val) => setParty("client", k, val)} />
      </div>

      <Block title={tr("Project")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={tr("Project name")}>
            <Input value={d.project.name} onChange={(e) => setProject("name", e.target.value)} placeholder={tr("Hotel, residence, boutique, offices…")} />
          </Field>
          <Field label={tr("Location")}>
            <Input value={d.project.location} onChange={(e) => setProject("location", e.target.value)} placeholder={tr("City, country")} />
          </Field>
          <Field label={tr("Delivery / site address")}>
            <Input value={d.project.deliveryAddress} onChange={(e) => setProject("deliveryAddress", e.target.value)} />
          </Field>
          <Field label={tr("Requested delivery")}>
            <Input type="date" value={d.project.desiredDelivery} onChange={(e) => setProject("desiredDelivery", e.target.value)} />
          </Field>
          <Field label={tr("Brief summary")} className="sm:col-span-2">
            <Textarea rows={3} value={d.project.brief} onChange={(e) => setProject("brief", e.target.value)} placeholder={tr("Items concerned, style, technical or regulatory constraints")} />
          </Field>
        </div>
      </Block>

      <Block title={tr("Details of services")}>
        <div className="space-y-4">
          {d.lines.map((l, i) => (
            <div key={i} className="grid items-end gap-3 border-b border-line pb-4 sm:grid-cols-[2.5rem_1fr_5.5rem_6.5rem_8rem_7rem_2rem]">
              <span className="pb-2.5 font-mono text-[11px] text-muted">{String(i + 1).padStart(2, "0")}</span>
              <Field label={i === 0 ? tr("Description (materials, dimensions, finishes)") : undefined}>
                <Textarea rows={1} className="min-h-0" value={l.designation} onChange={(e) => setRow("lines", i, { designation: e.target.value })} placeholder={tr("e.g. Custom coffee table, oiled solid oak, 120 × 60 × 40 cm")} />
              </Field>
              <Field label={i === 0 ? tr("Qty") : undefined}>
                <NumInput value={l.qty} onValue={(n) => setRow("lines", i, { qty: n })} />
              </Field>
              <Field label={i === 0 ? tr("Unit") : undefined}>
                <Input value={tr(l.unit)} onChange={(e) => setRow("lines", i, { unit: e.target.value })} list="quote-units" />
              </Field>
              <Field label={i === 0 ? tr("Unit price excl. VAT") : undefined}>
                <NumInput value={l.unitPrice} onValue={(n) => setRow("lines", i, { unitPrice: n })} placeholder="0" />
              </Field>
              <p className="pb-2.5 text-right tabular-nums">{money(t.lineTotals[i] ?? 0)}</p>
              <RemoveButton onClick={() => removeRow("lines", i)} label={tr("Remove")} />
            </div>
          ))}
          <datalist id="quote-units">
            {[tr("piece"), tr("lump sum"), "m²", tr("linear metre"), tr("hour"), tr("day")].map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
          <AddButton onClick={() => set("lines", [...d.lines, { designation: "", qty: 1, unit: "piece", unitPrice: 0 }])}>{tr("Add a line")}</AddButton>
        </div>
      </Block>

      <Block title={tr("Proposed options and variants")} hint={tr("Optional: not included in the total.")}>
        <div className="space-y-4">
          {d.options.map((o, i) => (
            <div key={i} className="grid items-end gap-3 border-b border-line pb-4 sm:grid-cols-[2.5rem_1fr_9rem_9rem_2rem]">
              <span className="pb-2.5 font-mono text-[11px] text-muted">{String.fromCharCode(65 + i)}</span>
              <Field label={i === 0 ? tr("Option") : undefined}>
                <Input value={o.label} onChange={(e) => setRow("options", i, { label: e.target.value })} placeholder={tr("e.g. Alternative finish, another wood species")} />
              </Field>
              <Field label={i === 0 ? tr("Price impact excl. VAT") : undefined}>
                <NumInput value={o.priceImpact} onValue={(n) => setRow("options", i, { priceImpact: n })} placeholder="+0" />
              </Field>
              <Field label={i === 0 ? tr("Lead-time impact") : undefined}>
                <Input value={o.delay} onChange={(e) => setRow("options", i, { delay: e.target.value })} placeholder={tr("+ X days")} />
              </Field>
              <RemoveButton onClick={() => removeRow("options", i)} label={tr("Remove")} />
            </div>
          ))}
          <AddButton onClick={() => set("options", [...d.options, { label: "", priceImpact: 0, delay: "" }])}>{tr("Add an option")}</AddButton>
        </div>
      </Block>

      <Block title={tr("Financial summary")}>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={tr("Trade discount (%)")}>
              <NumInput value={d.discountPct} onValue={(n) => set("discountPct", n)} placeholder="0" />
            </Field>
            <Field label={tr("VAT (%)")}>
              <NumInput value={d.vatRate} onValue={(n) => set("vatRate", n)} />
            </Field>
            <Field label={tr("Packaging")}>
              <NumInput value={d.packaging} onValue={(n) => set("packaging", n)} placeholder="0" />
            </Field>
            <Field label={tr("Transport and insurance")}>
              <NumInput value={d.transport} onValue={(n) => set("transport", n)} placeholder="0" />
            </Field>
            <Field label={tr("Incoterm")} className="sm:col-span-2">
              <Select value={d.incoterm} onChange={(e) => set("incoterm", e.target.value)}>
                {["EXW", "FCA", "DAP", "DDP"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            </Field>
          </div>
          <dl className="space-y-1.5 self-start border-t border-ink pt-3 tabular-nums">
            <Total label={tr("Subtotal excl. VAT")} value={money(t.subtotal)} />
            {d.discountPct > 0 && <Total label={tr("Discount")} value={"− " + money(t.discount)} />}
            <Total label={tr("Total excl. VAT")} value={money(t.totalHt)} />
            <Total label={tr("VAT")} value={money(t.vat)} />
            <div className="flex items-baseline justify-between border-t border-line pt-2">
              <dt className="font-mono text-[11px] uppercase tracking-[0.06em]">{tr("Total incl. VAT")}</dt>
              <dd className="font-display text-2xl text-brass">{money(t.totalTtc)}</dd>
            </div>
          </dl>
        </div>
      </Block>

      <Block title={tr("Schedule and production terms")}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={tr("Approval of drawings (days after signature)")}>
            <Input value={d.validationDays} onChange={(e) => set("validationDays", e.target.value)} />
          </Field>
          <Field label={tr("Production lead time (weeks)")}>
            <Input value={d.productionWeeks} onChange={(e) => set("productionWeeks", e.target.value)} />
          </Field>
          <Field label={tr("Delivery (weeks after production)")}>
            <Input value={d.deliveryWeeks} onChange={(e) => set("deliveryWeeks", e.target.value)} />
          </Field>
          <Field label={tr("Installation or fitting")}>
            <Select value={d.installation} onChange={(e) => set("installation", e.target.value as QuoteData["installation"])}>
              {INSTALLATION.map((x) => (
                <option key={x} value={x}>
                  {tr({ included: "included", not_included: "not included", optional: "optional" }[x])}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Block>

      <Block title={tr("Payment terms")} hint={t.paymentPctSum !== 100 ? tr("The schedule currently adds up to {pct} % (100 % expected).", { pct: tr.number(t.paymentPctSum) }) : undefined}>
        <div className="space-y-4">
          {t.payments.map((p, i) => (
            <div key={i} className="grid items-end gap-3 border-b border-line pb-4 sm:grid-cols-[1fr_6rem_9rem_2rem]">
              <Field label={i === 0 ? tr("Due") : undefined}>
                <Input value={tr(p.label)} onChange={(e) => setRow("payments", i, { label: e.target.value })} />
              </Field>
              <Field label={i === 0 ? tr("Share (%)") : undefined}>
                <NumInput value={p.pct} onValue={(n) => setRow("payments", i, { pct: n })} />
              </Field>
              <p className="pb-2.5 text-right tabular-nums">{money(p.amount)}</p>
              <RemoveButton onClick={() => removeRow("payments", i)} label={tr("Remove")} />
            </div>
          ))}
          {d.payments.length < 6 && <AddButton onClick={() => set("payments", [...d.payments, { label: "", pct: 0 }])}>{tr("Add an instalment")}</AddButton>}
          <div className="grid gap-5 pt-2 sm:grid-cols-3">
            <Field label={tr("Payment within (days of invoice)")}>
              <Input value={d.paymentDays} onChange={(e) => set("paymentDays", e.target.value)} />
            </Field>
            <Field label={tr("Late-payment penalty rate (%)")}>
              <Input value={d.latePenaltyPct} onChange={(e) => set("latePenaltyPct", e.target.value)} />
            </Field>
            <Field label={tr("Bank details (IBAN / BIC)")}>
              <Input value={d.iban} onChange={(e) => set("iban", e.target.value)} />
            </Field>
          </div>
        </div>
      </Block>

      <Block title={tr("Special conditions")} hint={tr("The standard clauses of the template are included automatically. Fill in the values below.")}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={tr("Dimensional tolerance (± mm)")}>
            <Input value={d.toleranceMm} onChange={(e) => set("toleranceMm", e.target.value)} />
          </Field>
          <Field label={tr("Days to report a non-conformity")}>
            <Input value={d.receptionDays} onChange={(e) => set("receptionDays", e.target.value)} />
          </Field>
          <Field label={tr("Warranty (months)")}>
            <Input value={d.warrantyMonths} onChange={(e) => set("warrantyMonths", e.target.value)} />
          </Field>
          <Field label={tr("Applicable law")}>
            <Input value={d.law === "French" ? tr("French") : d.law} onChange={(e) => set("law", e.target.value)} />
          </Field>
          <Field label={tr("Competent court (city)")}>
            <Input value={d.courtCity} onChange={(e) => set("courtCity", e.target.value)} />
          </Field>
          <Field label={tr("Additional notes")} className="sm:col-span-2 lg:col-span-3">
            <Textarea rows={3} value={d.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </div>
      </Block>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-line bg-ivory/95 px-4 py-4 backdrop-blur sm:mx-0 sm:px-0">
        <div className="mr-auto w-full sm:w-auto">
          <FormMessage state={state} />
        </div>
        <Button type="submit" name="intent" value="draft" variant="secondary" loading={pending}>
          {tr("Save draft")}
        </Button>
        <Button type="submit" name="intent" value="send" loading={pending}>
          {tr("Send to the client")}
        </Button>
      </div>
    </form>
  );
}

const numVal = (s: string) => (s.trim() === "" ? 0 : Number(s.replace(/\s/g, "").replace(",", ".")) || 0);

/** Champ numérique qui garde la saisie en cours (« 12, » ou « 0,5 ») tout en remontant la valeur. */
function NumInput({ value, onValue, placeholder }: { value: number; onValue: (n: number) => void; placeholder?: string }) {
  const [txt, setTxt] = useState(value ? String(value) : "");
  const shown = numVal(txt) === value ? txt : value ? String(value) : "";
  return (
    <Input
      inputMode="decimal"
      value={shown}
      placeholder={placeholder}
      onChange={(e) => {
        setTxt(e.target.value);
        onValue(numVal(e.target.value));
      }}
    />
  );
}

function Block({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-ink/70 pb-2">
        <h2 className="display text-2xl">{title}</h2>
        {hint && <p className="text-[12.5px] text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function PartyBlock({ title, p, onChange }: { title: string; p: Party; onChange: (k: keyof Party, value: string) => void }) {
  const tr = useT();
  return (
    <Block title={title}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={tr("Company / studio")} required>
          <Input value={p.company} onChange={(e) => onChange("company", e.target.value)} />
        </Field>
        <Field label={tr("Contact person")}>
          <Input value={p.contact} onChange={(e) => onChange("contact", e.target.value)} placeholder={tr("First name Last name, position")} />
        </Field>
        <Field label={tr("Address")} className="sm:col-span-2">
          <Input value={p.address} onChange={(e) => onChange("address", e.target.value)} />
        </Field>
        <Field label={tr("SIRET / VAT")}>
          <Input value={p.siret} onChange={(e) => onChange("siret", e.target.value)} />
        </Field>
        <Field label={tr("E-mail")}>
          <Input type="email" value={p.email} onChange={(e) => onChange("email", e.target.value)} />
        </Field>
        <Field label={tr("Phone")}>
          <Input value={p.phone} onChange={(e) => onChange("phone", e.target.value)} />
        </Field>
      </div>
    </Block>
  );
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-[14px]">
      <dt className="text-ink-soft">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-2 font-mono text-[11.5px] uppercase tracking-[0.06em] text-brass hover:text-ink">
      <Plus className="size-3.5" /> {children}
    </button>
  );
}

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="mb-1.5 flex size-8 items-center justify-center text-muted hover:text-danger">
      <Trash2 className="size-4" strokeWidth={1.5} />
    </button>
  );
}
