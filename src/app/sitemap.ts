import type { MetadataRoute } from "next";
import { ARTICLES } from "@/lib/journal";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const pages = ["", "/search", "/insights", "/journal", "/about", "/join", "/pricing", "/contact", "/legal/terms", "/legal/privacy", "/legal/cookies"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...ARTICLES.map((a) => ({ url: `${base}/journal/${a.slug}`, lastModified: new Date(a.date), priority: 0.6 })),
  ];
}
