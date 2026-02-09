import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { StockChart } from "@/components/StockChart";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { generateMockData } from "@/lib/stockData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, Diamond, Crown, ChevronRight, TrendingUp } from "lucide-react";
import { PromotionalMessage } from '@/components/PromotionalMessage';

export default function Dashboard() {
  const [symbol, setSymbol] = useState("KLSE:MAYBANK");
  const [searchInput, setSearchInput] = useState("");

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['stockData', symbol],
    queryFn: async () => {
      // Simulate API delay for realism
      await new Promise(resolve => setTimeout(resolve, 600)); 
      return generateMockData(symbol, 60);
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSymbol(searchInput.toUpperCase());
    }
  };

  const latestClose = data ? data[data.length - 1].close : 0;
  const trend = latestClose > (data ? data[0].close : 0) ? 'bullish' : 'bearish';
  const confidence = Math.floor(Math.random() * 30) + 70; // 70-99%

  const isKLSE = symbol.includes("KLSE") || symbol.includes(".KL");
  const currency = isKLSE ? "MYR" : "USD";

  return (
    <div className="min-h-screen font-sans pb-20">
      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-full h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto p-4 md:p-8 relative z-10 space-y-12">
        
        {/* Luxury Header */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-primary/20 pb-8">
          <div className="text-center md:text-left space-y-3">
            <div className="flex items-center justify-center md:justify-start gap-2 text-primary mb-1">
              <Crown className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-[10px] uppercase tracking-[0.25em] font-medium opacity-80">Dexter Chia Private Clients</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-foreground">
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
                />
              </div>
              <Button type="submit" className="h-12 px-8 rounded-none bg-primary text-primary-foreground font-medium tracking-widest hover:bg-primary/90 transition-all cursor-pointer">
                ANALYZE
              </Button>
            </form>
            <div className="flex justify-between md:justify-end px-1">
               <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                 Market Open
               </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Chart Section (Dominant) */}
          <div className="lg:col-span-8 space-y-6">
             <div className="flex justify-between items-end border-b border-white/5 pb-2">
                <div className="flex items-baseline gap-4">
                  <h2 className="text-3xl font-serif text-foreground">
                    {symbol}
                  </h2>
                  <span className="text-2xl font-light text-primary tracking-tighter flex items-baseline gap-1">
                    {latestClose.toFixed(2)} <span className="text-xs text-muted-foreground font-sans uppercase">{currency}</span>
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading} className="text-muted-foreground hover:text-primary transition-colors text-xs tracking-wider uppercase">
                  <RefreshCw className={`w-3 h-3 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
             </div>
             
             {data ? (
               <div className="glass-panel p-1 rounded-lg">
                 <StockChart data={data} symbol={symbol} />
               </div>
             ) : (
               <div className="h-[400px] flex flex-col items-center justify-center bg-card/20 rounded-lg border border-primary/10 border-dashed text-muted-foreground font-light">
                  <Diamond className="w-8 h-8 mb-4 text-primary/20 animate-pulse" />
                  Retrieving Market Data...
               </div>
             )}

             {/* Metric Cards */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Open', value: (Math.random() * 10 + 100).toFixed(2) },
                  { label: 'High', value: (Math.random() * 10 + 110).toFixed(2) },
                  { label: 'Low', value: (Math.random() * 10 + 90).toFixed(2) },
                  { label: 'Vol', value: '2.4M' },
                ].map((item) => (
                  <div key={item.label} className="bg-card/40 border border-white/5 p-4 rounded text-center hover:bg-white/5 transition-colors">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{item.label}</div>
                    <div className="text-xl font-serif font-medium text-foreground">{item.value}</div>
                  </div>
                ))}
             </div>
          </div>

          {/* Analysis & Promo Sidebar */}
          <div className="lg:col-span-4 space-y-8">
             <AnalysisPanel 
               symbol={symbol}
               currentPrice={latestClose}
               trend={trend}
               confidence={confidence}
             />
             
             <PromotionalMessage />
          </div>
        </div>
      </div>
    </div>
  );
}
