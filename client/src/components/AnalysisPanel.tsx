import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlignLeft, BrainCircuit, Loader2, Info } from "lucide-react";
import { AIResponseFooter } from "./PromotionalMessage";

interface AnalysisData {
  trend: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  patternAnalysis: string;
  indicators: {
    rsi: { value: number; signal: string };
    macd: { value: string; signal: string };
    trend: { value: string; signal: string };
    support: number;
    resistance: number;
    ma20: number;
    ma50: number;
  };
  sentiment: string;
  recommendation: string;
}

interface AnalysisPanelProps {
  symbol: string;
  currentPrice: number;
  analysis?: AnalysisData;
  isLoading: boolean;
  currency: string;
}

export function AnalysisPanel({ symbol, currentPrice, analysis, isLoading, currency }: AnalysisPanelProps) {
  if (isLoading) {
    return (
      <Card className="glass-panel border-t-4 border-t-primary rounded-t-lg overflow-hidden">
        <CardContent className="py-16 flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary/40 mb-4" />
          <span className="text-sm font-light tracking-wide">AI Analyzing {symbol}...</span>
          <span className="text-xs text-muted-foreground/60 mt-1">Processing chart patterns & indicators</span>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="glass-panel border-t-4 border-t-primary rounded-t-lg overflow-hidden">
        <CardContent className="py-16 flex flex-col items-center justify-center text-muted-foreground">
          <BrainCircuit className="w-8 h-8 text-primary/20 mb-4" />
          <span className="text-sm font-light">Search a symbol to get AI analysis</span>
        </CardContent>
      </Card>
    );
  }

  const isBullish = analysis.trend === 'bullish';
  const isNeutral = analysis.trend === 'neutral';

  return (
    <div className="space-y-6">
      <Card className="glass-panel border-t-4 border-t-primary rounded-t-lg overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span className="text-sm uppercase tracking-widest text-muted-foreground font-medium">Market Sentiment</span>
            <Badge 
              variant="outline" 
              className={`px-4 py-1 text-xs font-bold tracking-widest uppercase border ${
                isBullish 
                  ? 'border-[hsl(var(--chart-bullish))] text-[hsl(var(--chart-bullish))] bg-[hsl(var(--chart-bullish))]/5' 
                  : isNeutral
                  ? 'border-yellow-500 text-yellow-500 bg-yellow-500/5'
                  : 'border-[hsl(var(--chart-bearish))] text-[hsl(var(--chart-bearish))] bg-[hsl(var(--chart-bearish))]/5'
              }`}
              data-testid="badge-trend"
            >
              {analysis.trend}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <div className="space-y-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Confidence</span>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-serif text-primary" data-testid="text-confidence">{analysis.confidence}%</span>
            </div>
          </div>

          {analysis.sentiment && (
            <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-primary uppercase tracking-widest font-medium">Market Sentiment</span>
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-primary cursor-help transition-colors" />
                  <div className="absolute right-0 top-5 z-50 hidden group-hover:block w-64 p-3 bg-card border border-primary/20 rounded-lg shadow-xl text-[11px] text-muted-foreground leading-relaxed">
                    This information is AI-generated. It does not guarantee any results and is only for your reference. For more professional advice, kindly PM Dexter.
                  </div>
                </div>
              </div>
              <p className="text-sm text-foreground/90 font-light" data-testid="text-sentiment">{analysis.sentiment}</p>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-widest flex items-center gap-2 opacity-80">
              <AlignLeft className="w-4 h-4" /> Technical Indicators
            </h4>
            
            <div className="space-y-1">
               {[
                 { label: 'RSI (14)', value: analysis.indicators.rsi.value.toFixed(1), status: analysis.indicators.rsi.signal },
                 { label: 'MACD', value: analysis.indicators.macd.value, status: analysis.indicators.macd.signal },
                 { label: 'Trend', value: analysis.indicators.trend.value, status: analysis.indicators.trend.signal },
                 { label: 'Support', value: `${currency} ${analysis.indicators.support.toFixed(2)}`, status: 'Level' },
                 { label: 'Resistance', value: `${currency} ${analysis.indicators.resistance.toFixed(2)}`, status: 'Level' },
                 { label: 'MA(20)', value: `${currency} ${analysis.indicators.ma20.toFixed(2)}`, status: currentPrice > analysis.indicators.ma20 ? 'Above' : 'Below' },
                 { label: 'MA(50)', value: `${currency} ${analysis.indicators.ma50.toFixed(2)}`, status: currentPrice > analysis.indicators.ma50 ? 'Above' : 'Below' },
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors rounded border-b border-white/5 last:border-0" data-testid={`row-indicator-${i}`}>
                    <span className="text-sm text-muted-foreground font-light">{item.label}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono text-foreground">{item.value}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded border border-white/10 ${
                        item.status === 'Strong' || item.status === 'Above' ? 'text-green-400' : 
                        item.status === 'Weak' || item.status === 'Below' || item.status === 'Overbought' || item.status === 'Oversold' ? 'text-red-400' :
                        'text-muted-foreground'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                 </div>
               ))}
            </div>
          </div>

          {analysis.recommendation && (
            <div className="p-3 bg-card/50 border border-white/5 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-primary uppercase tracking-widest font-medium">Recommendation</span>
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-primary cursor-help transition-colors" />
                  <div className="absolute right-0 top-5 z-50 hidden group-hover:block w-64 p-3 bg-card border border-primary/20 rounded-lg shadow-xl text-[11px] text-muted-foreground leading-relaxed">
                    This information is AI-generated. It does not guarantee any results and is only for your reference. For more professional advice, kindly PM Dexter.
                  </div>
                </div>
              </div>
              <p className="text-sm text-foreground/90 font-light" data-testid="text-recommendation">{analysis.recommendation}</p>
            </div>
          )}

          <div className="pt-2">
            <AIResponseFooter />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
