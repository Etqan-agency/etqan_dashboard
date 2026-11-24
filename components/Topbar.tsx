"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { useAuth } from "@/providers/AuthProvider";
import { useSearch } from "@/providers/SearchProvider";
import { RESOURCES } from "@/lib/resources";
import { t } from "@/lib/i18n";
import { ROLE_LABEL, can, roleOf } from "@/lib/roles";
import { initials } from "@/lib/utils";

const STATIC_TITLES: Record<string, string> = {
  "/overview": "Overview",
  "/messages": "Inbox",
  "/settings": "Site settings",
  "/users": "Users",
  "/site-texts": "Website texts",
};

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.etqanpp.com").replace(/\/+$/, "");

export function Topbar({ onMenu, unread }: { onMenu: () => void; unread: number }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { query, setQuery } = useSearch();

  const key = pathname.replace(/^\//, "");
  const title = t(STATIC_TITLES[pathname] ?? RESOURCES[key]?.title ?? "Control panel");
  const searchable = Boolean(RESOURCES[key]) || ["/messages", "/users", "/site-texts"].includes(pathname);
  const name = user?.name || user?.username || user?.email || t("Staff");
  const role = roleOf(user);

  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" onClick={onMenu} aria-label={t("Open menu")}>
        <Icon name="menu" size={19} strokeWidth={1.9} />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--color-faint)", minWidth: 0 }}>
        <a className="crumb-root" href={SITE_URL} target="_blank" rel="noreferrer" title={t("View site")} dir="ltr">
          etqan.agency
        </a>
        <Icon name="chevron" size={14} strokeWidth={2} className="crumb-root flip-rtl" style={{ opacity: 0.5 }} />
        <b style={{ color: "var(--color-body)", fontWeight: 600 }}>{title}</b>
      </div>

      <div style={{ flex: 1 }} />

      {searchable ? (
        <label className="searchbox">
          <Icon name="search" size={15} strokeWidth={1.9} style={{ color: "var(--color-faint)", flex: "none" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search {what}", { what: title })}
            aria-label={t("Search {what}", { what: title })}
          />
        </label>
      ) : null}

      {can(user, "messages") ? (
        <Link href="/messages" className="icon-btn" aria-label={t("Inbox")}>
          <Icon name="bell" size={18} />
          {unread > 0 ? (
            <span
              style={{
                position: "absolute",
                top: 8,
                insetInlineEnd: 9,
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--color-clay)",
                border: "2px solid var(--color-surface)",
              }}
            />
          ) : null}
        </Link>
      ) : null}

      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
          {initials(name)}
        </div>
        <div className="who-text">
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{name}</div>
          <div style={{ fontSize: 11, color: "var(--color-faint)" }}>{role ? t(ROLE_LABEL[role]) : t("Read only")}</div>
        </div>
      </div>
    </header>
  );
}
