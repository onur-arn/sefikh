// Interface de choix du visuel : un thème se résume à cinq couleurs, trois polices et quelques détails.
// Tout le reste (filets, gris, teintes d'accent) en est déduit, pour que chaque réglage reste cohérent.

export type Colors = { bg: string; surface: string; ink: string; accent: string; dark: string };
export type Details = {
  corners: "droit" | "doux" | "arrondi";
  fields: "ligne" | "cadre";
  titleCase: "normale" | "capitales";
  tracking: "serre" | "normal" | "large";
  weight: "leger" | "regulier" | "appuye";
  logo: "titre" | "texte" | "legende";
  photos: "couleur" | "chaud" | "desature" | "nb";
};
export type Theme = {
  direction: string | null;
  colors: Colors;
  fonts: { display: string; text: string; caption: string };
  details: Details;
};

export type FontRole = "display" | "text" | "caption";
export type Font = { id: string; name: string; kind: string; weights: number[]; italic?: boolean; roles: FontRole[] };

export const FONTS: Font[] = [
  { id: "instrument-serif", name: "Instrument Serif", kind: "Didone condensée", weights: [400], italic: true, roles: ["display"] },
  { id: "cormorant", name: "Cormorant Garamond", kind: "Garalde de titrage", weights: [300, 400, 500, 600], italic: true, roles: ["display"] },
  { id: "fraunces", name: "Fraunces", kind: "Old style expressive", weights: [300, 400, 500, 600], italic: true, roles: ["display"] },
  { id: "newsreader", name: "Newsreader", kind: "Serif éditoriale", weights: [300, 400, 500, 600], italic: true, roles: ["display", "text"] },
  { id: "bodoni", name: "Bodoni Moda", kind: "Didone de mode", weights: [400, 500, 600], italic: true, roles: ["display"] },
  { id: "caslon", name: "Libre Caslon Display", kind: "Transitionnelle fine", weights: [400], roles: ["display"] },
  { id: "dm-serif", name: "DM Serif Display", kind: "Serif contrastée", weights: [400], italic: true, roles: ["display"] },
  { id: "gloock", name: "Gloock", kind: "Serif d'affiche", weights: [400], roles: ["display"] },
  { id: "young-serif", name: "Young Serif", kind: "Old style dense", weights: [400], roles: ["display"] },
  { id: "plex-serif", name: "IBM Plex Serif", kind: "Serif d'ingénieur", weights: [300, 400, 500, 600], italic: true, roles: ["display"] },
  { id: "italiana", name: "Italiana", kind: "Capitale calligraphique", weights: [400], roles: ["display"] },
  { id: "marcellus", name: "Marcellus", kind: "Lapidaire romaine", weights: [400], roles: ["display"] },
  { id: "tenor", name: "Tenor Sans", kind: "Humaniste élégante", weights: [400], roles: ["display"] },
  { id: "syne", name: "Syne", kind: "Grotesque d'art", weights: [400, 500, 600], roles: ["display"] },
  { id: "bricolage", name: "Bricolage Grotesque", kind: "Grotesque vivante", weights: [300, 400, 500, 600], roles: ["display"] },
  { id: "inter-tight", name: "Inter Tight", kind: "Néo-grotesque serrée", weights: [300, 400, 500, 600], roles: ["display"] },
  { id: "space-grotesk", name: "Space Grotesk", kind: "Grotesque technique", weights: [300, 400, 500, 600], roles: ["display", "text"] },
  { id: "jost", name: "Jost", kind: "Géométrique Bauhaus", weights: [300, 400, 500, 600], roles: ["display", "text", "caption"] },
  { id: "instrument-sans", name: "Instrument Sans", kind: "Grotesque douce", weights: [400, 500, 600], roles: ["text", "caption"] },
  { id: "inter", name: "Inter", kind: "Néo-grotesque", weights: [300, 400, 500, 600], roles: ["text"] },
  { id: "hanken", name: "Hanken Grotesk", kind: "Grotesque neutre", weights: [300, 400, 500, 600], roles: ["text"] },
  { id: "figtree", name: "Figtree", kind: "Géométrique amicale", weights: [300, 400, 500, 600], roles: ["text"] },
  { id: "manrope", name: "Manrope", kind: "Géométrique moderne", weights: [300, 400, 500, 600], roles: ["text"] },
  { id: "work-sans", name: "Work Sans", kind: "Grotesque d'atelier", weights: [300, 400, 500, 600], roles: ["text"] },
  { id: "plex-sans", name: "IBM Plex Sans", kind: "Grotesque d'ingénieur", weights: [300, 400, 500, 600], roles: ["text"] },
  { id: "eb-garamond", name: "EB Garamond", kind: "Garalde de lecture", weights: [400, 500, 600], italic: true, roles: ["text"] },
  { id: "dm-mono", name: "DM Mono", kind: "Chasse fixe douce", weights: [300, 400, 500], roles: ["caption"] },
  { id: "plex-mono", name: "IBM Plex Mono", kind: "Chasse fixe d'ingénieur", weights: [300, 400, 500], roles: ["caption"] },
  { id: "jetbrains", name: "JetBrains Mono", kind: "Chasse fixe nette", weights: [300, 400, 500], roles: ["caption"] },
  { id: "space-mono", name: "Space Mono", kind: "Chasse fixe rétro", weights: [400], roles: ["caption"] },
  { id: "spline-mono", name: "Spline Sans Mono", kind: "Chasse fixe ronde", weights: [300, 400, 500], roles: ["caption"] },
];

