import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { createTranslator, DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, matchLocale, type Catalog, type Locale, type Translator } from "./config";
import es from "./messages/es.json";
import fr from "./messages/fr.json";
import it from "./messages/it.json";
import zh from "./messages/zh.json";
import clientKeys from "./messages/client-keys.json";

const CATALOGS: Record<Locale, Catalog> = { en: {}, fr, it, es, zh };

/** Langue de la requête : choix enregistré (cookie), sinon langue du navigateur. */
export const getLocale = cache(async (): Promise<Locale> => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  return matchLocale((await headers()).get("accept-language"));
});

export const getT = cache(async (): Promise<Translator> => {
  const locale = await getLocale();
  return createTranslator(locale, CATALOGS[locale]);
});

/** Traducteur pour une langue donnée, hors requête (e-mails : langue du destinataire). */
export function translatorFor(locale: string | null | undefined): Translator {
  const l = isLocale(locale) ? locale : DEFAULT_LOCALE;
  return createTranslator(l, CATALOGS[l]);
}

/** Sous-ensemble du catalogue envoyé au navigateur : seules les clés utilisées par des composants client. */
export function clientCatalog(locale: Locale): Catalog {
  const all = CATALOGS[locale];
  const out: Catalog = {};
  for (const key of clientKeys as string[]) if (all[key]) out[key] = all[key];
  return out;
}
