"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Drawer } from "./ui";
import { SchemaField } from "./fields";
import { GalleryManager } from "./GalleryManager";
import { BlogWorkflow } from "./BlogWorkflow";
import { api, request } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { ResourceDef } from "@/lib/resources";
import { can, type Capability } from "@/lib/roles";
import type { AnyRecord } from "@/lib/types";
import { formatDate, invalidUrlKeys, timeAgo } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";

/** Capability needed to create/edit/delete records of a collection. */
export function writeCapability(def: ResourceDef): Capability {
  if (def.path === "/api/blog/") return "blog.write_own";
  if (def.path === "/api/authors/") return "authors";
  if (def.path === "/api/redirects/") return "redirects";
  return "content";
}

function initialValues(def: ResourceDef, record: AnyRecord | null) {
  const values: Record<string, any> = {};
  for (const field of def.fields) {
    if (!record) {
      if (field.default !== undefined) {
        // copy so arrays/objects are never shared between new records
        values[field.name] =
          field.default !== null && typeof field.default === "object"
            ? JSON.parse(JSON.stringify(field.default))
            : field.default;
        continue;
      }
      values[field.name] =
        field.type === "bool"
          ? field.name === "is_active"
          : field.type === "chips" || field.type === "results"
            ? []
            : field.type === "kv"
              ? {}
              : field.type === "number"
                ? field.nullable
                  ? null
                  : 0
                : field.type === "select"
                  ? field.optionsFrom
                    ? null
                    : (field.options?.[0]?.[0] ?? "")
                  : "";
      continue;
    }
    if (field.readFrom) {
      // tags[] / services[] are read-only; tag_slugs[] / service_slugs[] are what we write back.
      // Tags go back as names (the API accepts names or slugs) so they match what editors type.
      values[field.name] = (record[field.readFrom] ?? []).map((tag: any) =>
        typeof tag === "string" ? tag : field.name === "tag_slugs" ? (tag.name ?? tag.slug) : (tag.slug ?? tag.name),
      );
    } else {
      values[field.name] = record[field.name];
    }
  }
  return values;
}

/* ---------- local autosave of unsaved article text (survives a crash or a closed tab) ---------- */

const AUTOSAVE_PREFIX = "etqan.autosave.";

