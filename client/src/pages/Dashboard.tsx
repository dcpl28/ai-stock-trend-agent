import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { StockChart } from "@/components/StockChart";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { generateMockData } from "@/lib/stockData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, Layers } from "lucide-react";
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
  // Simple "random" trend logic for the mockup
  const trend = latestClose > (data ? data[0].close : 0) ? 'bullish' : 'bearish';
  const confidence = Math.floor(Math.random() * 30) + 70; // 70-99%

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
              <Layers className="w-8 h-8" />
              ProTerminal <span className="text-foreground text-lg font-normal opacity-50">v1.2</span>
            </h1>
            <p className="text-muted-foreground">Advanced Market Analytics & Portfolio Management</p>
          </div>
          
          <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Enter Symbol (e.g. KLSE:GENM)" 
                className="pl-9 font-mono bg-secondary/20 border-border"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary">Analyze</Button>
          </form>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart Section */}
          <div className="lg:col-span-2 space-y-4">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <span className="w-2 h-8 bg-primary rounded-sm inline-block"></span>
                  Market Overview
                </h2>
                <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
             </div>
             
             {data ? (
               <StockChart data={data} symbol={symbol} />
             ) : (
               <div className="h-[400px] flex items-center justify-center bg-card/20 rounded-lg border border-border/50 border-dashed">
                  Loading Market Data...
               </div>
             )}

             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {['Open', 'High', 'Low', 'Prev Close'].map((label) => (
                  <div key={label} className="bg-card/30 p-3 rounded border border-border/50">
                    <div className="text-xs text-muted-foreground uppercase">{label}</div>
                    <div className="text-lg font-mono font-medium">
                      {(Math.random() * 10 + 100).toFixed(2)}
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* Analysis Sidebar */}
          <div className="lg:col-span-1">
             <AnalysisPanel 
               symbol={symbol}
               currentPrice={latestClose}
               trend={trend}
               confidence={confidence}
             />
          </div>
        </div>
      </div>
    </div>
  );
}
