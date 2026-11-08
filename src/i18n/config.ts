// Langues de l'interface. L'anglais est la langue source : les textes du code servent de clés.

export const LOCALES = ["en", "fr", "it", "es", "zh"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "sefikh_locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  it: "Italiano",
  es: "Español",
  zh: "中文",
};

/** Balise régionale utilisée pour le formatage des dates, nombres et montants. */
const INTL_TAG: Record<Locale, string> = { en: "en-GB", fr: "fr-FR", it: "it-IT", es: "es-ES", zh: "zh-CN" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Première langue prise en charge dans un en-tête Accept-Language. */
export function matchLocale(header: string | null | undefined): Locale {
  for (const part of (header ?? "").split(",")) {
    const code = part.split(";")[0]?.trim().slice(0, 2).toLowerCase();
    if (isLocale(code)) return code;
  }
  return DEFAULT_LOCALE;
}

export type Catalog = Record<string, string>;
type Vars = Record<string, string | number>;

export type Translator = ((key: string | null | undefined, vars?: Vars) => string) & {
  locale: Locale;
  date: (d: Date | string, opts?: Intl.DateTimeFormatOptions) => string;
  relative: (d: Date | string) => string;
  money: (amountCents: number, currency?: string) => string;
  number: (n: number) => string;
  bytes: (bytes: number) => string;
};

/**
 * Traducteur « gettext » : la clé est le texte anglais. Une clé absente du catalogue s'affiche telle quelle,
 * ce qui rend sûr l'appel sur une valeur dynamique (nom d'offre, erreur d'API, tag…).
 */
export function createTranslator(locale: Locale, catalog: Catalog): Translator {
  const tag = INTL_TAG[locale];
  const tr = ((key, vars) => {
    if (!key) return "";
    const text = catalog[key] ?? key;
    return vars ? text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m)) : text;
  }) as Translator;

  tr.locale = locale;
  tr.date = (d, opts = { day: "numeric", month: "short", year: "numeric" }) => new Intl.DateTimeFormat(tag, opts).format(new Date(d));
  tr.relative = (d) => {
    const diff = (Date.now() - new Date(d).getTime()) / 1000;
    if (diff >= 86400 * 7) return tr.date(d);
    // « à l'instant » dans chaque langue, sans passer par le catalogue (src/i18n n'est pas inventorié).
    if (diff < 60) return new Intl.RelativeTimeFormat(tag, { numeric: "auto" }).format(0, "second");
    const rtf = new Intl.RelativeTimeFormat(tag, { numeric: "always", style: "short" });
    if (diff < 3600) return rtf.format(-Math.floor(diff / 60), "minute");
    if (diff < 86400) return rtf.format(-Math.floor(diff / 3600), "hour");
    return rtf.format(-Math.floor(diff / 86400), "day");
  };
  tr.money = (amountCents, currency = "eur") =>
    new Intl.NumberFormat(tag, { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: amountCents % 100 ? 2 : 0 }).format(amountCents / 100);
  tr.number = (n) => new Intl.NumberFormat(tag).format(n);
  tr.bytes = (bytes) => {
    if (bytes < 1024) return `${tr.number(bytes)} B`;
    if (bytes < 1024 * 1024) return `${tr.number(Math.round(bytes / 1024))} KB`;
    return `${new Intl.NumberFormat(tag, { maximumFractionDigits: 1 }).format(bytes / 1024 / 1024)} MB`;
  };
  return tr;
}
