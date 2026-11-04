import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { activeSubscription, foundingSeatsLeft } from "@/lib/billing";
import { PlanPicker } from "@/components/marketing/plan-picker";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Upgrade your profile"), robots: { index: false } };
}

export default async function UpgradePage() {
  const tr = await getT();
  const user = await requireRole("PRO", "/upgrade");
  const [sub, seats] = await Promise.all([activeSubscription(user.id), foundingSeatsLeft()]);
  return (
    <div className="container-x py-14">
      <header className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">{tr("Your profile is ready")}</p>
        <h1 className="display mt-3 text-5xl sm:text-6xl">{tr("Would you like to upgrade your profile?")}</h1>
        <p className="mt-4 text-muted">{tr("Advanced subscriptions give you a verified profile, more visibility in search results and a live view of the demand.")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
          <Link href="/dashboard" className="rounded-full border border-line bg-paper px-5 py-2.5 hover:border-ink/40">
            {tr("No, not now")}</Link>
          <a href="#plans" className="rounded-full bg-ink px-5 py-2.5 text-paper">
            {tr("Yes, I would like to try the advanced subscription")}</a>
        </div>
      </header>
      <div id="plans" className="mt-16 scroll-mt-24">
        <PlanPicker audience="PRO" currentPlan={user.plan} currentTerm={sub?.term ?? null} loggedInRole={user.role} foundingSeatsLeft={seats} compact />
      </div>
    </div>
  );
}
