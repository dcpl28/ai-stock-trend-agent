import React from "react";
import { Card } from "@/components/ui/card";
import {
  ExternalLink,
  TrendingUp,
  Briefcase,
  Lock,
  Star,
  ShieldCheck,
  Gem,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function PromotionalMessage() {
  const { t } = useI18n();

  return (
    <Card className="glass-panel overflow-hidden relative border-primary/30 shadow-2xl shadow-primary/5 group transition-all duration-500 hover:shadow-primary/10 hover:border-primary/40">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>

      <div className="p-6 relative z-10 space-y-6">
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] uppercase tracking-widest font-semibold mb-1">
            <Gem className="w-3 h-3" /> {t("privilegeService")}
          </div>
          <h3 className="text-2xl font-serif text-foreground leading-tight">
            {t("discretionaryTrading")} <br />
            <span className="text-primary italic">{t("portfolioManagement")}</span>
          </h3>
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            {t("promoDescription")}
          </p>
        </div>

        <div className="bg-gradient-to-br from-card to-background border border-white/5 p-5 rounded-lg flex flex-col items-center gap-3 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />

          <span className="text-[10px] uppercase tracking-widest text-muted-foreground z-10">
            {t("signUpInvitationCode")}
          </span>
          <div className="flex items-center gap-4 z-10">
            <div className="h-px w-8 bg-primary/30"></div>
            <code className="text-3xl font-serif tracking-widest text-primary drop-shadow-[0_0_15px_rgba(234,179,8,0.25)] font-medium">
              UBZQ
            </code>
            <div className="h-px w-8 bg-primary/30"></div>

            <span className="text-[10px] text-primary/60 italic z-10">
              {t("referFriends")}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            asChild
            className="w-full py-6 bg-primary text-primary-foreground font-medium tracking-wide hover:bg-primary/90 transition-all rounded shadow-lg shadow-primary/20 text-sm cursor-pointer"
          >
            <a
              href="https://m.global.mplusonline.com/kh/status/entry/transit?_scnl=UBZQ"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("signUpLink")}
            </a>
          </Button>

          <a
            href="https://wa.me/0169059789"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full py-3 bg-transparent border border-primary/30 text-primary hover:bg-primary/5 transition-all rounded text-sm group"
          >
            <span>{t("interestedWealth")}</span>
            <ExternalLink className="w-3 h-3 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 opacity-70">
          <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            <ShieldCheck className="w-3 h-3 text-primary" />
            <span>{t("trustedClients")}</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            <Briefcase className="w-3 h-3 text-primary" />
            <span>{t("assetsSecured")}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function AIResponseFooter() {
  return (
    <div></div>
  );
}