const BASE_DETAILS: Details = { corners: "droit", fields: "ligne", titleCase: "normale", tracking: "normal", weight: "regulier", logo: "titre", photos: "couleur" };

type Direction = { id: string; name: string; note: string; colors: Colors; fonts: Theme["fonts"]; details?: Partial<Details> };

export const DIRECTIONS: Direction[] = [
  {
    id: "cahier", name: "Cahier d'architecte", note: "Chaux, encre de noix, terre cuite. Le visuel actuel.",
    colors: { bg: "#f6f3ec", surface: "#fbf9f4", ink: "#1f1c17", accent: "#a2492a", dark: "#26221c" },
    fonts: { display: "instrument-serif", text: "instrument-sans", caption: "dm-mono" },
  },
  {
    id: "galerie", name: "Galerie blanche", note: "Cimaise nue, un seul bleu. L'œuvre avant tout.",
    colors: { bg: "#ffffff", surface: "#f7f7f6", ink: "#111111", accent: "#1d3fbb", dark: "#141414" },
    fonts: { display: "inter-tight", text: "inter", caption: "plex-mono" },
    details: { tracking: "serre", logo: "texte" },
  },
  {
    id: "travertin", name: "Travertin", note: "Pierre claire et bronze. Hôtellerie, calme, matière.",
    colors: { bg: "#efe8dc", surface: "#f7f2e9", ink: "#2b241c", accent: "#7d5c2f", dark: "#3a2f24" },
    fonts: { display: "cormorant", text: "jost", caption: "jost" },
    details: { weight: "leger", photos: "chaud" },
  },
  {
    id: "nuit", name: "Nuit d'atelier", note: "Anthracite et laiton. Un écrin sombre pour la photo.",
    colors: { bg: "#161513", surface: "#1f1d1a", ink: "#ece6da", accent: "#c9a36a", dark: "#0c0b0a" },
    fonts: { display: "fraunces", text: "hanken", caption: "jetbrains" },
    details: { weight: "leger" },
  },
  {
    id: "patine", name: "Vert-de-gris", note: "Cuivre oxydé et papier de lin. Végétal, posé.",
    colors: { bg: "#e9ece4", surface: "#f4f5ef", ink: "#1c2a25", accent: "#2f6b5e", dark: "#1c2f29" },
    fonts: { display: "newsreader", text: "figtree", caption: "dm-mono" },
    details: { photos: "desature" },
  },
  {
    id: "prusse", name: "Bleu de Prusse", note: "Le tirage de plan. Rigueur, cotes, précision.",
    colors: { bg: "#f2f4f3", surface: "#fbfbf9", ink: "#12233f", accent: "#1f4e8c", dark: "#0f2240" },
    fonts: { display: "plex-serif", text: "plex-sans", caption: "plex-mono" },
    details: { weight: "leger", fields: "cadre", logo: "legende" },
  },
  {
    id: "beton", name: "Béton brut", note: "Banché, sans apprêt, un signal orange.",
    colors: { bg: "#dcdbd6", surface: "#e9e8e3", ink: "#141414", accent: "#a82f08", dark: "#1a1a1a" },
    fonts: { display: "space-grotesk", text: "space-grotesk", caption: "space-mono" },
    details: { titleCase: "capitales", tracking: "serre", weight: "appuye", fields: "cadre", logo: "texte", photos: "nb" },
  },
  {
    id: "platre", name: "Plâtre rose", note: "Enduit à la chaux et lie-de-vin. Couture, salon.",
    colors: { bg: "#f2e6df", surface: "#faf3ee", ink: "#3a1c1f", accent: "#8c2f39", dark: "#3d1a20" },
    fonts: { display: "bodoni", text: "manrope", caption: "instrument-sans" },
    details: { corners: "doux" },
  },
  {
    id: "velours", name: "Salon de velours", note: "Vert bouteille et or pâle. Le club, la bibliothèque.",
    colors: { bg: "#13211d", surface: "#1a2c27", ink: "#efe7d6", accent: "#d0a35c", dark: "#0b1512" },
    fonts: { display: "gloock", text: "figtree", caption: "spline-mono" },
  },
  {
    id: "argile", name: "Argile", note: "Terre crue, formes tendres. Contemporain, accueillant.",
    colors: { bg: "#ede3d6", surface: "#f7f0e6", ink: "#2e2620", accent: "#a84a22", dark: "#352a22" },
    fonts: { display: "young-serif", text: "work-sans", caption: "spline-mono" },
    details: { corners: "arrondi", fields: "cadre" },
  },
];

