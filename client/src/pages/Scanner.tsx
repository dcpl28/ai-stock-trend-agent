import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Crown, Scan, TrendingUp, Trophy, Loader2, ArrowLeft, ArrowUpRight, ArrowDownRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

interface ScanResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  fiftyTwoWeekHigh: number;
  currency: string;
  reason: string;
}

const BREAKOUT_CRITERIA = [
  { id: "above_5_candles", label: "Above last 5 candle highs", group: "breakout" },
  { id: "above_10day", label: "Above 10-day high", group: "breakout" },
  { id: "above_3day", label: "Above 3-day high", group: "breakout" },
] as const;

const INDICATOR_CRITERIA = [
  { id: "above_ema5", label: "Above EMA 5", group: "indicator" },
  { id: "above_ema20", label: "Above EMA 20", group: "indicator" },
  { id: "above_sma200", label: "Above SMA 200", group: "indicator" },
  { id: "ema20_above_sma200", label: "EMA 20 above SMA 200", group: "indicator" },
  { id: "ema20_cross_sma200", label: "EMA 20 cross SMA 200 (Golden Cross)", group: "indicator" },
] as const;

export default function Scanner() {
  const { logout } = useAuth();
  const [, navigate] = useLocation();
  const [market, setMarket] = useState<"US" | "MY">("US");
  const [scanType, setScanType] = useState<"ath" | "breakout">("ath");
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [scanPage, setScanPage] = useState(1);
  const SCAN_PER_PAGE = 20;
  const [scanKey, setScanKey] = useState(0);

  const criteriaParam = selectedCriteria.join(",");

  const { data: results, isLoading, isFetching } = useQuery<ScanResult[]>({
    queryKey: ["/api/scanner", market, scanType, criteriaParam, scanKey],
    queryFn: async () => {
      const params = new URLSearchParams({ market, type: scanType });
      if (criteriaParam) params.set("criteria", criteriaParam);
      const res = await fetch(`/api/scanner?${params}`);
      if (!res.ok) throw new Error("Scan failed");
      return res.json();
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const handleScan = () => {
    setScanPage(1);
    if (enabled) {
      setScanKey(k => k + 1);
    } else {
      setEnabled(true);
    }
  };

  const toggleCriteria = (id: string) => {
    setEnabled(false);
    setSelectedCriteria(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleScanTypeChange = (type: "ath" | "breakout") => {
    setScanType(type);
    setEnabled(false);
    if (type === "ath") {
      setSelectedCriteria(prev => prev.filter(c =>
        INDICATOR_CRITERIA.some(ic => ic.id === c)
      ));
    }
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return `${(vol / 1e9).toFixed(1)}B`;
    if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M`;
    if (vol >= 1e3) return `${(vol / 1e3).toFixed(0)}K`;
    return vol.toString();
  };

  const formatMarketCap = (cap: number) => {
    if (cap >= 1e12) return `${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `${(cap / 1e9).toFixed(1)}B`;
    if (cap >= 1e6) return `${(cap / 1e6).toFixed(0)}M`;
    return cap.toString();
  };

  return (
    <div className="min-h-screen font-sans pb-20">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto p-4 md:p-8 relative z-10 space-y-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Terminal
          </button>
          <button
            onClick={logout}
            className="text-sm text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
            data-testid="button-scanner-logout"
          >
            Logout
          </button>
        </div>

        <header className="border-b border-primary/20 pb-6">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Crown className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-[10px] uppercase tracking-[0.25em] font-medium opacity-80">Market Scanner</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-foreground" data-testid="text-scanner-title">
            Stock <span className="text-primary italic">Scanner</span>
          </h1>
          <p className="text-muted-foreground font-light tracking-wide text-sm mt-2">
            Scan for breakout and all-time high stocks across US and Malaysian markets.
          </p>
        </header>

        <div className="bg-card/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 shadow-2xl shadow-black/40 space-y-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 block">Market</label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setMarket("US"); setEnabled(false); }}
                  className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-medium rounded-lg transition-all cursor-pointer ${
                    market === "US"
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-card/50 text-muted-foreground border border-white/5 hover:border-white/10"
                  }`}
                  data-testid="button-market-us"
                >
                  US Market
                </button>
                <button
                  onClick={() => { setMarket("MY"); setEnabled(false); }}
                  className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-medium rounded-lg transition-all cursor-pointer ${
                    market === "MY"
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-card/50 text-muted-foreground border border-white/5 hover:border-white/10"
                  }`}
                  data-testid="button-market-my"
                >
                  Malaysia (KLSE)
                </button>
              </div>
            </div>

            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 block">Scan Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleScanTypeChange("ath")}
                  className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-medium rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    scanType === "ath"
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-card/50 text-muted-foreground border border-white/5 hover:border-white/10"
                  }`}
                  data-testid="button-type-ath"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  All-Time High
                </button>
                <button
                  onClick={() => handleScanTypeChange("breakout")}
                  className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-medium rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    scanType === "breakout"
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-card/50 text-muted-foreground border border-white/5 hover:border-white/10"
                  }`}
                  data-testid="button-type-breakout"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Breakout
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4">
            <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-primary" />
              Criteria Filters <span className="text-muted-foreground/40">(select one or more)</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest mb-2">Breakout Conditions</p>
                <div className="space-y-1.5">
                  {BREAKOUT_CRITERIA.map(c => (
                    <label
                      key={c.id}
                      className={`flex items-center gap-2.5 py-1.5 px-3 rounded-lg transition-all cursor-pointer text-xs ${
                        scanType === "ath"
                          ? "opacity-30 cursor-not-allowed"
                          : selectedCriteria.includes(c.id)
                            ? "bg-primary/15 text-primary border border-primary/25"
                            : "text-muted-foreground hover:bg-white/[0.03] border border-transparent"
                      }`}
                      data-testid={`checkbox-${c.id}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCriteria.includes(c.id)}
                        onChange={() => scanType !== "ath" && toggleCriteria(c.id)}
                        disabled={scanType === "ath"}
                        className="w-3.5 h-3.5 rounded border-white/20 bg-transparent accent-primary cursor-pointer disabled:cursor-not-allowed"
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest mb-2">Technical Indicators</p>
                <div className="space-y-1.5">
                  {INDICATOR_CRITERIA.map(c => (
                    <label
                      key={c.id}
                      className={`flex items-center gap-2.5 py-1.5 px-3 rounded-lg transition-all cursor-pointer text-xs ${
                        selectedCriteria.includes(c.id)
                          ? "bg-primary/15 text-primary border border-primary/25"
                          : "text-muted-foreground hover:bg-white/[0.03] border border-transparent"
                      }`}
                      data-testid={`checkbox-${c.id}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCriteria.includes(c.id)}
                        onChange={() => toggleCriteria(c.id)}
                        className="w-3.5 h-3.5 rounded border-white/20 bg-transparent accent-primary cursor-pointer"
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleScan}
              disabled={isLoading || isFetching}
              className="h-11 px-10 bg-primary text-primary-foreground font-medium tracking-widest hover:bg-primary/90 cursor-pointer"
              data-testid="button-scan"
            >
              {isLoading || isFetching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Scanning...
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4 mr-2" />
                  SCAN
                </>
              )}
            </Button>
          </div>
        </div>

        {(isLoading || isFetching) && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary/40 mb-4" />
            <p className="text-sm font-light">Scanning {market === "US" ? "US" : "Malaysian"} market for {scanType === "ath" ? "all-time highs" : "breakouts"}...</p>
            <p className="text-xs text-muted-foreground/50 mt-1">This may take 15-30 seconds</p>
          </div>
        )}

        {!isLoading && !isFetching && results && results.length === 0 && (
          <div className="text-center py-16 text-muted-foreground" data-testid="text-no-results">
            <p className="text-sm font-light">No stocks matched the selected criteria right now.</p>
            <p className="text-xs text-muted-foreground/50 mt-1">Try a different market, scan type, or adjust your filters.</p>
          </div>
        )}

        {!isLoading && !isFetching && !enabled && (
          <div className="text-center py-16 text-muted-foreground" data-testid="text-scan-prompt">
            <Scan className="w-10 h-10 text-primary/20 mx-auto mb-4" />
            <p className="text-sm font-light">Select your market, scan type, and criteria, then click SCAN to find stocks.</p>
          </div>
        )}

        {!isLoading && !isFetching && results && results.length > 0 && (() => {
          const totalPages = Math.ceil(results.length / SCAN_PER_PAGE);
          const paged = results.slice((scanPage - 1) * SCAN_PER_PAGE, scanPage * SCAN_PER_PAGE);
          return (
          <div className="bg-card/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-[10px] text-primary uppercase tracking-widest font-medium flex items-center gap-2">
                {scanType === "ath" ? <Trophy className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                {results.length} {scanType === "ath" ? "All-Time High" : "Breakout"} Stocks Found
              </h2>
              <div className="flex items-center gap-3">
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setScanPage(p => Math.max(1, p - 1))}
                      disabled={scanPage <= 1}
                      className="h-6 px-2 text-[10px]"
                      data-testid="button-scan-prev"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </Button>
                    <span className="text-[10px] text-muted-foreground/60 font-mono" data-testid="text-scan-page">
                      {scanPage}/{totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setScanPage(p => Math.min(totalPages, p + 1))}
                      disabled={scanPage >= totalPages}
                      className="h-6 px-2 text-[10px]"
                      data-testid="button-scan-next"
                    >
                      <ArrowLeft className="w-3 h-3 rotate-180" />
                    </Button>
                  </div>
                )}
                <span className="text-[10px] text-muted-foreground/50">
                  {market === "US" ? "US Market" : "KLSE"} · Data may be delayed up to 15 min
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium py-3 px-6">Symbol</th>
                    <th className="text-left text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium py-3 px-4">Name</th>
                    <th className="text-right text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium py-3 px-4">Price</th>
                    <th className="text-right text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium py-3 px-4">Change</th>
                    <th className="text-right text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium py-3 px-4">Volume</th>
                    <th className="text-right text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium py-3 px-4 hidden md:table-cell">Mkt Cap</th>
                    <th className="text-left text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium py-3 px-6">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((stock, idx) => (
                    <tr
                      key={stock.symbol}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => navigate(`/?symbol=${stock.symbol}&from=scanner`)}
                      data-testid={`row-scan-result-${(scanPage - 1) * SCAN_PER_PAGE + idx}`}
                    >
                      <td className="py-3 px-6">
                        <span className="font-mono text-primary font-medium text-xs" data-testid={`text-scan-symbol-${(scanPage - 1) * SCAN_PER_PAGE + idx}`}>
                          {stock.symbol}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-foreground text-xs truncate max-w-[200px] block" data-testid={`text-scan-name-${(scanPage - 1) * SCAN_PER_PAGE + idx}`}>
                          {stock.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono text-foreground text-xs" data-testid={`text-scan-price-${(scanPage - 1) * SCAN_PER_PAGE + idx}`}>
                          {stock.currency} {stock.price.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-mono text-xs flex items-center justify-end gap-0.5 ${stock.changePercent >= 0 ? "text-green-400" : "text-red-400"}`} data-testid={`text-scan-change-${(scanPage - 1) * SCAN_PER_PAGE + idx}`}>
                          {stock.changePercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono text-muted-foreground text-xs" data-testid={`text-scan-volume-${(scanPage - 1) * SCAN_PER_PAGE + idx}`}>
                          {formatVolume(stock.volume)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right hidden md:table-cell">
                        <span className="font-mono text-muted-foreground text-xs">
                          {formatMarketCap(stock.marketCap)}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <span className="text-[11px] text-primary/80 font-light" data-testid={`text-scan-reason-${(scanPage - 1) * SCAN_PER_PAGE + idx}`}>
                          {stock.reason}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          );
        })()}
      </div>
    </div>
  );
}
