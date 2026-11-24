"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { EmptyState } from "@/components/ui";
import { api, USE_MOCK } from "@/lib/api";
import { t } from "@/lib/i18n";
import { ROLE_LABEL, can, canOpen, roleOf } from "@/lib/roles";
import { useAuth } from "@/providers/AuthProvider";
import { SearchProvider } from "@/providers/SearchProvider";
import type { Message } from "@/lib/types";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const canInbox = can(user, "messages");

  useEffect(() => {
    if (ready && !user && !USE_MOCK) router.replace("/login");
  }, [ready, user, router]);

  const refreshUnread = useCallback(async () => {
    if (!canInbox) return;
    try {
      const data = await api.list<Message>("/api/messages/", { is_read: "false", page_size: 1 });
      setUnread(data.count ?? 0);
    } catch {
      /* the badge is not worth an error state */
    }
  }, [canInbox]);

  useEffect(() => {
    if (ready && user) refreshUnread();
  }, [ready, user, refreshUnread]);

  // Let pages tell the shell the inbox changed.
  useEffect(() => {
    const handler = () => refreshUnread();
    window.addEventListener("etqan:inbox-changed", handler);
    return () => window.removeEventListener("etqan:inbox-changed", handler);
  }, [refreshUnread]);

  if (!ready || (!user && !USE_MOCK)) {
    return (
      <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", color: "var(--color-faint)" }}>
        {t("Loading…")}
      </div>
    );
  }

  const role = roleOf(user);
  const allowed = canOpen(user, pathname);

  return (
    <SearchProvider>
      <div className="shell">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} unread={unread} />
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
          <Topbar onMenu={() => setMenuOpen(true)} unread={unread} />
          <div className="page animate-rise">
            {allowed ? (
              children
            ) : (
              // UI guard only — the API refuses these requests for this role anyway.
              <div className="card">
                <EmptyState
                  icon="shield"
                  tone="clay"
                  title={t("You don't have access to this page.")}
                  body={t("Your role ({role}) can't open this section. Ask an admin if you need access.", {
                    role: role ? t(ROLE_LABEL[role]) : "—",
                  })}
                  action={
                    <Link className="btn btn-ghost btn-sm" href="/overview">
                      {t("Back to overview")}
                    </Link>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </SearchProvider>
  );
}