function readAutosave(key: string): { at: number; values: Record<string, any> } | null {
  try {
    const raw = window.localStorage.getItem(AUTOSAVE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writeAutosave(key: string, values: Record<string, any>) {
  try {
    window.localStorage.setItem(AUTOSAVE_PREFIX + key, JSON.stringify({ at: Date.now(), values }));
  } catch {
    /* storage full or blocked: autosave is a convenience only */
  }
}
function clearAutosave(key: string) {
  try {
    window.localStorage.removeItem(AUTOSAVE_PREFIX + key);
  } catch {
    /* ignore */
  }
}

export function ResourceEditor({
  def,
  record,
  open,
  onClose,
  onSaved,
}: {
  def: ResourceDef;
  record: AnyRecord | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const { user } = useAuth();
  const isBlog = def.path === "/api/blog/";
  /** the record being edited — becomes the created record after a first save */
  const [current, setCurrent] = useState<AnyRecord | null>(record);
  const [values, setValues] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  /** image fields the user removed — saved as null */
  const [cleared, setCleared] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [restorable, setRestorable] = useState<{ at: number; values: Record<string, any> } | null>(null);
  const dirty = useRef(false);

  const autosaveKey = isBlog ? `blog.${current?.slug ?? "new"}` : null;

  useEffect(() => {
    if (open) {
      setCurrent(record);
      setValues(initialValues(def, record));
      setFiles({});
      setCleared({});
      dirty.current = false;
      if (def.path === "/api/blog/") {
        const saved = readAutosave(`blog.${record?.slug ?? "new"}`);
        const recordTime = record?.updated_at ? new Date(record.updated_at).getTime() : 0;
        setRestorable(saved && saved.at > recordTime ? saved : null);
      } else {
        setRestorable(null);
      }
    }
  }, [open, def, record]);

  // Autosave article text locally a moment after each change.
  useEffect(() => {
    if (!open || !autosaveKey || !dirty.current) return;
    const id = window.setTimeout(() => writeAutosave(autosaveKey, values), 1500);
    return () => window.clearTimeout(id);
  }, [values, open, autosaveKey]);

  const cap = writeCapability(def);
  const canPublish = can(user, "blog.publish");
  const editable = isBlog ? (current ? Boolean(current.permissions?.edit ?? can(user, "blog.review")) : can(user, cap)) : can(user, cap);
  const deletable = isBlog ? Boolean(current?.permissions?.delete) : can(user, cap);

  // Writers and content creators don't see the publish switch: they submit for review instead.
  const fields = useMemo(
    () => def.fields.filter((f) => !(isBlog && f.name === "published" && !canPublish)),
    [def, isBlog, canPublish],
  );

  /** Client-side checks mirroring the backend, so obvious mistakes never round-trip. */
  function validate(): string | null {
    for (const field of fields) {
      if (field.readOnly) continue;
      const v = values[field.name];
      if (field.required && field.type !== "image" && (v == null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && !v.length))) {
        return t("{field} is required.", { field: t(field.label) });
      }
      if (field.urlValues) {
        const bad = invalidUrlKeys(v);
        if (bad.length)
          return t('{field}: "{keys}" must be a full URL starting with http:// or https://.', {
            field: t(field.label),
            keys: bad.join('", "'),
          });
      }
    }
    return null;
  }

  const detailPath = (key: string | undefined) => {
    if (!key) throw new Error(t("This record has no {lookup} to address it by.", { lookup: def.lookup }));
    return `${def.path}${encodeURIComponent(key)}/`;
  };

  async function save() {
    const problem = validate();
    if (problem) {
      toast(problem, true);
      return;
    }
    setSaving(true);
    let saved: AnyRecord | null = null;
    try {
      const payload: Record<string, any> = {};
      for (const field of fields) {
        if (field.readOnly) continue;
        if (field.type === "image") {
          // a removed image goes out as JSON null (the model fields are null=True);
          // new files follow in the multipart PATCH below
          if (cleared[field.name] && !files[field.name]) payload[field.name] = null;
          continue;
        }
        payload[field.name] = values[field.name];
      }

      if (current) saved = await api.patch<AnyRecord>(detailPath(current[def.lookup]), payload);
      else saved = await api.post<AnyRecord>(def.path, payload);
      // From here on this drawer edits the saved record, so a retry never creates a duplicate.
      setCurrent(saved);

      // Images go in a second multipart PATCH. Sending everything as one
      // FormData would force list and object fields through multipart, which
      // DRF parses inconsistently.
      const pending = Object.entries(files).filter(([, f]) => f);
      if (pending.length && saved) {
        const form = new FormData();
        pending.forEach(([name, file]) => form.append(name, file as File));
        saved = await request<AnyRecord>(detailPath(saved[def.lookup]), { method: "PATCH", body: form });
        setFiles({});
      }

      if (autosaveKey) clearAutosave(autosaveKey);
      clearAutosave(`blog.new`);
      dirty.current = false;
      toast(current ? t("{noun} updated.", { noun: t(def.noun) }) : t("{noun} created.", { noun: t(def.noun) }));
      onSaved();
      if (isBlog && saved) {
        // keep the drawer open on the post so the writer can submit it for review
        setCurrent(saved);
      } else {
        onClose();
      }
    } catch (err: any) {
      if (saved) onSaved(); // the record exists even though a later step failed
      toast(err.message ?? t("Save failed."), true);
    } finally {
      setSaving(false);
    }
  }

  async function destroy() {
    if (!current) return;
    if (!window.confirm(t("Delete this {noun}? This cannot be undone.", { noun: t(def.noun) }))) return;
    try {
      await api.remove(detailPath(current[def.lookup]));
      if (autosaveKey) clearAutosave(autosaveKey);
      toast(t("{noun} deleted.", { noun: t(def.noun) }));
      onSaved();
      onClose();
    } catch (err: any) {
      toast(err.message ?? t("Delete failed."), true);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={current ? (editable ? t("Edit {noun}", { noun: t(def.noun) }) : t(def.noun)) : t("Add {noun}", { noun: t(def.noun) })}
      footer={
        <>
          {current && deletable ? (
            <button className="btn btn-danger btn-sm" onClick={destroy} style={{ marginInlineEnd: "auto" }}>
              {t("Delete")}
            </button>
          ) : null}
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={!current || !deletable ? { marginInlineStart: "auto" } : undefined}>
            {editable ? t("Cancel") : t("Close")}
          </button>
          {editable ? (
            <button className="btn btn-blue btn-sm" onClick={save} disabled={saving}>
              {saving ? t("Saving…") : t("Save")}
            </button>
          ) : null}
        </>
      }
    >
      {isBlog && current?.slug ? (
        <BlogWorkflow
          post={current}
          onChange={(p) => {
            setCurrent(p);
            setValues(initialValues(def, p));
            onSaved();
          }}
        />
      ) : null}

      {restorable && editable ? (
        <div className="workflow-note" role="status" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ flex: 1 }}>{t("Unsaved changes from {when} were found on this device.", { when: timeAgo(new Date(restorable.at).toISOString()) })}</span>
          <button
            className="btn btn-blue btn-sm"
            onClick={() => {
              setValues((prev) => ({ ...prev, ...restorable.values }));
              dirty.current = true;
              setRestorable(null);
            }}
          >
            {t("Restore")}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              if (autosaveKey) clearAutosave(autosaveKey);
              setRestorable(null);
            }}
          >
            {t("Discard")}
          </button>
        </div>
      ) : null}

      <fieldset disabled={!editable} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        {fields.map((field) => (
          <SchemaField
            key={field.name}
            def={field}
            value={values[field.name]}
            onChange={(v) => {
              dirty.current = true;
              setValues((prev) => ({ ...prev, [field.name]: v }));
            }}
            onFile={(name, file) => {
              setFiles((prev) => ({ ...prev, [name]: file }));
              if (file) setCleared((prev) => ({ ...prev, [name]: false }));
            }}
            onClear={(name) => {
              setFiles((prev) => ({ ...prev, [name]: null }));
              setCleared((prev) => ({ ...prev, [name]: true }));
            }}
          />
        ))}
      </fieldset>

      {def.path === "/api/projects/" ? (
        current?.slug ? (
          <GalleryManager slug={current.slug} />
        ) : (
          <div className="hint" style={{ marginBottom: 15 }}>
            {t("Save the project first — the gallery can be managed once it exists.")}
          </div>
        )
      ) : null}

      {current ? (
        <div className="hint" style={{ borderTop: "1px solid var(--color-line)", paddingTop: 12 }}>
          <div style={{ fontFamily: "var(--font-mono)" }} dir="ltr">
            {current.id}
          </div>
          <div>
            {t("Created {created} · updated {updated}", {
              created: formatDate(current.created_at),
              updated: formatDate(current.updated_at),
            })}
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}
