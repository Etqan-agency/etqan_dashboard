"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { Badge, Drawer, EmptyState, PageHead, Pager, SkeletonRows } from "@/components/ui";
import { api } from "@/lib/api";
import type { LeadStatus, Message, Paginated } from "@/lib/types";
import { formatDate, timeAgo } from "@/lib/utils";
import { useSearch } from "@/providers/SearchProvider";
import { useToast } from "@/providers/ToastProvider";
import { isRtl, t } from "@/lib/i18n";

/** English labels — translated with t() at render time. */
const FILTERS: [string, string][] = [
  ["", "All"],
  ["false", "Unread"],
  ["true", "Read"],
];

/** Lead pipeline, in order. Mirrors the backend `status` choices. */
const STATUSES: [LeadStatus, string][] = [
  ["new", "New"],
  ["qualified", "Qualified"],
  ["proposal", "Proposal"],
  ["won", "Won"],
  ["lost", "Lost"],
  ["spam", "Spam"],
];
const STATUS_LABEL = Object.fromEntries(STATUSES) as Record<LeadStatus, string>;
const STATUS_TONE: Record<LeadStatus, "blue" | "warn" | "sky" | "live" | "draft" | "late"> = {
  new: "blue",
  qualified: "warn",
  proposal: "sky",
  won: "live",
  lost: "draft",
  spam: "late",
};

const LANGUAGE_LABEL: Record<string, string> = { en: "English", ar: "Arabic" };

const notifyShell = () => window.dispatchEvent(new Event("etqan:inbox-changed"));

function StatusPill({ status, label }: { status?: LeadStatus; label?: string }) {
  const s = (status ?? "new") as LeadStatus;
  // known statuses use our own (translated) label; the API's status_display is English-only
  return <Badge tone={STATUS_TONE[s] ?? "draft"}>{STATUS_LABEL[s] ? t(STATUS_LABEL[s]) : label || s}</Badge>;
}

/** Digits only, for https://wa.me/<digits>. */
const waDigits = (phone: string) => phone.replace(/\D/g, "").replace(/^00/, "");
/** Keep a leading + and digits, for tel: links. */
const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** The best way to reach this lead: email if given, otherwise phone. */
function primaryContact(m: Message) {
  if (m.email) return m.email;
  if (m.phone) return m.phone;
  return t("no contact details");
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: "1px solid var(--color-line)", fontSize: 12.5 }}>
      <span style={{ width: 118, flex: "none", color: "var(--color-faint)", fontWeight: 600 }}>{label}</span>
      <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{children}</span>
    </div>
  );
}

function Attribution({ m }: { m: Message }) {
  const rows: [string, ReactNode][] = [];
  const add = (label: string, value?: string | null, mono = false) => {
    if (value)
      rows.push([
        t(label),
        mono ? (
          <span dir="ltr" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
            {value}
          </span>
        ) : (
          value
        ),
      ]);
  };
  add("Source", m.utm_source);
  add("Medium", m.utm_medium);
  add("Campaign", m.utm_campaign);
  add("Term", m.utm_term);
  add("Content", m.utm_content);
  const clickIds = [m.gclid ? "Google Ads (gclid)" : "", m.fbclid ? "Meta (fbclid)" : ""].filter(Boolean).join(" · ");
  if (clickIds) rows.push([t("Ad click ID"), clickIds]);
  add("Referrer", m.referrer, true);
  add("Landing page", m.landing_page, true);
  add("Submitted from", m.page_path, true);

  return (
    <div style={{ marginBottom: 15 }}>
      <div className="field-label" style={{ marginBottom: 6 }}>
        {t("Attribution")}
      </div>
      {rows.length ? (
        rows.map(([label, value]) => (
          <DetailRow key={label} label={label}>
            {value}
          </DetailRow>
        ))
      ) : (
        <span className="hint">{t("No tracking data — the visitor arrived directly or blocked tracking parameters.")}</span>
      )}
    </div>
  );
}

