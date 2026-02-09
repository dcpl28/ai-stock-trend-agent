import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlignLeft, BrainCircuit } from "lucide-react";
import { AIResponseFooter } from "./PromotionalMessage";

interface AnalysisPanelProps {
  symbol: string;
  currentPrice: number;
  trend: 'bullish' | 'bearish';
  confidence: number;
}

export function AnalysisPanel({ symbol, currentPrice, trend, confidence }: AnalysisPanelProps) {
  const isBullish = trend === 'bullish';

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
                  : 'border-[hsl(var(--chart-bearish))] text-[hsl(var(--chart-bearish))] bg-[hsl(var(--chart-bearish))]/5'
              }`}
            >
              {trend}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <div className="grid grid-cols-2 gap-8 relative">
            {/* Center Divider */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
            
            <div className="space-y-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                 <BrainCircuit className="w-3 h-3 text-primary" /> AI Pattern Analysis
              </span>
              <div className="text-sm font-medium text-foreground leading-snug">
                {isBullish 
                  ? "Ascending Triangle Breakout detected. Higher lows confirm accumulation phase." 
                  : "Head and Shoulders pattern forming. Distribution evident at resistance levels."}
              </div>
            </div>
            
            <div className="space-y-2 pl-4">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Confidence</span>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-serif text-primary">{confidence}%</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-widest flex items-center gap-2 opacity-80">
              <AlignLeft className="w-4 h-4" /> Technical Indicators
            </h4>
            
            <div className="space-y-1">
               {[
                 { label: 'RSI (14)', value: isBullish ? '64.2' : '32.1', status: isBullish ? 'Neutral' : 'Oversold' },
                 { label: 'MACD', value: isBullish ? '+0.45' : '-0.12', status: isBullish ? 'Strong' : 'Weak' },
                 { label: 'MA (20)', value: (currentPrice * 0.98).toFixed(2), status: isBullish ? 'Support' : 'Resistance' },
                 { label: 'MA (200)', value: (currentPrice * 0.90).toFixed(2), status: 'Trend Line' }
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors rounded border-b border-white/5 last:border-0">
                    <span className="text-sm text-muted-foreground font-light">{item.label}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono text-foreground">{item.value}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded border border-white/10 ${
                        item.status === 'Strong' || item.status === 'Support' ? 'text-green-400' : 
                        item.status === 'Weak' || item.status === 'Resistance' ? 'text-red-400' :
                        'text-muted-foreground'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                 </div>
               ))}
            </div>
          </div>

          <div className="pt-2">
            <AIResponseFooter />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
