import { AssistantWidget } from "@/components/assistant/assistant-widget";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getT } from "@/i18n/server";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const tr = await getT();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
        {tr("Skip to content")}</a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <AssistantWidget />
    </>
  );
}
