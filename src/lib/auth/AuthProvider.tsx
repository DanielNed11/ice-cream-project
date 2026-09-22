"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { apiRequest } from "@/lib/api/client";
import type { AuthTokens, User } from "@/lib/api/types";
import { clearTokens, getAccessToken, storeTokens } from "@/lib/auth/tokens";

interface AuthContextValue {
  user: User | null;
  /** True until the stored token has been checked against the API. */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      setUser(await apiRequest<User>("/api/auth/me"));
    } catch {
      clearTokens();
      setUser(null);
    }
  }, []);

  // A stored token says nothing about who it belongs to, or whether it is still
  // valid, so the session is restored by asking the API rather than by decoding.
  // Every update happens inside the async body: setting state synchronously in
  // an effect would re-render before the browser paints.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (getAccessToken()) {
        await loadProfile();
      }
      if (!cancelled) {
        setLoading(false);
      }
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, [loadProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await apiRequest<AuthTokens>("/api/auth/login", {
        method: "POST",
        body: { email, password },
        anonymous: true,
      });
      storeTokens(tokens);
      await loadProfile();
    },
    [loadProfile],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const tokens = await apiRequest<AuthTokens>("/api/auth/register", {
        method: "POST",
        body: { name, email, password },
        anonymous: true,
      });
      storeTokens(tokens);
      await loadProfile();
    },
    [loadProfile],
  );

  const logout = useCallback(async () => {
    try {
      await apiRequest<void>("/api/auth/logout", { method: "POST" });
    } catch {
      // Revoking server side is best effort: the local tokens go either way.
    }
    clearTokens();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}
