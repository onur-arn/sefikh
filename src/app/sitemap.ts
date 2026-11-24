import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const pages = ["", "/insights", "/journal", "/about", "/join", "/subscription", "/faq", "/contact", "/legal/terms", "/legal/privacy", "/legal/cookies"];
  return pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 }));
}
