/** Auth session context: restores the session, exposes login/register/logout. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { api, clearTokens, hasSession, setTokens } from "@/lib/api";
import type { AuthUser, Tokens } from "@/types/api";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { email: string; full_name: string; password: string }) => Promise<{
    email: string;
    email_verified: boolean;
    dev_otp?: string;
    message?: string;
  }>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  resendOtp: (email: string) => Promise<{ dev_otp?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(hasSession());

  useEffect(() => {
    let cancelled = false;
    if (!hasSession()) {
      return;
    }
    api
      .get<{ user: AuthUser }>("/auth/me/")
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        clearTokens();
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const applyTokens = useCallback(async (tokens: Tokens): Promise<AuthUser> => {
    setTokens(tokens.access, tokens.refresh);
    const data = await api.get<{ user: AuthUser }>("/auth/me/");
    return data.user;
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api.post<{ user: AuthUser; tokens: Tokens }>(
        "/auth/login/",
        { email, password },
      );
      const me = await applyTokens(data.tokens);
      setUser(me);
    },
    [applyTokens],
  );

  const register = useCallback(
    async (payload: { email: string; full_name: string; password: string }) => {
      return api.post<{ email: string; email_verified: boolean; dev_otp?: string }>(
        "/auth/register/",
        payload,
      );
    },
    [],
  );

  const verifyOtp = useCallback(
    async (email: string, code: string) => {
      const data = await api.post<{ user: AuthUser; tokens: Tokens }>(
        "/auth/verify-otp/",
        { email, code },
      );
      const me = await applyTokens(data.tokens);
      setUser(me);
    },
    [applyTokens],
  );

  const resendOtp = useCallback(
    async (email: string) => {
      return api.post<{ dev_otp?: string }>("/auth/resend-otp/", { email });
    },
    [],
  );

  const logout = useCallback(() => {
    void api.post("/auth/logout/").catch(() => undefined);
    clearTokens();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, verifyOtp, resendOtp, logout }),
    [user, loading, login, register, verifyOtp, resendOtp, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
