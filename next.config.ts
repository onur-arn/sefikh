import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
];

if (process.env.DEMO_MODE === "1") securityHeaders.push({ key: "X-Robots-Tag", value: "noindex, nofollow" });

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Application fortement dynamique (sessions, messagerie) : modèle de rendu classique.
  cacheComponents: false,
  poweredByHeader: false,
  // Modules natifs à ne pas bundler (CLIP / ONNX, traitement d'image).
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node", "sharp"],
  // CLIP est coupé sur Vercel (CLIP_MODE=off) : son moteur dépasserait la taille maximale d'une fonction.
  outputFileTracingExcludes: {
    "*": ["node_modules/onnxruntime-node/**", "node_modules/onnxruntime-web/**", "node_modules/@huggingface/transformers/**", ".cache/**", "storage/**", "prisma/*.db"],
  },
  images: {
    qualities: [60, 75, 85],
    localPatterns: [{ pathname: "/files/**" }, { pathname: "/images/**" }],
  },
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
