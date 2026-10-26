import "server-only";

function read(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

export const env = {
  appUrl: read("APP_URL", "http://localhost:3000").replace(/\/$/, ""),
  authSecret: read("AUTH_SECRET", "dev-insecure-secret"),
  isProd: process.env.NODE_ENV === "production",
  smtp: {
    host: read("SMTP_HOST"),
    port: Number(read("SMTP_PORT", "587")),
    user: read("SMTP_USER"),
    password: read("SMTP_PASSWORD"),
  },
  mailFrom: read("MAIL_FROM", "SEFIKH <hello@sefikh.com>"),
  contactInbox: read("CONTACT_INBOX", "hello@sefikh.com"),
  stripeSecretKey: read("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: read("STRIPE_WEBHOOK_SECRET"),
  storageDir: read("STORAGE_DIR", "./storage"),
  clipEnabled: read("CLIP_MODE", "on") !== "off",
};

if (env.isProd && env.authSecret === "dev-insecure-secret") {
  console.warn("[sefikh] AUTH_SECRET n'est pas défini : à configurer avant la mise en production.");
}

/** Paiement simulé autorisé uniquement hors production et sans clé Stripe. */
export const simulatedPayments = !env.stripeSecretKey && !env.isProd;
