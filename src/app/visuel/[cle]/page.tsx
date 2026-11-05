import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudioLoader } from "@/components/visuel/studio-loader";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { normalizeTheme } from "@/lib/visuel/theme";
import "../studio.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "SEFIKH · Choix du visuel" },
  robots: { index: false, follow: false },
};

export default async function VisuelPage({ params }: { params: Promise<{ cle: string }> }) {
  const { cle } = await params;
  if (!env.visuelKey || cle !== env.visuelKey) notFound();

  const last = await db.designChoice.findFirst({ orderBy: { createdAt: "desc" } });
  const lastTheme = last ? normalizeTheme(JSON.parse(last.theme)) : null;
  return (
    <StudioLoader
      accessKey={cle}
      lastChoice={last && lastTheme ? { theme: lastTheme, clientName: last.clientName, comment: last.comment ?? "", date: last.createdAt.toISOString() } : null}
    />
  );
}
