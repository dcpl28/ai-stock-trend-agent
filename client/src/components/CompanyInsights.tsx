import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Briefcase, Building2, TrendingUp, AlertCircle, Newspaper, ExternalLink } from "lucide-react";

interface NewsItem {
  id: number;
  title: string;
  source: string;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface CompanyInsightsProps {
  symbol: string;
}

export function CompanyInsights({ symbol }: CompanyInsightsProps) {
  // Mock data generation based on symbol
  const isKLSE = symbol.includes("KLSE") || symbol.includes(".KL");
  
  const companyInfo = {
    business: isKLSE 
      ? "Leading financial services group in Southeast Asia, offering banking, insurance, and asset management."
      : "Multinational technology company focusing on e-commerce, cloud computing, and artificial intelligence.",
    strengths: [
      "Strong market capitalization and liquidity",
      "Consistent dividend yield history",
      "Dominant market share in key segments"
    ],
    weaknesses: [
      "Exposure to regional economic volatility",
      "Increasing regulatory compliance costs"
    ]
  };

  const news: NewsItem[] = [
    {
      id: 1,
      title: `${symbol} Reports Strong Q3 Earnings Growth`,
      source: "Financial Daily",
      time: "2h ago",
      sentiment: "positive"
    },
    {
      id: 2,
      title: "Analysts Upgrade Price Target Following Expansion News",
      source: "Market Watch",
      time: "5h ago",
      sentiment: "positive"
    },
    {
      id: 3,
      title: "Sector Analysis: Banking Stocks Face Headwinds",
      source: "Global Finance",
      time: "1d ago",
      sentiment: "neutral"
    },
    {
      id: 4,
      title: "New Strategic Partnership Announced",
      source: "Business Insider",
      time: "2d ago",
      sentiment: "positive"
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="glass-panel border-white/5">
        <CardHeader className="pb-3 border-b border-white/5">
          <CardTitle className="flex items-center gap-2 text-lg font-serif">
            <Building2 className="w-5 h-5 text-primary" />
            Company Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Core Business</h4>
            <p className="text-sm text-foreground/90 leading-relaxed font-light">
              {companyInfo.business}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-widest text-green-500/80 font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Strengths
              </h4>
              <ul className="space-y-1">
                {companyInfo.strengths.map((item, i) => (
                  <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
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
                {companyInfo.weaknesses.map((item, i) => (
                  <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-panel border-white/5">
        <CardHeader className="pb-3 border-b border-white/5">
          <CardTitle className="flex items-center gap-2 text-lg font-serif">
            <Newspaper className="w-5 h-5 text-primary" />
            Recent Market News
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-4 pt-4">
              {news.map((item) => (
                <div key={item.id} className="group flex flex-col gap-1 border-b border-white/5 last:border-0 pb-3 last:pb-0">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors cursor-pointer leading-tight">
                      {item.title}
                    </h4>
                    <Badge variant="outline" className={`shrink-0 text-[10px] px-1.5 py-0 h-5 border-none ${
                      item.sentiment === 'positive' ? 'bg-green-500/10 text-green-500' :
                      item.sentiment === 'negative' ? 'bg-red-500/10 text-red-500' :
                      'bg-white/5 text-muted-foreground'
                    }`}>
                      {item.sentiment}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-wider">
                    <span>{item.source}</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
