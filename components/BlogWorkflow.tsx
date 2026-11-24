"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "./ui";
import { Icon } from "./Icon";
import { api } from "@/lib/api";
import { intlLocale, t } from "@/lib/i18n";
import type { AnyRecord, PostEvent, PostRevision, PostStatus } from "@/lib/types";
import { formatDate, timeAgo } from "@/lib/utils";
import { useToast } from "@/providers/ToastProvider";

export const STATUS_LABEL: Record<PostStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  changes_requested: "Changes requested",
  approved: "Approved",
  published: "Published",
};

const STATUS_TONE: Record<PostStatus, "live" | "draft" | "blue" | "warn" | "late" | "sky"> = {
  draft: "draft",
  in_review: "blue",
  changes_requested: "late",
  approved: "sky",
  published: "live",
};

const ACTION_LABEL: Record<string, string> = {
  created: "Created",
  edited: "Edited",
  submitted: "Submitted for review",
  changes_requested: "Changes requested",
  approved: "Approved",
  published: "Published",
  scheduled: "Scheduled",
  unpublished: "Unpublished",
  comment: "Comment",
  restored: "Revision restored",
};

export function PostStatusBadge({ record }: { record: AnyRecord }) {
  const status = (record.status ?? (record.published ? "published" : "draft")) as PostStatus;
  if (record.is_scheduled) return <Badge tone="warn">{t("Scheduled")}</Badge>;
  return <Badge tone={STATUS_TONE[status] ?? "draft"}>{t(STATUS_LABEL[status] ?? status)}</Badge>;
}

