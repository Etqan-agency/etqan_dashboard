"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Drawer, EmptyState, PageHead, Pager, PrimaryButton, SkeletonRows, StatusBadge } from "@/components/ui";
import { Field, ToggleRow } from "@/components/fields";
import { Icon } from "@/components/Icon";
import { api } from "@/lib/api";
import { t } from "@/lib/i18n";
import { ROLES, ROLE_LABEL, can } from "@/lib/roles";
import type { ManagedUser, Paginated } from "@/lib/types";
import { formatDate, timeAgo } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useSearch } from "@/providers/SearchProvider";
import { useToast } from "@/providers/ToastProvider";

const PRIVILEGED = new Set(["admin", "super_admin"]);

/** 16 random characters from a set without look-alikes; meets the backend's validators. */
function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%*?";
  const bytes = new Uint32Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function PasswordInput({ value, onChange, autoComplete }: { value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: "flex", gap: 7 }}>
      <div style={{ position: "relative", flex: 1 }} dir="ltr">
        <input
          className="input"
          dir="ltr"
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ paddingInlineEnd: 44 }}
        />
        <button
          type="button"
          className="pw-toggle"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? t("Hide password") : t("Show password")}
          aria-pressed={show}
          title={show ? t("Hide password") : t("Show password")}
        >
          <Icon name={show ? "eyeOff" : "eye"} size={17} />
        </button>
      </div>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        style={{ flex: "none" }}
        onClick={() => {
          onChange(generatePassword());
          setShow(true);
        }}
      >
        <Icon name="key" size={13} /> {t("Generate")}
      </button>
    </div>
  );
}

const EMPTY = { name: "", email: "", username: "", role: "writer", is_active: true, password: "" };

