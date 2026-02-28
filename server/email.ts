import { storage } from "./storage";

interface StockAnalysis {
  symbol: string;
  displayName: string;
  price: number;
  currency: string;
  change: number;
  changePercent: number;
  trend: string;
  confidence: number;
  sentiment: string;
  recommendation: string;
  indicators: {
    rsi: { value: number; signal: string };
    macd: { value: string; signal: string };
    support: number;
    resistance: number;
    ma20: number;
    ma50: number;
  };
}

export function buildAnalysisEmailHtml(
  analyses: StockAnalysis[],
  userName: string
): string {
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const stockRows = analyses
    .map((a) => {
      const trendColor =
        a.trend === "bullish"
          ? "#22c55e"
          : a.trend === "bearish"
            ? "#ef4444"
            : "#f59e0b";
      const changeColor = a.change >= 0 ? "#22c55e" : "#ef4444";
      const changeSign = a.change >= 0 ? "+" : "";
      const confidenceColor =
        a.confidence >= 75
          ? "#22c55e"
          : a.confidence >= 50
            ? "#f59e0b"
            : "#ef4444";

      return `
      <tr>
        <td style="padding: 24px; border-bottom: 1px solid rgba(212, 175, 55, 0.1);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <h3 style="margin: 0 0 4px 0; color: #D4AF37; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 20px; font-weight: 600;">
                  ${a.symbol}
                </h3>
                <p style="margin: 0 0 12px 0; color: #9ca3af; font-size: 12px; font-family: 'Montserrat', Arial, sans-serif;">
                  ${a.displayName}
                </p>
              </td>
              <td style="text-align: right;">
                <p style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; font-family: 'Montserrat', Arial, sans-serif;">
                  ${a.currency} ${a.price.toFixed(2)}
                </p>
                <p style="margin: 4px 0 0 0; color: ${changeColor}; font-size: 13px; font-family: 'Montserrat', Arial, sans-serif;">
                  ${changeSign}${a.change.toFixed(2)} (${changeSign}${a.changePercent.toFixed(2)}%)
                </p>
              </td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
            <tr>
              <td style="padding: 8px 12px; background: rgba(212, 175, 55, 0.05); border-radius: 6px; width: 33%;">
                <p style="margin: 0; color: #9ca3af; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-family: 'Montserrat', Arial, sans-serif;">Trend</p>
                <p style="margin: 4px 0 0 0; color: ${trendColor}; font-size: 14px; font-weight: 600; text-transform: uppercase; font-family: 'Montserrat', Arial, sans-serif;">
                  ${a.trend}
                </p>
              </td>
              <td style="padding: 8px 12px; background: rgba(212, 175, 55, 0.05); border-radius: 6px; width: 33%;">
                <p style="margin: 0; color: #9ca3af; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-family: 'Montserrat', Arial, sans-serif;">Conviction</p>
                <p style="margin: 4px 0 0 0; color: ${confidenceColor}; font-size: 14px; font-weight: 600; font-family: 'Montserrat', Arial, sans-serif;">
                  ${a.confidence}%
                </p>
              </td>
              <td style="padding: 8px 12px; background: rgba(212, 175, 55, 0.05); border-radius: 6px; width: 33%;">
                <p style="margin: 0; color: #9ca3af; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-family: 'Montserrat', Arial, sans-serif;">RSI</p>
                <p style="margin: 4px 0 0 0; color: #ffffff; font-size: 14px; font-weight: 600; font-family: 'Montserrat', Arial, sans-serif;">
                  ${a.indicators.rsi.value.toFixed(1)} <span style="color: #9ca3af; font-size: 11px;">${a.indicators.rsi.signal}</span>
                </p>
              </td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 8px;">
            <tr>
              <td style="padding: 8px 12px; background: rgba(212, 175, 55, 0.05); border-radius: 6px; width: 25%;">
                <p style="margin: 0; color: #9ca3af; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-family: 'Montserrat', Arial, sans-serif;">Support</p>
                <p style="margin: 4px 0 0 0; color: #22c55e; font-size: 13px; font-weight: 500; font-family: 'Montserrat', Arial, sans-serif;">${a.indicators.support.toFixed(2)}</p>
              </td>
              <td style="padding: 8px 12px; background: rgba(212, 175, 55, 0.05); border-radius: 6px; width: 25%;">
                <p style="margin: 0; color: #9ca3af; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-family: 'Montserrat', Arial, sans-serif;">Resistance</p>
                <p style="margin: 4px 0 0 0; color: #ef4444; font-size: 13px; font-weight: 500; font-family: 'Montserrat', Arial, sans-serif;">${a.indicators.resistance.toFixed(2)}</p>
              </td>
              <td style="padding: 8px 12px; background: rgba(212, 175, 55, 0.05); border-radius: 6px; width: 25%;">
                <p style="margin: 0; color: #9ca3af; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-family: 'Montserrat', Arial, sans-serif;">MA20</p>
                <p style="margin: 4px 0 0 0; color: #3b82f6; font-size: 13px; font-weight: 500; font-family: 'Montserrat', Arial, sans-serif;">${a.indicators.ma20.toFixed(2)}</p>
              </td>
              <td style="padding: 8px 12px; background: rgba(212, 175, 55, 0.05); border-radius: 6px; width: 25%;">
                <p style="margin: 0; color: #9ca3af; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-family: 'Montserrat', Arial, sans-serif;">MA50</p>
                <p style="margin: 4px 0 0 0; color: #f59e0b; font-size: 13px; font-weight: 500; font-family: 'Montserrat', Arial, sans-serif;">${a.indicators.ma50.toFixed(2)}</p>
              </td>
            </tr>
          </table>

          <div style="margin-top: 12px; padding: 10px 14px; background: rgba(212, 175, 55, 0.05); border-left: 3px solid #D4AF37; border-radius: 0 6px 6px 0;">
            <p style="margin: 0 0 4px 0; color: #9ca3af; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-family: 'Montserrat', Arial, sans-serif;">Market Sentiment</p>
            <p style="margin: 0; color: #e5e7eb; font-size: 13px; line-height: 1.5; font-family: 'Montserrat', Arial, sans-serif;">${a.sentiment}</p>
          </div>

          <div style="margin-top: 8px; padding: 10px 14px; background: rgba(59, 130, 246, 0.05); border-left: 3px solid #3b82f6; border-radius: 0 6px 6px 0;">
            <p style="margin: 0 0 4px 0; color: #9ca3af; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-family: 'Montserrat', Arial, sans-serif;">AI Recommendation</p>
            <p style="margin: 0; color: #e5e7eb; font-size: 13px; line-height: 1.5; font-family: 'Montserrat', Arial, sans-serif;">${a.recommendation}</p>
          </div>
        </td>
      </tr>`;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0e1a; font-family: 'Montserrat', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0e1a; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td style="padding: 32px 24px; text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
              <p style="margin: 0 0 4px 0; color: #D4AF37; font-size: 10px; text-transform: uppercase; letter-spacing: 3px; font-family: 'Montserrat', Arial, sans-serif;">
                M+ Global Pro Terminal
              </p>
              <h1 style="margin: 8px 0; color: #ffffff; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; font-weight: 500;">
                Daily AI Stock Analysis
              </h1>
              <p style="margin: 0; color: #9ca3af; font-size: 13px; font-family: 'Montserrat', Arial, sans-serif;">
                ${date}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 16px 24px;">
              <p style="margin: 0; color: #e5e7eb; font-size: 14px; line-height: 1.6; font-family: 'Montserrat', Arial, sans-serif;">
                Hello ${userName},
              </p>
              <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 13px; line-height: 1.6; font-family: 'Montserrat', Arial, sans-serif;">
                Here is your daily AI analysis for your ${analyses.length} favourite stock${analyses.length > 1 ? "s" : ""} after today's market close.
              </p>
            </td>
          </tr>

          ${stockRows}

          <tr>
            <td style="padding: 24px; text-align: center; border-top: 1px solid rgba(212, 175, 55, 0.1);">
              <p style="margin: 0 0 8px 0; color: #D4AF37; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 2px; font-family: 'Montserrat', Arial, sans-serif;">
                Powered by AI
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 11px; line-height: 1.6; font-family: 'Montserrat', Arial, sans-serif;">
                This analysis is AI-generated and does not constitute financial advice. For professional guidance, please contact Dexter Chia.
              </p>
              <p style="margin: 12px 0 0 0; color: #4b5563; font-size: 10px; font-family: 'Montserrat', Arial, sans-serif;">
                M+ Global Pro Terminal &bull; ai.dexterchia.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export type { StockAnalysis };
