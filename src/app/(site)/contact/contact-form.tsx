"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/field";
import { contactAction } from "../actions";

const TOPICS = ["General question", "I am a maker", "Partnership", "Press", "Careers", "Billing", "Report a problem"];

export function ContactForm({ topic }: { topic?: string }) {
  const [state, onSubmit, pending] = useFormAction(contactAction);
  if (state?.success) return <div className="rounded-3xl border border-line bg-paper p-10"><FormMessage state={state} /></div>;
  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-line bg-paper p-6 sm:p-10">
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" error={state?.fieldErrors?.name}>
          <Input name="name" required autoComplete="name" />
        </Field>
        <Field label="E-mail" error={state?.fieldErrors?.email}>
          <Input name="email" type="email" required autoComplete="email" />
        </Field>
      </div>
      <Field label="Topic">
        <Select name="topic" defaultValue={topic && TOPICS.includes(topic) ? topic : TOPICS[0]}>
          {TOPICS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
      </Field>
      <Field label="Message" error={state?.fieldErrors?.message}>
        <Textarea name="message" rows={6} required maxLength={4000} />
      </Field>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <Button type="submit" size="lg" loading={pending}>
        Send message
      </Button>
    </form>
  );
}