export default function MessagesPage() {
  const toast = useToast();
  const { debounced } = useSearch();
  const [isRead, setIsRead] = useState("");
  const [status, setStatus] = useState("");
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
        status,
        ordering,
        search: debounced,
      });
      setData(result);
    } catch (err: any) {
      setError(err.message ?? t("Request failed."));
    } finally {
      setLoading(false);
    }
  }, [page, isRead, status, ordering, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debounced, isRead, status, ordering]);

  async function markRead(m: Message) {
    try {
      await api.patch(`/api/messages/${m.id}/mark-read/`, {});
      toast(t("Marked as read."));
      load();
      notifyShell();
    } catch (err: any) {
      toast(err.message ?? t("Could not update the message."), true);
    }
  }

  async function toggleRead(m: Message) {
    try {
      // staff can change is_read, status and service; the submission itself is read-only
      await api.patch(`/api/messages/${m.id}/`, { is_read: !m.is_read });
      toast(m.is_read ? t("Marked as unread.") : t("Marked as read."));
      setOpen(null);
      load();
      notifyShell();
    } catch (err: any) {
      toast(err.message ?? t("Could not update the message."), true);
    }
  }

  async function changeStatus(m: Message, next: LeadStatus) {
    if (next === m.status) return;
    try {
      const saved = await api.patch<Message>(`/api/messages/${m.id}/`, { status: next });
      const merged: Message = saved ? { ...m, ...saved } : { ...m, status: next, status_display: STATUS_LABEL[next] };
      setOpen((cur) => (cur && cur.id === m.id ? merged : cur));
      setData((cur) => (cur ? { ...cur, results: cur.results.map((r) => (r.id === m.id ? merged : r)) } : cur));
      toast(t("Status set to {status}.", { status: t(STATUS_LABEL[next]) }));
      // the row may no longer match the active status filter
      if (status && status !== next) load();
    } catch (err: any) {
      toast(err.message ?? t("Could not update the status."), true);
    }
  }

  async function destroy(m: Message) {
    if (!window.confirm(t("Delete this message?"))) return;
    try {
      await api.remove(`/api/messages/${m.id}/`);
      toast(t("Message deleted."));
      setOpen(null);
      load();
      notifyShell();
    } catch (err: any) {
      toast(err.message ?? t("Could not delete the message."), true);
    }
  }

  async function markAllRead() {
    try {
      const unread = await api.list<Message>("/api/messages/", { is_read: "false", page_size: 100 });
      await Promise.all(unread.results.map((m) => api.patch(`/api/messages/${m.id}/mark-read/`, {})));
      toast(
        t(unread.results.length === 1 ? "Marked 1 message as read." : "Marked {n} messages as read.", {
          n: unread.results.length,
        }),
      );
      load();
      notifyShell();
    } catch (err: any) {
      toast(err.message ?? t("Could not update the inbox."), true);
    }
  }

  const rows = data?.results ?? [];

  return (
    <>
      <PageHead
        title={t("Inbox")}
        sub={t("Leads from the contact form. Track each one through the pipeline with its status.")}
        actions={
          <button className="btn btn-ghost" onClick={markAllRead}>
            {t("Mark all read")}
          </button>
        }
      />

      <div className="toolbar">
        {FILTERS.map(([value, label]) => (
          <button key={label} className="chip" data-on={isRead === value} onClick={() => setIsRead(value)}>
            {t(label)}
          </button>
        ))}
        <select className="sel" value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t("Filter by status")}>
          <option value="">{t("All statuses")}</option>
          {STATUSES.map(([value, label]) => (
            <option key={value} value={value}>
              {t(label)}
            </option>
          ))}
        </select>
        <select className="sel" value={ordering} onChange={(e) => setOrdering(e.target.value)} aria-label={t("Sort")}>
          <option value="-created_at">{t("Newest first")}</option>
          <option value="created_at">{t("Oldest first")}</option>
          <option value="is_read">{t("Unread first")}</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <SkeletonRows count={5} />
        ) : error ? (
          <EmptyState icon="x" tone="clay" title={t("Couldn't load the inbox")} body={error} />
        ) : rows.length === 0 ? (
          <EmptyState icon="inbox" title={t("No messages")} body={t("Contact form submissions land here.")} />
        ) : (
          rows.map((m) => (
            <div
              key={m.id}
              className="row"
              onClick={() => setOpen(m)}
              style={{
                cursor: "pointer",
                background: m.is_read
                  ? undefined
                  : `linear-gradient(${isRtl() ? "270deg" : "90deg"}, rgba(37,99,235,.05), transparent 40%)`,
              }}
            >
              <div className="row-ico" style={m.is_read ? undefined : { color: "var(--color-blue)" }}>
                <Icon name="inbox" size={15} />
              </div>
              <div className="row-main">
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.subject || m.service_title || t("(no subject)")}</div>
                <div style={{ fontSize: 11.5, color: "var(--color-faint)", marginTop: 2 }}>
                  {m.name} · {primaryContact(m)}
                  {m.company ? ` · ${m.company}` : ""} · {timeAgo(m.created_at)}
                  {m.utm_source ? ` · ${t("via {source}", { source: m.utm_source })}` : ""}
                </div>
              </div>
              <div className="row-meta">
                {m.service_title ? <span className="tag">{m.service_title}</span> : null}
                {m.budget_range ? <span className="tag">{m.budget_range}</span> : null}
                <StatusPill status={m.status} label={m.status_display} />
                {!m.is_read ? (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      markRead(m);
                    }}
                  >
                    {t("Mark read")}
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
        title={open?.subject || open?.service_title || t("Message")}
        onClose={() => setOpen(null)}
        footer={
          open ? (
            <>
              <button className="btn btn-danger btn-sm" onClick={() => destroy(open)} style={{ marginInlineEnd: "auto" }}>
                {t("Delete")}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(null)}>
                {t("Close")}
              </button>
              <button className="btn btn-blue btn-sm" onClick={() => toggleRead(open)}>
                {open.is_read ? t("Mark unread") : t("Mark read")}
              </button>
            </>
          ) : null
        }
      >
        {open ? (
          <>
            <div style={{ marginBottom: 15 }}>
              <div className="field-label" style={{ marginBottom: 6 }}>
                {t("Status")}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <select
                  className="input"
                  style={{ maxWidth: 200 }}
                  value={open.status ?? "new"}
                  onChange={(e) => changeStatus(open, e.target.value as LeadStatus)}
                >
                  {STATUSES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {t(label)}
                    </option>
                  ))}
                </select>
                <StatusPill status={open.status} label={open.status_display} />
              </div>
            </div>

            <div style={{ marginBottom: 15 }}>
              <div className="field-label" style={{ marginBottom: 6 }}>
                {t("From")}
              </div>
              <div className="input" style={{ background: "var(--color-surface-2)" }}>
                {open.name}
                {open.email ? (
                  <>
                    {" "}
                    <span dir="ltr">&lt;{open.email}&gt;</span>
                  </>
                ) : null}
                {!open.email && open.phone ? (
                  <>
                    {" · "}
                    <span dir="ltr">{open.phone}</span>
                  </>
                ) : null}
              </div>
              {open.email && open.phone ? (
                <div className="hint" style={{ marginTop: 5 }}>
                  {t("Phone:")} <span dir="ltr">{open.phone}</span>
                </div>
              ) : null}
            </div>

            <div style={{ marginBottom: 15 }}>
              <DetailRow label={t("Service")}>{open.service_title || <span className="hint">—</span>}</DetailRow>
              <DetailRow label={t("Project type")}>{open.project_type || <span className="hint">—</span>}</DetailRow>
              <DetailRow label={t("Budget")}>{open.budget_range || <span className="hint">—</span>}</DetailRow>
              {open.company ? <DetailRow label={t("Company")}>{open.company}</DetailRow> : null}
              <DetailRow label={t("Language")}>
                {open.language ? (LANGUAGE_LABEL[open.language] ? t(LANGUAGE_LABEL[open.language]) : open.language) : <span className="hint">—</span>}
              </DetailRow>
              <DetailRow label={t("Received")}>{formatDate(open.created_at)} · {timeAgo(open.created_at)}</DetailRow>
            </div>

            <div style={{ marginBottom: 15 }}>
              <div className="field-label" style={{ marginBottom: 6 }}>
                {t("Message")}
              </div>
              <div
                className="input"
                style={{ background: "var(--color-surface-2)", whiteSpace: "pre-wrap", minHeight: 130 }}
              >
                {open.message || <span className="hint">{t("(no message)")}</span>}
              </div>
            </div>

            <Attribution m={open} />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {open.email ? (
                <a
                  className="btn btn-blue btn-sm"
                  href={`mailto:${open.email}?subject=${encodeURIComponent("Re: " + (open.subject || "Your enquiry"))}`}
                >
                  {t("Reply by email")}
                </a>
              ) : null}
              {open.phone ? (
                <a className={open.email ? "btn btn-ghost btn-sm" : "btn btn-blue btn-sm"} href={telHref(open.phone)}>
                  {t("Call")} <span dir="ltr">{open.phone}</span>
                </a>
              ) : null}
              {open.phone && waDigits(open.phone).length >= 7 ? (
                <a
                  className="btn btn-ghost btn-sm"
                  href={`https://wa.me/${waDigits(open.phone)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              ) : null}
            </div>
            <p className="hint" style={{ marginTop: 8 }}>
              {open.email
                ? t("Replies go out from your own mail client — the API only stores submissions.")
                : t("This lead left a phone number only. WhatsApp needs the number in international format.")}
            </p>
          </>
        ) : null}
      </Drawer>
    </>
  );
}
