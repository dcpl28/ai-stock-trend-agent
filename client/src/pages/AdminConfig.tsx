import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Crown, UserPlus, Trash2, Edit2, Check, X, Loader2, ArrowLeft, Users, Shield, Ban, CheckCircle, Globe, Activity, FileText, Clock, Search, Calendar, BarChart3, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

interface UserEntry {
  id: string;
  email: string;
  disabled: boolean;
  lastIp: string | null;
  lastLoginAt: string | null;
  requestCount: number;
}

interface AnalysisLogEntry {
  id: number;
  userEmail: string;
  symbol: string;
  ip: string | null;
  createdAt: string;
}

export default function AdminConfig() {
  const { isAdmin, logout } = useAuth();
  const [, navigate] = useLocation();
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [error, setError] = useState("");
  const [analysisLogs, setAnalysisLogs] = useState<AnalysisLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logUserFilter, setLogUserFilter] = useState("");
  const [logDateFrom, setLogDateFrom] = useState("");
  const [logDateTo, setLogDateTo] = useState("");
  const [logPage, setLogPage] = useState(1);
  const LOGS_PER_PAGE = 20;
  const [userPage, setUserPage] = useState(1);
  const USERS_PER_PAGE = 10;
  const [rateLimit, setRateLimit] = useState(20);
  const [rateLimitInput, setRateLimitInput] = useState("20");
  const [savingRate, setSavingRate] = useState(false);

  const totalUserPages = Math.max(1, Math.ceil(users.length / USERS_PER_PAGE));
  const paginatedUsers = users.slice((userPage - 1) * USERS_PER_PAGE, userPage * USERS_PER_PAGE);

  const filteredLogs = useMemo(() => {
    return analysisLogs.filter(log => {
      if (logUserFilter) {
        const filter = logUserFilter.toLowerCase();
        if (!log.userEmail.toLowerCase().includes(filter)) return false;
      }
      if (logDateFrom) {
        const from = new Date(logDateFrom);
        from.setHours(0, 0, 0, 0);
        if (new Date(log.createdAt) < from) return false;
      }
      if (logDateTo) {
        const to = new Date(logDateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(log.createdAt) > to) return false;
      }
      return true;
    });
  }, [analysisLogs, logUserFilter, logDateFrom, logDateTo]);

  const totalLogPages = Math.max(1, Math.ceil(filteredLogs.length / LOGS_PER_PAGE));
  const paginatedLogs = filteredLogs.slice((logPage - 1) * LOGS_PER_PAGE, logPage * LOGS_PER_PAGE);

  const stockFrequency = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const log of filteredLogs) {
      counts[log.symbol] = (counts[log.symbol] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [filteredLogs]);

  useEffect(() => {
    setLogPage(1);
  }, [logUserFilter, logDateFrom, logDateTo]);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    fetchUsers();
    fetchAnalysisLogs();
    fetchSettings();
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const fetchAnalysisLogs = async () => {
    try {
      const res = await fetch("/api/admin/analysis-logs?limit=1000");
      if (res.ok) {
        setAnalysisLogs(await res.json());
      }
    } catch {} finally {
      setLogsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setRateLimit(data.rateLimitPerHour);
        setRateLimitInput(String(data.rateLimitPerHour));
      }
    } catch {}
  };

  const saveRateLimit = async () => {
    const val = parseInt(rateLimitInput);
    if (isNaN(val) || val < 1 || val > 1000) return;
    setSavingRate(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rateLimitPerHour: val }),
      });
      if (res.ok) {
        setRateLimit(val);
      }
    } catch {} finally {
      setSavingRate(false);
    }
  };

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAdding(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, password: newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add user");
        return;
      }
      setNewEmail("");
      setNewPassword("");
      await fetchUsers();
    } catch {
      setError("Failed to add user");
    } finally {
      setAdding(false);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      await fetchUsers();
    } catch {}
  };

  const toggleDisable = async (id: string, disabled: boolean) => {
    try {
      await fetch(`/api/admin/users/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled }),
      });
      await fetchUsers();
    } catch {}
  };

  const startEdit = (user: UserEntry) => {
    setEditingId(user.id);
    setEditEmail(user.email);
    setEditPassword("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const body: any = {};
    if (editEmail) body.email = editEmail;
    if (editPassword) body.password = editPassword;

    try {
      const res = await fetch(`/api/admin/users/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setEditingId(null);
        await fetchUsers();
      }
    } catch {}
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen font-sans pb-20">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-transparent pointer-events-none" />

      <div className="max-w-3xl mx-auto p-4 md:p-8 relative z-10 space-y-8">
        <header className="border-b border-primary/20 pb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              data-testid="button-back-dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Terminal
            </button>
            <button
              onClick={logout}
              className="text-sm text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
              data-testid="button-admin-logout"
            >
              Logout
            </button>
          </div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <Crown className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-[10px] uppercase tracking-[0.25em] font-medium opacity-80">Admin Panel</span>
          </div>
          <h1 className="text-3xl font-serif font-medium tracking-tight text-foreground flex items-center gap-3" data-testid="text-admin-title">
            <Shield className="w-7 h-7 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground font-light tracking-wide text-sm mt-2">
            Manage users, monitor activity, and control access.
          </p>
        </header>

        <div className="bg-card/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 shadow-2xl shadow-black/40">
          <h2 className="text-[10px] text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <UserPlus className="w-3.5 h-3.5 text-primary" />
            Add New User
          </h2>
          {error && (
            <div className="text-red-400 text-sm mb-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3" data-testid="text-admin-error">
              {error}
            </div>
          )}
          <form onSubmit={addUser} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="Email address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1 h-10 bg-background/30 border-white/[0.06] focus-visible:border-primary/50 text-foreground"
              required
              data-testid="input-new-email"
            />
            <Input
              type="password"
              placeholder="Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex-1 h-10 bg-background/30 border-white/[0.06] focus-visible:border-primary/50 text-foreground"
              required
              data-testid="input-new-password"
            />
            <Button
              type="submit"
              disabled={adding}
              className="h-10 px-6 bg-primary text-primary-foreground font-medium tracking-widest hover:bg-primary/90 cursor-pointer"
              data-testid="button-add-user"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "ADD"}
            </Button>
          </form>
        </div>

        <div className="bg-card/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 shadow-2xl shadow-black/40">
          <h2 className="text-[10px] text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-primary" />
            Allowed Users ({users.length})
          </h2>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground font-light" data-testid="text-no-users">
              No users added yet. Add a user above to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedUsers.map((user) => (
                <div
                  key={user.id}
                  className={`bg-background/20 border rounded-xl p-4 transition-colors ${
                    user.disabled ? "border-red-500/20 opacity-60" : "border-white/[0.06] hover:border-primary/15"
                  }`}
                  data-testid={`row-user-${user.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {editingId === user.id ? (
                        <div className="flex flex-col sm:flex-row gap-2 mb-3">
                          <Input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="h-8 text-sm bg-background/50 border-white/10 text-foreground"
                            data-testid="input-edit-email"
                          />
                          <Input
                            type="password"
                            placeholder="New password (optional)"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            className="h-8 text-sm bg-background/50 border-white/10 text-foreground"
                            data-testid="input-edit-password"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-foreground font-medium" data-testid={`text-user-email-${user.id}`}>
                            {user.email}
                          </span>
                          {user.disabled && (
                            <span className="text-[9px] uppercase tracking-wider bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full font-medium">
                              Disabled
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground/60">
                        <span className="flex items-center gap-1" data-testid={`text-user-ip-${user.id}`}>
                          <Globe className="w-3 h-3" />
                          {user.lastIp || "No login yet"}
                        </span>
                        <span className="flex items-center gap-1" data-testid={`text-user-requests-${user.id}`}>
                          <Activity className="w-3 h-3" />
                          {user.requestCount} requests
                        </span>
                        <span data-testid={`text-user-lastlogin-${user.id}`}>
                          Last login: {formatDate(user.lastLoginAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {editingId === user.id ? (
                        <>
                          <button
                            onClick={saveEdit}
                            className="p-1.5 text-green-400 hover:bg-green-500/10 rounded transition-colors cursor-pointer"
                            data-testid="button-save-edit"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 text-muted-foreground hover:bg-white/5 rounded transition-colors cursor-pointer"
                            data-testid="button-cancel-edit"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => toggleDisable(user.id, !user.disabled)}
                            className={`p-1.5 rounded transition-colors cursor-pointer ${
                              user.disabled
                                ? "text-green-400 hover:bg-green-500/10"
                                : "text-orange-400 hover:bg-orange-500/10"
                            }`}
                            title={user.disabled ? "Enable user" : "Disable user"}
                            data-testid={`button-toggle-${user.id}`}
                          >
                            {user.disabled ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => startEdit(user)}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors cursor-pointer"
                            data-testid={`button-edit-${user.id}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                            data-testid={`button-delete-${user.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {totalUserPages > 1 && (
                <div className="flex items-center justify-center gap-1 pt-3">
                  <button
                    onClick={() => setUserPage(1)}
                    disabled={userPage === 1}
                    className="h-7 w-7 flex items-center justify-center text-[10px] text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06] rounded transition-colors cursor-pointer"
                    data-testid="button-user-first"
                  >
                    «
                  </button>
                  <button
                    onClick={() => setUserPage(p => Math.max(1, p - 1))}
                    disabled={userPage === 1}
                    className="h-7 w-7 flex items-center justify-center text-[10px] text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06] rounded transition-colors cursor-pointer"
                    data-testid="button-user-prev"
                  >
                    ‹
                  </button>
                  <span className="text-[10px] text-muted-foreground/70 px-3 uppercase tracking-widest">
                    Page {userPage} of {totalUserPages}
                  </span>
                  <button
                    onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))}
                    disabled={userPage === totalUserPages}
                    className="h-7 w-7 flex items-center justify-center text-[10px] text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06] rounded transition-colors cursor-pointer"
                    data-testid="button-user-next"
                  >
                    ›
                  </button>
                  <button
                    onClick={() => setUserPage(totalUserPages)}
                    disabled={userPage === totalUserPages}
                    className="h-7 w-7 flex items-center justify-center text-[10px] text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06] rounded transition-colors cursor-pointer"
                    data-testid="button-user-last"
                  >
                    »
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-card/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 shadow-2xl shadow-black/40">
          <h2 className="text-[10px] text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-primary" />
            Rate Limit Settings
          </h2>
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted-foreground whitespace-nowrap">
              Max AI requests per user per hour:
            </label>
            <Input
              type="number"
              min={1}
              max={1000}
              value={rateLimitInput}
              onChange={(e) => setRateLimitInput(e.target.value)}
              className="w-24 h-9 bg-background/30 border-white/[0.06] focus-visible:border-primary/50 text-foreground text-center"
              data-testid="input-rate-limit"
            />
            <Button
              onClick={saveRateLimit}
              disabled={savingRate || parseInt(rateLimitInput) === rateLimit}
              className="h-9 px-4 bg-primary text-primary-foreground text-xs font-medium tracking-widest hover:bg-primary/90 cursor-pointer"
              data-testid="button-save-rate-limit"
            >
              {savingRate ? <Loader2 className="w-3 h-3 animate-spin" /> : "SAVE"}
            </Button>
            <span className="text-[10px] text-muted-foreground/50">
              Current: {rateLimit}/hr
            </span>
          </div>
        </div>

        {stockFrequency.length > 0 && (
          <div className="bg-card/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 shadow-2xl shadow-black/40">
            <h2 className="text-[10px] text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-primary" />
              Most Searched Stocks
            </h2>
            <div className="space-y-2">
              {stockFrequency.map(([symbol, count], i) => {
                const maxCount = stockFrequency[0][1];
                const pct = (count / maxCount) * 100;
                return (
                  <div key={symbol} className="flex items-center gap-3" data-testid={`row-freq-${symbol}`}>
                    <span className="text-[10px] text-muted-foreground/50 w-5 text-right">{i + 1}.</span>
                    <span className="text-xs text-primary font-mono w-28 truncate" data-testid={`text-freq-symbol-${symbol}`}>{symbol}</span>
                    <div className="flex-1 h-5 bg-background/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary/60 to-primary/30 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(pct, 8)}%` }}
                      >
                        {pct > 25 && <span className="text-[9px] text-primary-foreground/80 font-medium">{count}</span>}
                      </div>
                    </div>
                    {pct <= 25 && <span className="text-[10px] text-muted-foreground/60 w-6">{count}</span>}
                    {i === 0 && <TrendingUp className="w-3 h-3 text-primary/60 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-card/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-primary" />
              AI Analysis Request Log ({analysisLogs.length})
            </h2>
            <button
              onClick={() => { setLogsLoading(true); fetchAnalysisLogs(); }}
              className="text-[10px] text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest cursor-pointer"
              data-testid="button-refresh-logs"
            >
              Refresh
            </button>
          </div>

          <div className="flex flex-wrap items-end gap-3 mb-4">
            <div className="flex-1 min-w-[160px]">
              <label className="text-[9px] text-muted-foreground/60 uppercase tracking-widest mb-1 block">Filter User</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/40" />
                <Input
                  value={logUserFilter}
                  onChange={(e) => setLogUserFilter(e.target.value)}
                  placeholder="Search by email..."
                  className="h-8 pl-7 text-xs bg-background/50 border-white/[0.08] focus:border-primary/50"
                  data-testid="input-log-user-filter"
                />
              </div>
            </div>
            <div className="min-w-[130px]">
              <label className="text-[9px] text-muted-foreground/60 uppercase tracking-widest mb-1 flex items-center gap-1 whitespace-nowrap">
                <Calendar className="w-3 h-3" /> From
              </label>
              <Input
                type="date"
                value={logDateFrom}
                onChange={(e) => setLogDateFrom(e.target.value)}
                className="h-8 text-xs bg-background/50 border-white/[0.08] focus:border-primary/50 [color-scheme:dark]"
                data-testid="input-log-date-from"
              />
            </div>
            <div className="min-w-[130px]">
              <label className="text-[9px] text-muted-foreground/60 uppercase tracking-widest mb-1 flex items-center gap-1 whitespace-nowrap">
                <Calendar className="w-3 h-3" /> To
              </label>
              <Input
                type="date"
                value={logDateTo}
                onChange={(e) => setLogDateTo(e.target.value)}
                className="h-8 text-xs bg-background/50 border-white/[0.08] focus:border-primary/50 [color-scheme:dark]"
                data-testid="input-log-date-to"
              />
            </div>
            {(logUserFilter || logDateFrom || logDateTo) && (
              <button
                onClick={() => { setLogUserFilter(""); setLogDateFrom(""); setLogDateTo(""); }}
                className="h-8 px-3 text-[10px] text-muted-foreground hover:text-primary border border-white/[0.08] rounded-md transition-colors uppercase tracking-widest cursor-pointer"
                data-testid="button-clear-log-filters"
              >
                Clear
              </button>
            )}
          </div>

          {logsLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading logs...
            </div>
          ) : analysisLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground font-light" data-testid="text-no-logs">
              No analysis requests yet.
            </div>
          ) : (
            <>
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 text-[9px] uppercase tracking-widest text-muted-foreground/50 pb-2 border-b border-white/5 sticky top-0 bg-card/95 backdrop-blur-sm px-1">
                  <span>User</span>
                  <span>Stock</span>
                  <span>IP</span>
                  <span>Time</span>
                </div>
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground/50 text-xs font-light">
                    No logs match your filters.
                  </div>
                ) : (
                  paginatedLogs.map((log) => (
                    <div
                      key={log.id}
                      className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center py-2 px-1 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                      data-testid={`row-log-${log.id}`}
                    >
                      <span className="text-xs text-foreground/80 truncate" data-testid={`text-log-email-${log.id}`}>
                        {log.userEmail}
                      </span>
                      <span className="text-xs text-primary font-mono" data-testid={`text-log-symbol-${log.id}`}>
                        {log.symbol}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50 font-mono" data-testid={`text-log-ip-${log.id}`}>
                        {log.ip ? log.ip.split(',')[0].trim() : "—"}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50 whitespace-nowrap" data-testid={`text-log-time-${log.id}`}>
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest" data-testid="text-log-total-count">
                    Total: {filteredLogs.length} {filteredLogs.length !== analysisLogs.length ? `of ${analysisLogs.length}` : ""} requests
                  </span>
                  {logUserFilter && (
                    <span className="text-[10px] text-primary/70 uppercase tracking-widest">
                      Filtered: "{logUserFilter}"
                    </span>
                  )}
                </div>
                {totalLogPages > 1 && (
                  <div className="flex items-center justify-center gap-1 pt-1">
                    <button
                      onClick={() => setLogPage(1)}
                      disabled={logPage === 1}
                      className="h-7 w-7 flex items-center justify-center text-[10px] text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06] rounded transition-colors cursor-pointer"
                      data-testid="button-log-first"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setLogPage(p => Math.max(1, p - 1))}
                      disabled={logPage === 1}
                      className="h-7 w-7 flex items-center justify-center text-[10px] text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06] rounded transition-colors cursor-pointer"
                      data-testid="button-log-prev"
                    >
                      ‹
                    </button>
                    <span className="text-[10px] text-muted-foreground/70 px-3 uppercase tracking-widest">
                      Page {logPage} of {totalLogPages}
                    </span>
                    <button
                      onClick={() => setLogPage(p => Math.min(totalLogPages, p + 1))}
                      disabled={logPage === totalLogPages}
                      className="h-7 w-7 flex items-center justify-center text-[10px] text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06] rounded transition-colors cursor-pointer"
                      data-testid="button-log-next"
                    >
                      ›
                    </button>
                    <button
                      onClick={() => setLogPage(totalLogPages)}
                      disabled={logPage === totalLogPages}
                      className="h-7 w-7 flex items-center justify-center text-[10px] text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06] rounded transition-colors cursor-pointer"
                      data-testid="button-log-last"
                    >
                      »
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
