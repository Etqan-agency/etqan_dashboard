"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, EmptyState, PageHead, PrimaryButton, SkeletonRows } from "@/components/ui";
import { api, USE_MOCK } from "@/lib/api";
import { getLang, t } from "@/lib/i18n";
import { useSearch } from "@/providers/SearchProvider";
import { useToast } from "@/providers/ToastProvider";

type Locale = "en" | "ar";
type Dict = Record<string, string>;
interface Section {
  key: string;
  label?: { en?: string; ar?: string };
  count?: number;
}
interface Catalog {
  en: Dict;
  ar: Dict;
  sections?: Section[];
}
interface Overrides {
  en: Dict;
  ar: Dict;
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.etqanpp.com").replace(/\/+$/, "");
const PAGE = 40;

/** Group label for a flat key such as "contact.faqs.items.0.q" -> "contact". */
const sectionOf = (key: string) => key.split(".")[0];

/** `{email}`-style placeholders a text must keep, or the site shows a broken sentence. */
const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");

/** "contact.faqs.items.0.q" -> "Faqs › Items 1 › Q" (readable crumb for editors). */
function crumb(key: string) {
  return key
    .split(".")
    .slice(1)
    .map((p) => (/^\d+$/.test(p) ? `#${Number(p) + 1}` : p.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ")))
    .join(" › ");
}

/**
 * Every piece of fixed text on the public website (headings, intros, buttons,
 * footer, legal pages…), in English and Arabic. Leave a box empty to use the
 * built-in text; anything typed here replaces it on the site.
 */
export default function SiteTextsPage() {
  const toast = useToast();
  const { debounced } = useSearch();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [saved, setSaved] = useState<Overrides>({ en: {}, ar: {} });
  const [draft, setDraft] = useState<Overrides>({ en: {}, ar: {} });
  const [section, setSection] = useState("");
  const [onlyChanged, setOnlyChanged] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [cat, ov] = await Promise.all([
        fetch(`${SITE_URL}/api/site-copy-catalog`, { cache: "no-store" }).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json() as Promise<Catalog>;
        }),
        USE_MOCK ? Promise.resolve({ en: {}, ar: {} }) : api.get<Overrides>("/api/site-copy/"),
      ]);
      const clean = { en: { ...(ov?.en ?? {}) }, ar: { ...(ov?.ar ?? {}) } };
      setCatalog({ en: cat.en ?? {}, ar: cat.ar ?? {}, sections: cat.sections ?? [] });
      setSaved(clean);
      setDraft(clean);
    } catch (err: any) {
      setError(
        t("Couldn't load the website texts from {site}. Check that the website is running and NEXT_PUBLIC_SITE_URL points to it.", {
          site: SITE_URL,
        }) + (err?.message ? ` (${err.message})` : ""),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const keys = useMemo(() => {
    if (!catalog) return [];
    return Array.from(new Set([...Object.keys(catalog.en), ...Object.keys(catalog.ar)]));
  }, [catalog]);

  const sections = useMemo(() => {
    const lang = getLang();
    const labelled = (catalog?.sections ?? []).map((s) => [s.key, s.label?.[lang] || s.label?.en || s.key] as const);
    const seen = new Set(labelled.map(([k]) => k));
    const rest = Array.from(new Set(keys.map(sectionOf)))
      .filter((k) => !seen.has(k))
      .map((k) => [k, k] as const);
    return [...labelled, ...rest];
  }, [keys, catalog]);

  const changedKeys = useMemo(() => {
    const out = new Set<string>();
    (["en", "ar"] as Locale[]).forEach((l) => {
      const all = new Set([...Object.keys(saved[l]), ...Object.keys(draft[l])]);
      all.forEach((k) => {
        if ((saved[l][k] ?? "") !== (draft[l][k] ?? "")) out.add(`${l}:${k}`);
      });
    });
    return out;
  }, [saved, draft]);

  const visible = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return keys.filter((k) => {
      if (section && sectionOf(k) !== section) return false;
      if (onlyChanged && !draft.en[k] && !draft.ar[k]) return false;
      if (!q) return true;
      return (
        k.toLowerCase().includes(q) ||
        (catalog?.en[k] ?? "").toLowerCase().includes(q) ||
        (catalog?.ar[k] ?? "").includes(debounced.trim()) ||
        (draft.en[k] ?? "").toLowerCase().includes(q) ||
        (draft.ar[k] ?? "").includes(debounced.trim())
      );
    });
  }, [keys, section, onlyChanged, debounced, catalog, draft]);

  useEffect(() => setLimit(PAGE), [section, onlyChanged, debounced]);

