import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { I18nProvider } from "@/i18n/client";
import { clientCatalog, getLocale, getT } from "@/i18n/server";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const sans = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return {
    metadataBase: new URL(appUrl),
    title: {
      default: tr("SEFIKH — The sourcing platform for interior professionals"),
      template: "%s · SEFIKH",
    },
    description: tr("Find the right skills, materials and makers to bring your interior projects to life. Search artisans, workshops and manufacturers by project, image, material or location."),
    keywords: ["artisans", "interior design", "sourcing", "craftsmanship", "workshops", "manufacturers", "materials", "hospitality design"],
    openGraph: {
      type: "website",
      siteName: "SEFIKH",
      title: tr("SEFIKH — From inspiration to realization"),
      description: tr("The sourcing platform connecting creatives with artisans, workshops and manufacturers."),
    },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  themeColor: "#f5f1ea",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html lang={locale} data-scroll-behavior="smooth" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <I18nProvider locale={locale} catalog={clientCatalog(locale)}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
