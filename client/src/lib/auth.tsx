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
  timeLeft: number;
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

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

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
      setTimeLeft(data.remainingMs || 0);
      if (!data.authenticated && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } catch {
      setState(prev => ({ ...prev, authenticated: false, loading: false }));
    }
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => checkSession();
    window.addEventListener('auth:expired', handleAuthExpired);
    checkSession();
    pollRef.current = setInterval(checkSession, 30000);
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) return 0;
        return prev - 1000;
      });
    }, 1000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
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
    <AuthContext.Provider value={{ ...state, login, adminLogin, logout, checkSession, timeLeft }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
