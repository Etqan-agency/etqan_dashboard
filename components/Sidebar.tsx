"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";
import { BrandLockup, LanguageToggle } from "./Brand";
import { API_BASE, USE_MOCK } from "@/lib/api";
import { t } from "@/lib/i18n";
import { canOpen } from "@/lib/roles";
import { useAuth } from "@/providers/AuthProvider";

type NavItem = { href: string; label: string; icon: IconName };

const CONTENT: NavItem[] = [
  { href: "/overview", label: "Overview", icon: "grid" },
  { href: "/blog", label: "Blog", icon: "pen" },
  { href: "/services", label: "Services", icon: "spark" },
  { href: "/projects", label: "Portfolio", icon: "layers" },
  { href: "/authors", label: "Authors", icon: "users" },
  { href: "/opinions", label: "Testimonials", icon: "quote" },
  { href: "/team", label: "Team", icon: "users" },
  { href: "/clients", label: "Clients", icon: "badge" },
  { href: "/faqs", label: "FAQs", icon: "help" },
];

const SITE: NavItem[] = [
  { href: "/site-texts", label: "Website texts", icon: "text" },
  { href: "/messages", label: "Inbox", icon: "inbox" },
  { href: "/settings", label: "Site settings", icon: "cog" },
  { href: "/redirects", label: "Redirects", icon: "arrow" },
];

const ADMIN: NavItem[] = [{ href: "/users", label: "Users", icon: "shield" }];

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
  const { user, signOut } = useAuth();

  const item = ({ href, label, icon }: NavItem) => {
    const active = pathname === href;
    return (
      <Link key={href} href={href} className="nav-item" data-active={active} onClick={onClose}>
        <Icon name={icon} size={18} style={{ opacity: active ? 1 : 0.8, flex: "none" }} />
        <span>{t(label)}</span>
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
              background: "var(--color-accent)",
              marginInlineStart: "auto",
              opacity: active ? 1 : 0,
              flex: "none",
            }}
          />
        )}
      </Link>
    );
  };

  const group = (label: string, items: NavItem[], first = false) => {
    const visible = items.filter((i) => canOpen(user, i.href));
    if (!visible.length) return null;
    return (
      <>
        <div className="nav-label" style={first ? undefined : { marginTop: 20 }}>
          {t(label)}
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>{visible.map(item)}</nav>
      </>
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
          background: "rgba(21,25,52,.42)",
          zIndex: 55,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 220ms",
        }}
      />
      <aside className="side" data-open={open}>
        <BrandLockup />

        <div>
          {group("Content", CONTENT, true)}
          {group("Site", SITE)}
          {group("Administration", ADMIN)}
        </div>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {USE_MOCK ? (
            <div
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-md)",
                padding: "11px 12px",
              }}
            >
              <span className="badge b-warn">{t("Sample data")}</span>
              <div style={{ fontSize: 10.5, color: "var(--color-faint)", marginTop: 5 }}>{t("no backend attached")}</div>
            </div>
          ) : null}
          <LanguageToggle variant="nav" />
          {!USE_MOCK && canOpen(user, "/settings") ? (
            <a className="nav-item" href={`${API_BASE}/api/docs/`} target="_blank" rel="noreferrer">
              <Icon name="code" size={18} style={{ opacity: 0.8, flex: "none" }} />
              <span>{t("API docs")}</span>
              <Icon name="external" size={13} style={{ marginInlineStart: "auto", opacity: 0.5 }} />
            </a>
          ) : null}
          <button className="nav-item" onClick={signOut}>
            <Icon name="logout" size={18} style={{ opacity: 0.8, flex: "none" }} className="flip-rtl" />
            <span>{t("Sign out")}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
