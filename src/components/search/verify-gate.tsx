import { MailCheck } from "lucide-react";
import { VerifyBanner } from "@/components/dashboard/verify-banner";
import { getT } from "@/i18n/server";

/** Recherche bloquée tant que l'adresse e-mail n'est pas confirmée (offre gratuite comme payante). */
export async function VerifyGate({ email, freeSearches }: { email: string; freeSearches: number }) {
  const tr = await getT();
  return (
    <div className="container-x pb-24 pt-12 sm:pt-20">
      <div className="mx-auto max-w-2xl border border-line bg-paper p-8 text-center sm:p-14">
        <MailCheck className="mx-auto size-7 text-muted" strokeWidth={1.2} />
        <h1 className="display mt-5 text-4xl sm:text-5xl">{tr("Confirm your e-mail address to start searching")}</h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
          {Number.isFinite(freeSearches)
            ? tr("We sent a confirmation link to {email}. Click it to unlock your {limit} free searches.", { email, limit: freeSearches })
            : tr("We sent a confirmation link to {email}. Click it to unlock your searches.", { email })}
        </p>
        <div className="mt-8 text-left">
          <VerifyBanner email={email} />
        </div>
      </div>
    </div>
  );
}