/** Nuancier : les palettes des directions, plus quelques accords sans typographie associée. */
export const PALETTES: { id: string; name: string; colors: Colors }[] = [
  ...DIRECTIONS.map((d) => ({ id: d.id, name: d.name, colors: d.colors })),
  { id: "lin", name: "Lin lavé", colors: { bg: "#ecebe4", surface: "#f6f5f0", ink: "#26261f", accent: "#5d6128", dark: "#2a2b22" } },
  { id: "ocre", name: "Ocre de Roussillon", colors: { bg: "#f4ecdc", surface: "#fbf6ea", ink: "#2d2115", accent: "#8f5a10", dark: "#3b2a18" } },
  { id: "ardoise", name: "Ardoise", colors: { bg: "#1c1f22", surface: "#25292d", ink: "#e8e9e6", accent: "#9fb7c4", dark: "#101214" } },
  { id: "aubergine", name: "Aubergine", colors: { bg: "#f1ecef", surface: "#faf6f8", ink: "#2a1a28", accent: "#5b2a4e", dark: "#2c1729" } },
];

export const PIGMENTS: { name: string; hex: string }[] = [
  { name: "Terre cuite", hex: "#a2492a" },
  { name: "Sienne", hex: "#8a4a1c" },
  { name: "Ocre", hex: "#8f5a10" },
  { name: "Bronze", hex: "#7d5c2f" },
  { name: "Olive", hex: "#5d6128" },
  { name: "Vert-de-gris", hex: "#2f6b5e" },
  { name: "Bleu de Prusse", hex: "#1f4e8c" },
  { name: "Outremer", hex: "#1d3fbb" },
  { name: "Aubergine", hex: "#5b2a4e" },
  { name: "Lie-de-vin", hex: "#8c2f39" },
  { name: "Minium", hex: "#b5350c" },
  { name: "Graphite", hex: "#3c3c3a" },
];

