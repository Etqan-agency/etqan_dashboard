"use client";

import { createContext, Fragment, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { type Lang, readSavedLang, saveLang, setLangState } from "@/lib/i18n";

interface LocaleValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
}

const LocaleContext = createContext<LocaleValue>({ lang: "en", setLang: () => {}, toggle: () => {} });

export const useLocale = () => useContext(LocaleContext);

function applyToDocument(lang: Lang) {
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === "ar" ? "rtl" : "ltr";
}

/**
 * Holds the dashboard language (English / Arabic), persists it in
 * localStorage and mirrors it on <html lang dir>. Changing the language
 * remounts the tree (keyed fragment) so every `t()` call re-runs.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLangValue] = useState<Lang>("en");

  useEffect(() => {
    const saved = readSavedLang();
    setLangState(saved);
    applyToDocument(saved);
    setLangValue(saved);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    saveLang(next);
    applyToDocument(next);
    setLangValue(next);
  }, []);

  const toggle = useCallback(() => setLang(lang === "ar" ? "en" : "ar"), [lang, setLang]);

  // keep module state in step during render too (first paint after a switch)
  setLangState(lang);

  return (
    <LocaleContext.Provider value={{ lang, setLang, toggle }}>
      <Fragment key={lang}>{children}</Fragment>
    </LocaleContext.Provider>
  );
}

/** Inline script for <head>: sets lang/dir before first paint so Arabic users never see an LTR flash. */
export const LOCALE_BOOT_SCRIPT = `try{var l=localStorage.getItem("etqan.lang");if(l==="ar"){document.documentElement.lang="ar";document.documentElement.dir="rtl";}}catch(e){}`;
