import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import TradingViewChart from "@/components/TradingViewChart";
import { StockChart } from "@/components/StockChart";
import { CompanyInsights } from "@/components/CompanyInsights";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Diamond, Crown, Loader2 } from "lucide-react";
import { PromotionalMessage } from '@/components/PromotionalMessage';
import { apiRequest } from "@/lib/queryClient";

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockResponse {
  symbol: string;
  currency: string;
  exchange: string;
  name: string;
  regularMarketPrice: number;
  previousClose: number;
  candles: CandleData[];
}

interface QuoteResponse {
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

interface AnalysisResponse {
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
  companyProfile: {
    business: string;
    strengths: string[];
    risks: string[];
  };
  recommendation: string;
}

export default function Dashboard() {
  const [symbol, setSymbol] = useState("KLSE:MAYBANK");
  const [searchInput, setSearchInput] = useState("");

  const { data: stockData, isLoading: stockLoading, error: stockError } = useQuery<StockResponse>({
    queryKey: ['/api/stock', symbol],
    queryFn: async () => {
      const encodedSymbol = encodeURIComponent(symbol);
      const res = await fetch(`/api/stock/${encodedSymbol}?range=6mo&interval=1d`);
      if (!res.ok) throw new Error('Failed to fetch stock data');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: quoteData, isLoading: quoteLoading } = useQuery<QuoteResponse>({
    queryKey: ['/api/quote', symbol],
    queryFn: async () => {
      const encodedSymbol = encodeURIComponent(symbol);
      const res = await fetch(`/api/quote/${encodedSymbol}`);
      if (!res.ok) throw new Error('Failed to fetch quote');
      return res.json();
    },
    staleTime: 60 * 1000,
    retry: 1,
  });

  const { data: analysis, isLoading: analysisLoading } = useQuery<AnalysisResponse>({
    queryKey: ['/api/analysis', symbol, stockData?.candles?.length],
    queryFn: async () => {
      const res = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          candles: stockData?.candles || [],
          quote: quoteData || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to fetch analysis');
      return res.json();
    },
    enabled: !!stockData?.candles && stockData.candles.length > 0,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      let searchSym = searchInput.toUpperCase();
      if (searchSym.startsWith("MYX:")) {
         searchSym = searchSym.replace("MYX:", "KLSE:");
      }
      setSymbol(searchSym);
    }
  };

  const isKLSE = symbol.includes("KLSE") || symbol.includes(".KL") || symbol.includes("MYX");
  const currency = stockData?.currency || (isKLSE ? "MYR" : "USD");
  const currentPrice = quoteData?.price || stockData?.regularMarketPrice || 0;
  const priceChange = quoteData?.change || 0;
  const priceChangePercent = quoteData?.changePercent || 0;
  const marketState = quoteData?.marketState || "UNKNOWN";

  return (
    <div className="min-h-screen font-sans pb-20">
      <div className="fixed top-0 left-0 w-full h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto p-4 md:p-8 relative z-10 space-y-12">
        
        <header className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-primary/20 pb-8">
          <div className="text-center md:text-left space-y-3">
            <div className="flex items-center justify-center md:justify-start gap-2 text-primary mb-1">
              <Crown className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-[10px] uppercase tracking-[0.25em] font-medium opacity-80">Dexter Chia Private Clients</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-foreground" data-testid="text-app-title">
              Market<span className="text-primary italic">Pro</span> Terminal
            </h1>
            <p className="text-muted-foreground font-light tracking-wide text-sm max-w-md">
              Institutional-grade analytics for the discerning investor. <br className="hidden md:block"/>
              Managed by Dexter Chia, Licensed Remisier.
            </p>
          </div>
          
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <form onSubmit={handleSearch} className="flex gap-0 shadow-2xl shadow-black/40 rounded-lg overflow-hidden border border-primary/20 group focus-within:border-primary/50 transition-colors w-full md:w-auto">
              <div className="relative w-full md:w-80 bg-card">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
                <Input 
                  placeholder="Search Symbol (e.g. KLSE:GENM)" 
                  className="pl-11 h-12 bg-transparent border-none text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 font-medium tracking-wide"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  data-testid="input-search-symbol"
                />
              </div>
              <Button type="submit" className="h-12 px-8 rounded-none bg-primary text-primary-foreground font-medium tracking-widest hover:bg-primary/90 transition-all cursor-pointer" data-testid="button-analyze">
                ANALYZE
              </Button>
            </form>
            <div className="flex justify-between md:justify-end px-1">
               <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1" data-testid="text-market-state">
                 <span className={`w-1.5 h-1.5 rounded-full ${marketState === 'REGULAR' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
                 {marketState === 'REGULAR' ? 'Market Open' : marketState === 'PRE' ? 'Pre-Market' : marketState === 'POST' ? 'After Hours' : 'Market Closed'}
               </span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-6">
             <div className="flex justify-between items-end border-b border-white/5 pb-2">
                <div className="flex items-baseline gap-4">
                  <h2 className="text-3xl font-serif text-foreground" data-testid="text-symbol-name">
                    {stockData?.name || symbol}
                  </h2>
                  {currentPrice > 0 && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-mono text-primary" data-testid="text-current-price">
                        {currency} {currentPrice.toFixed(2)}
                      </span>
                      <span className={`text-sm font-mono ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`} data-testid="text-price-change">
                        {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-sm font-light text-muted-foreground tracking-wide flex items-center gap-2" data-testid="text-data-source">
                   <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                   Live Market Data
                </span>
             </div>
             
             {stockLoading ? (
               <div className="h-[500px] flex flex-col items-center justify-center bg-card/20 rounded-lg border border-primary/10 border-dashed text-muted-foreground font-light">
                  <Loader2 className="w-8 h-8 mb-4 text-primary/40 animate-spin" />
                  Fetching Market Data...
               </div>
             ) : stockError ? (
               <div className="h-[500px] flex flex-col items-center justify-center bg-card/20 rounded-lg border border-red-500/20 border-dashed text-muted-foreground font-light">
                  <Diamond className="w-8 h-8 mb-4 text-red-500/40" />
                  <p className="text-red-400">Failed to load data for {symbol}</p>
                  <p className="text-xs text-muted-foreground mt-2">Try a different symbol (e.g., AAPL, MSFT, KLSE:MAYBANK)</p>
               </div>
             ) : stockData?.candles && stockData.candles.length > 0 ? (
               <div className="glass-panel p-1 rounded-lg h-[500px]">
                 {isKLSE ? (
                    <StockChart data={stockData.candles} symbol={symbol} />
                 ) : (
                    <TradingViewChart symbol={symbol} />
                 )}
               </div>
             ) : (
               <div className="h-[500px] flex flex-col items-center justify-center bg-card/20 rounded-lg border border-primary/10 border-dashed text-muted-foreground font-light">
                  <Diamond className="w-8 h-8 mb-4 text-primary/20 animate-pulse" />
                  No data available
               </div>
             )}

             <CompanyInsights
               symbol={symbol}
               analysis={analysis}
               quote={quoteData}
               isLoading={analysisLoading || quoteLoading}
             />
          </div>

          <div className="lg:col-span-4 space-y-8">
             <AnalysisPanel 
               symbol={symbol}
               currentPrice={currentPrice}
               analysis={analysis}
               isLoading={analysisLoading}
               currency={currency}
             />
             
             <PromotionalMessage />
          </div>
        </div>
      </div>
    </div>
  );
}
