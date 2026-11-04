"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { saveCompanyProfile } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/field";
import { ChipGroup, MonthPicker, TagInput } from "@/components/forms/chips";
import { PhoneInput } from "@/components/forms/phone-input";
import { COMPANY_KINDS, CONTINENTS, MATERIALS, SECTORS, SKILLS, TECHNIQUES } from "@/lib/constants";
import { COUNTRIES } from "@/lib/geo";
import { parseList } from "@/lib/utils";
import { Section } from "./client-profile-form";
import { useT } from "@/i18n/client";

export type CompanyFormData = {
  name?: string;
  kind?: string;
  sector?: string | null;
  tagline?: string | null;
  about?: string | null;
  publicEmail?: string | null;
  phone?: string | null;
  website?: string | null;
  street?: string | null;
  street2?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  operationAreas?: string;
  keywords?: string;
  productionCapacity?: string | null;
  leadTimeMin?: number | null;
  leadTimeMax?: number | null;
  availability?: string;
  foundedYear?: number | null;
  teamSize?: string | null;
  published?: boolean;
  tags?: { kind: string; name: string }[];
};

const TEAM = ["1–5", "6–10", "11–25", "26–50", "51–200", "200+"];

export function CompanyForm({ company, onboarding, accountEmail }: { company: CompanyFormData; onboarding?: boolean; accountEmail: string }) {
  const tr = useT();
  const [state, onSubmit, pending] = useFormAction(saveCompanyProfile);
  const e = state?.fieldErrors ?? {};
  const tagsOf = (k: string) => (company.tags ?? []).filter((t) => t.kind === k).map((t) => t.name);
  const leadOptions = Array.from({ length: 24 }, (_, i) => i + 1);

  return (
    <form onSubmit={onSubmit} className="space-y-12">
      {onboarding && <input type="hidden" name="onboarding" value="1" />}
      <FormMessage state={state} />

      <Section title={tr("Your company")} text={tr("The essentials creatives see first.")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={tr("Company's name")} required error={e.name}>
            <Input name="name" defaultValue={company.name ?? ""} required />
          </Field>
          <Field label={tr("You are")} required>
            <Select name="kind" defaultValue={company.kind ?? "ARTISAN"}>
              {COMPANY_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {tr(k.label)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={tr("Sector")} hint={tr("e.g. Architectural metalwork, upholstery…")} error={e.sector}>
            <Input name="sector" defaultValue={company.sector ?? ""} />
          </Field>
          <Field label={tr("Tagline")} hint={tr("One line that sums up your craft.")} error={e.tagline}>
            <Input name="tagline" defaultValue={company.tagline ?? ""} maxLength={140} placeholder={tr("Hand-patinated brass, bronze & copper surfaces")} />
          </Field>
          <Field label={tr("About you")} hint={tr("Describe your company, your skills and your materials.")} className="sm:col-span-2" error={e.about}>
            <Textarea name="about" defaultValue={company.about ?? ""} rows={6} maxLength={5000} />
          </Field>
          <Field label={tr("Founded in")}>
            <Input name="foundedYear" type="number" min={1700} max={new Date().getFullYear()} defaultValue={company.foundedYear ?? ""} />
          </Field>
          <Field label={tr("Team size")}>
            <Select name="teamSize" defaultValue={company.teamSize ?? ""}>
              <option value="">{tr("Select…")}</option>
              {TEAM.map((t) => (
                <option key={t} value={t}>{tr(t)}</option>
              ))}
            </Select>
          </Field>
        </div>
      </Section>

      <Section title={tr("Address & contact")} text={tr("Your address is used to match you with nearby projects.")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={tr("Street address")} className="sm:col-span-2">
            <Input name="street" defaultValue={company.street ?? ""} autoComplete="address-line1" />
          </Field>
          <Field label={tr("Address line 2 (optional)")} className="sm:col-span-2">
            <Input name="street2" defaultValue={company.street2 ?? ""} autoComplete="address-line2" />
          </Field>
          <Field label={tr("City")} required error={e.city}>
            <Input name="city" defaultValue={company.city ?? ""} required autoComplete="address-level2" />
          </Field>
          <Field label={tr("State / region")}>
            <Input name="region" defaultValue={company.region ?? ""} autoComplete="address-level1" />
          </Field>
          <Field label={tr("Country")} required error={e.country}>
            <Input name="country" defaultValue={company.country ?? ""} list="countries" required autoComplete="country-name" />
          </Field>
          <Field label={tr("Public e-mail")} hint={tr("Shown to Pro creatives. Account e-mail: {accountEmail}", { accountEmail })} error={e.publicEmail}>
            <Input name="publicEmail" type="email" defaultValue={company.publicEmail ?? ""} />
          </Field>
          <Field label={tr("Contact phone")}>
            <PhoneInput name="phone" defaultValue={company.phone} />
          </Field>
          <Field label={tr("Website")} error={e.website}>
            <Input name="website" defaultValue={company.website ?? ""} placeholder={tr("www.atelier.com")} />
          </Field>
        </div>
        <datalist id="countries">
          {COUNTRIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Section>

      <Section title={tr("Areas of operation")} text={tr("Where can you deliver and install?")}>
        <ChipGroup name="operationAreas" options={[...CONTINENTS]} defaultValue={parseList(company.operationAreas)} />
      </Section>

      <Section title={tr("Skills, materials & techniques")} text={tr("These power search results. Choose everything that applies.")}>
        <div className="space-y-6">
          <Field label={tr("Skills")} error={e.skills}>
            <ChipGroup name="skills" options={SKILLS.map((s) => s.name)} defaultValue={tagsOf("SKILL")} />
          </Field>
          <Field label={tr("Materials")}>
            <ChipGroup name="materials" options={MATERIALS.map((s) => s.name)} defaultValue={tagsOf("MATERIAL")} />
          </Field>
          <Field label={tr("Techniques")}>
            <ChipGroup name="techniques" options={TECHNIQUES.map((s) => s.name)} defaultValue={tagsOf("TECHNIQUE")} />
          </Field>
          <Field label={tr("Project sectors")}>
            <ChipGroup name="sectors" options={SECTORS.map((s) => s.name)} defaultValue={tagsOf("SECTOR")} />
          </Field>
          <Field label={tr("My skills in my own words")} hint={tr("Keywords or short sentences, shown as bubbles on your profile (up to 15).")}>
            <TagInput name="keywords" defaultValue={parseList(company.keywords)} placeholder={tr("bespoke kitchen fronts, bar counters…")} />
          </Field>
        </div>
      </Section>

      <Section title={tr("Production capabilities")} text={tr("Capacity, lead times and availability help creatives plan with you.")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={tr("Production capacities (optional)")} className="sm:col-span-2">
            <Textarea name="productionCapacity" defaultValue={company.productionCapacity ?? ""} rows={3} maxLength={600} placeholder={tr("e.g. up to 300 m² per month, sheets up to 3 × 1.5 m, small series up to 200 pieces…")} />
          </Field>
          <Field label={tr("My lead times — from (months)")}>
            <Select name="leadTimeMin" defaultValue={company.leadTimeMin ?? ""}>
              <option value="">—</option>
              {leadOptions.map((m) => (
                <option key={m} value={m}>
                  {tr(m > 1 ? "{m} months" : "{m} month", { m })}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={tr("to (months)")}>
            <Select name="leadTimeMax" defaultValue={company.leadTimeMax ?? ""}>
              <option value="">—</option>
              {leadOptions.map((m) => (
                <option key={m} value={m}>
                  {tr(m > 1 ? "{m} months" : "{m} month", { m })}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={tr("Months with production availability")} className="sm:col-span-2">
            <MonthPicker name="availability" defaultValue={parseList<number>(company.availability).map(Number)} />
          </Field>
        </div>
      </Section>

      {!onboarding && (
        <Section title={tr("Visibility")}>
          <label className="flex items-start gap-3 rounded-xl border border-line bg-paper p-4">
            <input type="checkbox" name="published" defaultChecked={company.published} className="mt-0.5 size-4 accent-ink" />
            <span>
              <span className="block text-sm font-medium">{tr("Publish my profile")}</span>
              <span className="text-[13px] text-muted">{tr("Your profile appears in search results once at least one portfolio picture is online.")}</span>
            </span>
          </label>
        </Section>
      )}

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-line bg-ivory/95 px-4 py-4 backdrop-blur sm:mx-0 sm:px-0">
        {state?.error && <p className="mr-auto text-sm text-danger">{tr(state.error)}</p>}
        <Button type="submit" size="lg" loading={pending}>
          {onboarding ? tr("Confirm and add my portfolio") : tr("Save changes")}
        </Button>
      </div>
    </form>
  );
}
