"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { useAuth } from "@/providers/AuthProvider";
import { useSearch } from "@/providers/SearchProvider";
import { RESOURCES } from "@/lib/resources";
import { initials } from "@/lib/utils";

const STATIC_TITLES: Record<string, string> = {
  "/overview": "Overview",
  "/messages": "Inbox",
  "/settings": "Site settings",
};

export function Topbar({ onMenu, unread }: { onMenu: () => void; unread: number }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { query, setQuery } = useSearch();

  const key = pathname.replace(/^\//, "");
  const title = STATIC_TITLES[pathname] ?? RESOURCES[key]?.title ?? "Admin";
  const searchable = Boolean(RESOURCES[key]) || pathname === "/messages";
  const name = user?.name || user?.username || user?.email || "Staff";

  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" onClick={onMenu} aria-label="Open menu">
        <Icon name="menu" size={19} strokeWidth={1.9} />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--color-faint)", minWidth: 0 }}>
        <span className="crumb-root">etqan.agency</span>
        <Icon name="chevron" size={14} strokeWidth={2} className="crumb-root" style={{ opacity: 0.5 }} />
        <b style={{ color: "var(--color-body)", fontWeight: 600 }}>{title}</b>
      </div>

      <div style={{ flex: 1 }} />

      {searchable ? (
        <label className="searchbox">
          <Icon name="search" size={15} strokeWidth={1.9} style={{ color: "var(--color-faint)", flex: "none" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}`}
            aria-label={`Search ${title}`}
          />
        </label>
      ) : null}

      <Link href="/messages" className="icon-btn" aria-label="Inbox">
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

      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
          {initials(name)}
        </div>
        <div className="who-text">
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{name}</div>
          <div style={{ fontSize: 11, color: "var(--color-faint)" }}>
            {user?.is_admin ? "Admin" : user?.is_staff ? "Staff" : "Read only"}
          </div>
        </div>
      </div>
    </header>
  );
}
