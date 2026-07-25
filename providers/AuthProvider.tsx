"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { USE_MOCK, login as apiLogin, logout as apiLogout, me, tokens } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthValue {
  user: User | null;
  ready: boolean;
  signIn: (loginId: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue>({
  user: null,
  ready: false,
  signIn: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  // Rehydrate on load: a stored refresh token means the session survives a reload.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (USE_MOCK) {
        setReady(true);
        return;
      }
      if (!tokens.access && !tokens.refresh) {
        setReady(true);
        return;
      }
      try {
        const u = await me();
        if (!cancelled) setUser(u);
      } catch {
        tokens.clear();
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (loginId: string, password: string) => {
    const data = await apiLogin(loginId, password);
    const u = data.user ?? (await me());
    if (!u.is_staff && !u.is_admin) {
      await apiLogout();
      throw new Error("That account is not staff — it can read the site but not edit it.");
    }
    setUser(u);
  }, []);

  const signOut = useCallback(async () => {
    await apiLogout();
    setUser(null);
    router.push("/login");
  }, [router]);

  return <AuthContext.Provider value={{ user, ready, signIn, signOut }}>{children}</AuthContext.Provider>;
}
