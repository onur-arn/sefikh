// Catalogue des abonnements SEFIKH (source unique pour l'UI, les contrôles d'accès et Stripe).
// Prix TTC en euros (v2, 24/11/2026) : MONTHLY = prix par mois, ANNUAL = prix par an payé en une fois (2 mois offerts).
// Offre de lancement : −20 % sur les 2 premiers mois d'un abonnement mensuel (LAUNCH_DISCOUNT).

export type PlanId =
  | "CLIENT_FREE"
  | "CLIENT_PRO"
  | "CLIENT_STUDIO"
  | "PRO_BASIC"
  | "PRO_PRO"
  | "PRO_VISIBILITY"
  | "PRO_INTELLIGENCE"
  | "PRO_FOUNDING";

export type Term = "ANNUAL" | "MONTHLY";
export type Audience = "CLIENT" | "PRO";

export type Plan = {
  id: PlanId;
  audience: Audience;
  name: string;
  frName?: string; // nom affiché en français (offres créatifs : Essentiel / Atelier / Premium)
  tagline: string;
  prices: Partial<Record<Term, number>>; // € TTC : MONTHLY par mois, ANNUAL par an ; absent = non proposé
  independentPrices?: Partial<Record<Term, number>>; // artisans indépendants (sinon même prix)
  hidden?: boolean; // offre retirée du catalogue (abonnés existants conservés)
  features: string[];
  highlight?: boolean;
  limits: {
    freeSearches: number; // total à vie, tous modes confondus ; Infinity = illimité
    newConversationsPerMonth: number;
    portfolioImages: number;
    seeMakers: boolean; // noms et fiches ; sinon résultats anonymes
    seeContactDetails: boolean;
    savedLibrary: boolean;
    marketInsights: boolean;
    analytics: boolean;
    searchBoost: number; // bonus de classement (pros)
    featured: boolean;
  };
  seatsLimit?: number; // places limitées (Founding Partner)
};

const UNLIMITED = Number.POSITIVE_INFINITY;