  const setValue = (l: Locale, k: string, v: string) =>
    setDraft((d) => {
      const next = { ...d[l] };
      if (v === "") delete next[k];
      else next[k] = v;
      return { ...d, [l]: next };
    });

  async function save() {
    // A text that drops a {placeholder} from the built-in one would break that sentence on the site.
    for (const id of Array.from(changedKeys)) {
      const [l, ...rest] = id.split(":");
      const k = rest.join(":");
      const value = draft[l as Locale][k];
      const original = catalog?.[l as Locale][k] ?? "";
      if (value && placeholders(original) && placeholders(value) !== placeholders(original)) {
        toast(t('"{key}" must keep these placeholders: {list}', { key: k, list: placeholders(original) }), true);
        return;
      }
    }
    const body: Overrides = { en: {}, ar: {} };
    changedKeys.forEach((id) => {
      const [l, ...rest] = id.split(":");
      const k = rest.join(":");
      body[l as Locale][k] = draft[l as Locale][k] ?? "";
    });
    setSaving(true);
    try {
      const res = await api.patch<Overrides>("/api/site-copy/", body);
      const clean = { en: { ...(res?.en ?? draft.en) }, ar: { ...(res?.ar ?? draft.ar) } };
      setSaved(clean);
      setDraft(clean);
      toast(t("Website texts saved. The site updates within a minute."));
    } catch (err: any) {
      toast(err.message ?? t("Save failed."), true);
    } finally {
      setSaving(false);
    }
  }

  const field = (l: Locale, k: string) => {
    const fallback = catalog?.[l][k] ?? "";
    const value = draft[l][k] ?? "";
    const long = fallback.length > 90 || value.length > 90;
    const props = {
      className: "input",
      dir: l === "ar" ? "rtl" : "ltr",
      lang: l,
      value,
      placeholder: fallback,
      maxLength: 10000,
      "aria-label": `${k} (${l === "ar" ? "العربية" : "English"})`,
      onChange: (e: { target: { value: string } }) => setValue(l, k, e.target.value),
      style: changedKeys.has(`${l}:${k}`) ? { borderColor: "var(--color-accent)" } : undefined,
    } as const;
    return long ? <textarea {...props} style={{ ...props.style, minHeight: 84 }} /> : <input {...props} />;
  };

  return (
    <>
      <PageHead
        title={t("Website texts")}
        sub={t(
          "Every fixed text on the public website — headings, intros, buttons, footer and legal pages — in English and Arabic. Leave a box empty to keep the built-in text (shown in grey).",
        )}
        actions={
          <PrimaryButton onClick={save} disabled={saving || changedKeys.size === 0}>
            {saving ? t("Saving…") : changedKeys.size ? t("Save {n} changes", { n: changedKeys.size }) : t("Save")}
          </PrimaryButton>
        }
      />

      <div className="toolbar">
        <select className="sel" value={section} onChange={(e) => setSection(e.target.value)}>
          <option value="">{t("All sections")}</option>
          {sections.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <label className="hint" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={onlyChanged} onChange={(e) => setOnlyChanged(e.target.checked)} />
          {t("Only customised texts")}
        </label>
        <div style={{ flex: 1 }} />
        <span className="hint">{t("{n} texts", { n: visible.length })}</span>
      </div>

      <div className="card">
        {loading ? (
          <SkeletonRows count={6} />
        ) : error ? (
          <EmptyState
            icon="x"
            tone="clay"
            title={t("Couldn't load {what}", { what: t("Website texts") })}
            body={error}
            action={
              <button className="btn btn-ghost btn-sm" onClick={load}>
                {t("Try again")}
              </button>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState icon="text" title={t("No matches")} body={t("No records match the current search and filters.")} />
        ) : (
          <div className="copy-list">
            {visible.slice(0, limit).map((k) => (
              <div className="copy-row" key={k}>
                <div className="copy-key">
                  <span dir="ltr">{crumb(k) || k}</span>
                  {draft.en[k] || draft.ar[k] ? <Badge tone="sky">{t("Customised")}</Badge> : null}
                  <code dir="ltr">{k}</code>
                </div>
                <div className="copy-fields">
                  <div>
                    <span className="field-label">English</span>
                    {field("en", k)}
                  </div>
                  <div>
                    <span className="field-label">العربية</span>
                    {field("ar", k)}
                  </div>
                </div>
              </div>
            ))}
            {visible.length > limit ? (
              <div style={{ padding: 16, textAlign: "center" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setLimit((n) => n + PAGE)}>
                  {t("Show more ({n} left)", { n: visible.length - limit })}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
