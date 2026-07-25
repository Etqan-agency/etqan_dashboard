"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { EmptyState, PageHead, Pager, PrimaryButton, SkeletonRows } from "@/components/ui";
import { ResourceEditor } from "@/components/ResourceEditor";
import { RESOURCES } from "@/lib/resources";
import { api } from "@/lib/api";
import type { AnyRecord, Paginated } from "@/lib/types";
import { useSearch } from "@/providers/SearchProvider";
import { useToast } from "@/providers/ToastProvider";

export default function ResourcePage() {
  const params = useParams<{ resource: string }>();
  const key = params.resource;
  const def = RESOURCES[key];
  if (!def) notFound();

  const toast = useToast();
  const { debounced } = useSearch();

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
        [field, `Sort: ${field.replace(/_/g, " ")} ↑`],
        [`-${field}`, `Sort: ${field.replace(/_/g, " ")} ↓`],
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
        title={def.title}
        sub={def.sub}
        actions={<PrimaryButton onClick={openNew}>New {def.noun}</PrimaryButton>}
      />

      <div className="toolbar">
        {(def.filters ?? []).map((f) => (
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
                {l}
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
              {n} / page
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
            title={`Couldn't load ${def.title.toLowerCase()}`}
            body={error}
            action={
              <button className="btn btn-ghost btn-sm" onClick={load}>
                Try again
              </button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={def.icon}
            title={hasFilters ? "No matches" : "Nothing here yet"}
            body={
              hasFilters
                ? "No records match the current search and filters."
                : `Add your first ${def.noun} to see it on the site.`
            }
            action={
              hasFilters ? null : (
                <button className="btn btn-blue btn-sm" onClick={openNew}>
                  New {def.noun}
                </button>
              )
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  {def.columns.map((c) => (
                    <th key={c.header}>{c.header}</th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((record) => (
                  <tr key={record.id} onClick={() => openEdit(record)}>
                    {def.columns.map((c) => (
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
                        Edit
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
