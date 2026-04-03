import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Crown, UserPlus, Trash2, Edit2, Check, X, Loader2, ArrowLeft, Users, Shield, Ban, CheckCircle, Globe, Activity, FileText, Clock, Search, Calendar, BarChart3, TrendingUp, AlertTriangle, DollarSign, MessageCircle, CreditCard, RefreshCw, Star, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useLocation } from "wouter";

interface UserEntry {
  id: string;
  email: string;
  disabled: boolean;
  lastIp: string | null;
  lastLoginAt: string | null;
  requestCount: number;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  subscriptionExpiresAt: string | null;
}

interface AnalysisLogEntry {
  id: number;
  userEmail: string;
  symbol: string;
  ip: string | null;
  createdAt: string;
}

interface BlockedIpEntry {
  id: number;
  ip: string;
  failedAttempts: number;
  blocked: boolean;
  lastAttemptAt: string;
  blockedAt: string | null;
}

interface IpRuleEntry {
  id: number;
  type: string;
  startIp: string;
  endIp: string;
  description: string | null;
  createdAt: string;
}

type TabId = "users" | "subscriptions" | "settings" | "security" | "logs" | "email";

export default function AdminConfig() {
  const { isAdmin, logout } = useAuth();
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>("users");

  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [error, setError] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const USERS_PER_PAGE = 10;

  const [analysisLogs, setAnalysisLogs] = useState<AnalysisLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logUserFilter, setLogUserFilter] = useState("");
  const [logDateFrom, setLogDateFrom] = useState("");
  const [logDateTo, setLogDateTo] = useState("");
  const [logPage, setLogPage] = useState(1);
  const LOGS_PER_PAGE = 20;

  const [rateLimit, setRateLimit] = useState(20);
  const [rateLimitInput, setRateLimitInput] = useState("20");
  const [savingRate, setSavingRate] = useState(false);
  const [blockedIps, setBlockedIps] = useState<BlockedIpEntry[]>([]);
  const [blockedIpsLoading, setBlockedIpsLoading] = useState(true);
  const [ipRules, setIpRules] = useState<IpRuleEntry[]>([]);
  const [ipRulesLoading, setIpRulesLoading] = useState(true);
  const [newRuleType, setNewRuleType] = useState<"block" | "whitelist">("whitelist");
  const [newRuleStartIp, setNewRuleStartIp] = useState("");
  const [newRuleEndIp, setNewRuleEndIp] = useState("");
  const [newRuleDesc, setNewRuleDesc] = useState("");
  const [addingRule, setAddingRule] = useState(false);
  const [plan5Price, setPlan5Price] = useState("5");
  const [plan10Price, setPlan10Price] = useState("10");
  const [plan5Input, setPlan5Input] = useState("5");
  const [plan10Input, setPlan10Input] = useState("10");
  const [savingPricing, setSavingPricing] = useState(false);
  const [triggeringEmail, setTriggeringEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<any>(null);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);

  const [subscriptions, setSubscriptions] = useState<UserEntry[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [approveUserId, setApproveUserId] = useState<string | null>(null);
  const [approvePlan, setApprovePlan] = useState<string>("essential");
  const [approveMonths, setApproveMonths] = useState(1);
  const [subsPage, setSubsPage] = useState(1);
  const [subsSearch, setSubsSearch] = useState("");
  const SUBS_PER_PAGE = 10;

  const [waNumber, setWaNumber] = useState("");
  const [waMessage, setWaMessage] = useState("");
  const [waNumberInput, setWaNumberInput] = useState("");
  const [waMessageInput, setWaMessageInput] = useState("");
  const [savingWa, setSavingWa] = useState(false);

  const [allUserFavourites, setAllUserFavourites] = useState<Record<string, any[]>>({});
  const [expandedFavUser, setExpandedFavUser] = useState<string | null>(null);
  const [addStockInputs, setAddStockInputs] = useState<Record<string, string>>({});
  const [addingStock, setAddingStock] = useState<string | null>(null);
  const [addStockError, setAddStockError] = useState<Record<string, string>>({});

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const search = userSearch.toLowerCase();
    return users.filter(u =>
      u.email.toLowerCase().includes(search) ||
      (u.lastIp && u.lastIp.includes(search))
    );
  }, [users, userSearch]);

  useEffect(() => { setUserPage(1); }, [userSearch]);

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice((userPage - 1) * USERS_PER_PAGE, userPage * USERS_PER_PAGE);

  const filteredSubs = useMemo(() => {
    if (!subsSearch.trim()) return subscriptions;
    const search = subsSearch.toLowerCase();
    return subscriptions.filter(s => s.email.toLowerCase().includes(search));
  }, [subscriptions, subsSearch]);

  useEffect(() => { setSubsPage(1); }, [subsSearch]);

  const totalSubsPages = Math.max(1, Math.ceil(filteredSubs.length / SUBS_PER_PAGE));
  const paginatedSubs = filteredSubs.slice((subsPage - 1) * SUBS_PER_PAGE, subsPage * SUBS_PER_PAGE);

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
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [filteredLogs]);

  useEffect(() => { setLogPage(1); }, [logUserFilter, logDateFrom, logDateTo]);

  useEffect(() => {
    if (!isAdmin) { navigate("/"); return; }
    fetchUsers();
    fetchAnalysisLogs();
    fetchSettings();
    fetchBlockedIps();
    fetchIpRules();
    fetchPlanPricing();
    fetchEmailLogs();
    fetchSubscriptions();
    fetchWhatsApp();
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsers(await res.json());
    } catch {} finally { setLoading(false); }
  };

  const fetchAnalysisLogs = async () => {
    try {
      const res = await fetch("/api/admin/analysis-logs?limit=1000");
      if (res.ok) setAnalysisLogs(await res.json());
    } catch {} finally { setLogsLoading(false); }
  };

  const fetchBlockedIps = async () => {
    try {
      const res = await fetch("/api/admin/blocked-ips");
      if (res.ok) setBlockedIps(await res.json());
    } catch {} finally { setBlockedIpsLoading(false); }
  };

  const unblockIp = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/blocked-ips/${id}`, { method: "DELETE" });
      if (res.ok) setBlockedIps(prev => prev.filter(ip => ip.id !== id));
    } catch {}
  };

  const fetchIpRules = async () => {
    try {
      const res = await fetch("/api/admin/ip-rules");
      if (res.ok) setIpRules(await res.json());
    } catch {} finally { setIpRulesLoading(false); }
  };

  const addIpRule = async () => {
    if (!newRuleStartIp || !newRuleEndIp) return;
    setAddingRule(true);
    try {
      const res = await fetch("/api/admin/ip-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newRuleType, startIp: newRuleStartIp, endIp: newRuleEndIp, description: newRuleDesc || undefined }),
      });
      if (res.ok) {
        const rule = await res.json();
        setIpRules(prev => [rule, ...prev]);
        setNewRuleStartIp(""); setNewRuleEndIp(""); setNewRuleDesc("");
      }
    } catch {} finally { setAddingRule(false); }
  };

  const deleteIpRule = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/ip-rules/${id}`, { method: "DELETE" });
      if (res.ok) setIpRules(prev => prev.filter(r => r.id !== id));
    } catch {}
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

  const fetchPlanPricing = async () => {
    try {
      const res = await fetch("/api/admin/plan-pricing");
      if (res.ok) {
        const data = await res.json();
        setPlan5Price(data.plan5Price); setPlan10Price(data.plan10Price);
        setPlan5Input(data.plan5Price); setPlan10Input(data.plan10Price);
      }
    } catch {}
  };

  const fetchEmailLogs = async () => {
    try {
      const res = await fetch("/api/admin/email-logs");
      if (res.ok) setEmailLogs(await res.json());
    } catch {}
  };

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch("/api/admin/subscriptions");
      if (res.ok) setSubscriptions(await res.json());
    } catch {} finally { setSubsLoading(false); }
  };

  const fetchWhatsApp = async () => {
    try {
      const res = await fetch("/api/admin/whatsapp");
      if (res.ok) {
        const data = await res.json();
        setWaNumber(data.number); setWaMessage(data.message);
        setWaNumberInput(data.number); setWaMessageInput(data.message);
      }
    } catch {}
  };

  const fetchUserFavourites = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/user-favourites/${userId}`);
      if (res.ok) {
        const favs = await res.json();
        setAllUserFavourites(prev => ({ ...prev, [userId]: favs }));
      }
    } catch {}
  };

  const adminDeleteFavourite = async (favId: number, userId: string) => {
    try {
      const res = await fetch(`/api/admin/user-favourites/${favId}`, { method: "DELETE" });
      if (res.ok) {
        fetchUserFavourites(userId);
      }
    } catch {}
  };

  const adminAddFavourite = async (userId: string) => {
    const raw = (addStockInputs[userId] || "").trim().toUpperCase();
    if (!raw) return;
    // Normalise: MYX: → KLSE:
    const symbol = raw.startsWith("MYX:") ? raw.replace("MYX:", "KLSE:") : raw;
    const displayName = symbol.includes(":") ? symbol.split(":")[1] : symbol;
    setAddingStock(userId);
    setAddStockError(prev => ({ ...prev, [userId]: "" }));
    try {
      const res = await fetch(`/api/admin/user-favourites/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, displayName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddStockError(prev => ({ ...prev, [userId]: data.error || "Failed to add stock" }));
      } else {
        setAddStockInputs(prev => ({ ...prev, [userId]: "" }));
        fetchUserFavourites(userId);
      }
    } catch {
      setAddStockError(prev => ({ ...prev, [userId]: "Network error" }));
    } finally {
      setAddingStock(null);
    }
  };

  const toggleFavUser = (userId: string) => {
    if (expandedFavUser === userId) {
      setExpandedFavUser(null);
    } else {
      setExpandedFavUser(userId);
      if (!allUserFavourites[userId]) fetchUserFavourites(userId);
    }
  };

  const triggerEmailAnalysis = async () => {
    setTriggeringEmail(true); setEmailResult(null);
    try {
      const res = await fetch("/api/admin/trigger-email", { method: "POST" });
      const data = await res.json();
      setEmailResult(data); fetchEmailLogs();
    } catch (err: any) {
      setEmailResult({ success: false, errors: [err.message] });
    } finally { setTriggeringEmail(false); }
  };

  const savePlanPricing = async () => {
    setSavingPricing(true);
    try {
      const res = await fetch("/api/admin/plan-pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan5Price: plan5Input, plan10Price: plan10Input }),
      });
      if (res.ok) { setPlan5Price(plan5Input); setPlan10Price(plan10Input); }
    } catch {} finally { setSavingPricing(false); }
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
      if (res.ok) setRateLimit(val);
    } catch {} finally { setSavingRate(false); }
  };

  const saveWhatsApp = async () => {
    setSavingWa(true);
    try {
      const res = await fetch("/api/admin/whatsapp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: waNumberInput, message: waMessageInput }),
      });
      if (res.ok) { setWaNumber(waNumberInput); setWaMessage(waMessageInput); }
    } catch {} finally { setSavingWa(false); }
  };

  const approveSubscription = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/subscriptions/${userId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: approvePlan, months: approveMonths }),
      });
      if (res.ok) { fetchSubscriptions(); setApproveUserId(null); }
    } catch {}
  };

  const renewSubscription = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/subscriptions/${userId}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ months: 1 }),
      });
      if (res.ok) fetchSubscriptions();
    } catch {}
  };

  const cancelSubscription = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/subscriptions/${userId}/cancel`, { method: "POST" });
      if (res.ok) fetchSubscriptions();
    } catch {}
  };

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setAdding(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, password: newPassword }),
      });
      if (!res.ok) { const data = await res.json(); setError(data.error || "Failed"); return; }
      setNewEmail(""); setNewPassword(""); await fetchUsers();
    } catch { setError("Failed to add user"); } finally { setAdding(false); }
  };

  const deleteUser = async (id: string) => {
    try { await fetch(`/api/admin/users/${id}`, { method: "DELETE" }); await fetchUsers(); } catch {}
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

  const startEdit = (user: UserEntry) => { setEditingId(user.id); setEditEmail(user.email); setEditPassword(""); };

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
      if (res.ok) { setEditingId(null); await fetchUsers(); }
    } catch {}
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "users", label: t("tabUsers"), icon: <Users className="w-3.5 h-3.5" /> },
    { id: "subscriptions", label: t("tabSubscriptions"), icon: <CreditCard className="w-3.5 h-3.5" /> },
    { id: "settings", label: t("tabSettings"), icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: "security", label: t("tabSecurity"), icon: <Shield className="w-3.5 h-3.5" /> },
    { id: "logs", label: t("tabLogs"), icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "email", label: t("tabEmail"), icon: <Activity className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen font-sans pb-20">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-transparent pointer-events-none" />

      <div className="max-w-4xl mx-auto p-4 md:p-8 relative z-10 space-y-6">
        <header className="border-b border-primary/20 pb-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer" data-testid="button-back-dashboard">
              <ArrowLeft className="w-4 h-4" /> {t("backToTerminal")}
            </button>
            <div className="flex items-center gap-3">
              <LanguageSwitcher compact />
              <button onClick={logout} className="text-sm text-muted-foreground hover:text-red-400 transition-colors cursor-pointer" data-testid="button-admin-logout">{t("logout")}</button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <Crown className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-[10px] uppercase tracking-[0.25em] font-medium opacity-80">{t("adminPanel")}</span>
          </div>
          <h1 className="text-3xl font-serif font-medium tracking-tight text-foreground flex items-center gap-3" data-testid="text-admin-title">
            <Shield className="w-7 h-7 text-primary" />
            {t("userManagement")}
          </h1>
          <p className="text-muted-foreground font-light tracking-wide text-sm mt-2">{t("adminSubtitle")}</p>
        </header>

        <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06] pb-0" data-testid="admin-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-widest font-medium transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-primary border-primary"
                  : "text-muted-foreground/60 border-transparent hover:text-muted-foreground hover:border-white/10"
              }`}
              data-testid={`tab-${tab.id}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="bg-card/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 shadow-2xl shadow-black/40">
              <h2 className="text-[10px] text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <UserPlus className="w-3.5 h-3.5 text-primary" /> {t("addNewUser")}
              </h2>
              {error && <div className="text-red-400 text-sm mb-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3" data-testid="text-admin-error">{error}</div>}
              <form onSubmit={addUser} className="flex flex-col sm:flex-row gap-3">
                <Input type="email" placeholder={t("emailAddress")} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="flex-1 h-10 bg-background/30 border-white/[0.06] focus-visible:border-primary/50 text-foreground" required data-testid="input-new-email" />
                <Input type="password" placeholder={t("password")} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="flex-1 h-10 bg-background/30 border-white/[0.06] focus-visible:border-primary/50 text-foreground" required data-testid="input-new-password" />
                <Button type="submit" disabled={adding} className="h-10 px-6 bg-primary text-primary-foreground font-medium tracking-widest hover:bg-primary/90 cursor-pointer" data-testid="button-add-user">
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : t("add")}
                </Button>
              </form>
            </div>

            <div className="bg-card/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-primary" /> {t("allowedUsers")} ({filteredUsers.length}{userSearch ? ` / ${users.length}` : ""})
                </h2>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input type="text" placeholder={t("searchUsers")} value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-9 h-9 bg-background/30 border-white/[0.06] focus-visible:border-primary/50 text-foreground text-sm" data-testid="input-search-users" />
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" />{t("loadingUsers")}</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-light" data-testid="text-no-users">{t("noUsersYet")}</div>
              ) : (
                <div className="space-y-3">
                  {paginatedUsers.map((user) => (
                    <div key={user.id} className={`bg-background/20 border rounded-xl p-4 transition-colors ${user.disabled ? "border-red-500/20 opacity-60" : "border-white/[0.06] hover:border-primary/15"}`} data-testid={`row-user-${user.id}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {editingId === user.id ? (
                            <div className="flex flex-col sm:flex-row gap-2 mb-3">
                              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="h-8 text-sm bg-background/50 border-white/10 text-foreground" data-testid="input-edit-email" />
                              <Input type="password" placeholder="New password (optional)" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} className="h-8 text-sm bg-background/50 border-white/10 text-foreground" data-testid="input-edit-password" />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm text-foreground font-medium" data-testid={`text-user-email-${user.id}`}>{user.email}</span>
                              {user.disabled && <span className="text-[9px] uppercase tracking-wider bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full font-medium">{t("disabled")}</span>}
                              {user.subscriptionStatus === "active" && (
                                <span className="text-[9px] uppercase tracking-wider bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full font-medium">
                                  {user.subscriptionPlan === "professional" ? t("planProName") : t("planBasicName")}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground/60">
                            <span className="flex items-center gap-1" data-testid={`text-user-ip-${user.id}`}><Globe className="w-3 h-3" />{user.lastIp || t("noLoginYet")}</span>
                            <span className="flex items-center gap-1" data-testid={`text-user-requests-${user.id}`}><Activity className="w-3 h-3" />{user.requestCount} {t("requests")}</span>
                            <span data-testid={`text-user-lastlogin-${user.id}`}>{t("lastLogin")} {formatDate(user.lastLoginAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {editingId === user.id ? (
                            <>
                              <button onClick={saveEdit} className="p-1.5 text-green-400 hover:bg-green-500/10 rounded transition-colors cursor-pointer" data-testid="button-save-edit"><Check className="w-4 h-4" /></button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 text-muted-foreground hover:bg-white/5 rounded transition-colors cursor-pointer" data-testid="button-cancel-edit"><X className="w-4 h-4" /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => toggleDisable(user.id, !user.disabled)} className={`p-1.5 rounded transition-colors cursor-pointer ${user.disabled ? "text-green-400 hover:bg-green-500/10" : "text-orange-400 hover:bg-orange-500/10"}`} title={user.disabled ? "Enable user" : "Disable user"} data-testid={`button-toggle-${user.id}`}>
                                {user.disabled ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                              </button>
                              <button onClick={() => startEdit(user)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors cursor-pointer" data-testid={`button-edit-${user.id}`}><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => deleteUser(user.id)} className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer" data-testid={`button-delete-${user.id}`}><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {totalUserPages > 1 && (
                    <div className="flex items-center justify-center gap-1 pt-3">
                      <button onClick={() => setUserPage(1)} disabled={userPage === 1} className="h-7 w-7 flex items-center justify-center text-[10px] text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06] rounded transition-colors cursor-pointer" data-testid="button-user-first">«</button>
                      <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1} className="h-7 w-7 flex items-center justify-center text-[10px] text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06] rounded transition-colors cursor-pointer" data-testid="button-user-prev">‹</button>
                      <span className="text-[10px] text-muted-foreground/70 px-3 uppercase tracking-widest">Page {userPage} of {totalUserPages}</span>
                      <button onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))} disabled={userPage === totalUserPages} className="h-7 w-7 flex items-center justify-center text-[10px] text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06] rounded transition-colors cursor-pointer" data-testid="button-user-next">›</button>
                      <button onClick={() => setUserPage(totalUserPages)} disabled={userPage === totalUserPages} className="h-7 w-7 flex items-center justify-center text-[10px] text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06] rounded transition-colors cursor-pointer" data-testid="button-user-last">»</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "subscriptions" && (
          <div className="space-y-6">
            <div className="bg-card/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-primary" /> {t("subscriptionManagement")} ({filteredSubs.length}{subsSearch ? ` / ${subscriptions.length}` : ""})
                </h2>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input type="text" placeholder={t("searchUsers")} value={subsSearch} onChange={(e) => setSubsSearch(e.target.value)} className="pl-9 h-9 bg-background/30 border-white/[0.06] focus-visible:border-primary/50 text-foreground text-sm" data-testid="input-search-subs" />
              </div>
              {subsLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /></div>
              ) : (
                <div className="space-y-3">
                  {paginatedSubs.map(sub => {
                    const isActive = sub.subscriptionStatus === "active";
                    const isExpired = sub.subscriptionStatus === "expired" || (sub.subscriptionExpiresAt && new Date(sub.subscriptionExpiresAt) < new Date());
                    return (
                      <div key={sub.id} className="bg-background/20 border border-white/[0.06] rounded-xl p-4 hover:border-primary/15 transition-colors" data-testid={`row-sub-${sub.id}`}>
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-foreground font-medium">{sub.email}</span>
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground/60">
                              <span>{t("plan")}: {sub.subscriptionPlan ? (sub.subscriptionPlan === "professional" ? t("planProName") : t("planBasicName")) : t("none")}</span>
                              <span className={`inline-flex items-center gap-1 ${isActive && !isExpired ? "text-green-400" : isExpired ? "text-red-400" : "text-muted-foreground/40"}`}>
                                {isActive && !isExpired ? t("active") : isExpired ? t("expired") : sub.subscriptionStatus === "cancelled" ? t("cancelled") : t("none")}
                              </span>
                              {sub.subscriptionExpiresAt && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {t("expires")}: {new Date(sub.subscriptionExpiresAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {approveUserId === sub.id ? (
                              <div className="flex items-center gap-2 bg-background/40 border border-white/10 rounded-lg p-2">
                                <select value={approvePlan} onChange={(e) => setApprovePlan(e.target.value)} className="h-7 bg-background/50 border border-white/[0.08] rounded px-2 text-xs text-foreground/90 focus:outline-none" data-testid="select-approve-plan">
                                  <option value="essential">{t("planBasicName")} (5)</option>
                                  <option value="professional">{t("planProName")} (10)</option>
                                </select>
                                <Input type="number" min={1} max={12} value={approveMonths} onChange={(e) => setApproveMonths(parseInt(e.target.value) || 1)} className="h-7 w-16 text-xs bg-background/50 border-white/[0.08]" data-testid="input-approve-months" />
                                <span className="text-[10px] text-muted-foreground/50">{t("months")}</span>
                                <Button size="sm" onClick={() => approveSubscription(sub.id)} className="h-7 px-3 text-[10px] cursor-pointer" data-testid="button-confirm-approve">
                                  <Check className="w-3 h-3" />
                                </Button>
                                <button onClick={() => setApproveUserId(null)} className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                              </div>
                            ) : (
                              <>
                                {!isActive || isExpired ? (
                                  <Button size="sm" variant="outline" onClick={() => { setApproveUserId(sub.id); setApprovePlan("essential"); setApproveMonths(1); }} className="h-7 px-3 text-[10px] uppercase tracking-widest text-green-400 border-green-500/30 hover:bg-green-500/10 cursor-pointer" data-testid={`button-approve-${sub.id}`}>
                                    <CheckCircle className="w-3 h-3 mr-1" /> {t("approveSub")}
                                  </Button>
                                ) : (
                                  <>
                                    <Button size="sm" variant="outline" onClick={() => renewSubscription(sub.id)} className="h-7 px-3 text-[10px] uppercase tracking-widest text-primary border-primary/30 hover:bg-primary/10 cursor-pointer" data-testid={`button-renew-${sub.id}`}>
                                      <RefreshCw className="w-3 h-3 mr-1" /> {t("renewSub")}
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => cancelSubscription(sub.id)} className="h-7 px-3 text-[10px] uppercase tracking-widest text-red-400 border-red-500/30 hover:bg-red-500/10 cursor-pointer" data-testid={`button-cancel-${sub.id}`}>
                                      <X className="w-3 h-3 mr-1" /> {t("cancelSub")}
                                    </Button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredSubs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground font-light">{t("noUsersYet")}</div>
                  )}
                  {totalSubsPages > 1 && (
                    <div className="flex items-center justify-center gap-1 pt-3">
                      <button onClick={() => setSubsPage(1)} disabled={subsPage === 1} className="h-7 w-7 flex items-center justify-center text-[10px] text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06] rounded transition-colors cursor-pointer" data-testid="button-subs-first">«</button>
                      <button onClick={() => setSubsPage(p => Math.max(1, p - 1))} disabled={subsPage === 1} className="h-7 w-7 flex items-center justify-center text-[10px] text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06] rounded transition-colors cursor-pointer" data-testid="button-subs-prev">‹</button>
                      <span className="text-[10px] text-muted-foreground/70 px-3 uppercase tracking-widest">Page {subsPage} of {totalSubsPages}</span>
                      <button onClick={() => setSubsPage(p => Math.min(totalSubsPages, p + 1))} disabled={subsPage === totalSubsPages} className="h-7 w-7 flex items-center justify-center text-[10px] text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06] rounded transition-colors cursor-pointer" data-testid="button-subs-next">›</button>
                      <button onClick={() => setSubsPage(totalSubsPages)} disabled={subsPage === totalSubsPages} className="h-7 w-7 flex items-center justify-center text-[10px] text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06] rounded transition-colors cursor-pointer" data-testid="button-subs-last">»</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-card/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 shadow-2xl shadow-black/40">
              <h2 className="text-[10px] text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-primary" /> {t("rateLimitSettings")}
              </h2>
              <div className="flex items-center gap-3">
                <label className="text-xs text-muted-foreground whitespace-nowrap">{t("maxAiRequests")}</label>
                <Input type="number" min={1} max={1000} value={rateLimitInput} onChange={(e) => setRateLimitInput(e.target.value)} className="w-24 h-9 bg-background/30 border-white/[0.06] focus-visible:border-primary/50 text-foreground text-center" data-testid="input-rate-limit" />
                <Button onClick={saveRateLimit} disabled={savingRate || parseInt(rateLimitInput) === rateLimit} className="h-9 px-4 bg-primary text-primary-foreground text-xs font-medium tracking-widest hover:bg-primary/90 cursor-pointer" data-testid="button-save-rate-limit">
                  {savingRate ? <Loader2 className="w-3 h-3 animate-spin" /> : t("save")}
                </Button>
                <span className="text-[10px] text-muted-foreground/50">Current: {rateLimit}/hr</span>
              </div>
            </div>

            <div className="bg-card/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 shadow-2xl shadow-black/40">
              <h2 className="text-[10px] text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-primary" /> {t("planPricing")}
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs text-muted-foreground whitespace-nowrap min-w-[200px]">{t("fiveStockPlan")}</label>
                  <Input type="number" min={1} step="0.01" value={plan5Input} onChange={(e) => setPlan5Input(e.target.value)} className="w-24 h-9 bg-background/30 border-white/[0.06] focus-visible:border-primary/50 text-foreground text-center" data-testid="input-plan5-price" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-muted-foreground whitespace-nowrap min-w-[200px]">{t("tenStockPlan")}</label>
                  <Input type="number" min={1} step="0.01" value={plan10Input} onChange={(e) => setPlan10Input(e.target.value)} className="w-24 h-9 bg-background/30 border-white/[0.06] focus-visible:border-primary/50 text-foreground text-center" data-testid="input-plan10-price" />
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <Button onClick={savePlanPricing} disabled={savingPricing || (plan5Input === plan5Price && plan10Input === plan10Price)} className="h-9 px-4 bg-primary text-primary-foreground text-xs font-medium tracking-widest hover:bg-primary/90 cursor-pointer" data-testid="button-save-pricing">
                    {savingPricing ? <Loader2 className="w-3 h-3 animate-spin" /> : t("savePricing")}
                  </Button>
                  <span className="text-[10px] text-muted-foreground/50">Current: ${plan5Price} / ${plan10Price}</span>
                </div>
              </div>
            </div>

            <div className="bg-card/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 shadow-2xl shadow-black/40">
              <h2 className="text-[10px] text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-primary" /> {t("whatsappSettings")}
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t("whatsappNumber")}</label>
                  <Input value={waNumberInput} onChange={(e) => setWaNumberInput(e.target.value)} placeholder="60123456789" className="h-9 bg-background/30 border-white/[0.06] focus-visible:border-primary/50 text-foreground max-w-xs" data-testid="input-wa-number" />
                  <p className="text-[10px] text-muted-foreground/40 mt-1">{t("whatsappNumberHint")}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t("whatsappMessage")}</label>
                  <Input value={waMessageInput} onChange={(e) => setWaMessageInput(e.target.value)} placeholder="Hi, I'm interested in subscribing..." className="h-9 bg-background/30 border-white/[0.06] focus-visible:border-primary/50 text-foreground" data-testid="input-wa-message" />
                </div>
                <Button onClick={saveWhatsApp} disabled={savingWa || (waNumberInput === waNumber && waMessageInput === waMessage)} className="h-9 px-4 bg-primary text-primary-foreground text-xs font-medium tracking-widest hover:bg-primary/90 cursor-pointer" data-testid="button-save-wa">
                  {savingWa ? <Loader2 className="w-3 h-3 animate-spin" /> : t("save")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="bg-card/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-[10px] text-primary uppercase tracking-widest font-medium flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" /> {t("blockedIps")}
                </h2>
                <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">{blockedIps.filter(ip => ip.blocked).length} {t("blocked")}</span>
              </div>
              {blockedIpsLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
              ) : blockedIps.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <CheckCircle className="w-6 h-6 text-green-500/60 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground/60 font-light">{t("noBlockedOrFlagged")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="table-blocked-ips">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium py-3 px-6">{t("ip")}</th>
                        <th className="text-center text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium py-3 px-4">{t("failedAttempts")}</th>
                        <th className="text-center text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium py-3 px-4">{t("status")}</th>
                        <th className="text-left text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium py-3 px-4">{t("lastAttempt")}</th>
                        <th className="text-right text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium py-3 px-6">{t("action")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blockedIps.map(entry => (
                        <tr key={entry.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-6 font-mono text-xs text-foreground/90" data-testid={`text-blocked-ip-${entry.id}`}>{entry.ip}</td>
                          <td className="py-3 px-4 text-center"><span className="text-xs text-red-400/80 font-medium">{entry.failedAttempts}</span></td>
                          <td className="py-3 px-4 text-center">
                            {entry.blocked ? (
                              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full"><Ban className="w-2.5 h-2.5" /> {t("blocked")}</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full"><AlertTriangle className="w-2.5 h-2.5" /> {t("warning")}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground/70">{new Date(entry.lastAttemptAt).toLocaleString()}</td>
                          <td className="py-3 px-6 text-right">
                            <Button variant="ghost" size="sm" onClick={() => unblockIp(entry.id)} className="text-[10px] uppercase tracking-widest text-green-400 hover:text-green-300 hover:bg-green-500/10 h-7 px-3 cursor-pointer" data-testid={`button-unblock-ip-${entry.id}`}>
                              <CheckCircle className="w-3 h-3 mr-1" /> {t("unblock")}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-card/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 className="text-[10px] text-primary uppercase tracking-widest font-medium flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> {t("ipAccessRules")}</h2>
                <p className="text-[10px] text-muted-foreground/50 mt-1 font-light">{t("ipRuleNote")}</p>
              </div>
              <div className="px-6 py-4 border-b border-white/5 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <select value={newRuleType} onChange={(e) => setNewRuleType(e.target.value as "block" | "whitelist")} className="h-9 bg-background/50 border border-white/[0.08] rounded-lg px-3 text-xs text-foreground/90 focus:outline-none focus:border-primary/40" data-testid="select-rule-type">
                    <option value="whitelist">{t("whitelistRule")}</option>
                    <option value="block">{t("blockRule")}</option>
                  </select>
                  <Input placeholder={`${t("startIp")} (e.g. 1.0.0.0)`} value={newRuleStartIp} onChange={(e) => setNewRuleStartIp(e.target.value)} className="h-9 w-40 bg-background/50 border-white/[0.08] text-xs placeholder:text-muted-foreground/30" data-testid="input-start-ip" />
                  <span className="text-xs text-muted-foreground/40">to</span>
                  <Input placeholder={`${t("endIp")} (e.g. 1.255.255.255)`} value={newRuleEndIp} onChange={(e) => setNewRuleEndIp(e.target.value)} className="h-9 w-44 bg-background/50 border-white/[0.08] text-xs placeholder:text-muted-foreground/30" data-testid="input-end-ip" />
                  <Input placeholder={t("description")} value={newRuleDesc} onChange={(e) => setNewRuleDesc(e.target.value)} className="h-9 w-48 bg-background/50 border-white/[0.08] text-xs placeholder:text-muted-foreground/30" data-testid="input-rule-desc" />
                  <Button onClick={addIpRule} disabled={addingRule || !newRuleStartIp || !newRuleEndIp} className="h-9 px-4 text-[10px] uppercase tracking-widest cursor-pointer" data-testid="button-add-ip-rule">
                    {addingRule ? <Loader2 className="w-3 h-3 animate-spin" /> : t("addRuleBtn")}
                  </Button>
                </div>
              </div>
              {ipRulesLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
              ) : ipRules.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <Globe className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground/60 font-light">{t("noIpRules")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="table-ip-rules">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium py-3 px-6">{t("type")}</th>
                        <th className="text-left text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium py-3 px-4">{t("range")}</th>
                        <th className="text-left text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium py-3 px-4">{t("description")}</th>
                        <th className="text-right text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium py-3 px-6">{t("action")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ipRules.map(rule => (
                        <tr key={rule.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-6">
                            {rule.type === "whitelist" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full"><CheckCircle className="w-2.5 h-2.5" /> {t("whitelistRule")}</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full"><Ban className="w-2.5 h-2.5" /> {t("blockRule")}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-foreground/90">{rule.startIp} — {rule.endIp}</td>
                          <td className="py-3 px-4 text-xs text-muted-foreground/70">{rule.description || "—"}</td>
                          <td className="py-3 px-6 text-right">
                            <Button variant="ghost" size="sm" onClick={() => deleteIpRule(rule.id)} className="text-[10px] uppercase tracking-widest text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 px-3 cursor-pointer" data-testid={`button-delete-rule-${rule.id}`}>
                              <Trash2 className="w-3 h-3 mr-1" /> {t("delete")}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="space-y-6">
            {stockFrequency.length > 0 && (
              <div className="bg-card/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 shadow-2xl shadow-black/40">
                <h2 className="text-[10px] text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-primary" /> {t("topStocksAnalyzed")}
                </h2>
                <div className="space-y-2">
                  {stockFrequency.map(([symbol, count], i) => {
                    const maxCount = stockFrequency[0][1];
                    const pct = (count / maxCount) * 100;
                    return (
                      <div key={symbol} className="flex items-center gap-3" data-testid={`row-freq-${symbol}`}>
                        <span className="text-[10px] text-muted-foreground/50 w-5 text-right">{i + 1}.</span>
                        <span className="text-xs text-primary font-mono w-28 truncate">{symbol}</span>
                        <div className="flex-1 h-5 bg-background/30 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary/60 to-primary/30 rounded-full transition-all duration-500 flex items-center justify-end pr-2" style={{ width: `${Math.max(pct, 8)}%` }}>
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
                  <FileText className="w-3.5 h-3.5 text-primary" /> {t("analysisLogs")} ({analysisLogs.length})
                </h2>
                <button onClick={() => { setLogsLoading(true); fetchAnalysisLogs(); }} className="text-[10px] text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest cursor-pointer" data-testid="button-refresh-logs">{t("refresh")}</button>
              </div>
              <div className="flex flex-wrap items-end gap-3 mb-4">
                <div className="flex-1 min-w-[160px]">
                  <label className="text-[9px] text-muted-foreground/60 uppercase tracking-widest mb-1 block">{t("filterByUser")}</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/40" />
                    <Input value={logUserFilter} onChange={(e) => setLogUserFilter(e.target.value)} placeholder={t("filterByUser")} className="h-8 pl-7 text-xs bg-background/50 border-white/[0.08] focus:border-primary/50" data-testid="input-log-user-filter" />
                  </div>
                </div>
                <div className="min-w-[130px]">
                  <label className="text-[9px] text-muted-foreground/60 uppercase tracking-widest mb-1 flex items-center gap-1 whitespace-nowrap"><Calendar className="w-3 h-3" /> {t("from")}</label>
                  <Input type="date" value={logDateFrom} onChange={(e) => setLogDateFrom(e.target.value)} className="h-8 text-xs bg-background/50 border-white/[0.08] focus:border-primary/50 [color-scheme:dark]" data-testid="input-log-date-from" />
                </div>
                <div className="min-w-[130px]">
                  <label className="text-[9px] text-muted-foreground/60 uppercase tracking-widest mb-1 flex items-center gap-1 whitespace-nowrap"><Calendar className="w-3 h-3" /> {t("to")}</label>
                  <Input type="date" value={logDateTo} onChange={(e) => setLogDateTo(e.target.value)} className="h-8 text-xs bg-background/50 border-white/[0.08] focus:border-primary/50 [color-scheme:dark]" data-testid="input-log-date-to" />
                </div>
                {(logUserFilter || logDateFrom || logDateTo) && (
                  <button onClick={() => { setLogUserFilter(""); setLogDateFrom(""); setLogDateTo(""); }} className="h-8 px-3 text-[10px] text-muted-foreground hover:text-primary border border-white/[0.08] rounded-md transition-colors uppercase tracking-widest cursor-pointer" data-testid="button-clear-log-filters">{t("clear")}</button>
                )}
              </div>
              {logsLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" />{t("loadingLogs")}</div>
              ) : analysisLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-light" data-testid="text-no-logs">{t("noLogsFound")}</div>
              ) : (
                <>
                  <div className="space-y-1 max-h-[500px] overflow-y-auto">
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 text-[9px] uppercase tracking-widest text-muted-foreground/50 pb-2 border-b border-white/5 sticky top-0 bg-card/95 backdrop-blur-sm px-1">
                      <span>{t("user")}</span><span>{t("symbol")}</span><span>{t("ip")}</span><span>{t("date")}</span>
                    </div>
                    {filteredLogs.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground/50 text-xs font-light">{t("noLogsMatchFilters")}</div>
                    ) : (
                      paginatedLogs.map((log) => (
                        <div key={log.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center py-2 px-1 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors" data-testid={`row-log-${log.id}`}>
                          <span className="text-xs text-foreground/80 truncate">{log.userEmail}</span>
                          <span className="text-xs text-primary font-mono">{log.symbol}</span>
                          <span className="text-[10px] text-muted-foreground/50 font-mono">{log.ip ? log.ip.split(',')[0].trim() : "—"}</span>
                          <span className="text-[10px] text-muted-foreground/50 whitespace-nowrap">{formatDate(log.createdAt)}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">{t("total")}: {filteredLogs.length} {filteredLogs.length !== analysisLogs.length ? `${t("of")} ${analysisLogs.length}` : ""}</span>
                    </div>
                    {totalLogPages > 1 && (
                      <div className="flex items-center justify-center gap-1 pt-1">
                        <button onClick={() => setLogPage(1)} disabled={logPage === 1} className="h-7 w-7 flex items-center justify-center text-[10px] text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06] rounded transition-colors cursor-pointer">«</button>
                        <button onClick={() => setLogPage(p => Math.max(1, p - 1))} disabled={logPage === 1} className="h-7 w-7 flex items-center justify-center text-[10px] text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06] rounded transition-colors cursor-pointer">‹</button>
                        <span className="text-[10px] text-muted-foreground/70 px-3 uppercase tracking-widest">{t("page")} {logPage} {t("of")} {totalLogPages}</span>
                        <button onClick={() => setLogPage(p => Math.min(totalLogPages, p + 1))} disabled={logPage === totalLogPages} className="h-7 w-7 flex items-center justify-center text-[10px] text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06] rounded transition-colors cursor-pointer">›</button>
                        <button onClick={() => setLogPage(totalLogPages)} disabled={logPage === totalLogPages} className="h-7 w-7 flex items-center justify-center text-[10px] text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06] rounded transition-colors cursor-pointer">»</button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === "email" && (
          <div className="space-y-6">
            <div className="bg-card/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 shadow-2xl shadow-black/40">
              <h2 className="text-[10px] text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-primary" /> {t("dailyEmailAnalysis")}
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Button onClick={triggerEmailAnalysis} disabled={triggeringEmail} className="h-9 px-4 bg-primary text-primary-foreground text-xs font-medium tracking-widest hover:bg-primary/90 cursor-pointer" data-testid="button-trigger-email">
                    {triggeringEmail ? (<><Loader2 className="w-3 h-3 animate-spin mr-2" />{t("processing")}...</>) : t("triggerEmailNow")}
                  </Button>
                  <span className="text-[10px] text-muted-foreground/50">{t("triggerEmailDesc")}</span>
                </div>
                {emailResult && (
                  <div className={`p-3 rounded-lg border text-xs ${emailResult.success ? "border-green-500/30 bg-green-500/5 text-green-400" : "border-red-500/30 bg-red-500/5 text-red-400"}`} data-testid="text-email-result">
                    {emailResult.success ? (
                      <p>{t("emailSentSuccess")}: {emailResult.usersProcessed} {t("usersProcessed")}</p>
                    ) : (
                      <div>
                        <p>{t("emailSentError")}</p>
                        {emailResult.errors?.map((e: string, i: number) => (<p key={i} className="mt-1 text-[10px]">{e}</p>))}
                      </div>
                    )}
                  </div>
                )}
                {emailLogs.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <FileText className="w-3 h-3" /> {t("recentEmailLogs")}
                    </h3>
                    <div className="max-h-[300px] overflow-y-auto space-y-1">
                      {emailLogs.slice(0, 20).map((log: any) => (
                        <div key={log.id} className="flex items-center justify-between text-[11px] px-3 py-2 rounded-lg bg-background/30" data-testid={`row-email-log-${log.id}`}>
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium ${log.status === "sent" ? "bg-green-500/20 text-green-400" : log.status === "error" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>{log.status}</span>
                            <span className="text-foreground/80">{log.userEmail}</span>
                            <span className="text-muted-foreground/50">{log.stocksIncluded}</span>
                          </div>
                          <span className="text-muted-foreground/40 text-[10px]">{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 shadow-2xl shadow-black/40">
              <h2 className="text-[10px] text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-primary" /> User Watchlists
              </h2>
              <div className="space-y-1">
                {users.map((user) => (
                  <div key={`fav-${user.id}`}>
                    <button
                      onClick={() => toggleFavUser(user.id)}
                      className="w-full flex items-center justify-between text-[11px] px-3 py-2 rounded-lg bg-background/30 hover:bg-background/50 transition-colors cursor-pointer"
                      data-testid={`button-expand-fav-${user.id}`}
                    >
                      <span className="text-foreground/80">{user.email}</span>
                      {expandedFavUser === user.id ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                    </button>
                    {expandedFavUser === user.id && (
                      <div className="ml-4 mt-1 mb-2 space-y-1">
                        {!allUserFavourites[user.id] ? (
                          <div className="text-[10px] text-muted-foreground/50 px-3 py-1"><Loader2 className="w-3 h-3 animate-spin inline mr-1" />Loading...</div>
                        ) : allUserFavourites[user.id].length === 0 ? (
                          <div className="text-[10px] text-muted-foreground/50 px-3 py-1">No watchlist stocks yet</div>
                        ) : (
                          allUserFavourites[user.id].map((fav: any) => (
                            <div key={fav.id} className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-lg bg-background/20" data-testid={`row-admin-fav-${fav.id}`}>
                              <div className="flex items-center gap-2">
                                <Star className="w-3 h-3 text-primary" />
                                <span className="text-foreground/80 font-medium">{fav.displayName || fav.symbol}</span>
                                <span className="text-muted-foreground/40 text-[10px]">{fav.symbol}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => adminDeleteFavourite(fav.id, user.id)}
                                className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                                data-testid={`button-admin-delete-fav-${fav.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))
                        )}

                        {/* Add stock input */}
                        <div className="pt-1">
                          <form
                            onSubmit={(e) => { e.preventDefault(); adminAddFavourite(user.id); }}
                            className="flex items-center gap-1.5"
                          >
                            <Input
                              value={addStockInputs[user.id] || ""}
                              onChange={(e) => setAddStockInputs(prev => ({ ...prev, [user.id]: e.target.value }))}
                              placeholder="e.g. KLSE:MAYBANK or NVDA"
                              className="h-7 text-[11px] bg-background/30 border-white/10 placeholder:text-muted-foreground/30"
                              data-testid={`input-add-stock-${user.id}`}
                            />
                            <Button
                              type="submit"
                              size="sm"
                              disabled={addingStock === user.id || !(addStockInputs[user.id] || "").trim()}
                              className="h-7 px-2 text-[11px] cursor-pointer"
                              data-testid={`button-add-stock-${user.id}`}
                            >
                              {addingStock === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            </Button>
                          </form>
                          {addStockError[user.id] && (
                            <p className="text-[10px] text-red-400 mt-1 px-1" data-testid={`error-add-stock-${user.id}`}>{addStockError[user.id]}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
