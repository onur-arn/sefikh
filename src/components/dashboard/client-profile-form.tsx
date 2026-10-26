"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { saveClientProfile } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/field";
import { PhoneInput } from "@/components/forms/phone-input";
import { TagInput } from "@/components/forms/chips";
import { CLIENT_TYPES } from "@/lib/constants";
import { COUNTRIES } from "@/lib/geo";
import { parseList } from "@/lib/utils";

type Profile = { name: string; studioName?: string | null; clientType?: string | null; sector?: string | null; phone?: string | null; street?: string | null; street2?: string | null; city?: string | null; region?: string | null; country?: string | null; website?: string | null; bio?: string | null; keywords?: string | null; email: string };

export function ClientProfileForm({ profile, onboarding }: { profile: Profile; onboarding?: boolean }) {
  const [state, onSubmit, pending] = useFormAction(saveClientProfile);
  const e = state?.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="space-y-10">
      {onboarding && <input type="hidden" name="onboarding" value="1" />}
      <FormMessage state={state} />
      <Section title="Identity" text="How makers will see you in conversations.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" required error={e.name}>
            <Input name="name" defaultValue={profile.name} required />
          </Field>
          <Field label="Studio / company name" error={e.studioName}>
            <Input name="studioName" defaultValue={profile.studioName ?? ""} placeholder="e.g. Studio Laurent Architecture" />
          </Field>
          <Field label="Who are you?" error={e.clientType}>
            <Select name="clientType" defaultValue={profile.clientType ?? ""}>
              <option value="">Select…</option>
              {CLIENT_TYPES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Sector" hint="e.g. Hospitality, residential, retail" error={e.sector}>
            <Input name="sector" defaultValue={profile.sector ?? ""} />
          </Field>
        </div>
      </Section>

      <Section title="Contact & address">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="E-mail" hint="Change it in Settings.">
            <Input value={profile.email} disabled readOnly />
          </Field>
          <Field label="Phone" error={e.phone}>
            <PhoneInput name="phone" defaultValue={profile.phone} />
          </Field>
          <Field label="Street address" className="sm:col-span-2">
            <Input name="street" defaultValue={profile.street ?? ""} autoComplete="address-line1" />
          </Field>
          <Field label="Address line 2 (optional)" className="sm:col-span-2">
            <Input name="street2" defaultValue={profile.street2 ?? ""} autoComplete="address-line2" />
          </Field>
          <Field label="City">
            <Input name="city" defaultValue={profile.city ?? ""} autoComplete="address-level2" />
          </Field>
          <Field label="State / region">
            <Input name="region" defaultValue={profile.region ?? ""} autoComplete="address-level1" />
          </Field>
          <Field label="Country">
            <Input name="country" defaultValue={profile.country ?? ""} list="countries" autoComplete="country-name" />
          </Field>
          <Field label="Website" error={e.website}>
            <Input name="website" defaultValue={profile.website ?? ""} placeholder="www.yourstudio.com" />
          </Field>
        </div>
        <datalist id="countries">
          {COUNTRIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Section>

      <Section title="About your practice" text="Helps makers understand your projects. Add keywords such as hotels, restaurants, residences…">
        <Field label="Short presentation">
          <Textarea name="bio" defaultValue={profile.bio ?? ""} rows={4} maxLength={2000} />
        </Field>
        <div className="mt-5">
          <Field label="Typical projects (keywords)">
            <TagInput name="keywords" defaultValue={parseList(profile.keywords)} placeholder="hotels, restaurants, residences…" />
          </Field>
        </div>
      </Section>

      <div className="flex justify-end border-t border-line pt-6">
        <Button type="submit" size="lg" loading={pending}>
          {onboarding ? "Confirm and continue" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

export function Section({ title, text, children }: { title: string; text?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <div>
        <h2 className="display text-2xl">{title}</h2>
        {text && <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{text}</p>}
      </div>
      <div>{children}</div>
    </section>
  );
}
