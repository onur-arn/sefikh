// Catalogue des abonnements SEFIKH (source unique pour l'UI, les contrôles d'accès et Stripe).
// Prix en euros TTC par mois. « ANNUAL » = engagement 12 mois facturé mensuellement.

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
  tagline: string;
  prices: Partial<Record<Term, number>>; // € / mois ; absent = non proposé sur cette durée
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
    tagline: "Identify · Source · Save · Connect",
    prices: { ANNUAL: 39, MONTHLY: 49 },
    highlight: true,
    features: [
      "Unlimited AI-powered searches",
      "Unlimited image searches",
      "Full company profiles with contact details",
      "Unlimited direct messaging",
      "Supplier library & saved makers",
      "Personalised suggestions",
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
    tagline: "Collaborate at studio scale",
    prices: { ANNUAL: 79, MONTHLY: 95 },
    features: [
      "Everything included in Pro",
      "Cloud documents for every project",
      "Full Trends & Insights market data",
      "Quarterly demand reporting",
      "Priority support",
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
    prices: { ANNUAL: 149, MONTHLY: 179 },
    features: ["Professional profile with verified badge", "Portfolio of up to 60 pictures", "Visibility analytics"],
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
    prices: { ANNUAL: 299, MONTHLY: 349 },
    highlight: true,
    features: ["Everything in Pro", "Portfolio of up to 120 pictures", "Boosted ranking in search results", "Featured in the Content section", "Editorial features & dedicated content"],
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
    prices: { ANNUAL: 499, MONTHLY: 579 },
    features: ["Everything in Visibility", "Portfolio of up to 200 pictures", "Advanced demand analysis", "Full market insights", "Quarterly demand reporting"],
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
    prices: { ANNUAL: 149 },
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

export function formatLimit(n: number) {
  return Number.isFinite(n) ? String(n) : "Unlimited";
}
