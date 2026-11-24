"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { SESSION_EXPIRED_EVENT, USE_MOCK, login as apiLogin, logout as apiLogout, me, tokens } from "@/lib/api";
import { t } from "@/lib/i18n";
import { can } from "@/lib/roles";
import type { User } from "@/lib/types";

interface AuthValue {
  user: User | null;
  ready: boolean;
  signIn: (loginId: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** re-read /me, e.g. after an admin changed your role */
  reload: () => Promise<void>;
}

const AuthContext = createContext<AuthValue>({
  user: null,
  ready: false,
  signIn: async () => {},
  signOut: async () => {},
  reload: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const isAuthError = (err: unknown) => {
  const status = (err as { status?: number } | null)?.status;
  return status === 401 || status === 403;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  const reload = useCallback(async () => {
    try {
      const u = await me();
      setUser(can(u, "dashboard") ? u : null);
    } catch (err) {
      // Only a refused session ends it; a network blip or a 5xx keeps the tokens.
      if (isAuthError(err)) {
        tokens.clear();
        setUser(null);
      }
    }
  }, []);

  // Rehydrate on load: a stored refresh token means the session survives a reload.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (USE_MOCK) {
        try {
          const u = await me();
          if (!cancelled) setUser(u);
        } finally {
          if (!cancelled) setReady(true);
        }
        return;
      }
      if (!tokens.access && !tokens.refresh) {
        setReady(true);
        return;
      }
      try {
        const u = await me();
        if (!cancelled) setUser(can(u, "dashboard") ? u : null);
      } catch (err) {
        if (isAuthError(err)) tokens.clear();
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // The API client gave up refreshing: drop the user and go to the login screen.
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      router.replace("/login?expired=1");
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [router]);

  const signIn = useCallback(async (loginId: string, password: string) => {
    const data = await apiLogin(loginId, password);
    const u = await me().catch(() => data.user as User);
    if (!can(u, "dashboard")) {
      await apiLogout();
      throw new Error(t("That account has no dashboard role. Ask an admin to give it one."));
    }
    setUser(u);
  }, []);

  const signOut = useCallback(async () => {
    await apiLogout();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, ready, signIn, signOut, reload }}>{children}</AuthContext.Provider>
  );
}
