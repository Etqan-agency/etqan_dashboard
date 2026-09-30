"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { EmptyState, PageHead, PrimaryButton, SkeletonRows } from "@/components/ui";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import type { Message, SiteSettings } from "@/lib/types";
import { useToast } from "@/providers/ToastProvider";

interface Counts {
  services: number;
  projects: number;
  blogAll: number;
  blogPublished: number;
  unread: number;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.etqanpp.com";

export default function OverviewPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [inbox, setInbox] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // No aggregate endpoint exists, so counts come from page_size=1 probes.
        const [set, services, projects, blogAll, blogPublished, unread] = await Promise.all([
          api.get<SiteSettings>("/api/settings/"),
          api.list("/api/services/", { page_size: 1 }),
          api.list("/api/projects/", { page_size: 1 }),
          api.list("/api/blog/", { page_size: 1 }),
          api.list("/api/blog/", { page_size: 1, published: "true" }),
          api.list<Message>("/api/messages/", { page_size: 5, is_read: "false", ordering: "-created_at" }),
        ]);
        if (cancelled) return;
        setSettings(set);
        setCounts({
          services: services.count,
          projects: projects.count,
          blogAll: blogAll.count,
          blogPublished: blogPublished.count,
          unread: unread.count,
        });
        setInbox(unread.results);
      } catch (err: any) {
        if (!cancelled) toast(err.message ?? "Could not load the overview.", true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const drafts = counts ? counts.blogAll - counts.blogPublished : 0;

  const cards: { label: string; icon: IconName; value: number; href: string; note?: React.ReactNode }[] = [
    { label: "Services", icon: "spark", value: counts?.services ?? 0, href: "/services" },
    { label: "Portfolio projects", icon: "layers", value: counts?.projects ?? 0, href: "/projects" },
    {
      label: "Blog posts",
      icon: "pen",
      value: counts?.blogAll ?? 0,
      href: "/blog",
      note:
        drafts > 0 ? (
          <span className="badge b-late">{drafts} draft{drafts > 1 ? "s" : ""}</span>
        ) : (
          <span className="badge b-live">all published</span>
        ),
    },
    {
      label: "Unread messages",
      icon: "inbox",
      value: counts?.unread ?? 0,
      href: "/messages",
      note: counts?.unread ? <span className="badge b-late">needs a reply</span> : <span className="badge b-draft">clear</span>,
    },
  ];

  return (
    <>
      <PageHead
        title="Overview"
        sub="What's live on the site right now, and what's waiting on you."
        actions={
          <>
            <a className="btn btn-ghost" href={SITE_URL} target="_blank" rel="noreferrer">
              <Icon name="external" size={14} />
              View site
            </a>
            <Link href="/blog">
              <PrimaryButton>Write a post</PrimaryButton>
            </Link>
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
            Live homepage hero
          </div>
          <h2
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
          <p style={{ color: "var(--color-muted)", marginTop: 10, maxWidth: "56ch" }}>{settings?.hero_subtitle ?? ""}</p>
          <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap", alignItems: "center" }}>
            <Link href="/settings" className="btn btn-ghost btn-sm">
              Edit hero copy
            </Link>
            {settings?.announcement_text ? <span className="tag">{settings.announcement_text}</span> : null}
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
                {loading ? "—" : c.value}
              </div>
              {!loading ? c.note : null}
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "26px 0 13px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>Needs attention</h2>
      </div>

      <div className="grid-split">
        <div className="card">
          <div className="card-head">
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Unread messages</h3>
            <Link href="/messages" className="link" style={{ marginInlineStart: "auto" }}>
              Open inbox
              <Icon name="chevron" size={13} strokeWidth={2} />
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
                    {m.name} · {m.email || m.phone || "no contact"} · {timeAgo(m.created_at)}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState icon="check" tone="moss" title="Inbox is clear" body="No unread contact submissions." />
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          <div className="card card-dark card-pad">
            <span
              className="tag"
              style={{ borderColor: "rgba(255,255,255,.18)", color: "rgba(255,255,255,.8)", background: "transparent" }}
            >
              Drafts
            </span>
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.25, marginTop: 14 }}>
              {loading ? "—" : drafts > 0 ? `${drafts} post${drafts > 1 ? "s" : ""} still unpublished` : "Everything is published"}
            </div>
            <div style={{ color: "rgba(255,255,255,.62)", fontSize: 12.5, marginTop: 8 }}>
              Unpublished items are hidden from the public API.
            </div>
            <Link href="/blog" className="btn btn-blue btn-sm" style={{ marginTop: 16 }}>
              Review drafts
            </Link>
          </div>

          <div className="card card-pad">
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Site stats block</h3>
            <p className="hint" style={{ marginBottom: 12 }}>
              Shown on the homepage. Edit these under Site settings.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {Object.entries(settings?.stats ?? {}).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--color-muted)" }}>{k}</span>
                  <b>{String(v)}</b>
                </div>
              ))}
              {!loading && !Object.keys(settings?.stats ?? {}).length ? (
                <span className="hint">No stats set yet.</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