export const COLOR_ROLES: { key: keyof Colors; label: string; hint: string }[] = [
  { key: "bg", label: "Fond", hint: "Le mur : fond général des pages" },
  { key: "surface", label: "Surface", hint: "Blocs et cartes posés sur le fond" },
  { key: "ink", label: "Encre", hint: "Texte, filets forts, boutons" },
  { key: "accent", label: "Accent", hint: "Survols et points d'attention" },
  { key: "dark", label: "Sombre", hint: "Bandeaux derrière les photos" },
];

export const DETAIL_OPTIONS: { key: keyof Details; label: string; hint: string; options: { value: string; label: string }[] }[] = [
  { key: "corners", label: "Angles", hint: "Boutons, cartes, images", options: [{ value: "droit", label: "Tire-ligne" }, { value: "doux", label: "Adoucis" }, { value: "arrondi", label: "Arrondis" }] },
  { key: "fields", label: "Champs de saisie", hint: "Formulaires et recherche", options: [{ value: "ligne", label: "Soulignés" }, { value: "cadre", label: "Encadrés" }] },
  { key: "titleCase", label: "Casse des titres", hint: "Plus affirmé en capitales", options: [{ value: "normale", label: "Bas de casse" }, { value: "capitales", label: "Capitales" }] },
  { key: "tracking", label: "Interlettrage des titres", hint: "L'espace entre les lettres", options: [{ value: "serre", label: "Serré" }, { value: "normal", label: "Courant" }, { value: "large", label: "Aéré" }] },
  { key: "weight", label: "Graisse des titres", hint: "Selon les graisses de la police", options: [{ value: "leger", label: "Légère" }, { value: "regulier", label: "Normale" }, { value: "appuye", label: "Appuyée" }] },
  { key: "logo", label: "Logotype", hint: "Dessin du mot SEFIKH", options: [{ value: "titre", label: "Police de titre" }, { value: "texte", label: "Police de texte" }, { value: "legende", label: "Police de légende" }] },
  { key: "photos", label: "Photographies", hint: "Traitement de toutes les images", options: [{ value: "couleur", label: "Naturel" }, { value: "chaud", label: "Chaud" }, { value: "desature", label: "Désaturé" }, { value: "nb", label: "Noir et blanc" }] },
];

export const PREVIEW_PAGES: { path: string; label: string }[] = [
  { path: "/", label: "Accueil" },
  { path: "/about", label: "À propos" },
  { path: "/content", label: "Contenus" },
  { path: "/insights", label: "Tendances" },
  { path: "/pricing", label: "Tarifs" },
  { path: "/journal/the-return-of-patinated-brass", label: "Article" },
  { path: "/register", label: "Inscription" },
];

// ── Couleurs ─────────────────────────────────────────────────

const HEX = /^#[0-9a-f]{6}$/;
export const isHex = (v: unknown): v is string => typeof v === "string" && HEX.test(v);