export const PLANS: Record<PlanId, Plan> = {
  CLIENT_FREE: {
    id: "CLIENT_FREE",
    audience: "CLIENT",
    name: "Free",
    frName: "Essentiel",
    tagline: "Explore · Search · Discover",
    prices: { ANNUAL: 0, MONTHLY: 0 },
    features: [
      "3 free searches in total: project, image or category",
      "AI-powered results and matches",
      "Anonymous preview of matching makers",
    ],
    limits: {
      freeSearches: 3,
      newConversationsPerMonth: 0,
      portfolioImages: 0,
      seeMakers: false,
      seeContactDetails: false,
      savedLibrary: false,
      marketInsights: false,
      analytics: false,
      searchBoost: 0,
      featured: false,
    },
  },
  CLIENT_PRO: {
    id: "CLIENT_PRO",
    audience: "CLIENT",
    name: "Pro",
    frName: "Atelier",
    tagline: "Identify · Source · Save · Connect",
    prices: { MONTHLY: 149, ANNUAL: 1490 },
    highlight: true,
    features: [
      "Unlimited AI-powered searches",
      "Full company profiles with contact details",
      "Unlimited direct messaging with automatic translation",
      "Supplier library & saved makers",
    ],
    limits: {
      freeSearches: UNLIMITED,
      newConversationsPerMonth: UNLIMITED,
      portfolioImages: 0,
      seeMakers: true,
      seeContactDetails: true,
      savedLibrary: true,
      marketInsights: false,
      analytics: false,
      searchBoost: 0,
      featured: false,
    },
  },
  CLIENT_STUDIO: {
    id: "CLIENT_STUDIO",
    audience: "CLIENT",
    name: "Studio",
    frName: "Premium",
    tagline: "Collaborate at studio scale",
    prices: { MONTHLY: 299, ANNUAL: 2990 },
    features: [
      "Everything included in Pro",
      "Cloud documents for every project",
      "Full Trends & Insights market data",
      "3 user accesses included, then €89 / month per additional access",
    ],
    limits: {
      freeSearches: UNLIMITED,
      newConversationsPerMonth: UNLIMITED,
      portfolioImages: 0,
      seeMakers: true,
      seeContactDetails: true,
      savedLibrary: true,
      marketInsights: true,
      analytics: false,
      searchBoost: 0,
      featured: false,
    },
  },
  PRO_BASIC: {
    id: "PRO_BASIC",
    audience: "PRO",
    name: "Not listed",
    tagline: "Profile hidden until you subscribe",
    prices: { ANNUAL: 0, MONTHLY: 0 },
    features: [],
    limits: {
      freeSearches: UNLIMITED,
      newConversationsPerMonth: 0,
      portfolioImages: 6,
      seeMakers: false,
      seeContactDetails: true,
      savedLibrary: false,
      marketInsights: false,
      analytics: false,
      searchBoost: 0,
      featured: false,
    },
  },
  PRO_PRO: {
    id: "PRO_PRO",
    audience: "PRO",
    name: "Pro",
    tagline: "A complete professional presence",
    prices: { MONTHLY: 149, ANNUAL: 1490 },
    independentPrices: { MONTHLY: 99, ANNUAL: 990 },
    features: ["Create your professional profile", "Portfolio of up to 60 pictures", "Visibility analytics"],
    limits: {
      freeSearches: UNLIMITED,
      newConversationsPerMonth: 0,
      portfolioImages: 60,
      seeMakers: true,
      seeContactDetails: true,
      savedLibrary: true,
      marketInsights: false,
      analytics: true,
      searchBoost: 0.04,
      featured: false,
    },
  },
  PRO_VISIBILITY: {
    id: "PRO_VISIBILITY",
    audience: "PRO",
    name: "Visibility",
    tagline: "Be seen first",
    prices: { MONTHLY: 299, ANNUAL: 2990 },
    independentPrices: { MONTHLY: 179, ANNUAL: 1790 },
    highlight: true,
    features: ["Everything in Pro", "Portfolio of up to 120 pictures", "Boosted ranking in search results", "Editorial features & dedicated content for special projects realised through SEFIKH"],
    limits: {
      freeSearches: UNLIMITED,
      newConversationsPerMonth: 0,
      portfolioImages: 120,
      seeMakers: true,
      seeContactDetails: true,
      savedLibrary: true,
      marketInsights: false,
      analytics: true,
      searchBoost: 0.1,
      featured: true,
    },
  },
  PRO_INTELLIGENCE: {
    id: "PRO_INTELLIGENCE",
    audience: "PRO",
    name: "Intelligence",
    tagline: "Understand the demand",
    prices: { MONTHLY: 399, ANNUAL: 3990 },
    features: [
      "Everything in Visibility",
      "Portfolio of up to 200 pictures",
      "Advanced demand analysis: appearances in searches, profile clicks, saves and average match score",
      "Full market insights",
    ],
    limits: {
      freeSearches: UNLIMITED,
      newConversationsPerMonth: 0,
      portfolioImages: 200,
      seeMakers: true,
      seeContactDetails: true,
      savedLibrary: true,
      marketInsights: true,
      analytics: true,
      searchBoost: 0.12,
      featured: true,
    },
  },
  PRO_FOUNDING: {
    id: "PRO_FOUNDING",
    audience: "PRO",
    name: "Founding Partner",
    tagline: "Launch-phase programme — limited places",
    hidden: true, // remplacé en v2 par l'offre de lancement (−20 % les 2 premiers mois)
    prices: { ANNUAL: 1490 },
    features: ["Full Intelligence package", "12-month partnership for launch-phase supporters", "Founding Partner badge", "Price locked for 12 months"],
    seatsLimit: 50,
    limits: {
      freeSearches: UNLIMITED,
      newConversationsPerMonth: 0,
      portfolioImages: 200,
      seeMakers: true,
      seeContactDetails: true,
      savedLibrary: true,
      marketInsights: true,
      analytics: true,
      searchBoost: 0.12,
      featured: true,
    },
  },
};

/** Seules ces offres rendent un maker visible sur SEFIKH. */
export const LISTED_PLAN_IDS: PlanId[] = ["PRO_PRO", "PRO_VISIBILITY", "PRO_INTELLIGENCE", "PRO_FOUNDING"];

export const CLIENT_PLAN_IDS: PlanId[] = ["CLIENT_FREE", "CLIENT_PRO", "CLIENT_STUDIO"];
export const PRO_PLAN_IDS: PlanId[] = ["PRO_BASIC", "PRO_PRO", "PRO_VISIBILITY", "PRO_INTELLIGENCE", "PRO_FOUNDING"];

export function getPlan(id: string | null | undefined): Plan {
  return PLANS[(id as PlanId) ?? "CLIENT_FREE"] ?? PLANS.CLIENT_FREE;
}

export function defaultPlanFor(role: string): PlanId {
  return role === "PRO" ? "PRO_BASIC" : "CLIENT_FREE";
}

export function isPaid(id: string) {
  const p = getPlan(id);
  return (p.prices.ANNUAL ?? 0) > 0 || (p.prices.MONTHLY ?? 0) > 0;
}

/** Offre de lancement : remise sur les premiers mois d'un abonnement mensuel. */
export const LAUNCH_DISCOUNT = { percent: 20, months: 2 } as const;

/** Prix TTC en euros pour une durée, selon le statut (indépendant ou entreprise). */
export function planPrice(plan: Plan, term: Term, independent = false): number | undefined {
  return (independent ? plan.independentPrices?.[term] : undefined) ?? plan.prices[term];
}

/** Nom affiché d'une offre (les offres créatifs ont un nom propre en français). */
export function planName(plan: Plan, tr: ((key: string) => string) & { locale: string }) {
  return tr.locale === "fr" && plan.frName ? plan.frName : tr(plan.name);
}

export function formatLimit(n: number) {
  return Number.isFinite(n) ? String(n) : "Unlimited";
}
