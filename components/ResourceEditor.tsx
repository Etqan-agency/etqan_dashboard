"use client";

import { useEffect, useState } from "react";
import { Drawer } from "./ui";
import { SchemaField } from "./fields";
import { GalleryManager } from "./GalleryManager";
import { api, request } from "@/lib/api";
import type { ResourceDef } from "@/lib/resources";
import type { AnyRecord } from "@/lib/types";
import { capitalise, formatDate, invalidUrlKeys } from "@/lib/utils";
import { useToast } from "@/providers/ToastProvider";

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
      values[field.name] = (record[field.readFrom] ?? []).map((t: any) =>
        typeof t === "string" ? t : field.name === "tag_slugs" ? (t.name ?? t.slug) : (t.slug ?? t.name),
      );
    } else {
      values[field.name] = record[field.name];
    }
  }
  return values;
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
  const [values, setValues] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  /** image fields the user removed — saved as null */
  const [cleared, setCleared] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initialValues(def, record));
      setFiles({});
      setCleared({});
    }
  }, [open, def, record]);

  /** Client-side checks mirroring the backend, so obvious mistakes never round-trip. */
  function validate(): string | null {
    for (const field of def.fields) {
      if (field.readOnly) continue;
      const v = values[field.name];
      if (field.required && field.type !== "image" && (v == null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && !v.length))) {
        return `${field.label} is required.`;
      }
      if (field.urlValues) {
        const bad = invalidUrlKeys(v);
        if (bad.length) return `${field.label}: "${bad.join('", "')}" must be a full URL starting with http:// or https://.`;
      }
    }
    return null;
  }

  const detailPath = (key: string | undefined) => {
    if (!key) throw new Error(`This ${def.noun} has no ${def.lookup} to address it by.`);
    return `${def.path}${encodeURIComponent(key)}/`;
  };

  async function save() {
    const problem = validate();
    if (problem) {
      toast(problem, true);
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, any> = {};
      for (const field of def.fields) {
        if (field.readOnly) continue;
        if (field.type === "image") {
          // a removed image goes out as JSON null (the model fields are null=True);
          // new files follow in the multipart PATCH below
          if (cleared[field.name] && !files[field.name]) payload[field.name] = null;
          continue;
        }
        payload[field.name] = values[field.name];
      }

      let saved: AnyRecord;
      if (record) saved = await api.patch<AnyRecord>(detailPath(record[def.lookup]), payload);
      else saved = await api.post<AnyRecord>(def.path, payload);

      // Images go in a second multipart PATCH. Sending everything as one
      // FormData would force list and object fields through multipart, which
      // DRF parses inconsistently.
      const pending = Object.entries(files).filter(([, f]) => f);
      if (pending.length && saved) {
        const form = new FormData();
        pending.forEach(([name, file]) => form.append(name, file as File));
        await request(detailPath(saved[def.lookup]), { method: "PATCH", body: form });
      }

      toast(record ? `${capitalise(def.noun)} updated.` : `${capitalise(def.noun)} created.`);
      onSaved();
      onClose();
    } catch (err: any) {
      toast(err.message ?? "Save failed.", true);
    } finally {
      setSaving(false);
    }
  }

  async function destroy() {
    if (!record) return;
    if (!window.confirm(`Delete this ${def.noun}? This cannot be undone.`)) return;
    try {
      await api.remove(detailPath(record[def.lookup]));
      toast(`${capitalise(def.noun)} deleted.`);
      onSaved();
      onClose();
    } catch (err: any) {
      toast(err.message ?? "Delete failed.", true);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={record ? `Edit ${def.noun}` : `New ${def.noun}`}
      footer={
        <>
          {record ? (
            <button className="btn btn-danger btn-sm" onClick={destroy} style={{ marginInlineEnd: "auto" }}>
              Delete
            </button>
          ) : null}
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-blue btn-sm" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      {def.fields.map((field) => (
        <SchemaField
          key={field.name}
          def={field}
          value={values[field.name]}
          onChange={(v) => setValues((prev) => ({ ...prev, [field.name]: v }))}
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

      {def.path === "/api/projects/" ? (
        record?.slug ? (
          <GalleryManager slug={record.slug} />
        ) : (
          <div className="hint" style={{ marginBottom: 15 }}>
            Save the project first — the gallery can be managed once it exists.
          </div>
        )
      ) : null}

      {record ? (
        <div className="hint" style={{ borderTop: "1px solid var(--color-line)", paddingTop: 12 }}>
          <div style={{ fontFamily: "var(--font-mono)" }}>{record.id}</div>
          <div>
            Created {formatDate(record.created_at)} · updated {formatDate(record.updated_at)}
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}
