import { SiteHeader } from "@/components/layout/site-header";
import { ConfirmEmailGate } from "@/components/auth/confirm-email-gate";
import { mustConfirmEmail } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        {user && mustConfirmEmail(user) ? <ConfirmEmailGate email={user.email} /> : children}
      </main>
    </>
  );
}
