import React, { useRef, useState, useCallback } from "react";
import html2canvas from "html2canvas";
import { QRCodeSVG } from "qrcode.react";
import { Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

interface AnalysisData {
  trend: "bullish" | "bearish" | "neutral";
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

interface ShareAnalysisProps {
  symbol: string;
  currentPrice: number;
  analysis: AnalysisData;
  currency: string;
}

const SIGNUP_URL = "https://m.global.mplusonline.com/kh/status/entry/transit?_scnl=UBZQ";
const INVITATION_CODE = "UBZQ";

export function ShareAnalysisButton({ symbol, currentPrice, analysis, currency }: ShareAnalysisProps) {
  const { t } = useI18n();
  const captureRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const handleShare = useCallback(async () => {
    if (!captureRef.current) return;
    setGenerating(true);

    try {
      await document.fonts.ready;

      captureRef.current.style.display = "block";
      await new Promise(r => setTimeout(r, 150));

      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: "#0a0e1a",
        scale: 2,
        useCORS: true,
        logging: false,
        width: 600,
        windowWidth: 600,
      });

      captureRef.current.style.display = "none";

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const fileName = `${symbol}_analysis_${new Date().toISOString().split("T")[0]}.png`;

        if (navigator.share && navigator.canShare?.({ files: [new File([blob], fileName, { type: "image/png" })] })) {
          try {
            await navigator.share({
              files: [new File([blob], fileName, { type: "image/png" })],
              title: `${symbol} - ${t("shareImageTitle")}`,
            });
          } catch (e: any) {
            if (e.name !== "AbortError") {
              downloadBlob(blob, fileName);
            }
          }
        } else {
          downloadBlob(blob, fileName);
        }
        setGenerating(false);
      }, "image/png");
    } catch (err) {
      console.error("Share failed:", err);
      setGenerating(false);
      if (captureRef.current) captureRef.current.style.display = "none";
    }
  }, [symbol, t]);

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const trendColor = analysis.trend === "bullish" ? "#22c55e" : analysis.trend === "bearish" ? "#ef4444" : "#eab308";
  const trendLabel = analysis.trend === "bullish" ? t("bullish") : analysis.trend === "bearish" ? t("bearish") : t("neutral");
  const dateStr = new Date().toLocaleDateString("en-MY", { year: "numeric", month: "short", day: "numeric" });

  const supportLabel = t("support");
  const resistanceLabel = t("resistance");
  const aboveLabel = t("above");
  const belowLabel = t("below");
  const levelLabel = t("level");
  const trendIndicatorLabel = t("trendLabel");

  return (
    <>
      <Button
        onClick={handleShare}
        disabled={generating}
        variant="outline"
        size="sm"
        className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
        data-testid="button-share-analysis"
      >
        {generating ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-xs">{t("shareGenerating")}</span>
          </>
        ) : (
          <>
            <Share2 className="w-3.5 h-3.5" />
            <span className="text-xs">{t("shareAnalysis")}</span>
          </>
        )}
      </Button>

      <div
        ref={captureRef}
        style={{
          display: "none",
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          width: "600px",
          fontFamily: "'Montserrat', 'Segoe UI', sans-serif",
          zIndex: -1,
        }}
      >
        <div style={{
          background: "linear-gradient(180deg, #0a0e1a 0%, #0f1525 50%, #0a0e1a 100%)",
          padding: "32px",
          color: "#e2e8f0",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <div>
              <div style={{ fontSize: "10px", color: "#eab308", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "4px" }}>
                M+ GLOBAL PRO TERMINAL
              </div>
              <div style={{ fontSize: "28px", fontWeight: "700", color: "#ffffff", letterSpacing: "1px" }}>
                {symbol}
              </div>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                {dateStr}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "4px" }}>
                {t("shareImageTitle")}
              </div>
              <div style={{
                fontSize: "14px",
                fontWeight: "700",
                color: trendColor,
                padding: "4px 16px",
                border: `1px solid ${trendColor}`,
                borderRadius: "4px",
                display: "inline-block",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}>
                {trendLabel}
              </div>
            </div>
          </div>

          <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, #eab308, transparent)", marginBottom: "20px" }} />

          <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>{t("sharePrice")}</div>
              <div style={{ fontSize: "20px", fontWeight: "600", color: "#ffffff" }}>{currency} {currentPrice.toFixed(2)}</div>
            </div>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>{t("shareConfidence")}</div>
              <div style={{ fontSize: "20px", fontWeight: "600", color: "#eab308" }}>{analysis.confidence}%</div>
            </div>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>RSI</div>
              <div style={{ fontSize: "20px", fontWeight: "600", color: "#ffffff" }}>{analysis.indicators.rsi.value.toFixed(1)}</div>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
            <div style={{ fontSize: "10px", color: "#eab308", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px" }}>{t("shareTechIndicators")}</div>
            {[
              { label: "MACD", value: analysis.indicators.macd.value, signal: analysis.indicators.macd.signal },
              { label: trendIndicatorLabel, value: analysis.indicators.trend.value, signal: analysis.indicators.trend.signal },
              { label: supportLabel, value: `${currency} ${analysis.indicators.support.toFixed(2)}`, signal: levelLabel },
              { label: resistanceLabel, value: `${currency} ${analysis.indicators.resistance.toFixed(2)}`, signal: levelLabel },
              { label: "MA(20)", value: `${currency} ${analysis.indicators.ma20.toFixed(2)}`, signal: currentPrice > analysis.indicators.ma20 ? aboveLabel : belowLabel },
              { label: "MA(50)", value: `${currency} ${analysis.indicators.ma50.toFixed(2)}`, signal: currentPrice > analysis.indicators.ma50 ? aboveLabel : belowLabel },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>{item.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "12px", color: "#e2e8f0", fontFamily: "monospace" }}>{item.value}</span>
                  <span style={{
                    fontSize: "9px",
                    padding: "2px 8px",
                    borderRadius: "3px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: ["Strong", "Above", aboveLabel].includes(item.signal) ? "#22c55e" : ["Weak", "Below", "Overbought", "Oversold", belowLabel].includes(item.signal) ? "#ef4444" : "#94a3b8",
                  }}>{item.signal}</span>
                </div>
              </div>
            ))}
          </div>

          {analysis.sentiment && (
            <div style={{ background: "rgba(234,179,8,0.05)", border: "1px solid rgba(234,179,8,0.15)", borderRadius: "8px", padding: "14px", marginBottom: "16px" }}>
              <div style={{ fontSize: "10px", color: "#eab308", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "6px" }}>{t("shareMarketSentiment")}</div>
              <div style={{ fontSize: "12px", color: "#e2e8f0", lineHeight: "1.6" }}>{analysis.sentiment}</div>
            </div>
          )}

          {analysis.recommendation && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "14px", marginBottom: "20px" }}>
              <div style={{ fontSize: "10px", color: "#eab308", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "6px" }}>{t("shareRecommendation")}</div>
              <div style={{ fontSize: "12px", color: "#e2e8f0", lineHeight: "1.6" }}>{analysis.recommendation}</div>
            </div>
          )}

          <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, #eab308, transparent)", marginBottom: "20px" }} />

          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, rgba(234,179,8,0.08) 0%, rgba(234,179,8,0.02) 100%)",
            border: "1px solid rgba(234,179,8,0.2)",
            borderRadius: "12px",
            padding: "20px",
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px" }}>
                {t("shareInvitationCode")}
              </div>
              <div style={{
                fontSize: "36px",
                fontWeight: "800",
                color: "#eab308",
                letterSpacing: "8px",
                textShadow: "0 0 20px rgba(234,179,8,0.3)",
                marginBottom: "8px",
              }}>
                {INVITATION_CODE}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: "1.5" }}>
                {t("shareScanToSignUp")} →
              </div>
            </div>
            <div style={{
              background: "#ffffff",
              padding: "10px",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
            }}>
              <QRCodeSVG
                value={SIGNUP_URL}
                size={100}
                level="M"
                bgColor="#ffffff"
                fgColor="#0a0e1a"
              />
              <div style={{ fontSize: "7px", color: "#0a0e1a", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>
                {t("shareScanToSignUp")}
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "16px", fontSize: "9px", color: "#64748b", letterSpacing: "2px", textTransform: "uppercase" }}>
            {t("sharePoweredBy")} • ai.dexterchia.com
          </div>

          <div style={{ textAlign: "center", marginTop: "6px", fontSize: "8px", color: "#475569", fontStyle: "italic" }}>
            {t("aiDisclaimer")}
          </div>
        </div>
      </div>
    </>
  );
}