function UserEditor({
  record,
  open,
  onClose,
  onSaved,
}: {
  record: ManagedUser | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const { user: me } = useAuth();
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const canAdmins = can(me, "users.admins");
  const isSelf = Boolean(record && me?.id && record.id === me.id);
  const locked = Boolean(record && PRIVILEGED.has(record.role) && !canAdmins);

  useEffect(() => {
    if (open)
      setForm(
        record
          ? {
              name: record.name ?? "",
              email: record.email,
              username: record.username ?? "",
              role: record.role || "writer",
              is_active: record.is_active,
              password: "",
            }
          : { ...EMPTY },
      );
  }, [open, record]);

  const set = (patch: Partial<typeof EMPTY>) => setForm((f) => ({ ...f, ...patch }));
  const roleOptions = ROLES.filter((r) => canAdmins || !PRIVILEGED.has(r.value) || r.value === form.role);

  async function save() {
    if (!form.email.trim()) return toast(t("{field} is required.", { field: t("Email") }), true);
    if (!record && !form.password) return toast(t("Set a password for the new account."), true);
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        email: form.email.trim(),
        username: form.username.trim() || null,
        is_active: form.is_active,
      };
      if (!isSelf) body.role = form.role;
      if (form.password) body.password = form.password;
      if (record) await api.patch(`/api/users/${record.id}/`, body);
      else await api.post("/api/users/", body);
      toast(record ? t("User updated.") : t("User created. Share the password with them securely."));
      onSaved();
      onClose();
    } catch (err: any) {
      toast(err.message ?? t("Save failed."), true);
    } finally {
      setSaving(false);
    }
  }

  async function deactivate() {
    if (!record) return;
    if (!window.confirm(t("Deactivate {name}? They are signed out and can't sign in until reactivated. Their articles stay.", { name: record.name || record.email })))
      return;
    try {
      await api.remove(`/api/users/${record.id}/`);
      toast(t("User deactivated."));
      onSaved();
      onClose();
    } catch (err: any) {
      toast(err.message ?? t("Request failed."), true);
    }
  }

  const description = ROLES.find((r) => r.value === form.role)?.description;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={record ? t("Edit user") : t("Add user")}
      footer={
        <>
          {record && record.is_active && !isSelf && !locked ? (
            <button className="btn btn-danger btn-sm" onClick={deactivate} style={{ marginInlineEnd: "auto" }}>
              {t("Deactivate")}
            </button>
          ) : null}
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={!record || isSelf || locked ? { marginInlineStart: "auto" } : undefined}>
            {locked ? t("Close") : t("Cancel")}
          </button>
          {!locked ? (
            <button className="btn btn-blue btn-sm" onClick={save} disabled={saving}>
              {saving ? t("Saving…") : t("Save")}
            </button>
          ) : null}
        </>
      }
    >
      {locked ? (
        <div className="workflow-note" role="note">
          {t("Only a super admin can change admin accounts.")}
        </div>
      ) : null}
      <fieldset disabled={locked} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <Field label={t("Full name")}>
          <input className="input" dir="auto" value={form.name} maxLength={150} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <Field label={t("Email")} required hint={t("Used to sign in.")}>
          <input className="input" dir="ltr" type="email" autoComplete="off" value={form.email} onChange={(e) => set({ email: e.target.value })} />
        </Field>
        <Field label={t("Username")} hint={t("Optional. Can be used instead of the email to sign in.")}>
          <input className="input" dir="ltr" autoComplete="off" value={form.username} maxLength={150} onChange={(e) => set({ username: e.target.value })} />
        </Field>
        <Field label={t("Role")} hint={isSelf ? t("You can't change your own role.") : t(description ?? "")}>
          <select className="input" value={form.role} disabled={isSelf} onChange={(e) => set({ role: e.target.value })}>
            {roleOptions.map((r) => (
              <option key={r.value} value={r.value}>
                {t(r.label)}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label={record ? t("New password") : t("Password")}
          required={!record}
          hint={
            record
              ? t("Leave blank to keep the current password. Setting one signs the user out everywhere.")
              : t("At least 8 characters, not too common and not only numbers.")
          }
        >
          <PasswordInput value={form.password} onChange={(v) => set({ password: v })} autoComplete="new-password" />
        </Field>
        {!isSelf ? (
          <div style={{ marginBottom: 15 }}>
            <ToggleRow
              label={t("Active")}
              hint={t("Inactive accounts can't sign in.")}
              on={form.is_active}
              onChange={(v) => set({ is_active: v })}
            />
          </div>
        ) : null}
      </fieldset>
      <details className="hint" style={{ marginTop: 6 }}>
        <summary style={{ cursor: "pointer" }}>{t("What each role can do")}</summary>
        <ul style={{ paddingInlineStart: 18, marginTop: 8, display: "grid", gap: 6 }}>
          {ROLES.map((r) => (
            <li key={r.value}>
              <b>{t(r.label)}</b> — {t(r.description)}
            </li>
          ))}
        </ul>
      </details>
      {record ? (
        <div className="hint" style={{ borderTop: "1px solid var(--color-line)", paddingTop: 12, marginTop: 14 }}>
          {t("Joined {date}", { date: formatDate(record.date_joined) })}
          {record.last_login ? ` · ${t("Last sign-in {when}", { when: timeAgo(record.last_login) })}` : ""}
        </div>
      ) : null}
    </Drawer>
  );
}

export default function UsersPage() {
  const { debounced } = useSearch();
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("true");
  const [data, setData] = useState<Paginated<ManagedUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [open, setOpen] = useState(false);
  const pageSize = 24;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(
        await api.list<ManagedUser>("/api/users/", {
          page,
          page_size: pageSize,
          search: debounced,
          role: roleFilter,
          is_active: activeFilter,
        }),
      );
    } catch (err: any) {
      setError(err.message ?? t("Request failed."));
    } finally {
      setLoading(false);
    }
  }, [page, debounced, roleFilter, activeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = data?.results ?? [];

  return (
    <>
      <PageHead
        title={t("Users")}
        sub={t("Who can sign in to this dashboard and what each person may do. Accounts are deactivated, never deleted, so their articles keep their history.")}
        actions={
          <PrimaryButton
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            {t("Add user")}
          </PrimaryButton>
        }
      />

      <div className="toolbar">
        <select className="sel" value={roleFilter} onChange={(e) => (setRoleFilter(e.target.value), setPage(1))}>
          <option value="">{t("All roles")}</option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {t(r.label)}
            </option>
          ))}
        </select>
        <select className="sel" value={activeFilter} onChange={(e) => (setActiveFilter(e.target.value), setPage(1))}>
          <option value="true">{t("Active")}</option>
          <option value="false">{t("Inactive")}</option>
          <option value="">{t("All statuses")}</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <SkeletonRows count={5} />
        ) : error ? (
          <EmptyState
            icon="x"
            tone="clay"
            title={t("Couldn't load {what}", { what: t("Users") })}
            body={error}
            action={
              <button className="btn btn-ghost btn-sm" onClick={load}>
                {t("Try again")}
              </button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState icon="shield" title={t("No matches")} body={t("No records match the current search and filters.")} />
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t("User")}</th>
                  <th>{t("Role")}</th>
                  <th>{t("Last sign-in")}</th>
                  <th>{t("Status")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => {
                      setEditing(u);
                      setOpen(true);
                    }}
                  >
                    <td>
                      <div style={{ fontWeight: 600 }} dir="auto">
                        {u.name || "—"}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--color-faint)", marginTop: 2 }} dir="ltr">
                        {u.email}
                      </div>
                    </td>
                    <td>
                      <Badge tone={PRIVILEGED.has(u.role) ? "blue" : "sky"}>{t(ROLE_LABEL[u.role] ?? "No role")}</Badge>
                    </td>
                    <td style={{ color: "var(--color-muted)" }}>{u.last_login ? timeAgo(u.last_login) : t("Never")}</td>
                    <td>
                      <StatusBadge on={u.is_active} onLabel={t("Active")} offLabel={t("Inactive")} />
                    </td>
                    <td style={{ textAlign: "end" }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditing(u);
                          setOpen(true);
                        }}
                      >
                        {t("Edit")}
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

      <UserEditor
        record={editing}
        open={open}
        onClose={() => setOpen(false)}
        onSaved={load}
      />
    </>
  );
}
