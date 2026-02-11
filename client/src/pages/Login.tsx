import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Crown, LogIn, Shield, Loader2, AlertCircle, Lock, Mail } from "lucide-react";

export default function Login() {
  const { login, adminLogin } = useAuth();
  const [mode, setMode] = useState<"user" | "admin">("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await adminLogin(adminPassword);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans flex items-center justify-center relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-background to-background pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_80%,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 border border-primary/20 mb-5">
            <Crown className="w-6 h-6 text-primary" strokeWidth={1.5} />
          </div>
          <h1
            className="text-3xl font-serif font-medium tracking-tight text-foreground mb-1"
            data-testid="text-login-title"
          >
            M+ Global <span className="text-primary italic">Pro</span>
          </h1>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70 font-medium">
            AI Stock Trend Terminal
          </p>
        </div>

        <div className="bg-card/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 shadow-2xl shadow-black/50">
          <div className="flex gap-1 mb-6 bg-background/40 rounded-lg p-1">
            <button
              onClick={() => { setMode("user"); setError(""); }}
              className={`flex-1 py-2 text-[10px] uppercase tracking-[0.15em] font-medium rounded-md transition-all cursor-pointer ${
                mode === "user"
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-muted-foreground/60 hover:text-muted-foreground"
              }`}
              data-testid="button-user-tab"
            >
              <LogIn className="w-3 h-3 inline mr-1 -mt-0.5" />
              Client
            </button>
            <button
              onClick={() => { setMode("admin"); setError(""); }}
              className={`flex-1 py-2 text-[10px] uppercase tracking-[0.15em] font-medium rounded-md transition-all cursor-pointer ${
                mode === "admin"
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-muted-foreground/60 hover:text-muted-foreground"
              }`}
              data-testid="button-admin-tab"
            >
              <Shield className="w-3 h-3 inline mr-1 -mt-0.5" />
              Admin
            </button>
          </div>

          {error && (
            <div
              className="flex items-center gap-2 text-red-400 text-xs mb-4 bg-red-500/10 border border-red-500/15 rounded-lg p-3"
              data-testid="text-login-error"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          {mode === "user" ? (
            <form onSubmit={handleUserLogin} className="space-y-4">
              <div>
                <label className="text-[10px] text-muted-foreground/70 uppercase tracking-widest mb-1.5 block">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 pl-10 bg-background/30 border-white/[0.06] focus-visible:border-primary/40 text-foreground placeholder:text-muted-foreground/30"
                    required
                    data-testid="input-email"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground/70 uppercase tracking-widest mb-1.5 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pl-10 bg-background/30 border-white/[0.06] focus-visible:border-primary/40 text-foreground placeholder:text-muted-foreground/30"
                    required
                    data-testid="input-password"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary text-primary-foreground font-medium tracking-[0.15em] text-xs hover:bg-primary/90 cursor-pointer mt-2"
                data-testid="button-login"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "SIGN IN"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="text-[10px] text-muted-foreground/70 uppercase tracking-widest mb-1.5 block">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                  <Input
                    type="password"
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="h-11 pl-10 bg-background/30 border-white/[0.06] focus-visible:border-primary/40 text-foreground placeholder:text-muted-foreground/30"
                    required
                    data-testid="input-admin-password"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary text-primary-foreground font-medium tracking-[0.15em] text-xs hover:bg-primary/90 cursor-pointer mt-2"
                data-testid="button-admin-login"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "ADMIN LOGIN"
                )}
              </Button>
            </form>
          )}

          <p className="text-[10px] text-muted-foreground/40 text-center mt-5">
            {mode === "user" ? "Sessions expire after 15 minutes" : "Admin access for user management"}
          </p>
        </div>

        <p className="text-[10px] text-muted-foreground/30 text-center mt-6 font-light">
          Dexter Chia Private Clients
        </p>
      </div>
    </div>
  );
}
