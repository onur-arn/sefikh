import type { Metadata } from "next";
import { ContactForm } from "./contact-form";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Contact us") };
}

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const tr = await getT();
  const { topic } = await searchParams;
  return (
    <div className="container-x grid gap-12 py-16 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <p className="eyebrow">{tr("Contact")}</p>
        <h1 className="display mt-3 text-5xl sm:text-6xl">{tr("Let's talk.")}</h1>
        <p className="mt-4 max-w-md text-muted">{tr("A question about the platform, a partnership, press or a job application? Write to us — we answer within 2 business days.")}</p>
        <p className="mt-8 text-sm">
          {tr("contact@sefikh.com")}{" "}<br />
          <span className="text-muted">{tr("Caen, France")}</span>
        </p>
      </div>
      <ContactForm topic={typeof topic === "string" ? topic : undefined} />
    </div>
  );
}
