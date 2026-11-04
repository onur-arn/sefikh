"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createTranslator, DEFAULT_LOCALE, type Catalog, type Locale, type Translator } from "./config";

const I18nContext = createContext<Translator>(createTranslator(DEFAULT_LOCALE, {}));

export function I18nProvider({ locale, catalog, children }: { locale: Locale; catalog: Catalog; children: ReactNode }) {
  const tr = useMemo(() => createTranslator(locale, catalog), [locale, catalog]);
  return <I18nContext.Provider value={tr}>{children}</I18nContext.Provider>;
}

export function useT() {
  return useContext(I18nContext);
}
