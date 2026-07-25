"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";
import { API_BASE, USE_MOCK } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

const CONTENT: { href: string; label: string; icon: IconName }[] = [
  { href: "/overview", label: "Overview", icon: "grid" },
  { href: "/services", label: "Services", icon: "spark" },
  { href: "/projects", label: "Portfolio", icon: "layers" },
  { href: "/blog", label: "Blog", icon: "pen" },
  { href: "/opinions", label: "Testimonials", icon: "quote" },
  { href: "/team", label: "Team", icon: "users" },
  { href: "/clients", label: "Clients", icon: "badge" },
];

const SITE: { href: string; label: string; icon: IconName }[] = [
  { href: "/messages", label: "Inbox", icon: "inbox" },
  { href: "/settings", label: "Site settings", icon: "cog" },
];

export function Sidebar({
  open,
  onClose,
  unread,
}: {
  open: boolean;
  onClose: () => void;
  unread: number;
}) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const item = ({ href, label, icon }: { href: string; label: string; icon: IconName }) => {
    const active = pathname === href;
    return (
      <Link key={href} href={href} className="nav-item" data-active={active} onClick={onClose}>
        <Icon name={icon} size={18} style={{ opacity: active ? 1 : 0.8, flex: "none" }} />
        <span>{label}</span>
        {href === "/messages" && unread > 0 ? (
          <span
            style={{
              marginInlineStart: "auto",
              fontSize: 11,
              fontWeight: 700,
              padding: "1px 7px",
              borderRadius: "var(--radius-pill)",
              background: active ? "rgba(255,255,255,.16)" : "var(--color-clay-tint)",
              color: active ? "#fff" : "var(--color-clay)",
            }}
          >
            {unread}
          </span>
        ) : (
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--color-blue)",
              marginInlineStart: "auto",
              opacity: active ? 1 : 0,
              flex: "none",
            }}
          />
        )}
      </Link>
    );
  };

  return (
    <>
      <div
        onClick={onClose}
        className="side-scrim"
        data-open={open}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10,26,47,.42)",
          zIndex: 55,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 220ms",
        }}
      />
      <aside className="side" data-open={open}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px" }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "var(--color-ink)",
              display: "grid",
              placeItems: "center",
              color: "#fff",
              flex: "none",
            }}
          >
            <Icon name="layers" size={17} />
          </div>
          <div>
            <div style={{ fontWeight: 800, letterSpacing: "-0.03em", fontSize: 16 }}>ETQAN</div>
            <div
              style={{
                fontSize: 10.5,
                color: "var(--color-faint)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Admin
            </div>
          </div>
        </div>

        <div>
          <div className="nav-label">Content</div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>{CONTENT.map(item)}</nav>
          <div className="nav-label" style={{ marginTop: 20 }}>
            Site
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>{SITE.map(item)}</nav>
        </div>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-line)",
              borderRadius: "var(--radius-md)",
              padding: "11px 12px",
            }}
          >
            <span className={`badge ${USE_MOCK ? "b-warn" : "b-live"}`}>{USE_MOCK ? "Sample data" : "Live API"}</span>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                color: "var(--color-faint)",
                marginTop: 5,
                wordBreak: "break-all",
              }}
            >
              {USE_MOCK ? "no backend attached" : API_BASE}
            </div>
          </div>
          {!USE_MOCK ? (
            <a className="nav-item" href={`${API_BASE}/api/docs/`} target="_blank" rel="noreferrer">
              <Icon name="code" size={18} style={{ opacity: 0.8, flex: "none" }} />
              <span>API docs</span>
              <Icon name="external" size={13} style={{ marginInlineStart: "auto", opacity: 0.5 }} />
            </a>
          ) : null}
          <button className="nav-item" onClick={signOut}>
            <Icon name="logout" size={18} style={{ opacity: 0.8, flex: "none" }} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
