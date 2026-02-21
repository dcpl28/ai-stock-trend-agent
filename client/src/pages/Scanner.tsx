import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Crown, Scan, TrendingUp, Trophy, Loader2, ArrowLeft, ArrowUpRight, ArrowDownRight, Filter, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";
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

export default function Scanner() {
  const { logout } = useAuth();
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const [market, setMarket] = useState<"US" | "MY">("US");
  const [scanType, setScanType] = useState<"ath" | "breakout">("ath");
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [scanPage, setScanPage] = useState(1);
  const SCAN_PER_PAGE = 20;
  type SortKey = "symbol" | "name" | "price" | "changePercent" | "volume" | "marketCap";
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const BREAKOUT_CRITERIA = [
    { id: "above_5_candles", label: t("above5Candles"), group: "breakout" },
    { id: "above_10day", label: t("above10Day"), group: "breakout" },
    { id: "above_3day", label: t("above3Day"), group: "breakout" },
  ] as const;

  const INDICATOR_CRITERIA = [
    { id: "above_ema5", label: t("aboveEma5"), group: "indicator" },
    { id: "above_ema20", label: t("aboveEma20"), group: "indicator" },
    { id: "above_sma200", label: t("aboveSma200"), group: "indicator" },
    { id: "ema20_above_sma200", label: t("ema20AboveSma200"), group: "indicator" },
    { id: "ema20_cross_sma200", label: t("ema20CrossSma200"), group: "indicator" },
  ] as const;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "symbol" || key === "name" ? "asc" : "desc");
    }
    setScanPage(1);
  };

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

  const sortedResults = React.useMemo(() => {
    if (!results || !sortKey) return results;
    return [...results].sort((a, b) => {
      let av: any = a[sortKey];
      let bv: any = b[sortKey];
      if (typeof av === "string") {
        av = av.toLowerCase();
        bv = (bv as string).toLowerCase();
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [results, sortKey, sortDir]);

  const handleScan = () => {
    setScanPage(1);
    setSortKey(null);
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
            {t("backToTerminal")}
          </button>
          <div className="flex items-center gap-3">
            <LanguageSwitcher compact />
            <button
              onClick={logout}
              className="text-sm text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
              data-testid="button-scanner-logout"
            >
              {t("logout")}
            </button>
          </div>
        </div>

        <header className="border-b border-primary/20 pb-6">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Crown className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-[10px] uppercase tracking-[0.25em] font-medium opacity-80">{t("marketScanner")}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-foreground" data-testid="text-scanner-title">
            {t("stockScanner")} <span className="text-primary italic">{t("stockScannerHighlight")}</span>
          </h1>
          <p className="text-muted-foreground font-light tracking-wide text-sm mt-2">
            {t("scannerSubtitle")}
          </p>
        </header>

        <div className="bg-card/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 shadow-2xl shadow-black/40 space-y-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 block">{t("market")}</label>
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
                  {t("usMarket")}
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
                  {t("malaysiaKlse")}
                </button>
              </div>
            </div>

            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 block">{t("scanType")}</label>
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
                  {t("allTimeHigh")}
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
                  {t("breakout")}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4">
            <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-primary" />
              {t("criteriaFilters")} <span className="text-muted-foreground/40">{t("selectOneOrMore")}</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest mb-2">{t("breakoutConditions")}</p>
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
                <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest mb-2">{t("technicalIndicators")}</p>
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
                  {t("scanning")}
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4 mr-2" />
                  {t("scan")}
                </>
              )}
            </Button>
          </div>
        </div>

        {(isLoading || isFetching) && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary/40 mb-4" />
            <p className="text-sm font-light">
              {t("scanningMarket", {
                market: market === "US" ? t("scanningUS") : t("scanningMY"),
                type: scanType === "ath" ? t("scanningATH") : t("scanningBreakout"),
              })}
            </p>
            <p className="text-xs text-muted-foreground/50 mt-1">{t("scanTimeTip")}</p>
          </div>
        )}

        {!isLoading && !isFetching && results && results.length === 0 && (
          <div className="text-center py-16 text-muted-foreground" data-testid="text-no-results">
            <p className="text-sm font-light">{t("noStocksMatched")}</p>
            <p className="text-xs text-muted-foreground/50 mt-1">{t("tryDifferentFilter")}</p>
          </div>
        )}

        {!isLoading && !isFetching && !enabled && (
          <div className="text-center py-16 text-muted-foreground" data-testid="text-scan-prompt">
            <Scan className="w-10 h-10 text-primary/20 mx-auto mb-4" />
            <p className="text-sm font-light">{t("scanPrompt")}</p>
          </div>
        )}

        {!isLoading && !isFetching && sortedResults && sortedResults.length > 0 && (() => {
          const totalPages = Math.ceil(sortedResults.length / SCAN_PER_PAGE);
          const paged = sortedResults.slice((scanPage - 1) * SCAN_PER_PAGE, scanPage * SCAN_PER_PAGE);
          const SortIcon = ({ col }: { col: SortKey }) => {
            if (sortKey !== col) return <ChevronDown className="w-2.5 h-2.5 opacity-30 inline ml-0.5" />;
            return sortDir === "asc" ? <ChevronUp className="w-2.5 h-2.5 text-primary inline ml-0.5" /> : <ChevronDown className="w-2.5 h-2.5 text-primary inline ml-0.5" />;
          };
          return (
          <div className="bg-card/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-[10px] text-primary uppercase tracking-widest font-medium flex items-center gap-2">
                {scanType === "ath" ? <Trophy className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                {results?.length || 0} {scanType === "ath" ? t("allTimeHigh") : t("breakout")} {t("stocksFound")}
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
                  {market === "US" ? t("usMarket") : "KLSE"} · {t("dataDelayed")}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium py-3 px-6 cursor-pointer hover:text-primary/80 select-none" onClick={() => handleSort("symbol")} data-testid="sort-symbol">{t("symbol")}<SortIcon col="symbol" /></th>
                    <th className="text-left text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium py-3 px-4 cursor-pointer hover:text-primary/80 select-none" onClick={() => handleSort("name")} data-testid="sort-name">{t("name")}<SortIcon col="name" /></th>
                    <th className="text-right text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium py-3 px-4 cursor-pointer hover:text-primary/80 select-none" onClick={() => handleSort("price")} data-testid="sort-price">{t("price")}<SortIcon col="price" /></th>
                    <th className="text-right text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium py-3 px-4 cursor-pointer hover:text-primary/80 select-none" onClick={() => handleSort("changePercent")} data-testid="sort-change">{t("change")}<SortIcon col="changePercent" /></th>
                    <th className="text-right text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium py-3 px-4 cursor-pointer hover:text-primary/80 select-none" onClick={() => handleSort("volume")} data-testid="sort-volume">{t("volume")}<SortIcon col="volume" /></th>
                    <th className="text-right text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium py-3 px-4 hidden md:table-cell cursor-pointer hover:text-primary/80 select-none" onClick={() => handleSort("marketCap")} data-testid="sort-mktcap">{t("mktCap")}<SortIcon col="marketCap" /></th>
                    <th className="text-left text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium py-3 px-6">{t("signal")}</th>
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
