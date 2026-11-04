import "server-only";
import { db } from "@/lib/db";
import { getT } from "@/i18n/server";
import { embedText } from "@/lib/clip";
import { VOCABULARY, type TagKind } from "@/lib/constants";
import { continentOf, detectLocation, distanceKm, findCity, findCountry, type City } from "@/lib/geo";
import { cosine, fromBytes } from "@/lib/images";
import { getPlan } from "@/lib/plans";
import { parseList } from "@/lib/utils";
import { LISTED_COMPANY } from "@/lib/access";

// ───────────────────────── Analyse de la requête ─────────────────────────

export type DetectedTag = { kind: TagKind; name: string };

const STOPWORDS = new Set(
  "a an and the for with of in on to by from at my our your i we me is are be looking need want create find some any into like near around about this that de la le les des du un une et pour avec en au aux sur dans je nous cherche besoin projet project".split(" "),
);

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function containsPhrase(haystack: string, phrase: string) {
  const p = norm(phrase).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${p}s?([^a-z0-9]|$)`).test(haystack);
}

/** Détecte compétences / matériaux / techniques / secteurs et localisation dans un texte libre. */
export function parseQuery(text: string) {
  const t = norm(text);
  const tags: DetectedTag[] = [];
  for (const [kind, entries] of Object.entries(VOCABULARY) as [TagKind, (typeof VOCABULARY)[TagKind]][]) {
    for (const v of entries) {
      if ([v.name, ...(v.synonyms ?? [])].some((s) => containsPhrase(t, s))) tags.push({ kind, name: v.name });
    }
  }
  const location = detectLocation(text);
  const words = t
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !location.matched.includes(w));
  return { tags, location, words: [...new Set(words)] };
}

// ───────────────────────── Moteur ─────────────────────────

export type SearchInput = {
  q?: string;
  skills?: string[];
  materials?: string[];
  techniques?: string[];
  sectors?: string[];
  kind?: string;
  near?: string; // ville ou pays
  radiusKm?: number;
  maxLeadTime?: number;
  imageEmbedding?: Float32Array | null;
  imageColors?: number[] | null;
  sort?: "relevance" | "distance" | "recent";
};

export type SearchResult = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  kind: string;
  city: string | null;
  country: string | null;
  verified: boolean;
  featured: boolean;
  plan: string;
  score: number;
  match: number; // 0-100, affiché à l'utilisateur
  distance: number | null;
  reasons: string[];
  tags: { kind: string; name: string }[];
  image: { key: string; width: number; height: number; title: string | null } | null;
  gallery: string[];
};

async function loadCandidates() {
  return db.company.findMany({
    where: LISTED_COMPANY,
    include: {
      user: { select: { plan: true } },
      tags: { include: { tag: true } },
      portfolio: {
        orderBy: { position: "asc" },
        select: { id: true, key: true, thumbKey: true, width: true, height: true, title: true, description: true, embedding: true, colorVector: true },
      },
    },
  });
}

const clamp = (x: number) => Math.max(0, Math.min(1, x));
/** Les similarités CLIP texte↔image tombent typiquement entre 0,15 et 0,33. */
const clipTextScale = (s: number) => clamp((s - 0.19) / 0.12);
/** Image↔image : 0,5 = vague ressemblance, 0,9+ = quasi identique. */
const clipImageScale = (s: number) => clamp((s - 0.45) / 0.45);

export async function runSearch(input: SearchInput) {
  const tr = await getT();
  const parsed = parseQuery(input.q ?? "");
  const requested = new Map<string, DetectedTag>();
  for (const t of parsed.tags) requested.set(`${t.kind}:${t.name}`, t);

  const hardFilters: [TagKind, string[]][] = [
    ["SKILL", input.skills ?? []],
    ["MATERIAL", input.materials ?? []],
    ["TECHNIQUE", input.techniques ?? []],
    ["SECTOR", input.sectors ?? []],
  ];

  // Localisation : champ explicite prioritaire, sinon détectée dans la requête.
  let city: City | null = null;
  let country: string | null = null;
  if (input.near) {
    city = findCity(input.near);
    country = city?.country ?? findCountry(input.near) ?? detectLocation(input.near).country ?? null;
    if (!city) city = detectLocation(input.near).city ?? null;
  } else {
    city = parsed.location.city ?? null;
    country = parsed.location.country ?? null;
  }
  const continent = continentOf(country);

  const textEmbedding = input.q ? await embedText(input.q) : null;
  const candidates = await loadCandidates();
  const now = new Date();

  const results: SearchResult[] = [];
  for (const c of candidates) {
    const plan = getPlan(c.user.plan);
    const companyTags = c.tags.map((t) => ({ kind: t.tag.kind, name: t.tag.name }));
    const has = (kind: string, name: string) => companyTags.some((t) => t.kind === kind && t.name === name);

    // Filtres stricts (cases cochées) : au moins une valeur par groupe.
    if (hardFilters.some(([kind, values]) => values.length > 0 && !values.some((v) => has(kind, v)))) continue;
    if (input.kind && c.kind !== input.kind) continue;
    if (input.maxLeadTime && c.leadTimeMin && c.leadTimeMin > input.maxLeadTime) continue;

    const distance = city && c.lat != null && c.lng != null ? distanceKm(city, { lat: c.lat, lng: c.lng }) : null;
    if (input.radiusKm && city && (distance == null || distance > input.radiusKm)) continue;

    const reasons: string[] = [];
    const parts: { w: number; s: number }[] = [];

    // 1. Correspondance vocabulaire
    if (requested.size) {
      let hit = 0;
      for (const t of requested.values()) {
        if (has(t.kind, t.name)) {
          hit += t.kind === "SECTOR" ? 0.7 : 1;
          if (reasons.length < 3) reasons.push(tr(t.name));
        }
      }
      parts.push({ w: 0.4, s: hit / requested.size });
    }

    // 2. Mots libres dans le texte du profil
    if (parsed.words.length) {
      const blob = norm(
        [c.name, c.tagline, c.about, c.productionCapacity, c.city, c.country, ...parseList(c.keywords), ...companyTags.map((t) => t.name), ...c.portfolio.map((p) => `${p.title ?? ""} ${p.description ?? ""}`)].join(" "),
      );
      const found = parsed.words.filter((w) => blob.includes(w));
      parts.push({ w: 0.15, s: found.length / parsed.words.length });
    }

    // 3. Similarité visuelle (CLIP texte→image, image→image ou empreinte couleur)
    let best: { img: (typeof c.portfolio)[number]; s: number } | null = null;
    if (input.imageEmbedding || input.imageColors || textEmbedding) {
      for (const img of c.portfolio) {
        let image: number | null = null;
        const emb = fromBytes(img.embedding);
        if (input.imageEmbedding && emb) image = clipImageScale(cosine(input.imageEmbedding, emb));
        else if (input.imageColors && img.colorVector) image = clamp((cosine(input.imageColors, parseList<number>(img.colorVector)) - 0.5) / 0.5) * 0.8;
        const text = textEmbedding && emb ? clipTextScale(cosine(textEmbedding, emb)) : null;
        // Image et texte combinés : l'image guide, le texte précise.
        const s = image != null && text != null ? image * 0.7 + text * 0.3 : (image ?? text ?? 0);
        if (!best || s > best.s) best = { img, s };
      }
      const weight = input.imageEmbedding || input.imageColors ? 0.75 : 0.3;
      parts.push({ w: weight, s: best?.s ?? 0 });
      if (best && best.s > 0.55 && (input.imageEmbedding || input.imageColors)) reasons.unshift(tr("Visually similar work"));
    }

    // 4. Localisation
    if (city || country) {
      let s = 0;
      const areas = parseList(c.operationAreas);
      if (distance != null && distance < 15) s = 1;
      else if (distance != null && distance < 150) s = 0.85;
      else if (country && c.country === country) s = 0.7;
      else if ((country && areas.includes(country)) || (continent && areas.includes(continent))) s = 0.55;
      else if (continent && c.continent === continent) s = 0.35;
      parts.push({ w: 0.2, s });
      if (distance != null && distance < 150) reasons.push(distance < 15 ? tr("In {city}", { city: city!.name }) : tr("{km} km from {city}", { km: Math.round(distance), city: city!.name }));
      else if (s >= 0.55) reasons.push(tr("Works in {country}", { country: country ?? "" }));
    }

    const totalW = parts.reduce((a, p) => a + p.w, 0);
    let score = totalW ? parts.reduce((a, p) => a + p.w * p.s, 0) / totalW : 0.5;
    const hasQuery = parts.length > 0;
    if (hasQuery && score < 0.12) continue; // non pertinent

    const featured = plan.limits.featured || (c.featuredUntil != null && c.featuredUntil > now);
    score += plan.limits.searchBoost + (c.verified ? 0.02 : 0);

    const cover = best && best.s > 0 ? best.img : c.portfolio[0];
    results.push({
      id: c.id,
      slug: c.slug,
      name: c.name,
      tagline: c.tagline,
      kind: c.kind,
      city: c.city,
      country: c.country,
      verified: c.verified,
      featured,
      plan: plan.id,
      score,
      match: Math.round(clamp(score) * 100),
      distance: distance != null ? Math.round(distance) : null,
      reasons: [...new Set(reasons)].slice(0, 3),
      tags: companyTags,
      image: cover ? { key: cover.thumbKey ?? cover.key, width: cover.width, height: cover.height, title: cover.title } : null,
      gallery: c.portfolio.filter((p) => p.id !== cover?.id).slice(0, 3).map((p) => p.thumbKey ?? p.key),
    });
  }

  // Coupe relative : on ne garde que les résultats raisonnablement proches du meilleur.
  const hasCriteria = !!(input.q || input.imageEmbedding || input.imageColors || city || country);
  if (hasCriteria && results.length > 3) {
    const best = Math.max(...results.map((r) => r.score));
    for (let i = results.length - 1; i >= 0; i--) if (results[i]!.score < best * 0.45) results.splice(i, 1);
  }

  if (input.sort === "distance" && city) results.sort((a, b) => (a.distance ?? 1e9) - (b.distance ?? 1e9));
  else if (input.sort === "recent") results.sort((a, b) => a.name.localeCompare(b.name));
  else results.sort((a, b) => b.score - a.score);

  return {
    results,
    detected: { tags: [...requested.values()], city: city?.name ?? null, country },
    usedVisualAI: !!(textEmbedding || input.imageEmbedding),
  };
}

// ───────────────────────── Quotas & journalisation ─────────────────────────

export type SearchMode = "TEXT" | "IMAGE" | "FILTER" | "PROJECT";

/** Recherches effectuées par un compte depuis sa création, tous modes confondus. */
export async function searchesUsed(userId: string) {
  return db.searchLog.count({ where: { userId, mode: { in: ["TEXT", "IMAGE", "FILTER"] } } });
}

export async function logSearch(opts: {
  userId?: string | null;
  visitorId?: string | null;
  mode: SearchMode;
  query?: string | null;
  terms: string[];
  location?: string | null;
  results: SearchResult[];
  imageKey?: string | null;
  embedding?: Buffer | null;
}) {
  const log = await db.searchLog.create({
    data: {
      userId: opts.userId ?? null,
      visitorId: opts.visitorId ?? null,
      mode: opts.mode,
      query: opts.query?.slice(0, 500) ?? null,
      terms: JSON.stringify(opts.terms),
      location: opts.location ?? null,
      resultsCount: opts.results.length,
      imageKey: opts.imageKey ?? null,
      embedding: opts.embedding ? new Uint8Array(opts.embedding) : null,
    },
  });
  if (opts.results.length) {
    await db.searchImpression.createMany({
      data: opts.results.slice(0, 24).map((r, i) => ({ searchId: log.id, companyId: r.id, rank: i + 1 })),
    });
  }
  return log;
}

/** Retrouve une recherche identique récente pour ne pas décompter deux fois un rechargement. */
export async function findRecentSearch(who: { userId?: string | null; visitorId?: string | null }, mode: SearchMode, query: string) {
  if (!who.userId && !who.visitorId) return null;
  return db.searchLog.findFirst({
    where: {
      mode,
      query,
      createdAt: { gte: new Date(Date.now() - 30 * 60_000) },
      ...(who.userId ? { userId: who.userId } : { visitorId: who.visitorId }),
    },
    select: { id: true },
  });
}
