import React, { useRef, useState, useCallback, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
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
  const qrRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const getQRDataURL = useCallback((): string | null => {
    if (!qrRef.current) return null;
    const canvas = qrRef.current.querySelector("canvas");
    if (!canvas) return null;
    return canvas.toDataURL("image/png");
  }, []);

  const handleShare = useCallback(async () => {
    setGenerating(true);

    try {
      const W = 600;
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = W * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(scale, scale);

      const trendColor = analysis.trend === "bullish" ? "#22c55e" : analysis.trend === "bearish" ? "#ef4444" : "#eab308";
      const trendLabel = analysis.trend === "bullish" ? t("bullish") : analysis.trend === "bearish" ? t("bearish") : t("neutral");
      const dateStr = new Date().toLocaleDateString("en-MY", { year: "numeric", month: "short", day: "numeric" });
      const supportLabel = t("support");
      const resistanceLabel = t("resistance");
      const aboveLabel = t("above");
      const belowLabel = t("below");
      const levelLabel = t("level");
      const trendIndicatorLabel = t("trendLabel");

      let y = 0;
      const pad = 32;

      const drawText = (text: string, x: number, ty: number, font: string, color: string, align: CanvasTextAlign = "left", maxWidth?: number) => {
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        if (maxWidth) {
          ctx.fillText(text, x, ty, maxWidth);
        } else {
          ctx.fillText(text, x, ty);
        }
      };

      const drawRoundedRect = (x: number, ry: number, w: number, h: number, r: number, fillColor: string, strokeColor?: string) => {
        ctx.beginPath();
        ctx.roundRect(x, ry, w, h, r);
        if (fillColor) {
          ctx.fillStyle = fillColor;
          ctx.fill();
        }
        if (strokeColor) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      };

      const wrapText = (text: string, x: number, startY: number, maxW: number, lineHeight: number, font: string, color: string): number => {
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.textAlign = "left";
        const words = text.split(" ");
        let line = "";
        let cy = startY;
        for (const word of words) {
          const test = line + word + " ";
          if (ctx.measureText(test).width > maxW && line) {
            ctx.fillText(line.trim(), x, cy);
            line = word + " ";
            cy += lineHeight;
          } else {
            line = test;
          }
        }
        if (line.trim()) {
          ctx.fillText(line.trim(), x, cy);
          cy += lineHeight;
        }
        return cy;
      };

      const estimateHeight = () => {
        let h = pad;
        h += 70;
        h += 10;
        h += 80;
        h += 20;

        const indicatorCount = 6;
        h += 40 + indicatorCount * 28 + 16;

        if (analysis.sentiment) {
          ctx.font = "12px sans-serif";
          const sentWords = analysis.sentiment.split(" ");
          let lines = 1;
          let line = "";
          for (const w of sentWords) {
            if (ctx.measureText(line + w + " ").width > W - pad * 2 - 28) {
              lines++;
              line = w + " ";
            } else {
              line += w + " ";
            }
          }
          h += 40 + lines * 18 + 14;
        }

        if (analysis.recommendation) {
          ctx.font = "12px sans-serif";
          const recWords = analysis.recommendation.split(" ");
          let lines = 1;
          let line = "";
          for (const w of recWords) {
            if (ctx.measureText(line + w + " ").width > W - pad * 2 - 28) {
              lines++;
              line = w + " ";
            } else {
              line += w + " ";
            }
          }
          h += 40 + lines * 18 + 14;
        }

        h += 10;
        h += 140;
        h += 50;
        return h;
      };

      const totalH = estimateHeight();
      canvas.height = totalH * scale;

      ctx.scale(scale, scale);

      const grad = ctx.createLinearGradient(0, 0, 0, totalH);
      grad.addColorStop(0, "#0a0e1a");
      grad.addColorStop(0.5, "#0f1525");
      grad.addColorStop(1, "#0a0e1a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, totalH);

      y = pad;

      drawText("M+ GLOBAL PRO TERMINAL", pad, y + 10, "600 10px sans-serif", "#eab308", "left");
      drawText(symbol, pad, y + 42, "700 28px sans-serif", "#ffffff", "left");
      drawText(dateStr, pad, y + 58, "12px sans-serif", "#94a3b8", "left");

      drawText(t("shareImageTitle"), W - pad, y + 10, "10px sans-serif", "#94a3b8", "right");

      const trendW = ctx.measureText(trendLabel.toUpperCase()).width + 32;
      const trendX = W - pad - trendW;
      drawRoundedRect(trendX, y + 20, trendW, 28, 4, "transparent", trendColor);
      drawText(trendLabel.toUpperCase(), trendX + trendW / 2, y + 39, "700 14px sans-serif", trendColor, "center");

      y += 70;

      const lineGrad = ctx.createLinearGradient(0, 0, W, 0);
      lineGrad.addColorStop(0, "transparent");
      lineGrad.addColorStop(0.5, "#eab308");
      lineGrad.addColorStop(1, "transparent");
      ctx.fillStyle = lineGrad;
      ctx.fillRect(0, y, W, 1);
      y += 10;

      const boxW = (W - pad * 2 - 32) / 3;
      const boxes = [
        { label: t("sharePrice"), value: `${currency} ${currentPrice.toFixed(2)}`, color: "#ffffff" },
        { label: t("shareConfidence"), value: `${analysis.confidence}%`, color: "#eab308" },
        { label: "RSI", value: analysis.indicators.rsi.value.toFixed(1), color: "#ffffff" },
      ];
      boxes.forEach((box, i) => {
        const bx = pad + i * (boxW + 16);
        drawRoundedRect(bx, y, boxW, 65, 8, "rgba(255,255,255,0.03)", "rgba(255,255,255,0.06)");
        drawText(box.label, bx + boxW / 2, y + 20, "10px sans-serif", "#94a3b8", "center");
        drawText(box.value, bx + boxW / 2, y + 48, "600 20px sans-serif", box.color, "center");
      });
      y += 80;

      const indicators = [
        { label: "MACD", value: analysis.indicators.macd.value, signal: analysis.indicators.macd.signal },
        { label: trendIndicatorLabel, value: analysis.indicators.trend.value, signal: analysis.indicators.trend.signal },
        { label: supportLabel, value: `${currency} ${analysis.indicators.support.toFixed(2)}`, signal: levelLabel },
        { label: resistanceLabel, value: `${currency} ${analysis.indicators.resistance.toFixed(2)}`, signal: levelLabel },
        { label: "MA(20)", value: `${currency} ${analysis.indicators.ma20.toFixed(2)}`, signal: currentPrice > analysis.indicators.ma20 ? aboveLabel : belowLabel },
        { label: "MA(50)", value: `${currency} ${analysis.indicators.ma50.toFixed(2)}`, signal: currentPrice > analysis.indicators.ma50 ? aboveLabel : belowLabel },
      ];

      drawRoundedRect(pad, y, W - pad * 2, 40 + indicators.length * 28, 8, "rgba(255,255,255,0.03)", "rgba(255,255,255,0.06)");
      drawText(t("shareTechIndicators"), pad + 16, y + 22, "10px sans-serif", "#eab308", "left");
      let iy = y + 40;
      indicators.forEach((item, i) => {
        drawText(item.label, pad + 16, iy + 16, "12px sans-serif", "#94a3b8", "left");
        drawText(item.value, W - pad - 100, iy + 16, "12px monospace", "#e2e8f0", "right");

        const sigColor = ["Strong", "Above", aboveLabel].includes(item.signal) ? "#22c55e" : ["Weak", "Below", "Overbought", "Oversold", belowLabel].includes(item.signal) ? "#ef4444" : "#94a3b8";
        const sigW = ctx.measureText(item.signal).width + 16;
        drawRoundedRect(W - pad - 16 - sigW, iy + 4, sigW, 20, 3, "transparent", "rgba(255,255,255,0.1)");
        drawText(item.signal, W - pad - 16 - sigW / 2, iy + 17, "9px sans-serif", sigColor, "center");

        if (i < indicators.length - 1) {
          ctx.fillStyle = "rgba(255,255,255,0.04)";
          ctx.fillRect(pad + 16, iy + 26, W - pad * 2 - 32, 1);
        }
        iy += 28;
      });
      y = iy + 16;

      if (analysis.sentiment) {
        drawRoundedRect(pad, y, W - pad * 2, 10, 8, "rgba(234,179,8,0.05)", "rgba(234,179,8,0.15)");
        drawText(t("shareMarketSentiment"), pad + 14, y + 22, "10px sans-serif", "#eab308", "left");
        const sentY = wrapText(analysis.sentiment, pad + 14, y + 40, W - pad * 2 - 28, 18, "12px sans-serif", "#e2e8f0");
        const sentH = sentY - y + 4;
        ctx.clearRect(pad - 1, y - 1, W - pad * 2 + 2, sentH + 2);

        const bgGrad2 = ctx.createLinearGradient(0, y, 0, y + sentH);
        bgGrad2.addColorStop(0, "#0d1220");
        bgGrad2.addColorStop(1, "#0f1525");
        ctx.fillStyle = bgGrad2;
        ctx.fillRect(pad, y, W - pad * 2, sentH);

        drawRoundedRect(pad, y, W - pad * 2, sentH, 8, "rgba(234,179,8,0.05)", "rgba(234,179,8,0.15)");
        drawText(t("shareMarketSentiment"), pad + 14, y + 22, "10px sans-serif", "#eab308", "left");
        wrapText(analysis.sentiment, pad + 14, y + 40, W - pad * 2 - 28, 18, "12px sans-serif", "#e2e8f0");
        y += sentH + 12;
      }

      if (analysis.recommendation) {
        drawRoundedRect(pad, y, W - pad * 2, 10, 8, "rgba(255,255,255,0.03)", "rgba(255,255,255,0.06)");
        drawText(t("shareRecommendation"), pad + 14, y + 22, "10px sans-serif", "#eab308", "left");
        const recY = wrapText(analysis.recommendation, pad + 14, y + 40, W - pad * 2 - 28, 18, "12px sans-serif", "#e2e8f0");
        const recH = recY - y + 4;
        ctx.clearRect(pad - 1, y - 1, W - pad * 2 + 2, recH + 2);

        const bgGrad3 = ctx.createLinearGradient(0, y, 0, y + recH);
        bgGrad3.addColorStop(0, "#0d1220");
        bgGrad3.addColorStop(1, "#0f1525");
        ctx.fillStyle = bgGrad3;
        ctx.fillRect(pad, y, W - pad * 2, recH);

        drawRoundedRect(pad, y, W - pad * 2, recH, 8, "rgba(255,255,255,0.03)", "rgba(255,255,255,0.06)");
        drawText(t("shareRecommendation"), pad + 14, y + 22, "10px sans-serif", "#eab308", "left");
        wrapText(analysis.recommendation, pad + 14, y + 40, W - pad * 2 - 28, 18, "12px sans-serif", "#e2e8f0");
        y += recH + 12;
      }

      const lineGrad2 = ctx.createLinearGradient(0, 0, W, 0);
      lineGrad2.addColorStop(0, "transparent");
      lineGrad2.addColorStop(0.5, "#eab308");
      lineGrad2.addColorStop(1, "transparent");
      ctx.fillStyle = lineGrad2;
      ctx.fillRect(0, y, W, 1);
      y += 10;

      const promoH = 130;
      drawRoundedRect(pad, y, W - pad * 2, promoH, 12, "rgba(234,179,8,0.06)", "rgba(234,179,8,0.2)");

      drawText(t("shareInvitationCode"), pad + 20, y + 24, "10px sans-serif", "#94a3b8", "left");
      drawText(INVITATION_CODE, pad + 20, y + 68, "800 36px sans-serif", "#eab308", "left");
      ctx.shadowColor = "rgba(234,179,8,0.3)";
      ctx.shadowBlur = 20;
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      drawText(t("shareScanToSignUp") + " →", pad + 20, y + 90, "11px sans-serif", "#94a3b8", "left");

      const qrDataURL = getQRDataURL();
      if (qrDataURL) {
        const qrImg = new Image();
        await new Promise<void>((resolve) => {
          qrImg.onload = () => resolve();
          qrImg.onerror = () => resolve();
          qrImg.src = qrDataURL;
        });

        const qrSize = 90;
        const qrPad = 8;
        const qrBoxX = W - pad - qrSize - qrPad * 2 - 20;
        const qrBoxY = y + 10;
        drawRoundedRect(qrBoxX, qrBoxY, qrSize + qrPad * 2, qrSize + qrPad * 2 + 18, 8, "#ffffff", "");
        ctx.drawImage(qrImg, qrBoxX + qrPad, qrBoxY + qrPad, qrSize, qrSize);
        drawText(t("shareScanToSignUp"), qrBoxX + (qrSize + qrPad * 2) / 2, qrBoxY + qrSize + qrPad * 2 + 10, "600 7px sans-serif", "#0a0e1a", "center");
      }

      y += promoH + 16;

      drawText(t("sharePoweredBy") + " • ai.dexterchia.com", W / 2, y, "9px sans-serif", "#64748b", "center");
      y += 16;

      ctx.font = "italic 8px sans-serif";
      ctx.fillStyle = "#475569";
      ctx.textAlign = "center";
      const disclaimerText = t("aiDisclaimer");
      const disclaimerWords = disclaimerText.split(" ");
      let dLine = "";
      let dY = y;
      for (const word of disclaimerWords) {
        if (ctx.measureText(dLine + word + " ").width > W - pad * 2) {
          ctx.fillText(dLine.trim(), W / 2, dY);
          dLine = word + " ";
          dY += 12;
        } else {
          dLine += word + " ";
        }
      }
      if (dLine.trim()) {
        ctx.fillText(dLine.trim(), W / 2, dY);
        dY += 12;
      }

      const finalH = dY + pad / 2;
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = W * scale;
      finalCanvas.height = finalH * scale;
      const fctx = finalCanvas.getContext("2d")!;
      fctx.drawImage(canvas, 0, 0, W * scale, finalH * scale, 0, 0, W * scale, finalH * scale);

      finalCanvas.toBlob(async (blob) => {
        if (!blob) {
          setGenerating(false);
          return;
        }

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
    }
  }, [symbol, currentPrice, analysis, currency, t, getQRDataURL]);

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

      <div ref={qrRef} style={{ position: "fixed", top: "-9999px", left: "-9999px", opacity: 0, pointerEvents: "none" }}>
        <QRCodeCanvas
          value={SIGNUP_URL}
          size={200}
          level="M"
          bgColor="#ffffff"
          fgColor="#0a0e1a"
        />
      </div>
    </>
  );
}