function rgb(hex: string) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}
export function mix(a: string, b: string, amount: number) {
  const [x, y] = [rgb(a), rgb(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i]! - v) * amount).toString(16).padStart(2, "0")).join("")}`;
}
function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}
export const isDark = (hex: string) => luminance(hex) < 0.18;

/** Rapproche `color` de `toward` jusqu'à atteindre le contraste voulu sur `on`. */
function ensureContrast(color: string, toward: string, on: string, target: number) {
  let out = color;
  for (let i = 1; i <= 10 && contrast(out, on) < target; i++) out = mix(color, toward, i / 10);
  return out;
}

/** Les variables du site déduites des cinq couleurs. */
export function tokens(c: Colors) {
  const dark = isDark(c.bg);
  return {
    ivory: c.bg,
    paper: c.surface,
    sand: mix(c.bg, c.ink, 0.07),
    line: mix(c.bg, c.ink, 0.16),
    ink: c.ink,
    "ink-soft": mix(c.ink, c.bg, 0.16),
    muted: ensureContrast(mix(c.ink, c.bg, 0.42), c.ink, c.bg, 4.5),
    brass: c.accent,
    "brass-dark": mix(c.accent, c.ink, 0.3),
    "brass-light": mix(c.accent, c.bg, 0.82),
    espresso: c.dark,
    wine: mix(c.accent, c.dark, 0.4),
    success: dark ? "#8fb394" : "#4c6b4f",
    danger: dark ? "#e08a7e" : "#a33a2f",
  };
}

// ── Polices ──────────────────────────────────────────────────

export const fontById = (id: string) => FONTS.find((f) => f.id === id);

export function fontUrl(font: Font) {
  const family = font.name.replaceAll(" ", "+");
  const axis = font.italic
    ? `ital,wght@${[...font.weights.map((w) => `0,${w}`), ...font.weights.map((w) => `1,${w}`)].join(";")}`
    : `wght@${font.weights.join(";")}`;
  return `https://fonts.googleapis.com/css2?family=${family}:${axis}&display=swap`;
}

const FALLBACK = {
  sans: 'ui-sans-serif, system-ui, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif',
  serif: 'ui-serif, Georgia, "Songti SC", "Noto Serif SC", serif',
  mono: 'ui-monospace, Menlo, "PingFang SC", monospace',
};
export const fontStack = (id: string, fallback: keyof typeof FALLBACK) => `"${fontById(id)?.name ?? "serif"}", ${FALLBACK[fallback]}`;

/** Graisse disponible la plus proche de celle demandée. */
function nearestWeight(font: Font | undefined, target: number) {
  return (font?.weights ?? [400]).reduce((best, w) => (Math.abs(w - target) < Math.abs(best - target) ? w : best));
}

const RADII = {
  droit: [1, 1, 2, 2, 2, 2],
  doux: [3, 5, 7, 9, 11, 13],
  arrondi: [8, 12, 16, 20, 24, 28],
};
const WEIGHT = { leger: 300, regulier: 400, appuye: 600 };
const TRACKING = { serre: -0.026, normal: -0.012, large: 0.012 };
const PHOTOS = { couleur: "none", chaud: "sepia(.2) saturate(.92)", desature: "saturate(.5)", nb: "grayscale(1) contrast(1.05)" };

/** La feuille de style qui transforme le site : c'est elle qu'on injecte dans l'aperçu. */
export function buildCss(theme: Theme) {
  const { colors, fonts, details } = theme;
  const t = tokens(colors);
  const onDark = isDark(colors.bg) ? colors.ink : colors.surface;
  const display = fontById(fonts.display);
  const weight = nearestWeight(display, WEIGHT[details.weight]);
  const tracking = TRACKING[details.tracking] + (details.titleCase === "capitales" ? 0.02 : 0);
  const [sm, md, lg, xl, x2, x3] = RADII[details.corners];
  const logo = {
    titre: { family: "var(--font-display)", spacing: "0.1em", size: "1em" },
    texte: { family: "var(--font-sans)", spacing: "0.2em", size: "0.74em" },
    legende: { family: "var(--font-mono)", spacing: "0.26em", size: "0.68em" },
  }[details.logo];
  return `html:root {
${Object.entries(t).map(([k, v]) => `  --color-${k}: ${v};`).join("\n")}
  --font-display: ${fontStack(fonts.display, "serif")};
  --font-sans: ${fontStack(fonts.text, "sans")};
  --font-mono: ${fontStack(fonts.caption, "mono")};
  --radius-sm: ${sm}px; --radius-md: ${md}px; --radius-lg: ${lg}px;
  --radius-xl: ${xl}px; --radius-2xl: ${x2}px; --radius-3xl: ${x3}px;
}
[class*="bg-espresso"] { --color-paper: ${onDark}; --color-ivory: ${onDark}; --color-ink: ${colors.dark}; }
header.bg-transparent { --color-paper: ${onDark}; }
.display {
  font-weight: ${weight};
  letter-spacing: ${tracking}em;
  text-transform: ${details.titleCase === "capitales" ? "uppercase" : "none"};
}
.font-display.tracking-\\[0\\.1em\\] { font-family: ${logo.family}; letter-spacing: ${logo.spacing}; font-size: calc(1.75rem * ${logo.size.replace("em", "")}); }
${details.fields === "cadre" ? ".field { border: 1px solid color-mix(in srgb, var(--color-ink) 32%, transparent); border-radius: var(--radius-md); padding: 0.6rem 0.8rem; }" : ""}
main img, aside img { filter: ${PHOTOS[details.photos]}; }
`;
}

