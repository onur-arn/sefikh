import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
];

const nextConfig: NextConfig = {
  // Application fortement dynamique (sessions, messagerie) : modèle de rendu classique.
  cacheComponents: false,
  poweredByHeader: false,
  // Modules natifs à ne pas bundler (CLIP / ONNX, traitement d'image).
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node", "sharp"],
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
