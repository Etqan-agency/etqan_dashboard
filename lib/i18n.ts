/**
 * Dashboard translations (English source strings -> Arabic).
 *
 * Usage: `t("Save")`, `t("New {noun}", { noun: t("post") })`.
 * English is the source language: a string with no Arabic entry is shown in
 * English, so a missing translation never breaks the UI. Arabic strings live in
 * `i18n-ar.ts`, keyed by the exact English text.
 *
 * The current language is module state set by `LocaleProvider`, which remounts
 * the app when it changes, so plain `t()` calls during render are always fresh.
 */
import { AR } from "./i18n-ar";

export type Lang = "en" | "ar";

export const LANG_STORAGE_KEY = "etqan.lang";
export const LANGS: Lang[] = ["en", "ar"];

let current: Lang = "en";

export function getLang(): Lang {
  return current;
}

export function setLangState(lang: Lang) {
  current = lang;
}

export function isRtl(lang: Lang = current) {
  return lang === "ar";
}

/** Read the saved language; never throws (private mode, blocked storage). */
export function readSavedLang(): Lang {
  try {
    const v = window.localStorage.getItem(LANG_STORAGE_KEY);
    return v === "ar" || v === "en" ? v : "en";
  } catch {
    return "en";
  }
}

export function saveLang(lang: Lang) {
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    /* storage blocked — the choice lasts for this page only */
  }
}

const SUFFIXES: [string, string][] = [[" (Arabic)", " (بالعربية)"]];

function interpolate(s: string, vars?: Record<string, string | number>) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

function lookup(s: string): string | undefined {
  const hit = AR[s];
  if (hit !== undefined) return hit;
  for (const [en, ar] of SUFFIXES) {
    if (s.endsWith(en)) {
      const base = AR[s.slice(0, -en.length)];
      if (base !== undefined) return base + ar;
    }
  }
  return undefined;
}

/** Translate an English UI string into the current language. */
export function t(s: string | undefined | null, vars?: Record<string, string | number>): string {
  if (s == null) return "";
  const out = current === "ar" ? (lookup(s) ?? s) : s;
  return interpolate(out, vars);
}

/** Locale for Intl / toLocaleDateString. Arabic uses Latin digits (as the site does). */
export function intlLocale(): string {
  return current === "ar" ? "ar-EG-u-nu-latn" : "en-GB";
}

/**
 * Turn a DRF field key (e.g. "meta_title") into a readable, translated label.
 * Used when flattening API validation errors.
 */
export function fieldLabel(key: string): string {
  if (key === "non_field_errors" || key === "detail") return "";
  const human = key.replace(/_ar$/, "").replace(/_/g, " ");
  const label = human.charAt(0).toUpperCase() + human.slice(1);
  return t(key.endsWith("_ar") ? `${label} (Arabic)` : label);
}
