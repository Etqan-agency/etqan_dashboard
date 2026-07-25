"use client";

import { useEffect, useState } from "react";
import { Drawer } from "./ui";
import { SchemaField } from "./fields";
import { api, request } from "@/lib/api";
import type { ResourceDef } from "@/lib/resources";
import type { AnyRecord } from "@/lib/types";
import { capitalise, formatDate } from "@/lib/utils";
import { useToast } from "@/providers/ToastProvider";

function initialValues(def: ResourceDef, record: AnyRecord | null) {
  const values: Record<string, any> = {};
  for (const field of def.fields) {
    if (!record) {
      values[field.name] =
        field.type === "bool"
          ? field.name === "is_active" || field.name === "published"
          : field.type === "chips"
            ? []
            : field.type === "kv"
              ? {}
              : field.type === "number"
                ? 0
                : field.type === "select"
                  ? (field.options?.[0]?.[0] ?? "")
                  : "";
      continue;
    }
    if (field.readFrom) {
      // tags[] is read-only; tag_slugs[] is what we write back
      values[field.name] = (record[field.readFrom] ?? []).map((t: any) => t.slug ?? t.name ?? t);
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initialValues(def, record));
      setFiles({});
    }
  }, [open, def, record]);

  const detailPath = (key: string | undefined) => {
    if (!key) throw new Error(`This ${def.noun} has no ${def.lookup} to address it by.`);
    return `${def.path}${encodeURIComponent(key)}/`;
  };

  async function save() {
    setSaving(true);
    try {
      const payload: Record<string, any> = {};
      for (const field of def.fields) {
        if (field.readOnly || field.type === "image") continue;
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
          onFile={(name, file) => setFiles((prev) => ({ ...prev, [name]: file }))}
        />
      ))}

      {record?.gallery?.length ? (
        <div className="hint" style={{ marginBottom: 12 }}>
          Gallery: {record.gallery.length} image(s), nested under the project — there is no standalone endpoint for them.
        </div>
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
