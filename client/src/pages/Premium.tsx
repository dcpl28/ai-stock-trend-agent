import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";
import { useLocation } from "wouter";
import {
  Crown,
  Mail,
  TrendingUp,
  BarChart3,
  Star,
  ArrowLeft,
  Clock,
  LogOut,
  Bell,
  CheckCircle2,
  Zap,
  MessageCircle,
  ExternalLink,
} from "lucide-react";

export default function Premium() {
  const { email, logout, timeLeft } = useAuth();
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const [plan5Price, setPlan5Price] = useState("5");
  const [plan10Price, setPlan10Price] = useState("10");
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    fetch("/api/plan-pricing")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setPlan5Price(data.plan5Price || "5");
          setPlan10Price(data.plan10Price || "10");
        }
      })
      .catch(() => {});

    fetch("/api/whatsapp-link")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.url) setWhatsappUrl(data.url);
      })
      .catch(() => {});

    fetch("/api/subscription")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.subscription) setSubscription(data.subscription);
      })
      .catch(() => {});
  }, []);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen font-sans pb-20">
      <div className="fixed top-0 left-0 w-full h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-transparent pointer-events-none" />

      <div className="max-w-5xl mx-auto p-4 md:p-8 relative z-10 space-y-12">
        <div className="flex items-center justify-between bg-card/30 border border-primary/10 rounded-lg px-4 py-2.5">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer mr-1"
              data-testid="button-back-dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t("backToTerminal")}
            </button>
            <span className="font-light" data-testid="text-session-email-premium">{email}</span>
            <span className="text-primary/30">|</span>
            <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground" data-testid="text-session-timer-premium">
              <Clock className="w-3 h-3" />
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
              data-testid="button-logout-premium"
            >
              <LogOut className="w-3.5 h-3.5" />
              {t("logout")}
            </button>
          </div>
        </div>

        <header className="text-center space-y-4 border-b border-primary/20 pb-10">
          <div className="flex items-center justify-center gap-2 text-primary mb-2">
            <Crown className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[11px] uppercase tracking-[0.25em] font-medium opacity-80">
              {t("premiumServices")}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-foreground" data-testid="text-premium-title">
            {t("premiumTitle")} <span className="text-primary italic">{t("premiumTitleHighlight")}</span>
          </h1>
          <p className="text-muted-foreground font-light tracking-wide text-sm max-w-lg mx-auto">
            {t("premiumSubtitle")}
          </p>
        </header>

        {subscription && (
          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-6 max-w-md mx-auto text-center space-y-2" data-testid="card-active-subscription">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto" />
            <h3 className="text-lg font-serif text-foreground">{t("yourSubscription")}</h3>
            <p className="text-sm text-green-400 font-medium">
              {t("activePlan")}: {subscription.plan === "professional" ? t("planProName") : t("planBasicName")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("expiresOn")}: {new Date(subscription.expiresAt).toLocaleDateString()}
            </p>
          </div>
        )}

        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-serif text-foreground" data-testid="text-premium-headline">
            {t("premiumHeadline")}
          </h2>
          <p className="text-muted-foreground font-light text-sm leading-relaxed">
            {t("premiumDescription")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="bg-card/50 border border-primary/10 rounded-xl p-6 space-y-5 hover:border-primary/30 transition-colors" data-testid="card-plan-basic">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary/70" />
              <span className="text-xs uppercase tracking-widest font-medium text-muted-foreground">
                {t("planBasicName")}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-serif text-foreground">${plan5Price}</span>
              <span className="text-sm text-muted-foreground font-light">/ {t("perMonth")}</span>
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2.5 text-sm text-foreground/80 font-light">
                <CheckCircle2 className="w-4 h-4 text-primary/70 shrink-0" />
                <span>{t("planFeatureStocks", { count: "5" })}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-foreground/80 font-light">
                <CheckCircle2 className="w-4 h-4 text-primary/70 shrink-0" />
                <span>{t("planFeatureDailyEmail")}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-foreground/80 font-light">
                <CheckCircle2 className="w-4 h-4 text-primary/70 shrink-0" />
                <span>{t("planFeatureAiAnalysis")}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-foreground/80 font-light">
                <CheckCircle2 className="w-4 h-4 text-primary/70 shrink-0" />
                <span>{t("planFeatureIndicators")}</span>
              </div>
            </div>
          </div>

          <div className="bg-card/50 border border-primary/30 rounded-xl p-6 space-y-5 relative overflow-hidden" data-testid="card-plan-pro">
            <div className="absolute top-0 right-0 bg-primary/20 text-primary text-[10px] uppercase tracking-widest font-medium px-4 py-1.5 rounded-bl-lg">
              {t("popular")}
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-xs uppercase tracking-widest font-medium text-primary">
                {t("planProName")}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-serif text-foreground">${plan10Price}</span>
              <span className="text-sm text-muted-foreground font-light">/ {t("perMonth")}</span>
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2.5 text-sm text-foreground/80 font-light">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>{t("planFeatureStocks", { count: "10" })}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-foreground/80 font-light">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>{t("planFeatureDailyEmail")}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-foreground/80 font-light">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>{t("planFeatureAiAnalysis")}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-foreground/80 font-light">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>{t("planFeatureIndicators")}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-foreground/80 font-light">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>{t("planFeaturePriority")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-6 max-w-md mx-auto pt-4">
          <p className="text-muted-foreground font-light text-sm">
            {t("subscribeWhatsAppDesc")}
          </p>

          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium px-8 py-3.5 rounded-xl text-sm tracking-wide transition-colors shadow-lg shadow-[#25D366]/20"
              data-testid="button-subscribe-whatsapp"
            >
              <MessageCircle className="w-5 h-5" />
              {t("subscribeViaWhatsApp")}
              <ExternalLink className="w-4 h-4 opacity-70" />
            </a>
          ) : (
            <div className="text-xs text-muted-foreground/50 bg-card/30 border border-white/5 rounded-lg px-6 py-3">
              WhatsApp contact not configured yet. Please check back soon.
            </div>
          )}
        </div>

        <div className="text-center space-y-4 max-w-md mx-auto pt-4">
          <div className="flex items-center justify-center gap-3 text-muted-foreground text-sm font-light">
            <TrendingUp className="w-4 h-4 text-primary/60" />
            <span>{t("premiumFeature1")}</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-muted-foreground text-sm font-light">
            <BarChart3 className="w-4 h-4 text-primary/60" />
            <span>{t("premiumFeature2")}</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-muted-foreground text-sm font-light">
            <Bell className="w-4 h-4 text-primary/60" />
            <span>{t("premiumFeature3")}</span>
          </div>
        </div>

        <div className="text-center pt-4 pb-8">
          <p className="text-xs text-muted-foreground/50 font-light" data-testid="text-premium-note">
            {t("premiumNote")}
          </p>
        </div>
      </div>
    </div>
  );
}