/** <input type="datetime-local"> value for a Date, in local time. */
function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Editorial workflow for one blog post: state, the editor's note, the actions
 * this user may take (from the API's `permissions` block), comments and the
 * revision history. Every action is re-checked by the API.
 */
export function BlogWorkflow({ post, onChange }: { post: AnyRecord; onChange: (post: AnyRecord) => void }) {
  const toast = useToast();
  const perms = post.permissions ?? {};
  const base = `/api/blog/${encodeURIComponent(String(post.slug))}/`;
  const [note, setNote] = useState("");
  const [scheduleAt, setScheduleAt] = useState(() => toLocalInput(new Date(Date.now() + 24 * 3600 * 1000)));
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<{ events: PostEvent[]; revisions: PostRevision[] } | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!perms.comment) return;
    try {
      setHistory(await api.get(`${base}history/`));
    } catch {
      setHistory({ events: [], revisions: [] });
    }
  }, [base, perms.comment]);

  useEffect(() => {
    if (showHistory) loadHistory();
  }, [showHistory, loadHistory]);

  async function run(path: string, body: Record<string, unknown>, done: string) {
    setBusy(true);
    try {
      const updated = await api.post<AnyRecord | null>(`${base}${path}/`, body);
      if (updated) onChange(updated);
      setNote("");
      toast(t(done));
      if (showHistory) loadHistory();
    } catch (err: any) {
      toast(err.message ?? t("Request failed."), true);
    } finally {
      setBusy(false);
    }
  }

  async function restore(rev: PostRevision) {
    if (!window.confirm(t("Restore this revision? The current text is kept in the history."))) return;
    await run(`revisions/${rev.id}/restore`, {}, "Revision restored.");
  }

  const status = (post.status ?? "draft") as PostStatus;

  return (
    <section className="workflow" aria-label={t("Editorial workflow")}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <b style={{ fontSize: 13 }}>{t("Editorial workflow")}</b>
        <PostStatusBadge record={post} />
        {post.is_scheduled && post.published_at ? (
          <span className="hint" style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
            <Icon name="clock" size={13} />
            {t("Goes live {date}", { date: new Date(post.published_at).toLocaleString(intlLocale()) })}
          </span>
        ) : null}
        {post.owner?.name ? (
          <span className="hint" style={{ marginInlineStart: "auto" }}>
            {t("Written by {name}", { name: post.owner.name })}
          </span>
        ) : null}
      </div>

      {post.review_note && status === "changes_requested" ? (
        <div className="workflow-note" role="note">
          <b>{t("Editor's note")}:</b> {post.review_note}
        </div>
      ) : null}

      {!perms.edit && status === "in_review" ? (
        <p className="hint">{t("This post is with the editors. You can edit it again if they request changes.")}</p>
      ) : null}

      {perms.comment || perms.request_changes ? (
        <textarea
          className="input"
          style={{ minHeight: 64 }}
          placeholder={perms.request_changes ? t("Note to the writer (required to request changes)") : t("Add a comment…")}
          value={note}
          maxLength={5000}
          onChange={(e) => setNote(e.target.value)}
        />
      ) : null}

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {perms.submit ? (
          <button className="btn btn-blue btn-sm" disabled={busy} onClick={() => run("submit", { note }, "Sent for review.")}>
            <Icon name="send" size={13} className="flip-rtl" /> {t("Submit for review")}
          </button>
        ) : null}
        {perms.request_changes ? (
          <button
            className="btn btn-ghost btn-sm"
            disabled={busy || !note.trim()}
            title={!note.trim() ? t("Write a note first.") : undefined}
            onClick={() => run("request-changes", { note }, "Changes requested.")}
          >
            {t("Request changes")}
          </button>
        ) : null}
        {perms.approve ? (
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => run("approve", { note }, "Post approved.")}>
            <Icon name="check" size={13} /> {t("Approve")}
          </button>
        ) : null}
        {perms.publish ? (
          <button className="btn btn-blue btn-sm" disabled={busy} onClick={() => run("publish", { note }, "Post published.")}>
            {t("Publish now")}
          </button>
        ) : null}
        {perms.unpublish ? (
          <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => run("unpublish", { note }, "Post unpublished.")}>
            {post.is_scheduled ? t("Cancel schedule") : t("Unpublish")}
          </button>
        ) : null}
        {perms.comment && note.trim() && !perms.request_changes ? (
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => run("comment", { note }, "Comment added.")}>
            {t("Comment")}
          </button>
        ) : null}
        {perms.request_changes && note.trim() ? (
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => run("comment", { note }, "Comment added.")}>
            {t("Comment only")}
          </button>
        ) : null}
      </div>

      {perms.publish ? (
        <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
          <label className="hint" htmlFor="schedule-at">
            {t("Schedule for")}
          </label>
          <input
            id="schedule-at"
            className="input"
            type="datetime-local"
            dir="ltr"
            style={{ maxWidth: 230 }}
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
          />
          <button
            className="btn btn-ghost btn-sm"
            disabled={busy || !scheduleAt}
            onClick={() => {
              const when = new Date(scheduleAt);
              if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
                toast(t("Pick a time in the future."), true);
                return;
              }
              run("publish", { published_at: when.toISOString(), note }, "Post scheduled.");
            }}
          >
            <Icon name="clock" size={13} /> {t("Schedule")}
          </button>
        </div>
      ) : null}

      {perms.comment ? (
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowHistory((v) => !v)}>
            <Icon name="history" size={13} /> {showHistory ? t("Hide history") : t("History and revisions")}
          </button>
          {showHistory ? (
            history ? (
              <div className="history">
                {history.events.length === 0 ? <p className="hint">{t("No activity yet.")}</p> : null}
                <ol>
                  {history.events.map((e) => (
                    <li key={e.id}>
                      <span className="hint" title={formatDate(e.created_at)}>
                        {timeAgo(e.created_at)}
                      </span>{" "}
                      <b>{e.actor ?? t("Someone")}</b> — {t(ACTION_LABEL[e.action] ?? e.action)}
                      {e.note ? <div className="history-note">{e.note}</div> : null}
                    </li>
                  ))}
                </ol>
                {history.revisions.length ? (
                  <>
                    <b style={{ fontSize: 12.5 }}>{t("Earlier versions")}</b>
                    <ol>
                      {history.revisions.map((r) => (
                        <li key={r.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span className="hint">{timeAgo(r.created_at)}</span> · {r.editor ?? t("Someone")} ·{" "}
                            <span dir="auto">{r.snapshot?.title || "—"}</span>
                          </span>
                          {perms.edit ? (
                            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => restore(r)}>
                              {t("Restore")}
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                  </>
                ) : null}
              </div>
            ) : (
              <p className="hint">{t("Loading…")}</p>
            )
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
