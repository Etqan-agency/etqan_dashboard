"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { EmptyState, PageHead, PrimaryButton, SkeletonRows } from "@/components/ui";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import type { Message, Paginated, SiteSettings } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { isRtl, t } from "@/lib/i18n";
import { can, canOpen } from "@/lib/roles";

/** null = not loaded (no permission, or the probe failed). */
interface Counts {
  services: number | null;
  projects: number | null;
  blogAll: number | null;
  blogPublished: number | null;
  unread: number | null;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.etqanpp.com";

export default function OverviewPage() {
  const toast = useToast();
  const { user } = useAuth();
  const canContent = can(user, "content");
  const canBlog = can(user, "blog.write_own");
  const canMessages = can(user, "messages");
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [inbox, setInbox] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // No aggregate endpoint exists, so counts come from page_size=1 probes.
      // Only probe what this role may read, and settle each probe on its own so
      // one 403/failure never blanks the whole overview.
      const skip = Promise.resolve(null);
      const results = await Promise.allSettled([
        api.get<SiteSettings>("/api/settings/"),
        canContent ? api.list("/api/services/", { page_size: 1 }) : skip,
        canContent ? api.list("/api/projects/", { page_size: 1 }) : skip,
        canBlog ? api.list("/api/blog/", { page_size: 1 }) : skip,
        canBlog ? api.list("/api/blog/", { page_size: 1, published: "true" }) : skip,
        canMessages
          ? api.list<Message>("/api/messages/", { page_size: 5, is_read: "false", ordering: "-created_at" })
          : skip,
      ]);
      if (cancelled) return;
      const value = <T,>(r: PromiseSettledResult<T>) => (r.status === "fulfilled" ? r.value : null);
      const [set, services, projects, blogAll, blogPublished, unread] = results;
      const countOf = (r: PromiseSettledResult<Paginated<any> | null>) => value(r)?.count ?? null;
      setSettings(value(set as PromiseSettledResult<SiteSettings>));
      setCounts({
        services: countOf(services as PromiseSettledResult<Paginated<any> | null>),
        projects: countOf(projects as PromiseSettledResult<Paginated<any> | null>),
        blogAll: countOf(blogAll as PromiseSettledResult<Paginated<any> | null>),
        blogPublished: countOf(blogPublished as PromiseSettledResult<Paginated<any> | null>),
        unread: countOf(unread as PromiseSettledResult<Paginated<any> | null>),
      });
      setInbox((value(unread as PromiseSettledResult<Paginated<Message> | null>)?.results ?? []) as Message[]);
      const failed = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
      if (failed) toast(failed.reason?.message ?? t("Could not load the overview."), true);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [toast, canContent, canBlog, canMessages]);

  const drafts =
    counts && counts.blogAll != null && counts.blogPublished != null ? counts.blogAll - counts.blogPublished : 0;

  const allCards: { label: string; icon: IconName; value: number | null; href: string; note?: React.ReactNode }[] = [
    { label: t("Services"), icon: "spark", value: counts?.services ?? null, href: "/services" },
    { label: t("Portfolio projects"), icon: "layers", value: counts?.projects ?? null, href: "/projects" },
    {
      label: t("Blog posts"),
      icon: "pen",
      value: counts?.blogAll ?? null,
      href: "/blog",
      note:
        drafts > 0 ? (
          <span className="badge b-late">{t(drafts > 1 ? "{n} drafts" : "{n} draft", { n: drafts })}</span>
        ) : (
          <span className="badge b-live">{t("all published")}</span>
        ),
    },
    {
      label: t("Unread messages"),
      icon: "inbox",
      value: counts?.unread ?? null,
      href: "/messages",
      note: counts?.unread ? (
        <span className="badge b-late">{t("needs a reply")}</span>
      ) : (
        <span className="badge b-draft">{t("clear")}</span>
      ),
    },
  ];
  // only show (and link to) sections this role can open
  const cards = allCards.filter((c) => canOpen(user, c.href));

