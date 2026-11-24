import { MailCheck } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { VerifyBanner } from "@/components/dashboard/verify-banner";
import { getT } from "@/i18n/server";

/** Espace connecté fermé tant que l'adresse e-mail n'est pas confirmée (v2 : plus d'accès avant confirmation). */
export async function ConfirmEmailGate({ email }: { email: string }) {
  const tr = await getT();
  return (
    <div className="container-x pb-24 pt-12 sm:pt-20">
      <div className="mx-auto max-w-2xl border border-line bg-paper p-8 text-center sm:p-14">
        <MailCheck className="mx-auto size-7 text-muted" strokeWidth={1.2} />
        <h1 className="display mt-5 text-4xl">{tr("Confirm your e-mail address")}</h1>
        <p className="mx-auto mt-4 max-w-md text-[14.5px] leading-relaxed text-ink-soft">
          {tr("We sent a confirmation link to {email}. Click it to activate your account and continue.", { email })}
        </p>
        <p className="mx-auto mt-2 max-w-md text-[13px] text-muted">{tr("Can't find it? Check your spam or promotions folder.")}</p>
        <div className="mt-8 text-left">
          <VerifyBanner email={email} />
        </div>
        <form action={logoutAction} className="mt-6">
          <button className="folio underline hover:text-ink">{tr("Use another account")}</button>
        </form>
      </div>
    </div>
  );
}
