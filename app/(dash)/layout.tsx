"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { api, USE_MOCK } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { SearchProvider } from "@/providers/SearchProvider";
import type { Message } from "@/lib/types";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (ready && !user && !USE_MOCK) router.replace("/login");
  }, [ready, user, router]);

  const refreshUnread = useCallback(async () => {
    try {
      const data = await api.list<Message>("/api/messages/", { is_read: "false", page_size: 1 });
      setUnread(data.count ?? 0);
    } catch {
      /* the badge is not worth an error state */
    }
  }, []);

  useEffect(() => {
    if (ready) refreshUnread();
  }, [ready, refreshUnread]);

  // Let pages tell the shell the inbox changed.
  useEffect(() => {
    const handler = () => refreshUnread();
    window.addEventListener("etqan:inbox-changed", handler);
    return () => window.removeEventListener("etqan:inbox-changed", handler);
  }, [refreshUnread]);

  if (!ready) {
    return (
      <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", color: "var(--color-faint)" }}>
        Loading…
      </div>
    );
  }

  return (
    <SearchProvider>
      <div className="shell">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} unread={unread} />
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
          <Topbar onMenu={() => setMenuOpen(true)} unread={unread} />
          <div className="page animate-rise">{children}</div>
        </div>
      </div>
    </SearchProvider>
  );
}