// ── Thèmes ───────────────────────────────────────────────────

export function themeFromDirection(id: string): Theme {
  const d = DIRECTIONS.find((x) => x.id === id) ?? DIRECTIONS[0]!;
  return { direction: d.id, colors: { ...d.colors }, fonts: { ...d.fonts }, details: { ...BASE_DETAILS, ...d.details } };
}
export const defaultTheme = () => themeFromDirection("cahier");

/** Relit un thème venu de l'extérieur (lien, navigateur, formulaire) : renvoie null s'il n'est pas valide. */
export function normalizeTheme(input: unknown): Theme | null {
  if (typeof input !== "object" || input === null) return null;
  const v = input as Partial<Theme>;
  const c = v.colors;
  if (!c || !COLOR_ROLES.every((r) => isHex(c[r.key]))) return null;
  const f = v.fonts;
  if (!f || !(["display", "text", "caption"] as const).every((role) => fontById(f[role])?.roles.includes(role))) return null;
  const d = v.details;
  if (!d || !DETAIL_OPTIONS.every((o) => o.options.some((x) => x.value === d[o.key]))) return null;
  const direction = DIRECTIONS.some((x) => x.id === v.direction) ? v.direction! : null;
  return {
    direction,
    colors: { bg: c.bg, surface: c.surface, ink: c.ink, accent: c.accent, dark: c.dark },
    fonts: { display: f.display, text: f.text, caption: f.caption },
    details: Object.fromEntries(DETAIL_OPTIONS.map((o) => [o.key, d[o.key]])) as Details,
  };
}

export const encodeTheme = (theme: Theme) => btoa(JSON.stringify(theme)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
export function decodeTheme(code: string) {
  try {
    return normalizeTheme(JSON.parse(atob(code.replaceAll("-", "+").replaceAll("_", "/"))));
  } catch {
    return null;
  }
}

export const themeName = (theme: Theme) => DIRECTIONS.find((d) => d.id === theme.direction)?.name ?? "Composition personnelle";

/** Ce que je reporterai dans src/app/globals.css et src/app/layout.tsx une fois le choix fait. */
export function themeSpec(theme: Theme) {
  const t = tokens(theme.colors);
  const f = (id: string) => fontById(id)?.name ?? id;
  return [
    "/* Polices */",
    `/* Titres : ${f(theme.fonts.display)} · Texte : ${f(theme.fonts.text)} · Légendes : ${f(theme.fonts.caption)} */`,
    "",
    "/* Détails */",
    ...DETAIL_OPTIONS.map((o) => `/* ${o.label} : ${o.options.find((x) => x.value === theme.details[o.key])?.label} */`),
    "",
    "@theme {",
    ...Object.entries(t).map(([k, v]) => `  --color-${k}: ${v};`),
    "}",
  ].join("\n");
}
