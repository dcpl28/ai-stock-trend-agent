import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Crown, LogIn, Shield, Loader2, AlertCircle } from "lucide-react";

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
    <div className="min-h-screen font-sans flex items-center justify-center relative">
      <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 text-primary mb-3">
            <Crown className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[11px] uppercase tracking-[0.25em] font-medium opacity-80">
              Dexter Chia Private Clients
            </span>
          </div>
          <h1 className="text-4xl font-serif font-medium tracking-tight text-foreground" data-testid="text-login-title">
            Market<span className="text-primary italic">Pro</span> Terminal
          </h1>
          <p className="text-muted-foreground font-light tracking-wide text-sm mt-2">
            Please sign in to access the analysis tools
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setMode("user"); setError(""); }}
            className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-medium rounded-lg transition-all cursor-pointer ${
              mode === "user"
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-card/50 text-muted-foreground border border-white/5 hover:border-white/10"
            }`}
            data-testid="button-user-tab"
          >
            <LogIn className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            Client Login
          </button>
          <button
            onClick={() => { setMode("admin"); setError(""); }}
            className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-medium rounded-lg transition-all cursor-pointer ${
              mode === "admin"
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-card/50 text-muted-foreground border border-white/5 hover:border-white/10"
            }`}
            data-testid="button-admin-tab"
          >
            <Shield className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            Admin
          </button>
        </div>

        <div className="bg-card/50 border border-primary/10 rounded-xl p-6 shadow-2xl shadow-black/40">
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3" data-testid="text-login-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {mode === "user" ? (
            <form onSubmit={handleUserLogin} className="space-y-4">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 block">Email</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-background/50 border-white/10 focus-visible:border-primary/50 text-foreground"
                  required
                  data-testid="input-email"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 block">Password</label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-background/50 border-white/10 focus-visible:border-primary/50 text-foreground"
                  required
                  data-testid="input-password"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary text-primary-foreground font-medium tracking-widest hover:bg-primary/90 cursor-pointer"
                data-testid="button-login"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "SIGN IN"}
              </Button>
              <p className="text-[11px] text-muted-foreground/60 text-center mt-3">
                Sessions expire after 15 minutes of login
              </p>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 block">Admin Password</label>
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="h-11 bg-background/50 border-white/10 focus-visible:border-primary/50 text-foreground"
                  required
                  data-testid="input-admin-password"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary text-primary-foreground font-medium tracking-widest hover:bg-primary/90 cursor-pointer"
                data-testid="button-admin-login"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ADMIN LOGIN"}
              </Button>
              <p className="text-[11px] text-muted-foreground/60 text-center mt-3">
                Admin access lets you manage allowed users
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
