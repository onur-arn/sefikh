import { requireUser } from "@/lib/auth/session";
import { getPlan } from "@/lib/plans";
import { DashboardNav } from "@/components/dashboard/nav";
import { VerifyBanner } from "@/components/dashboard/verify-banner";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireUser("/dashboard");
  const plan = getPlan(user.plan);
  return (
    <div className="container-x grid grid-cols-1 gap-8 py-8 lg:grid-cols-[230px_1fr] lg:gap-12 lg:py-12">
      <DashboardNav role={user.role} planName={plan.name} insights={plan.limits.marketInsights} analytics={plan.limits.analytics} />
      <div className="min-w-0">
        {!user.emailVerifiedAt && <VerifyBanner email={user.email} />}
        {children}
      </div>
    </div>
  );
}
