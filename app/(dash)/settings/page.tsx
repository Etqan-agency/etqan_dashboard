"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { PageHead, SkeletonRows } from "@/components/ui";
import { Field, KeyValueInput } from "@/components/fields";
import { api } from "@/lib/api";
import type { SiteSettings } from "@/lib/types";
import { invalidUrlKeys } from "@/lib/utils";
import { useToast } from "@/providers/ToastProvider";
import { t } from "@/lib/i18n";

const EMPTY: SiteSettings = {
  hero_title: "",
  hero_subtitle: "",
  announcement_text: "",
  company_about: "",
  mission: "",
  vision: "",
  values: [],
  stats: {},
  contact_email: "",
  contact_phone: "",
  address: "",
  social_links: {},
  hero_title_ar: "",
  hero_subtitle_ar: "",
  announcement_text_ar: "",
  company_about_ar: "",
  mission_ar: "",
  vision_ar: "",
  address_ar: "",
};

/* English source strings — translated with t() at render time. */
/** Arabic twins are optional — the public API (`?lang=ar`) falls back to English. */
const AR_HINT = "Leave blank to use the English text.";
/** Stored by the API but not rendered by the public website yet. */
const NOT_SHOWN = "Not shown on the website yet.";

export default function SettingsPage() {
  const toast = useToast();
  const [form, setForm] = useState<SiteSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<SiteSettings>("/api/settings/");
        if (!cancelled) setForm({ ...EMPTY, ...data });
      } catch (err: any) {
        if (!cancelled) toast(err.message ?? t("Could not load site settings."), true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function save() {
    const bad = invalidUrlKeys(form.social_links);
    if (bad.length) {
      toast(
        t('Social links: "{keys}" must be a full URL starting with http:// or https://.', { keys: bad.join('", "') }),
        true,
      );
      return;
    }
    setSaving(true);
    try {
      // The settings record is a singleton — there is no id in the URL.
      const payload = { ...form, values: form.values.filter((v) => v.title.trim()) };
      const saved = await api.patch<SiteSettings>("/api/settings/", payload);
      setForm({ ...EMPTY, ...saved });
      toast(t("Site settings saved."));
    } catch (err: any) {
      toast(err.message ?? t("Save failed."), true);
    } finally {
      setSaving(false);
    }
  }

  /** English content fields stay ltr even in the Arabic UI; Arabic twins pass "rtl". */
  const text = (key: keyof SiteSettings, label: string, hint?: string, dir: "rtl" | "ltr" = "ltr") => (
    <Field label={t(label)} hint={hint ? t(hint) : undefined}>
      <input
        className="input"
        dir={dir}
        value={String(form[key] ?? "")}
        onChange={(e) => set(key, e.target.value as any)}
      />
    </Field>
  );
  const area = (key: keyof SiteSettings, label: string, hint?: string, dir: "rtl" | "ltr" = "ltr") => (
    <Field label={t(label)} hint={hint ? t(hint) : undefined}>
      <textarea
        className="input"
        dir={dir}
        value={String(form[key] ?? "")}
        onChange={(e) => set(key, e.target.value as any)}
      />
    </Field>
  );
  const textAr = (key: keyof SiteSettings, label: string, hint = AR_HINT) => text(key, `${label} (Arabic)`, hint, "rtl");
  const areaAr = (key: keyof SiteSettings, label: string) => area(key, `${label} (Arabic)`, AR_HINT, "rtl");

  if (loading) {
    return (
      <>
        <PageHead title={t("Site settings")} sub={t("One record behind the whole site.")} />
        <div className="card">
          <SkeletonRows count={6} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead
        title={t("Site settings")}
        sub={t("One record behind the whole site. Saving writes to PATCH /api/settings/.")}
        actions={
          <button className="btn btn-blue" onClick={save} disabled={saving}>
            {saving ? t("Saving…") : t("Save changes")}
          </button>
        }
      />

      <div className="grid-2">
        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          <section className="card">
            <div className="card-head">
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>{t("Homepage hero")}</h3>
            </div>
            <div className="card-pad">
              {text("hero_title", "Hero title", NOT_SHOWN)}
              {textAr("hero_title_ar", "Hero title", `${t(NOT_SHOWN)} ${t(AR_HINT)}`)}
              {area("hero_subtitle", "Hero subtitle")}
              {areaAr("hero_subtitle_ar", "Hero subtitle")}
              {text("announcement_text", "Announcement badge", "Short badge above the homepage hero. Leave empty to hide it.")}
              {textAr("announcement_text_ar", "Announcement badge")}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>{t("About")}</h3>
            </div>
            <div className="card-pad">
              {area("company_about", "About")}
              {areaAr("company_about_ar", "About")}
              {area("mission", "Mission")}
              {areaAr("mission_ar", "Mission")}
              {area("vision", "Vision")}
              {areaAr("vision_ar", "Vision")}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>{t("Values")}</h3>
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginInlineStart: "auto" }}
                onClick={() => set("values", [...form.values, { title: "", description: "" }])}
              >
                <Icon name="plus" size={13} strokeWidth={2.2} />
                {t("Add value")}
              </button>
            </div>
            <div className="card-pad">
              {form.values.length === 0 ? (
                <span className="hint">
                  {t("No values yet.")} {t(NOT_SHOWN)}
                </span>
              ) : (
                <>
                  <p className="hint" style={{ marginTop: 0, marginBottom: 9 }}>
                    {t(NOT_SHOWN)}
                  </p>
                  {form.values.map((v, i) => (
                    <div
                      key={i}
                      style={{
                        border: "1px solid var(--color-line)",
                        borderRadius: "var(--radius-md)",
                        padding: 12,
                        marginBottom: 9,
                        background: "var(--color-surface-2)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "var(--color-faint)",
                          }}
                        >
                          {t("Value {n}", { n: i + 1 })}
                        </span>
                        <button
                          aria-label={t("Remove value")}
                          style={{ marginInlineStart: "auto", color: "var(--color-faint)" }}
                          onClick={() => set("values", form.values.filter((_, j) => j !== i))}
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                      <Field label={t("Title")}>
                        <input
                          className="input"
                          dir="ltr"
                          value={v.title}
                          onChange={(e) => {
                            const next = [...form.values];
                            next[i] = { ...v, title: e.target.value };
                            set("values", next);
                          }}
                        />
                      </Field>
                      <Field label={t("Description")}>
                        <textarea
                          className="input"
                          dir="ltr"
                          value={v.description}
                          onChange={(e) => {
                            const next = [...form.values];
                            next[i] = { ...v, description: e.target.value };
                            set("values", next);
                          }}
                        />
                      </Field>
                    </div>
                  ))}
                </>
              )}
            </div>
          </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          <section className="card">
            <div className="card-head">
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>{t("Contact")}</h3>
            </div>
            <div className="card-pad">
              {text("contact_email", "Contact email")}
              {text("contact_phone", "Phone")}
              {area("address", "Address")}
              {areaAr("address_ar", "Address")}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>{t("Stats")}</h3>
            </div>
            <div className="card-pad">
              <KeyValueInput
                value={form.stats}
                onChange={(v) => set("stats", v)}
                keyPlaceholder="projects"
              />
              <p className="hint" style={{ marginTop: 8 }}>
                {t(NOT_SHOWN)} {t("Free-form keys are stored for future use.")}
              </p>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>{t("Social links")}</h3>
            </div>
            <div className="card-pad">
              <KeyValueInput
                value={form.social_links}
                onChange={(v) => set("social_links", v)}
                keyPlaceholder="linkedin"
                urlValues
              />
              <p className="hint" style={{ marginTop: 8 }}>
                {t("Use full URLs, e.g. https://www.linkedin.com/company/…")}
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
