"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { Drawer, EmptyState, PageHead, Pager, SkeletonRows } from "@/components/ui";
import { api } from "@/lib/api";
import type { Message, Paginated } from "@/lib/types";
import { formatDate, timeAgo } from "@/lib/utils";
import { useSearch } from "@/providers/SearchProvider";
import { useToast } from "@/providers/ToastProvider";

const FILTERS: [string, string][] = [
  ["", "All"],
  ["false", "Unread"],
  ["true", "Read"],
];

const notifyShell = () => window.dispatchEvent(new Event("etqan:inbox-changed"));

export default function MessagesPage() {
  const toast = useToast();
  const { debounced } = useSearch();
  const [isRead, setIsRead] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<Message> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<Message | null>(null);
  const pageSize = 12;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api.list<Message>("/api/messages/", {
        page,
        page_size: pageSize,
        is_read: isRead,
        ordering,
        search: debounced,
      });
      setData(result);
    } catch (err: any) {
      setError(err.message ?? "Request failed.");
    } finally {
      setLoading(false);
    }
  }, [page, isRead, ordering, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debounced, isRead, ordering]);

  async function markRead(m: Message) {
    try {
      await api.patch(`/api/messages/${m.id}/mark-read/`, {});
      toast("Marked as read.");
      load();
      notifyShell();
    } catch (err: any) {
      toast(err.message ?? "Could not update the message.", true);
    }
  }

  async function toggleRead(m: Message) {
    try {
      // is_read is the only writable field on this serializer
      await api.patch(`/api/messages/${m.id}/`, { is_read: !m.is_read });
      toast(m.is_read ? "Marked as unread." : "Marked as read.");
      setOpen(null);
      load();
      notifyShell();
    } catch (err: any) {
      toast(err.message ?? "Could not update the message.", true);
    }
  }

  async function destroy(m: Message) {
    if (!window.confirm("Delete this message?")) return;
    try {
      await api.remove(`/api/messages/${m.id}/`);
      toast("Message deleted.");
      setOpen(null);
      load();
      notifyShell();
    } catch (err: any) {
      toast(err.message ?? "Could not delete the message.", true);
    }
  }

  async function markAllRead() {
    try {
      const unread = await api.list<Message>("/api/messages/", { is_read: "false", page_size: 100 });
      await Promise.all(unread.results.map((m) => api.patch(`/api/messages/${m.id}/mark-read/`, {})));
      toast(`Marked ${unread.results.length} message${unread.results.length === 1 ? "" : "s"} as read.`);
      load();
      notifyShell();
    } catch (err: any) {
      toast(err.message ?? "Could not update the inbox.", true);
    }
  }

  const rows = data?.results ?? [];

  return (
    <>
      <PageHead
        title="Inbox"
        sub="Submissions from the contact form. The read flag is the only field you can change."
        actions={
          <button className="btn btn-ghost" onClick={markAllRead}>
            Mark all read
          </button>
        }
      />

      <div className="toolbar">
        {FILTERS.map(([value, label]) => (
          <button key={label} className="chip" data-on={isRead === value} onClick={() => setIsRead(value)}>
            {label}
          </button>
        ))}
        <select className="sel" value={ordering} onChange={(e) => setOrdering(e.target.value)}>
          <option value="-created_at">Newest first</option>
          <option value="created_at">Oldest first</option>
          <option value="is_read">Unread first</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <SkeletonRows count={5} />
        ) : error ? (
          <EmptyState icon="x" tone="clay" title="Couldn't load the inbox" body={error} />
        ) : rows.length === 0 ? (
          <EmptyState icon="inbox" title="No messages" body="Contact form submissions land here." />
        ) : (
          rows.map((m) => (
            <div
              key={m.id}
              className="row"
              onClick={() => setOpen(m)}
              style={{
                cursor: "pointer",
                background: m.is_read ? undefined : "linear-gradient(90deg, rgba(37,99,235,.05), transparent 40%)",
              }}
            >
              <div className="row-ico" style={m.is_read ? undefined : { color: "var(--color-blue)" }}>
                <Icon name="inbox" size={15} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.subject || "(no subject)"}</div>
                <div style={{ fontSize: 11.5, color: "var(--color-faint)", marginTop: 2 }}>
                  {m.name} · {m.email}
                  {m.company ? ` · ${m.company}` : ""} · {timeAgo(m.created_at)}
                </div>
              </div>
              <div style={{ marginInlineStart: "auto", display: "flex", gap: 8, alignItems: "center", flex: "none" }}>
                {m.project_type ? <span className="tag">{m.project_type}</span> : null}
                {m.budget_range ? <span className="tag">{m.budget_range}</span> : null}
                {!m.is_read ? (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      markRead(m);
                    }}
                  >
                    Mark read
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}

        {data && rows.length > 0 ? (
          <Pager
            page={page}
            pageSize={pageSize}
            count={data.count}
            hasNext={Boolean(data.next)}
            hasPrevious={Boolean(data.previous)}
            onPage={setPage}
          />
        ) : null}
      </div>

      <Drawer
        open={Boolean(open)}
        title={open?.subject || "Message"}
        onClose={() => setOpen(null)}
        footer={
          open ? (
            <>
              <button className="btn btn-danger btn-sm" onClick={() => destroy(open)} style={{ marginInlineEnd: "auto" }}>
                Delete
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(null)}>
                Close
              </button>
              <button className="btn btn-blue btn-sm" onClick={() => toggleRead(open)}>
                {open.is_read ? "Mark unread" : "Mark read"}
              </button>
            </>
          ) : null
        }
      >
        {open ? (
          <>
            <div style={{ marginBottom: 15 }}>
              <div className="field-label" style={{ marginBottom: 6 }}>
                From
              </div>
              <div className="input" style={{ background: "var(--color-surface-2)" }}>
                {open.name} &lt;{open.email}&gt;
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 15 }}>
              {open.company ? <span className="tag">{open.company}</span> : null}
              {open.project_type ? <span className="tag">{open.project_type}</span> : null}
              {open.budget_range ? <span className="tag">{open.budget_range}</span> : null}
              <span className="tag">{formatDate(open.created_at)}</span>
            </div>
            <div style={{ marginBottom: 15 }}>
              <div className="field-label" style={{ marginBottom: 6 }}>
                Message
              </div>
              <div
                className="input"
                style={{ background: "var(--color-surface-2)", whiteSpace: "pre-wrap", minHeight: 130 }}
              >
                {open.message}
              </div>
            </div>
            <a
              className="btn btn-blue btn-sm"
              href={`mailto:${open.email}?subject=${encodeURIComponent("Re: " + (open.subject || "Your enquiry"))}`}
            >
              Reply by email
            </a>
            <p className="hint" style={{ marginTop: 8 }}>
              Replies go out from your own mail client — the API only stores submissions.
            </p>
          </>
        ) : null}
      </Drawer>
    </>
  );
}
