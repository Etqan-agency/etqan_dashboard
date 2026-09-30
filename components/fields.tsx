"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { MarkdownEditor } from "./MarkdownEditor";
import { api } from "@/lib/api";
import type { FieldDef, OptionsSource } from "@/lib/resources";
import type { ProjectResult } from "@/lib/types";
import { isHttpUrl } from "@/lib/utils";

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

export function ChipsInput({
  value,
  onChange,
  dir,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  dir?: "rtl" | "ltr";
}) {
  const [draft, setDraft] = useState("");
  const commit = () => {
    const v = draft.trim().replace(/,$/, "");
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft("");
  };
  return (
    <div
      dir={dir}
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
  urlValues,
}: {
  value: Record<string, string | number>;
  onChange: (v: Record<string, string>) => void;
  keyPlaceholder?: string;
  /** flag values that are not full http(s) URLs */
  urlValues?: boolean;
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
            placeholder={urlValues ? "https://…" : "value"}
            aria-invalid={urlValues && k.trim() !== "" && !isHttpUrl(v) ? true : undefined}
            style={urlValues && k.trim() !== "" && !isHttpUrl(v) ? { borderColor: "var(--color-clay)" } : undefined}
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
      {urlValues && rows.some(([k, v]) => k.trim() && !isHttpUrl(v)) ? (
        <div className="hint" style={{ color: "var(--color-clay)", marginTop: 6 }}>
          Values must be full URLs starting with http:// or https://.
        </div>
      ) : null}
    </div>
  );
}

/** Repeatable value / label / source rows for case-study results. */
export function ResultsInput({
  value,
  onChange,
  dir,
}: {
  value: ProjectResult[];
  onChange: (v: ProjectResult[]) => void;
  dir?: "rtl" | "ltr";
}) {
  const rows = Array.isArray(value) ? value : [];
  const set = (i: number, key: keyof ProjectResult, v: string) => {
    const next = rows.map((r, j) => (j === i ? { ...r, [key]: v } : r));
    onChange(next);
  };
  return (
    <div dir={dir}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 7, marginBottom: 7 }}>
          <input
            className="input"
            style={{ maxWidth: 110 }}
            value={r.value ?? ""}
            placeholder="42%"
            onChange={(e) => set(i, "value", e.target.value)}
          />
          <input
            className="input"
            value={r.label ?? ""}
            placeholder="label"
            onChange={(e) => set(i, "label", e.target.value)}
          />
          <input
            className="input"
            value={r.source ?? ""}
            placeholder="source"
            onChange={(e) => set(i, "source", e.target.value)}
          />
          <button
            type="button"
            aria-label="Remove result"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
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
        onClick={() => onChange([...rows, { value: "", label: "", source: "" }])}
        style={{ marginTop: 4 }}
      >
        <Icon name="plus" size={13} strokeWidth={2.2} />
        Add result
      </button>
    </div>
  );
}

/** Fetch `[value, label]` select options from another collection. */
function useRemoteOptions(source?: OptionsSource) {
  const [options, setOptions] = useState<[string, string][]>([]);
  useEffect(() => {
    if (!source) return;
    let alive = true;
    api
      .list<Record<string, any>>(source.path, { page_size: 100 })
      .then((data) => {
        if (!alive) return;
        setOptions(
          (data?.results ?? []).map((r) => [
            String(r[source.value]),
            r.is_active === false ? `${r[source.label]} (hidden)` : String(r[source.label]),
          ]),
        );
      })
      .catch(() => alive && setOptions([]));
    return () => {
      alive = false;
    };
  }, [source]);
  return source ? ([["", source.empty], ...options] as [string, string][]) : null;
}

export function ImageInput({
  currentUrl,
  onFile,
  onClear,
}: {
  currentUrl?: string | null;
  onFile: (file: File | null) => void;
  /** when given, a "Remove" button clears the image (saved as null) */
  onClear?: () => void;
}) {
  const [preview, setPreview] = useState<string | undefined>(currentUrl ?? undefined);
  const [inputKey, setInputKey] = useState(0);
  // the drawer stays mounted between records — follow the record's stored image
  useEffect(() => {
    setPreview(currentUrl ?? undefined);
    setInputKey((k) => k + 1);
  }, [currentUrl]);
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
        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          <input
            key={inputKey}
            type="file"
            accept="image/*"
            className="input"
            style={{ padding: 7 }}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              onFile(file);
              setPreview(file ? URL.createObjectURL(file) : (currentUrl ?? undefined));
            }}
          />
          {onClear && preview ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ flex: "none" }}
              onClick={() => {
                onClear();
                setPreview(undefined);
                setInputKey((k) => k + 1);
              }}
            >
              Remove
            </button>
          ) : null}
        </div>
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
  onClear,
}: {
  def: FieldDef;
  value: any;
  onChange: (v: any) => void;
  onFile: (name: string, file: File | null) => void;
  /** image fields: clear the stored image */
  onClear?: (name: string) => void;
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
        <ChipsInput value={Array.isArray(value) ? value : []} onChange={onChange} dir={def.dir} />
      </Field>
    );
  }
  if (def.type === "kv") {
    return (
      <Field label={def.label} hint={def.hint}>
        <KeyValueInput value={value ?? {}} onChange={onChange} urlValues={def.urlValues} />
      </Field>
    );
  }
  if (def.type === "results") {
    return (
      <Field label={def.label} hint={def.hint}>
        <ResultsInput value={value ?? []} onChange={onChange} dir={def.dir} />
      </Field>
    );
  }
  if (def.type === "image") {
    return (
      <Field label={def.label} hint={def.hint}>
        <ImageInput
          currentUrl={value}
          onFile={(f) => onFile(def.name, f)}
          onClear={onClear && def.clearable !== false ? () => onClear(def.name) : undefined}
        />
      </Field>
    );
  }
  if (def.type === "select") {
    return <SelectField def={def} value={value} onChange={onChange} />;
  }
  if (def.type === "markdown") {
    return (
      <Field label={def.label} hint={def.hint} required={def.required}>
        <MarkdownEditor value={value ?? ""} onChange={onChange} dir={def.dir} />
      </Field>
    );
  }
  if (def.type === "textarea") {
    return (
      <Field label={def.label} hint={def.hint} required={def.required}>
        <textarea
          className="input"
          dir={def.dir}
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
        dir={def.dir}
        readOnly={def.readOnly}
        maxLength={def.type === "number" ? undefined : def.maxLength}
        style={["slug", "old_path", "new_path"].includes(def.name) ? { fontFamily: "var(--font-mono)", fontSize: 12.5 } : undefined}
        value={value ?? ""}
        onChange={(e) =>
          onChange(
            def.type === "number"
              ? e.target.value === ""
                ? def.nullable
                  ? null
                  : 0
                : Number(e.target.value)
              : e.target.value,
          )
        }
      />
    </Field>
  );
}

function SelectField({ def, value, onChange }: { def: FieldDef; value: any; onChange: (v: any) => void }) {
  const remote = useRemoteOptions(def.optionsFrom);
  const options = remote ?? def.options ?? [];
  const current = value == null ? "" : String(value);
  // keep an unknown current value selectable (e.g. options still loading)
  const withCurrent =
    current && !options.some(([v]) => v === current) ? [...options, [current, current] as [string, string]] : options;
  return (
    <Field label={def.label} hint={def.hint} required={def.required}>
      <select
        className="input"
        value={current}
        onChange={(e) => onChange(def.optionsFrom && e.target.value === "" ? null : e.target.value)}
      >
        {withCurrent.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </Field>
  );
}
