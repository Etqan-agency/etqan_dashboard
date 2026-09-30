"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { request } from "@/lib/api";
import { useToast } from "@/providers/ToastProvider";

/** Largest inline image the API accepts (POST /api/uploads/). */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

/** ~200 words per minute (like the website), at least one minute; Markdown syntax is not counted. */
export function textStats(text: string) {
  const plain = (text ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|-]/g, " ")
    .trim();
  const words = plain ? plain.split(/\s+/).length : 0;
  return { words, minutes: words ? Math.max(1, Math.round(words / 200)) : 0 };
}

type Edit = { before: string; after: string; placeholder: string; block?: boolean; line?: string };

const ACTIONS: { key: string; label: string; title: string; edit: Edit }[] = [
  { key: "h2", label: "H2", title: "Heading 2", edit: { before: "", after: "", placeholder: "Heading", line: "## " } },
  { key: "h3", label: "H3", title: "Heading 3", edit: { before: "", after: "", placeholder: "Subheading", line: "### " } },
  { key: "bold", label: "B", title: "Bold", edit: { before: "**", after: "**", placeholder: "bold text" } },
  { key: "link", label: "Link", title: "Link", edit: { before: "[", after: "](https://)", placeholder: "link text" } },
  { key: "ul", label: "• List", title: "Bulleted list", edit: { before: "", after: "", placeholder: "List item", line: "- " } },
  { key: "ol", label: "1. List", title: "Numbered list", edit: { before: "", after: "", placeholder: "List item", line: "1. " } },
  { key: "quote", label: "Quote", title: "Quote", edit: { before: "", after: "", placeholder: "Quote", line: "> " } },
  { key: "code", label: "</>", title: "Code (inline, or a block for multiple lines)", edit: { before: "`", after: "`", placeholder: "code", block: true } },
];

/**
 * Markdown textarea with a formatting toolbar, a live preview tab (RTL for Arabic),
 * inline image upload (inserts `![alt](url)` at the cursor) and a word-count / reading-time hint.
 */
export function MarkdownEditor({
  value,
  onChange,
  dir,
}: {
  value: string;
  onChange: (v: string) => void;
  dir?: "rtl" | "ltr";
}) {
  const toast = useToast();
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState(false);
  const text = value ?? "";
  const stats = textStats(text);
  const rtl = dir === "rtl";

  /** Replace the current selection and restore a sensible selection afterwards. */
  function replaceSelection(build: (selected: string) => { text: string; selectFrom: number; selectTo: number }) {
    const el = ref.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const out = build(text.slice(start, end));
    onChange(text.slice(0, start) + out.text + text.slice(end));
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(start + out.selectFrom, start + out.selectTo);
    });
  }

  function apply(edit: Edit) {
    const el = ref.current;
    const start = el?.selectionStart ?? text.length;
    replaceSelection((selected) => {
      if (edit.line) {
        // Line-level markers go at the start of every selected line, on a fresh line if needed.
        const atLineStart = start === 0 || text[start - 1] === "\n";
        const lead = atLineStart ? "" : "\n";
        const body = (selected || edit.placeholder)
          .split("\n")
          .map((l, i) => (edit.line === "1. " ? `${i + 1}. ` : edit.line) + l)
          .join("\n");
        const markerLen = lead.length + (edit.line === "1. " ? 3 : edit.line!.length);
        return { text: lead + body, selectFrom: selected ? lead.length : markerLen, selectTo: lead.length + body.length };
      }
      if (edit.block && selected.includes("\n")) {
        const block = "```\n" + selected + "\n```";
        return { text: block, selectFrom: 4, selectTo: 4 + selected.length };
      }
      const inner = selected || edit.placeholder;
      return {
        text: edit.before + inner + edit.after,
        selectFrom: edit.before.length,
        selectTo: edit.before.length + inner.length,
      };
    });
  }

  async function upload(file: File) {
    if (!ACCEPT.split(",").includes(file.type)) {
      toast("Use a JPEG, PNG, WebP or GIF image.", true);
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast("Images must be 5 MB or smaller.", true);
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await request<{ url: string }>("/api/uploads/", { method: "POST", body: form });
      const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/[[\]]/g, "").trim() || "image";
      replaceSelection((selected) => {
        const label = selected.trim() || alt;
        const md = `![${label}](${res.url})`;
        // Keep images on their own line so they render as blocks.
        const el = ref.current;
        const start = el?.selectionStart ?? text.length;
        const lead = start === 0 || text[start - 1] === "\n" ? "" : "\n";
        return { text: `${lead}${md}\n`, selectFrom: lead.length + 2, selectTo: lead.length + 2 + label.length };
      });
      toast("Image uploaded — edit the alt text in the brackets.");
    } catch (err: any) {
      toast(err.message ?? "Upload failed.", true);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const tabBtn = (key: "write" | "preview", label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === key}
      className="md-tab"
      data-active={tab === key}
      onClick={() => setTab(key)}
    >
      {label}
    </button>
  );

  return (
    <div className="md-editor">
      <div className="md-bar">
        <div role="tablist" style={{ display: "flex", gap: 2 }}>
          {tabBtn("write", "Write")}
          {tabBtn("preview", "Preview")}
        </div>
        {tab === "write" ? (
          <div className="md-tools" role="toolbar" aria-label="Formatting">
            {ACTIONS.map((a) => (
              <button
                key={a.key}
                type="button"
                className="md-tool"
                title={a.title}
                aria-label={a.title}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => apply(a.edit)}
                style={a.key === "bold" ? { fontWeight: 800 } : a.key === "code" ? { fontFamily: "var(--font-mono)" } : undefined}
              >
                {a.label}
              </button>
            ))}
            <button
              type="button"
              className="md-tool"
              title="Upload an image (JPEG, PNG, WebP or GIF, max 5 MB)"
              disabled={uploading}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? "Uploading…" : "Image"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file);
              }}
            />
          </div>
        ) : null}
      </div>

      {tab === "write" ? (
        <textarea
          ref={ref}
          className="md-input"
          dir={dir}
          value={text}
          spellCheck
          placeholder={rtl ? "اكتب المقال بصيغة Markdown…" : "Write in Markdown…"}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (!(e.metaKey || e.ctrlKey)) return;
            const k = e.key.toLowerCase();
            if (k === "b") {
              e.preventDefault();
              apply(ACTIONS.find((a) => a.key === "bold")!.edit);
            } else if (k === "k") {
              e.preventDefault();
              apply(ACTIONS.find((a) => a.key === "link")!.edit);
            }
          }}
          onPaste={(e) => {
            const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"));
            if (file) {
              e.preventDefault();
              upload(file);
            }
          }}
        />
      ) : (
        <div className="md-preview" dir={dir} lang={rtl ? "ar" : "en"}>
          {text.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          ) : (
            <p style={{ color: "var(--color-faint)" }}>Nothing to preview yet.</p>
          )}
        </div>
      )}

      <div className="md-foot">
        <span>
          {stats.words.toLocaleString()} {stats.words === 1 ? "word" : "words"} · {stats.minutes} min read
        </span>
        <span>Markdown · ⌘B bold · ⌘K link · paste an image to upload it</span>
      </div>
    </div>
  );
}
