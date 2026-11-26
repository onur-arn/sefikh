import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("FAQ"), description: tr("Answers about your SEFIKH account, payments and memberships.") };
}

// FAQ v2 (structure de la cliente, 24/11/2026). Pas de numéros, typographie réduite.
const SECTIONS: { title: string; items: [string, string][] }[] = [
  {
    title: "My account",
    items: [
      ["How do I create a SEFIKH account?", "Click “Log in” at the top of the page, then choose “I'm looking for an artisan” or “I'm an artisan” under “New to SEFIKH?”. Enter your name, e-mail address and a password, then click the confirmation link we send you: your account opens once your e-mail address is confirmed. You then complete your profile."],
      ["How do I reset my password?", "On the log-in page, click “Forgot password?” and enter your e-mail address. You will receive a link valid for one hour to choose a new password."],
      ["How do I update my account information?", "From your dashboard, open “My profile” (or “Business profile” for artisans) to edit your details. Your e-mail address, password and notifications are managed in “Settings”."],
      ["How do I track my activity and performance on SEFIKH?", "Your dashboard overview shows your recent activity: projects, conversations and saved artisans. Artisans with a plan also have an “Analytics” page showing how often their profile is viewed and appears in searches."],
      ["How do I delete my account?", "Go to Settings, then “Delete my account”. Your profile, portfolio, projects, documents and conversations are permanently deleted and any subscription is cancelled. This cannot be undone."],
      ["Can I have multiple professional profiles under one account?", "No: one account corresponds to one profile. If you run several distinct businesses, create one account per business with a different e-mail address."],
      ["How can I change my account type (Architect, Designer, or Craftsman)?", "Creatives can change their profession at any time in “My profile” (“Who are you?”). Switching between a creative account and an artisan account is not possible from your dashboard: contact us and we will help you."],
      ["How can I upload or update my portfolio?", "Artisans manage their pictures from the “Portfolio” page of their dashboard. Every new picture is reviewed by our team before it appears on SEFIKH, usually within 72 hours. The number of pictures depends on your plan."],
      ["How can I change my email address?", "In Settings, under “E-mail address”, enter your new address and your current password. A confirmation link is sent to the new address."],
      ["How can I manage my notification preferences?", "In Settings, under “Notifications”, choose whether you want to receive an e-mail when you get a new message."],
      ["What should I do if I can't access my account?", "First try resetting your password. If you don't receive our e-mails, check your spam folder. If the problem persists, write to us at contact@sefikh.com."],
      ["How can I verify my professional profile?", "Every new artisan profile is reviewed by our team, usually within 72 hours, before it goes online. Profiles with an active plan display a verified badge."],
    ],
  },
  {
    title: "Payment & billing",
    items: [
      ["What payment methods are available?", "Cards (Visa, Mastercard, American Express) everywhere, plus local methods depending on your country, such as SEPA Direct Debit. Payments are processed securely by Stripe."],
      ["How can I access and download my invoices?", "Every payment generates an invoice, available at any time in your dashboard under “Plan & billing”."],
      ["When will I be charged for my subscription?", "On the day you subscribe, then on the same date every month (monthly billing) or every year (annual billing)."],
      ["How can I update my billing information?", "In “Plan & billing”, open the payment management space to update your card, address or VAT number."],
      ["What happens if my payment fails?", "We notify you by e-mail and in your dashboard. Update your payment method to keep your benefits; without payment, your account returns to the free plan."],
      ["Can I get a refund? Are there any additional fees?", "A period that has started is not refunded, but you can cancel at any time to stop the next payments. There are no additional fees: all prices include VAT."],
      ["Is my payment information secure?", "Yes. Payments are handled by Stripe, a certified payment provider. SEFIKH never sees or stores your card number."],
      ["Will my subscription renew automatically?", "Yes, every month or every year depending on your billing, until you cancel it."],
    ],
  },
  {
    title: "Membership",
    items: [
      ["What is included in the free plan?", "3 searches in total (by project, image or category), AI-powered results and an anonymous preview of matching artisans: craft, city, know-how, availability and a selection of their work."],
      ["What is the difference between pro and studio?", "Pro gives unlimited searches, full company profiles with contact details, direct messaging with automatic translation and your supplier library. Studio adds cloud documents for every project, the full Trends & Insights market data and 3 user accesses for your team."],
      ["Can I cancel/change my subscription at any time?", "Yes. A cancellation takes effect at the end of the period already paid. An upgrade applies immediately; a downgrade applies at the end of the current period."],
      ["Is there a free trial for paid plans?", "There is no free trial, but the free plan lets you try the search engine, and our launch offer gives you −20% on your first 2 months with monthly billing."],
      ["What happens when my subscription expires?", "Your account returns to the free plan. For artisans, the profile is no longer shown in search results until a plan is active again."],
      ["Can I switch from a paid plan to the Free plan?", "Yes: cancel your subscription in “Plan & billing”. You keep your benefits until the end of the period already paid."],
      ["Will I lose my data if I downgrade my subscription?", "No. Your profile, projects, conversations and pictures are kept. Only the features of the higher plan become unavailable."],
      ["Can I get a subscription for my entire team?", "Yes: the Studio plan includes 3 user accesses, and you can add more at €89 per month per additional access. Contact us to set up your team."],
      ["Can I change my subscription from monthly to yearly?", "Yes. Choose annual billing on the Memberships page: you are billed once a year and get 2 months free."],
      ["Are there any limitations on the Free plan?", "Yes: 3 searches in total, artisans shown anonymously, no contact details and no messaging."],
    ],
  },
];

export default async function FaqPage() {
  const tr = await getT();
  return (
    <div className="container-x pb-24 pt-12 sm:pt-16">
      <header className="grid gap-4 lg:grid-cols-12">
        <p className="kicker self-start lg:col-span-3">{tr("FAQ")}</p>
        <div className="lg:col-span-9">
          <h1 className="display text-4xl">{tr("Frequently asked questions")}</h1>
          <p className="mt-3 text-[14px] text-muted">
            {tr("Another question?")}{" "}
            <Link href="/contact" className="text-ink underline decoration-brass underline-offset-4 hover:text-brass">
              {tr("Contact us")}
            </Link>
          </p>
        </div>
      </header>

      {SECTIONS.map((s) => (
        <section key={s.title} className="mt-14 grid gap-6 border-t border-ink/70 pt-8 lg:grid-cols-12">
          <h2 className="display text-2xl lg:col-span-3">{tr(s.title)}</h2>
          <div className="lg:col-span-9">
            {s.items.map(([q, a]) => (
              <details key={q} name="faq" className="group border-b border-line first:border-t lg:first:border-t-0">
                {/* list-none + marqueur webkit masqué : pas de triangle natif (Safari). */}
                <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-4 [&::-webkit-details-marker]:hidden">
                  <span className="text-[15px] leading-snug transition-colors group-hover:text-brass">{tr(q)}</span>
                  <span aria-hidden className="relative size-3 shrink-0 self-center">
                    <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-brass" />
                    <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-brass transition-transform duration-300 group-open:scale-y-0" />
                  </span>
                </summary>
                <p className="-mt-1 max-w-2xl pb-5 text-[14px] leading-relaxed text-ink-soft">{tr(a)}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
