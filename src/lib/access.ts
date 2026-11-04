import { getPlan } from "@/lib/plans";

// Règle d'accès aux makers : sans offre payante, les résultats sont anonymes et le contact impossible.
// L'anonymisation se fait côté serveur : le nom, le slug et l'identifiant ne sont jamais envoyés au navigateur.

type Viewer = { role: string; plan: string } | null | undefined;

export function canSeeMakers(user: Viewer) {
  return !!user && (user.role === "ADMIN" || getPlan(user.plan).limits.seeMakers);
}

type Anonymizable = {
  kind: string;
  city: string | null;
  country: string | null;
  verified: boolean;
  featured?: boolean;
  image: { key: string; width: number; height: number; title?: string | null } | null;
  match?: number;
  reasons?: string[];
  distance?: number | null;
};

/** Ne conserve d'un maker que ce qui ne permet pas de l'identifier. */
export function anonymize(m: Anonymizable, index: number) {
  return {
    id: `anonymous-${index}`,
    anonymous: true as const,
    slug: "",
    name: "",
    tagline: null,
    kind: m.kind,
    city: m.city,
    country: m.country,
    verified: m.verified,
    featured: m.featured,
    image: m.image ? { key: m.image.key, width: m.image.width, height: m.image.height, title: null } : null,
    gallery: [] as string[],
    match: m.match,
    reasons: m.reasons,
    distance: m.distance,
  };
}