  return (
    <>
      <PageHead
        title={t("Overview")}
        sub={t("What's live on the site right now, and what's waiting on you.")}
        actions={
          <>
            <a className="btn btn-ghost" href={SITE_URL} target="_blank" rel="noreferrer">
              <Icon name="external" size={14} />
              {t("View site")}
            </a>
            {canOpen(user, "/blog") ? (
              <Link href="/blog">
                <PrimaryButton>{t("Write a post")}</PrimaryButton>
              </Link>
            ) : null}
          </>
        }
      />

      {/* signature block: the live hero copy, straight from /api/settings/ */}
      <div className="card" style={{ padding: 24, position: "relative", overflow: "hidden", marginBottom: 15 }}>
        <div
          style={{
            position: "absolute",
            inset: "0 0 auto",
            height: 150,
            background: "linear-gradient(180deg, rgba(191,216,245,.4), rgba(191,216,245,0))",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative" }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            <Icon name="globe" size={13} style={{ color: "var(--color-blue)" }} />
            {t("Live homepage hero")}
          </div>
          <h2
            dir="auto"
            style={{
              fontSize: "clamp(22px, 3.2vw, 34px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              maxWidth: "20ch",
            }}
          >
            {settings?.hero_title ?? "—"}
          </h2>
          <p dir="auto" style={{ color: "var(--color-muted)", marginTop: 10, maxWidth: "56ch" }}>{settings?.hero_subtitle ?? ""}</p>
          <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap", alignItems: "center" }}>
            {canOpen(user, "/settings") ? (
              <Link href="/settings" className="btn btn-ghost btn-sm">
                {t("Edit hero copy")}
              </Link>
            ) : null}
            {settings?.announcement_text ? <span className="tag" dir="auto">{settings.announcement_text}</span> : null}
          </div>
        </div>
      </div>

      <div className="grid-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card" style={{ padding: "17px 19px", display: "block" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 31,
                  height: 31,
                  borderRadius: 10,
                  background: "var(--color-surface-2)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--color-blue)",
                  border: "1px solid var(--color-line)",
                }}
              >
                <Icon name={c.icon} size={16} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-muted)" }}>{c.label}</div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 9, marginTop: 9 }}>
              <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>
                {loading || c.value == null ? "—" : c.value}
              </div>
              {!loading && c.value != null ? c.note : null}
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "26px 0 13px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>{t("Needs attention")}</h2>
      </div>

      <div className={canMessages ? "grid-split" : undefined}>
        {canMessages ? (
          <div className="card">
            <div className="card-head">
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>{t("Unread messages")}</h3>
              <Link href="/messages" className="link" style={{ marginInlineStart: "auto" }}>
                {t("Open inbox")}
                <Icon name="chevron" size={13} strokeWidth={2} style={isRtl() ? { transform: "scaleX(-1)" } : undefined} />
              </Link>
            </div>
            {loading ? (
              <SkeletonRows count={3} />
            ) : inbox.length ? (
              inbox.map((m) => (
                <Link key={m.id} href="/messages" className="row" style={{ display: "flex" }}>
                  <div className="row-ico" style={{ color: "var(--color-blue)" }}>
                    <Icon name="inbox" size={15} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.subject || m.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--color-faint)", marginTop: 2 }}>
                      {m.name} · {m.email || m.phone || t("no contact")} · {timeAgo(m.created_at)}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState icon="check" tone="moss" title={t("Inbox is clear")} body={t("No unread contact submissions.")} />
            )}
          </div>
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          {canBlog ? (
            <div className="card card-dark card-pad">
              <span
                className="tag"
                style={{ borderColor: "rgba(255,255,255,.18)", color: "rgba(255,255,255,.8)", background: "transparent" }}
              >
                {t("Drafts")}
              </span>
              <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.25, marginTop: 14 }}>
                {loading
                  ? "—"
                  : drafts > 0
                    ? t(drafts > 1 ? "{n} posts still unpublished" : "{n} post still unpublished", { n: drafts })
                    : t("Everything is published")}
              </div>
              <div style={{ color: "rgba(255,255,255,.62)", fontSize: 12.5, marginTop: 8 }}>
                {t("Unpublished items are hidden from the public API.")}
              </div>
              <Link href="/blog" className="btn btn-blue btn-sm" style={{ marginTop: 16 }}>
                {t("Review drafts")}
              </Link>
            </div>
          ) : null}

          <div className="card card-pad">
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{t("Site stats block")}</h3>
            <p className="hint" style={{ marginBottom: 12 }}>
              {t("Shown on the homepage. Edit these under Site settings.")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {Object.entries(settings?.stats ?? {}).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--color-muted)" }}>{k}</span>
                  <b>{String(v)}</b>
                </div>
              ))}
              {!loading && !Object.keys(settings?.stats ?? {}).length ? (
                <span className="hint">{t("No stats set yet.")}</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
