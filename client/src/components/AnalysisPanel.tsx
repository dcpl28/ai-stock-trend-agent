import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowUpRight, ArrowDownRight, Activity, TrendingUp, AlertTriangle } from "lucide-react";
import { PromotionalMessage, AIResponseFooter } from "./PromotionalMessage";

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
      <Card className="bg-card/50 backdrop-blur-sm border-border overflow-hidden">
        <div className={`h-2 w-full ${isBullish ? 'bg-[hsl(var(--chart-bullish))]' : 'bg-[hsl(var(--chart-bearish))]'}`} />
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg text-muted-foreground font-normal">Technical Analysis</span>
            <Badge 
              variant="outline" 
              className={`px-3 py-1 text-sm font-bold border-2 ${
                isBullish 
                  ? 'border-[hsl(var(--chart-bullish))] text-[hsl(var(--chart-bullish))] bg-[hsl(var(--chart-bullish))]/10' 
                  : 'border-[hsl(var(--chart-bearish))] text-[hsl(var(--chart-bearish))] bg-[hsl(var(--chart-bearish))]/10'
              }`}
            >
              {trend.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Current Price</span>
              <div className="text-3xl font-mono font-bold tracking-tight">
                {currentPrice.toFixed(2)}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Trend Confidence</span>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <span className="text-2xl font-mono font-bold">{confidence}%</span>
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Detected Patterns
            </h4>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between p-2 rounded bg-secondary/30 border border-border/50 text-sm">
                <span>Moving Average Crossover</span>
                <span className={isBullish ? "text-[hsl(var(--chart-bullish))]" : "text-[hsl(var(--chart-bearish))]"}>
                   {isBullish ? "Golden Cross" : "Death Cross"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-secondary/30 border border-border/50 text-sm">
                <span>RSI (14)</span>
                <span className="font-mono">{isBullish ? "62.4 (Healthy)" : "34.2 (Oversold)"}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-secondary/30 border border-border/50 text-sm">
                <span>Volume Analysis</span>
                <span className="font-mono">Accumulation</span>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-primary font-medium text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Remisier's Note</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Based on the candlestick formation, {symbol} is showing strong {trend} momentum. 
              Key support levels held firmly during the last session.
            </p>
            <AIResponseFooter />
          </div>
        </CardContent>
      </Card>
      
      <PromotionalMessage />
    </div>
  );
}
