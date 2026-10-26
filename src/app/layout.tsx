import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "SEFIKH — The sourcing platform for interior professionals",
    template: "%s · SEFIKH",
  },
  description:
    "Find the right skills, materials and makers to bring your interior projects to life. Search artisans, workshops and manufacturers by project, image, material or location.",
  keywords: ["artisans", "interior design", "sourcing", "craftsmanship", "workshops", "manufacturers", "materials", "hospitality design"],
  openGraph: {
    type: "website",
    siteName: "SEFIKH",
    title: "SEFIKH — From inspiration to realization",
    description: "The sourcing platform connecting creatives with artisans, workshops and manufacturers.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#f5f1ea",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
