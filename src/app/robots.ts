import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/messages", "/api/", "/onboarding", "/checkout", "/dev/", "/files/queries/", "/files/attachments/", "/files/documents/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
