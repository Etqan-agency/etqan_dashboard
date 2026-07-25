"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import type { FieldDef } from "@/lib/resources";

export function Field({ label, hint, required, children }: { label?: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 15 }}>
      {label ? (
        <label className="field-label">
          {label}
          {required ? <span style={{ color: "var(--color-clay)", fontWeight: 700 }}>*</span> : null}
        </label>
      ) : null}
      {children}
      {hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        width: 42,
        height: 24,
        borderRadius: "var(--radius-pill)",
        background: on ? "var(--color-blue)" : "var(--color-line-strong)",
        position: "relative",
        flex: "none",
        transition: "background 220ms var(--ease-brand)",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          insetInlineStart: 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "var(--shadow-e1)",
          transform: on ? "translateX(18px)" : "none",
          transition: "transform 220ms var(--ease-brand)",
        }}
      />
    </button>
  );
}

export function ToggleRow({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--color-line)" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{label}</div>
        {hint ? <div style={{ fontSize: 11.5, color: "var(--color-faint)", marginTop: 2 }}>{hint}</div> : null}
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

export function ChipsInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const commit = () => {
    const v = draft.trim().replace(/,$/, "");
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft("");
  };
  return (
    <div
      style={{
        border: "1px solid var(--color-line)",
        borderRadius: "var(--radius-md)",
        padding: 8,
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        background: "var(--color-surface)",
        minHeight: 44,
      }}
    >
      {value.map((v, i) => (
        <span
          key={v + i}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-pill)",
            padding: "4px 6px 4px 11px",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {v}
          <button
            type="button"
            aria-label={`Remove ${v}`}
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            style={{ width: 16, height: 16, borderRadius: "50%", display: "grid", placeItems: "center", color: "var(--color-faint)" }}
          >
            <Icon name="x" size={11} strokeWidth={2.5} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        placeholder="Type and press Enter"
        style={{ border: 0, outline: 0, flex: 1, minWidth: 120, fontSize: 13, padding: 4, background: "transparent" }}
      />
    </div>
  );
}

export function KeyValueInput({
  value,
  onChange,
  keyPlaceholder = "key",
}: {
  value: Record<string, string | number>;
  onChange: (v: Record<string, string>) => void;
  keyPlaceholder?: string;
}) {
  const entries = Object.entries(value ?? {});
  const update = (rows: [string, string][]) => {
    const out: Record<string, string> = {};
    rows.forEach(([k, v]) => {
      if (k.trim()) out[k.trim()] = v;
    });
    onChange(out);
  };
  const rows: [string, string][] = entries.map(([k, v]) => [k, String(v)]);

  return (
    <div>
      {rows.map(([k, v], i) => (
        <div key={i} style={{ display: "flex", gap: 7, marginBottom: 7 }}>
          <input
            className="input"
            style={{ maxWidth: 170, fontFamily: "var(--font-mono)", fontSize: 12 }}
            value={k}
            placeholder={keyPlaceholder}
            onChange={(e) => {
              const next = [...rows];
              next[i] = [e.target.value, v];
              update(next);
            }}
          />
          <input
            className="input"
            value={v}
            placeholder="value"
            onChange={(e) => {
              const next = [...rows];
              next[i] = [k, e.target.value];
              update(next);
            }}
          />
          <button
            type="button"
            aria-label="Remove pair"
            onClick={() => update(rows.filter((_, j) => j !== i))}
            style={{
              width: 38,
              height: 38,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-line)",
              display: "grid",
              placeItems: "center",
              color: "var(--color-faint)",
              flex: "none",
            }}
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => update([...rows, ["", ""]])}
        style={{ marginTop: 4 }}
      >
        <Icon name="plus" size={13} strokeWidth={2.2} />
        Add pair
      </button>
    </div>
  );
}

export function ImageInput({
  currentUrl,
  onFile,
}: {
  currentUrl?: string;
  onFile: (file: File | null) => void;
}) {
  const [preview, setPreview] = useState<string | undefined>(currentUrl);
  const box = {
    width: 62,
    height: 62,
    borderRadius: "var(--radius-md)",
    objectFit: "cover" as const,
    background: "var(--color-surface-2)",
    border: "1px solid var(--color-line)",
    flex: "none",
  };
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      {preview ? (
        <img src={preview} alt="" style={box} />
      ) : (
        <div style={{ ...box, display: "grid", placeItems: "center", color: "var(--color-faint)" }}>
          <Icon name="image" size={18} />
        </div>
      )}
      <div style={{ flex: 1 }}>
        <input
          type="file"
          accept="image/*"
          className="input"
          style={{ padding: 7 }}
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            onFile(file);
            setPreview(file ? URL.createObjectURL(file) : currentUrl);
          }}
        />
        <div className="hint" style={{ marginTop: 5 }}>
          Uploaded as a separate multipart request once the record saves.
        </div>
      </div>
    </div>
  );
}

/** Render one field from the resource schema. */
export function SchemaField({
  def,
  value,
  onChange,
  onFile,
}: {
  def: FieldDef;
  value: any;
  onChange: (v: any) => void;
  onFile: (name: string, file: File | null) => void;
}) {
  if (def.type === "bool") {
    return (
      <div style={{ marginBottom: 15 }}>
        <ToggleRow label={def.label} hint={def.hint} on={Boolean(value)} onChange={onChange} />
      </div>
    );
  }
  if (def.type === "chips") {
    return (
      <Field label={def.label} hint={def.hint} required={def.required}>
        <ChipsInput value={Array.isArray(value) ? value : []} onChange={onChange} />
      </Field>
    );
  }
  if (def.type === "kv") {
    return (
      <Field label={def.label} hint={def.hint}>
        <KeyValueInput value={value ?? {}} onChange={onChange} />
      </Field>
    );
  }
  if (def.type === "image") {
    return (
      <Field label={def.label} hint={def.hint}>
        <ImageInput currentUrl={value} onFile={(f) => onFile(def.name, f)} />
      </Field>
    );
  }
  if (def.type === "select") {
    return (
      <Field label={def.label} hint={def.hint} required={def.required}>
        <select className="input" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
          {(def.options ?? []).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </Field>
    );
  }
  if (def.type === "textarea") {
    return (
      <Field label={def.label} hint={def.hint} required={def.required}>
        <textarea
          className="input"
          style={def.tall ? { minHeight: 200 } : undefined}
          maxLength={def.maxLength}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </Field>
    );
  }
  return (
    <Field label={def.label} hint={def.hint} required={def.required}>
      <input
        className="input"
        type={def.type === "number" ? "number" : "text"}
        readOnly={def.readOnly}
        style={def.name === "slug" ? { fontFamily: "var(--font-mono)", fontSize: 12.5 } : undefined}
        value={value ?? ""}
        onChange={(e) => onChange(def.type === "number" ? Number(e.target.value || 0) : e.target.value)}
      />
    </Field>
  );
}
