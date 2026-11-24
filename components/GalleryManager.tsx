"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { api, request } from "@/lib/api";
import type { ProjectImage } from "@/lib/types";
import { useToast } from "@/providers/ToastProvider";
import { t } from "@/lib/i18n";

const sortImages = (rows: ProjectImage[]) => [...rows].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

/** Accept either a bare array or a paginated envelope. */
const asArray = (data: any): ProjectImage[] => (Array.isArray(data) ? data : (data?.results ?? []));

const iconBtn = {
  width: 30,
  height: 30,
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-line)",
  display: "grid",
  placeItems: "center",
  color: "var(--color-faint)",
  flex: "none",
} as const;

/**
 * Project gallery editor. Changes save immediately against
 * GET/POST /api/projects/<slug>/gallery/ and PATCH/DELETE /api/project-images/<id>/.
 */
export function GalleryManager({ slug }: { slug: string }) {
  const toast = useToast();
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { caption: string; caption_ar: string }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const listPath = `/api/projects/${encodeURIComponent(slug)}/gallery/`;
  const itemPath = (id: string) => `/api/project-images/${encodeURIComponent(id)}/`;

  const apply = (rows: ProjectImage[]) => {
    const sorted = sortImages(rows);
    setImages(sorted);
    setDrafts(Object.fromEntries(sorted.map((img) => [img.id, { caption: img.caption ?? "", caption_ar: img.caption_ar ?? "" }])));
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      apply(asArray(await api.get(listPath)));
    } catch (err: any) {
      setError(err.message ?? t("Could not load the gallery."));
    } finally {
      setLoading(false);
    }
  }, [listPath]);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(fileList: FileList | null) {
    const list = Array.from(fileList ?? []);
    if (!list.length) return;
    setBusy(true);
    let next = images.reduce((max, img) => Math.max(max, img.order ?? 0), 0);
    let done = 0;
    try {
      for (const file of list) {
        const form = new FormData();
        form.append("image", file);
        form.append("order", String(++next));
        await request(listPath, { method: "POST", body: form });
        done++;
      }
      toast(t(done === 1 ? "Uploaded 1 image." : "Uploaded {n} images.", { n: done }));
    } catch (err: any) {
      toast(`${done ? t("Uploaded {n}, then failed: ", { n: done }) : ""}${err.message ?? t("Upload failed.")}`, true);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
      setBusy(false);
      load();
    }
  }

  async function saveCaption(img: ProjectImage) {
    const draft = drafts[img.id];
    if (!draft) return;
    const changes: Partial<ProjectImage> = {};
    if (draft.caption !== (img.caption ?? "")) changes.caption = draft.caption;
    if (draft.caption_ar !== (img.caption_ar ?? "")) changes.caption_ar = draft.caption_ar;
    if (!Object.keys(changes).length) return;
    try {
      const saved = await api.patch<ProjectImage>(itemPath(img.id), changes);
      setImages((rows) => rows.map((r) => (r.id === img.id ? { ...r, ...changes, ...(saved ?? {}) } : r)));
      toast(t("Caption saved."));
    } catch (err: any) {
      toast(err.message ?? t("Could not save the caption."), true);
    }
  }

  async function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    const reordered = [...images];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    // renumber 1..n and only PATCH the rows whose order actually changed
    const renumbered = reordered.map((img, i) => ({ ...img, order: i + 1 }));
    const changed = renumbered.filter((img) => images.find((o) => o.id === img.id)?.order !== img.order);
    setImages(renumbered);
    setBusy(true);
    try {
      await Promise.all(changed.map((img) => api.patch(itemPath(img.id), { order: img.order })));
    } catch (err: any) {
      toast(err.message ?? t("Could not reorder the gallery."), true);
      load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(img: ProjectImage) {
    if (!window.confirm(t("Delete this gallery image? This cannot be undone."))) return;
    try {
      await api.remove(itemPath(img.id));
      setImages((rows) => rows.filter((r) => r.id !== img.id));
      toast(t("Image deleted."));
    } catch (err: any) {
      toast(err.message ?? t("Could not delete the image."), true);
    }
  }

  const setDraft = (id: string, key: "caption" | "caption_ar", value: string) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { caption: "", caption_ar: "" }), [key]: value } }));

  return (
    <div style={{ marginBottom: 15 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <label className="field-label" style={{ margin: 0 }}>
          {t("Gallery")}
        </label>
        <span className="hint">{images.length ? t(images.length === 1 ? "1 image" : "{n} images", { n: images.length }) : ""}</span>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ marginInlineStart: "auto" }}
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          <Icon name="plus" size={13} strokeWidth={2.2} />
          {busy ? t("Working…") : t("Upload images")}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => upload(e.target.files)}
        />
      </div>

      {loading ? (
        <div className="skel" />
      ) : error ? (
        <div className="hint" style={{ color: "var(--color-clay)" }}>
          {error}{" "}
          <button type="button" className="btn btn-ghost btn-sm" onClick={load}>
            {t("Retry")}
          </button>
        </div>
      ) : images.length === 0 ? (
        <div className="hint">{t("No gallery images yet. Upload screenshots to show them on the case study.")}</div>
      ) : (
        images.map((img, i) => (
          <div
            key={img.id}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              border: "1px solid var(--color-line)",
              borderRadius: "var(--radius-md)",
              padding: 9,
              marginBottom: 8,
              background: "var(--color-surface-2)",
            }}
          >
            {img.image ? (
              <a href={img.image} target="_blank" rel="noreferrer" style={{ flex: "none" }}>
                <img
                  src={img.image}
                  alt={img.caption || ""}
                  style={{
                    width: 84,
                    height: 62,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid var(--color-line)",
                    background: "var(--color-surface)",
                  }}
                />
              </a>
            ) : (
              <div
                style={{
                  width: 84,
                  height: 62,
                  borderRadius: 8,
                  border: "1px solid var(--color-line)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--color-faint)",
                  flex: "none",
                }}
              >
                <Icon name="image" size={16} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              <input
                className="input"
                dir="ltr"
                placeholder={t("Caption")}
                maxLength={200}
                value={drafts[img.id]?.caption ?? ""}
                onChange={(e) => setDraft(img.id, "caption", e.target.value)}
                onBlur={() => saveCaption(img)}
              />
              <input
                className="input"
                dir="rtl"
                placeholder={t("Caption (Arabic)")}
                maxLength={200}
                value={drafts[img.id]?.caption_ar ?? ""}
                onChange={(e) => setDraft(img.id, "caption_ar", e.target.value)}
                onBlur={() => saveCaption(img)}
              />
              {img.width && img.height ? (
                <span className="hint" dir="ltr">
                  {img.width}×{img.height}px
                </span>
              ) : null}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <button
                type="button"
                aria-label={t("Move up")}
                style={iconBtn}
                disabled={busy || i === 0}
                onClick={() => move(i, -1)}
              >
                <Icon name="chevron" size={13} style={{ transform: "rotate(-90deg)" }} />
              </button>
              <button
                type="button"
                aria-label={t("Move down")}
                style={iconBtn}
                disabled={busy || i === images.length - 1}
                onClick={() => move(i, 1)}
              >
                <Icon name="chevron" size={13} style={{ transform: "rotate(90deg)" }} />
              </button>
              <button type="button" aria-label={t("Delete image")} style={iconBtn} onClick={() => remove(img)}>
                <Icon name="trash" size={13} />
              </button>
            </div>
          </div>
        ))
      )}
      <span className="hint">{t("Changes here save immediately. Captions save when you leave the box.")}</span>
    </div>
  );
}
