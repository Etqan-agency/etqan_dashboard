"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { PageHead, SkeletonRows } from "@/components/ui";
import { Field, KeyValueInput } from "@/components/fields";
import { api } from "@/lib/api";
import type { SiteSettings } from "@/lib/types";
import { useToast } from "@/providers/ToastProvider";

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
};

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
        if (!cancelled) toast(err.message ?? "Could not load site settings.", true);
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
    setSaving(true);
    try {
      // The settings record is a singleton — there is no id in the URL.
      const payload = { ...form, values: form.values.filter((v) => v.title.trim()) };
      const saved = await api.patch<SiteSettings>("/api/settings/", payload);
      setForm({ ...EMPTY, ...saved });
      toast("Site settings saved.");
    } catch (err: any) {
      toast(err.message ?? "Save failed.", true);
    } finally {
      setSaving(false);
    }
  }

  const text = (key: keyof SiteSettings, label: string, hint?: string) => (
    <Field label={label} hint={hint}>
      <input className="input" value={String(form[key] ?? "")} onChange={(e) => set(key, e.target.value as any)} />
    </Field>
  );
  const area = (key: keyof SiteSettings, label: string, hint?: string) => (
    <Field label={label} hint={hint}>
      <textarea className="input" value={String(form[key] ?? "")} onChange={(e) => set(key, e.target.value as any)} />
    </Field>
  );

  if (loading) {
    return (
      <>
        <PageHead title="Site settings" sub="One record behind the whole site." />
        <div className="card">
          <SkeletonRows count={6} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead
        title="Site settings"
        sub="One record behind the whole site. Saving writes to PATCH /api/settings/."
        actions={
          <button className="btn btn-blue" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        }
      />

      <div className="grid-2">
        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          <section className="card">
            <div className="card-head">
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Homepage hero</h3>
            </div>
            <div className="card-pad">
              {text("hero_title", "Hero title")}
              {area("hero_subtitle", "Hero subtitle")}
              {text("announcement_text", "Announcement bar", "Leave empty to hide the bar.")}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>About</h3>
            </div>
            <div className="card-pad">
              {area("company_about", "About")}
              {area("mission", "Mission")}
              {area("vision", "Vision")}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Values</h3>
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginInlineStart: "auto" }}
                onClick={() => set("values", [...form.values, { title: "", description: "" }])}
              >
                <Icon name="plus" size={13} strokeWidth={2.2} />
                Add value
              </button>
            </div>
            <div className="card-pad">
              {form.values.length === 0 ? (
                <span className="hint">No values yet. Add one to show them on the About page.</span>
              ) : (
                form.values.map((v, i) => (
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
                        Value {i + 1}
                      </span>
                      <button
                        aria-label="Remove value"
                        style={{ marginInlineStart: "auto", color: "var(--color-faint)" }}
                        onClick={() => set("values", form.values.filter((_, j) => j !== i))}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                    <Field label="Title">
                      <input
                        className="input"
                        value={v.title}
                        onChange={(e) => {
                          const next = [...form.values];
                          next[i] = { ...v, title: e.target.value };
                          set("values", next);
                        }}
                      />
                    </Field>
                    <Field label="Description">
                      <textarea
                        className="input"
                        value={v.description}
                        onChange={(e) => {
                          const next = [...form.values];
                          next[i] = { ...v, description: e.target.value };
                          set("values", next);
                        }}
                      />
                    </Field>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          <section className="card">
            <div className="card-head">
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Contact</h3>
            </div>
            <div className="card-pad">
              {text("contact_email", "Contact email")}
              {text("contact_phone", "Phone")}
              {area("address", "Address")}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Stats</h3>
            </div>
            <div className="card-pad">
              <KeyValueInput
                value={form.stats}
                onChange={(v) => set("stats", v)}
                keyPlaceholder="projects"
              />
              <p className="hint" style={{ marginTop: 8 }}>
                Free-form keys — whatever your homepage reads from the stats object.
              </p>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Social links</h3>
            </div>
            <div className="card-pad">
              <KeyValueInput
                value={form.social_links}
                onChange={(v) => set("social_links", v)}
                keyPlaceholder="linkedin"
              />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
