import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, AlertCircle, Loader2, MapPin, Calendar, Briefcase, Factory } from "lucide-react";

interface QuoteData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  eps: number;
  dividendYield: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  averageVolume: number;
  currency: string;
  exchange: string;
  marketState: string;
}

interface AnalysisData {
  companyProfile?: {
    business: string;
    sector?: string;
    industry?: string;
    founded?: string;
    headquarters?: string;
    strengths: string[];
    risks: string[];
  };
}

interface CompanyInsightsProps {
  symbol: string;
  analysis?: AnalysisData;
  quote?: QuoteData;
  isLoading: boolean;
}

export function CompanyInsights({
  symbol,
  analysis,
  quote,
  isLoading,
}: CompanyInsightsProps) {
  const currency = quote?.currency || "USD";

  const formatLargeNumber = (num: number | undefined) => {
    if (!num) return "N/A";
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(2);
  };

  const profile = analysis?.companyProfile;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <Card className="glass-panel border-white/5">
          <CardContent className="py-12 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary/40 mb-3" />
            <span className="text-sm font-light">
              Loading company insights...
            </span>
          </CardContent>
        </Card>
      ) : profile ? (
        <Card className="glass-panel border-white/5">
          <CardHeader className="pb-3 border-b border-white/5">
            <CardTitle className="flex items-center gap-2 text-[10px] text-primary uppercase tracking-widest font-medium">
              <Building2 className="w-4 h-4 text-primary" />
              Company Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                Core Business
              </h4>
              <p
                className="text-sm text-foreground/90 leading-relaxed font-light"
                data-testid="text-company-business"
              >
                {profile.business}
              </p>
            </div>

            {(profile.sector || profile.industry || profile.founded || profile.headquarters) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 border-y border-white/5">
                {profile.sector && (
                  <div className="space-y-1" data-testid="text-company-sector">
                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                      <Briefcase className="w-3 h-3" /> Sector
                    </div>
                    <p className="text-xs text-foreground/80 font-light">{profile.sector}</p>
                  </div>
                )}
                {profile.industry && (
                  <div className="space-y-1" data-testid="text-company-industry">
                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                      <Factory className="w-3 h-3" /> Industry
                    </div>
                    <p className="text-xs text-foreground/80 font-light">{profile.industry}</p>
                  </div>
                )}
                {profile.founded && profile.founded !== "N/A" && (
                  <div className="space-y-1" data-testid="text-company-founded">
                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                      <Calendar className="w-3 h-3" /> Founded
                    </div>
                    <p className="text-xs text-foreground/80 font-light">{profile.founded}</p>
                  </div>
                )}
                {profile.headquarters && (
                  <div className="space-y-1" data-testid="text-company-hq">
                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                      <MapPin className="w-3 h-3" /> Headquarters
                    </div>
                    <p className="text-xs text-foreground/80 font-light">{profile.headquarters}</p>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-widest text-green-500/80 font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Strengths
                </h4>
                <ul className="space-y-1">
                  {profile.strengths.map((item, i) => (
                    <li
                      key={i}
                      className="text-xs text-foreground/80 flex items-start gap-2"
                      data-testid={`text-strength-${i}`}
                    >
                      <span className="w-1 h-1 rounded-full bg-green-500 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-widest text-red-400/80 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Risks
                </h4>
                <ul className="space-y-1">
                  {profile.risks.map((item, i) => (
                    <li
                      key={i}
                      className="text-xs text-foreground/80 flex items-start gap-2"
                      data-testid={`text-risk-${i}`}
                    >
                      <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
