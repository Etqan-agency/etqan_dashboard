"use client";

import { useEffect, type ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { cx } from "@/lib/utils";

/* ---------------- Badge ---------------- */
export function Badge({ tone, children }: { tone: "live" | "draft" | "blue" | "warn" | "late" | "sky"; children: ReactNode }) {
  return <span className={`badge b-${tone}`}>{children}</span>;
}

export function StatusBadge({ on, onLabel, offLabel }: { on?: boolean; onLabel: string; offLabel: string }) {
  return <Badge tone={on ? "live" : "draft"}>{on ? onLabel : offLabel}</Badge>;
}

/* ---------------- Primary button with the site's arrow chip ---------------- */
export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cx("btn btn-primary", className)}>
      <span>{children}</span>
      <span className="arrow">
        <Icon name="arrow" size={13} strokeWidth={2.2} style={{ color: "#fff" }} />
      </span>
    </button>
  );
}

/* ---------------- Thumbnail ---------------- */
export function Thumb({ src, round }: { src?: string; round?: boolean }) {
  const style = {
    width: 40,
    height: 40,
    borderRadius: round ? "50%" : 10,
    objectFit: "cover" as const,
    background: "var(--color-surface-2)",
    border: "1px solid var(--color-line)",
    flex: "none",
  };
  if (src) return <img src={src} alt="" style={style} />;
  return (
    <div style={{ ...style, display: "grid", placeItems: "center", color: "var(--color-faint)" }}>
      <Icon name="image" size={16} />
    </div>
  );
}

/* ---------------- Empty state ---------------- */
export function EmptyState({
  icon = "layers",
  title,
  body,
  action,
  tone,
}: {
  icon?: IconName;
  title: string;
  body: string;
  action?: ReactNode;
  tone?: "moss" | "clay";
}) {
  const colour = tone === "moss" ? "var(--color-moss)" : tone === "clay" ? "var(--color-clay)" : "var(--color-faint)";
  return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-line)",
          display: "grid",
          placeItems: "center",
          margin: "0 auto 13px",
          color: colour,
        }}
      >
        <Icon name={icon} size={19} />
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</h3>
      <p style={{ color: "var(--color-muted)", fontSize: 13, margin: "6px auto 15px", maxWidth: "40ch" }}>{body}</p>
      {action}
    </div>
  );
}

/* ---------------- Skeleton rows ---------------- */
export function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skel" />
      ))}
    </>
  );
}

/* ---------------- Pager ---------------- */
export function Pager({
  page,
  pageSize,
  count,
  hasNext,
  hasPrevious,
  onPage,
}: {
  page: number;
  pageSize: number;
  count: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPage: (p: number) => void;
}) {
  const from = count ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, count);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "13px 19px",
        borderTop: "1px solid var(--color-line)",
        flexWrap: "wrap",
      }}
    >
      <span style={{ color: "var(--color-muted)", fontSize: 12.5 }}>
        {from}–{to} of {count}
      </span>
      <div style={{ marginInlineStart: "auto", display: "flex", gap: 7 }}>
        <button className="btn btn-ghost btn-sm" disabled={!hasPrevious} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <button className="btn btn-ghost btn-sm" disabled={!hasNext} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

/* ---------------- Drawer ---------------- */
export function Drawer({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10,26,47,.44)",
          zIndex: 90,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 220ms",
        }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: "fixed",
          insetBlock: 0,
          insetInlineEnd: 0,
          width: "min(560px, 100%)",
          background: "var(--color-surface)",
          zIndex: 100,
          boxShadow: "var(--shadow-e3)",
          transform: open ? "none" : "translateX(100%)",
          transition: "transform 220ms var(--ease-brand)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid var(--color-line)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <h2 style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" size={17} strokeWidth={2} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>{open ? children : null}</div>
        {footer ? (
          <div
            style={{
              padding: "15px 22px",
              borderTop: "1px solid var(--color-line)",
              display: "flex",
              gap: 8,
              background: "var(--color-surface-2)",
            }}
          >
            {footer}
          </div>
        ) : null}
      </aside>
    </>
  );
}

/* ---------------- Page header ---------------- */
export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 16,
        flexWrap: "wrap",
        marginBottom: 20,
      }}
    >
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.1 }}>{title}</h1>
        {sub ? (
          <p style={{ color: "var(--color-muted)", marginTop: 6, fontSize: 13.5, maxWidth: "64ch" }}>{sub}</p>
        ) : null}
      </div>
      {actions ? (
        <div style={{ marginInlineStart: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>
      ) : null}
    </div>
  );
}
