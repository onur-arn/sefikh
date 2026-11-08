import "server-only";

function read(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

export const env = {
  appUrl: read("APP_URL", "http://localhost:3000").replace(/\/$/, ""),
  authSecret: read("AUTH_SECRET", "dev-insecure-secret"),
  isProd: process.env.NODE_ENV === "production",
  /** Site de recette en ligne : paiements simulés, e-mails confirmés d'office, pas d'indexation. */
  demoMode: read("DEMO_MODE") === "1",
  smtp: {
    host: read("SMTP_HOST"),
    port: Number(read("SMTP_PORT", "587")),
    user: read("SMTP_USER"),
    password: read("SMTP_PASSWORD"),
  },
  mailFrom: read("MAIL_FROM", "SEFIKH <contact@sefikh.com>"),
  contactInbox: read("CONTACT_INBOX", "contact@sefikh.com"),
  stripeSecretKey: read("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: read("STRIPE_WEBHOOK_SECRET"),
  storageDir: read("STORAGE_DIR", "./storage"),
  clipEnabled: read("CLIP_MODE", "on") !== "off",
  /** Clé du lien privé de l'interface de choix du visuel (/visuel/<clé>). */
  visuelKey: read("VISUEL_KEY", process.env.NODE_ENV === "production" ? "" : "demo"),
  /** Traduction automatique : DeepL en priorité (clé « …:fx » = offre gratuite), sinon Claude. */
  deeplApiKey: read("DEEPL_API_KEY"),
  anthropicApiKey: read("ANTHROPIC_API_KEY"),
  aiModel: read("AI_MODEL", "claude-opus-5-5"),
};

if (env.isProd && env.authSecret === "dev-insecure-secret") {
  console.warn("[sefikh] AUTH_SECRET n'est pas défini : à configurer avant la mise en production.");
}

/** Paiement simulé autorisé uniquement sans clé Stripe, hors production ou sur le site de recette. */
export const simulatedPayments = !env.stripeSecretKey && (!env.isProd || env.demoMode);
