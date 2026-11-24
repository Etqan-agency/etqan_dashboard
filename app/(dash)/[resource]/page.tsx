"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { EmptyState, PageHead, Pager, PrimaryButton, SkeletonRows } from "@/components/ui";
import { ResourceEditor, writeCapability } from "@/components/ResourceEditor";
import { PostStatusBadge } from "@/components/BlogWorkflow";
import { RESOURCES, type ColumnDef, type FilterDef } from "@/lib/resources";
import { api } from "@/lib/api";
import { t } from "@/lib/i18n";
import { can } from "@/lib/roles";
import type { AnyRecord, Paginated } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import { useSearch } from "@/providers/SearchProvider";

/** Blog: workflow status instead of the plain published flag. */
const BLOG_STATUS_FILTER: FilterDef = {
  param: "status",
  options: [
    ["", "All states"],
    ["draft", "Draft"],
    ["in_review", "In review"],
    ["changes_requested", "Changes requested"],
    ["approved", "Approved"],
    ["published", "Published"],
  ],
};
import { useToast } from "@/providers/ToastProvider";

export default function ResourcePage() {
  const params = useParams<{ resource: string }>();
  const key = params.resource;
  const def = RESOURCES[key];
  if (!def) notFound();

  const toast = useToast();
  const { user } = useAuth();
  const { debounced } = useSearch();
  const isBlog = def.path === "/api/blog/";
  const canWrite = can(user, writeCapability(def));
  const filterDefs: FilterDef[] = isBlog ? [BLOG_STATUS_FILTER] : (def.filters ?? []);
  const columns: ColumnDef[] = isBlog
    ? [
        ...def.columns.filter((c) => c.header !== "Status"),
        { header: "Status", cell: (r) => <PostStatusBadge record={r} /> },
      ]
    : def.columns;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [ordering, setOrdering] = useState(def.defaultOrder);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [data, setData] = useState<Paginated<AnyRecord> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AnyRecord | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  // reset when switching between collections
  useEffect(() => {
    setPage(1);
    setOrdering(def.defaultOrder);
    setFilters({});
  }, [def]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api.list<AnyRecord>(def.path, {
        page,
        page_size: pageSize,
        ordering,
        search: debounced,
        ...filters,
      });
      setData(result);
    } catch (err: any) {
      setError(err.message ?? "Request failed.");
    } finally {
      setLoading(false);
    }
  }, [def.path, page, pageSize, ordering, debounced, filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debounced]);

  const orderOptions = useMemo(
    () =>
      def.ordering.flatMap((field) => [
        [field, t("Sort: {field} ↑", { field: t(field.replace(/_/g, " ")) })],
        [`-${field}`, t("Sort: {field} ↓", { field: t(field.replace(/_/g, " ")) })],
      ]) as [string, string][],
    [def],
  );

  const rows = data?.results ?? [];
  const hasFilters = Boolean(debounced) || Object.values(filters).some(Boolean);

  function openNew() {
    setEditing(null);
    setEditorOpen(true);
  }
  function openEdit(record: AnyRecord) {
    setEditing(record);
    setEditorOpen(true);
  }

  return (
    <>
      <PageHead
        title={t(def.title)}
        sub={t(def.sub)}
        actions={canWrite ? <PrimaryButton onClick={openNew}>{t("Add {noun}", { noun: t(def.noun) })}</PrimaryButton> : null}
      />

      <div className="toolbar">
        {filterDefs.map((f) => (
          <select
            key={f.param}
            className="sel"
            value={filters[f.param] ?? ""}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, [f.param]: e.target.value }));
              setPage(1);
            }}
          >
            {f.options.map(([v, l]) => (
              <option key={v} value={v}>
                {t(l)}
              </option>
            ))}
          </select>
        ))}
        <select
          className="sel"
          value={ordering}
          onChange={(e) => {
            setOrdering(e.target.value);
            setPage(1);
          }}
        >
          {orderOptions.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <div style={{ flex: 1 }} />
        <select
          className="sel"
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
        >
          {[12, 24, 48, 100].map((n) => (
            <option key={n} value={n}>
              {t("{n} / page", { n })}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <SkeletonRows count={5} />
        ) : error ? (
          <EmptyState
            icon="x"
            tone="clay"
            title={t("Couldn't load {what}", { what: t(def.title) })}
            body={error}
            action={
              <button className="btn btn-ghost btn-sm" onClick={load}>
                {t("Try again")}
              </button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={def.icon}
            title={hasFilters ? t("No matches") : t("Nothing here yet")}
            body={
              hasFilters
                ? t("No records match the current search and filters.")
                : t("Add your first {noun} to see it on the site.", { noun: t(def.noun) })
            }
            action={
              hasFilters || !canWrite ? null : (
                <button className="btn btn-blue btn-sm" onClick={openNew}>
                  {t("Add {noun}", { noun: t(def.noun) })}
                </button>
              )
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c.header}>{t(c.header)}</th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((record) => (
                  <tr key={record.id} onClick={() => openEdit(record)}>
                    {columns.map((c) => (
                      <td key={c.header}>{c.cell(record)}</td>
                    ))}
                    <td style={{ textAlign: "end" }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(record);
                        }}
                      >
                        {(isBlog ? record.permissions?.edit : canWrite) ? t("Edit") : t("Open")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      <ResourceEditor
        def={def}
        record={editing}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={load}
      />
    </>
  );
}
