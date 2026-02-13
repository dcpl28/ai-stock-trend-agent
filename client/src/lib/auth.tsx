import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

interface AuthState {
  authenticated: boolean;
  email: string | null;
  isAdmin: boolean;
  remainingMs: number;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    authenticated: false,
    email: null,
    isAdmin: false,
    remainingMs: 0,
    loading: true,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setState({
        authenticated: data.authenticated,
        email: data.email || null,
        isAdmin: data.isAdmin || false,
        remainingMs: data.remainingMs || 0,
        loading: false,
      });
      if (!data.authenticated && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } catch {
      setState(prev => ({ ...prev, authenticated: false, loading: false }));
    }
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => checkSession();
    window.addEventListener('auth:expired', handleAuthExpired);
    checkSession();
    timerRef.current = setInterval(checkSession, 30000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, [checkSession]);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Login failed");
    }
    await checkSession();
  };

  const adminLogin = async (password: string) => {
    const res = await fetch("/api/auth/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Login failed");
    }
    await checkSession();
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setState({
      authenticated: false,
      email: null,
      isAdmin: false,
      remainingMs: 0,
      loading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, adminLogin, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
