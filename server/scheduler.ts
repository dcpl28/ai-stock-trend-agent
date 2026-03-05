import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import YahooFinance from "yahoo-finance2";
import { storage } from "./storage";
import { buildAnalysisEmailHtml, type StockAnalysis } from "./email";
import { readFileSync } from "fs";
import { join } from "path";

const yahooFinance = new YahooFinance();

const KLSE_NAME_TO_CODE: Record<string, string> = (() => {
  try {
    const raw = readFileSync(
      join(__dirname, "..", "server", "klse-stocks.json"),
      "utf8",
    );
    return JSON.parse(raw);
  } catch {
    try {
      const raw = readFileSync(
        join(process.cwd(), "server", "klse-stocks.json"),
        "utf8",
      );
      return JSON.parse(raw);
    } catch {
      console.warn("[SCHEDULER] Could not load klse-stocks.json");
      return {};
    }
  }
})();

const replitOpenai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

function getAIProvider(): { type: "openai" | "anthropic" | "replit" } {
  const provider = (process.env.AI_PROVIDER || "replit").toLowerCase();
  if (provider === "openai" && process.env.OPENAI_API_KEY)
    return { type: "openai" };
  if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY)
    return { type: "anthropic" };
  return { type: "replit" };
}

async function resolveYahooSymbol(symbol: string): Promise<string> {
  if (symbol.startsWith("KLSE:") || symbol.startsWith("MYX:")) {
    const ticker = symbol.replace("KLSE:", "").replace("MYX:", "").toUpperCase();
    if (/^\d+$/.test(ticker)) return `${ticker}.KL`;

    const localCode = KLSE_NAME_TO_CODE[ticker];
    if (localCode) return localCode;

    const directSymbol = `${ticker}.KL`;
    try {
      const q: any = await yahooFinance.quote(directSymbol, {}, { validateResult: false });
      if (q && q.symbol && q.regularMarketPrice)
        return directSymbol;
    } catch {}

    const searchQueries = [ticker, `${ticker} Berhad`, `${ticker} Malaysia`];
    for (const query of searchQueries) {
      try {
        const searchResult: any = await yahooFinance.search(query, {}, { validateResult: false });
        const klseMatch = searchResult?.quotes?.find(
          (q: any) => q.symbol?.endsWith(".KL") && q.quoteType === "EQUITY",
        );
        if (klseMatch) return klseMatch.symbol;
      } catch {}
    }

    return directSymbol;
  } else if (symbol.includes(":")) {
    const exchange = symbol.split(":")[0].toUpperCase();
    const ticker = symbol.split(":")[1];
    if (exchange === "NASDAQ" || exchange === "NYSE") return ticker;
    return ticker;
  }

  const upperSymbol = symbol.toUpperCase();
  const klseCode = KLSE_NAME_TO_CODE[upperSymbol];
  if (klseCode) return klseCode;

  return symbol;
}

function calcSMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function calcEMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
}

function calcRSI(data: number[], period: number = 14): number | null {
  if (data.length < period + 1) return null;
  let gains = 0,
    losses = 0;
  for (let i = data.length - period; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calcMACD(data: number[]): number | null {
  const ema12 = calcEMA(data, 12);
  const ema26 = calcEMA(data, 26);
  if (ema12 === null || ema26 === null) return null;
  return ema12 - ema26;
}

async function analyzeStock(
  symbol: string,
): Promise<StockAnalysis | null> {
  try {
    const yahooSymbol = await resolveYahooSymbol(symbol);
    console.log(`[SCHEDULER] Analyzing ${symbol} (${yahooSymbol})...`);

    const quote: any = await yahooFinance.quote(yahooSymbol, {}, { validateResult: false });
    if (!quote) {
      console.log(`[SCHEDULER] No quote data for ${symbol}`);
      return null;
    }

    const chartResult: any = await yahooFinance.chart(yahooSymbol, {
      period1: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      period2: new Date().toISOString().split("T")[0],
      interval: "1d",
    }, { validateResult: false });

    const rawQuotes = chartResult?.quotes || [];
    const candles = rawQuotes
      .filter(
        (q: any) =>
          q.open != null &&
          q.high != null &&
          q.low != null &&
          q.close != null &&
          q.close > 0,
      )
      .map((q: any) => ({
        time: q.date
          ? new Date(q.date).toISOString().split("T")[0]
          : "",
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume || 0,
      }));

    if (candles.length < 5) {
      console.log(`[SCHEDULER] Not enough data for ${symbol}: ${candles.length} candles`);
      return null;
    }

    const recentCandles = candles.slice(-120);
    const closes = recentCandles.map((c: any) => c.close);
    const volumes = recentCandles.map((c: any) => c.volume);
    const highs = recentCandles.map((c: any) => c.high);
    const lows = recentCandles.map((c: any) => c.low);

    const sma5 = calcSMA(closes, 5);
    const sma10 = calcSMA(closes, 10);
    const sma20 = calcSMA(closes, 20);
    const sma50 = calcSMA(closes, 50);
    const sma100 = calcSMA(closes, 100);
    const ema12 = calcEMA(closes, 12);
    const ema26 = calcEMA(closes, 26);
    const rsi14 = calcRSI(closes, 14);
    const macdValue = calcMACD(closes);

    const avgVol20 = calcSMA(volumes, 20);
    const currentVol = volumes[volumes.length - 1];
    const volRatio = avgVol20 ? currentVol / avgVol20 : null;

    const high20 = Math.max(...highs.slice(-20));
    const low20 = Math.min(...lows.slice(-20));
    const high52 = Math.max(...highs);
    const low52 = Math.min(...lows);
    const currentPrice = closes[closes.length - 1];
    const priceRange52Pct =
      high52 !== low52
        ? ((currentPrice - low52) / (high52 - low52)) * 100
        : 50;

    const returns5d =
      closes.length >= 6
        ? (closes[closes.length - 1] / closes[closes.length - 6] - 1) * 100
        : null;
    const returns20d =
      closes.length >= 21
        ? (closes[closes.length - 1] / closes[closes.length - 21] - 1) * 100
        : null;

    const technicalSummary = `
PRE-COMPUTED TECHNICAL INDICATORS (server-side calculated, use these for accurate analysis):
Moving Averages:
  SMA(5): ${sma5?.toFixed(4) ?? "N/A"}
  SMA(10): ${sma10?.toFixed(4) ?? "N/A"}
  SMA(20): ${sma20?.toFixed(4) ?? "N/A"}
  SMA(50): ${sma50?.toFixed(4) ?? "N/A"}
  SMA(100): ${sma100?.toFixed(4) ?? "N/A"}
  EMA(12): ${ema12?.toFixed(4) ?? "N/A"}
  EMA(26): ${ema26?.toFixed(4) ?? "N/A"}
Momentum:
  RSI(14): ${rsi14?.toFixed(2) ?? "N/A"}
  MACD (12,26): ${macdValue?.toFixed(4) ?? "N/A"}
Volume:
  Current Volume: ${currentVol}
  20-Day Avg Volume: ${avgVol20?.toFixed(0) ?? "N/A"}
  Volume Ratio (current/avg): ${volRatio?.toFixed(2) ?? "N/A"}x
Price Levels:
  20-Day High: ${high20}
  20-Day Low: ${low20}
  52-Week Range Position: ${priceRange52Pct.toFixed(1)}% (0%=at low, 100%=at high)
Performance:
  5-Day Return: ${returns5d?.toFixed(2) ?? "N/A"}%
  20-Day Return: ${returns20d?.toFixed(2) ?? "N/A"}%
MA Alignment: Price ${currentPrice > (sma20 ?? 0) ? "ABOVE" : "BELOW"} SMA20, ${currentPrice > (sma50 ?? 0) ? "ABOVE" : "BELOW"} SMA50
`;

    const priceData = recentCandles
      .slice(-30)
      .map(
        (c: any) =>
          `${c.time}: O=${c.open} H=${c.high} L=${c.low} C=${c.close} V=${c.volume}`,
      )
      .join("\n");

    const companyName = quote.shortName || quote.longName || symbol;
    const currency = quote.currency || quote.financialCurrency || "MYR";

    const prompt = `You are an expert stock market technical analyst. Analyze ${symbol} (${companyName}) and provide a BRIEF analysis suitable for a daily email digest.

Current Price: ${quote.regularMarketPrice} ${currency}
Change: ${quote.regularMarketChange?.toFixed(2)} (${quote.regularMarketChangePercent?.toFixed(2)}%)
Volume: ${quote.regularMarketVolume}
Market Cap: ${quote.marketCap}

${technicalSummary}

Recent OHLCV Data (last 30 trading days):
${priceData}

CONVICTION SCORE: Calculate 0-100 based on signal alignment. 75-100=Strong, 50-74=Moderate, <50=Weak.

Respond in this JSON format ONLY:
{
  "trend": "bullish" or "bearish" or "neutral",
  "confidence": <number 0-100>,
  "sentiment": "<1-2 sentence market sentiment>",
  "recommendation": "<brief actionable recommendation>",
  "indicators": {
    "rsi": { "value": <RSI value>, "signal": "<Overbought/Oversold/Neutral>" },
    "macd": { "value": "<MACD value>", "signal": "<Strong/Weak/Neutral>" },
    "support": <support level>,
    "resistance": <resistance level>,
    "ma20": <SMA20 value>,
    "ma50": <SMA50 value>
  }
}

Return ONLY valid JSON, no markdown.`;

    let content = "";
    const aiConfig = getAIProvider();

    if (aiConfig.type === "anthropic") {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY!,
      });
      const response = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
        max_tokens: 1000,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      });
      content =
        response.content[0].type === "text" ? response.content[0].text : "{}";
    } else if (aiConfig.type === "openai") {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
      const response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-5.2",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 1000,
        temperature: 0.3,
      });
      content = response.choices[0]?.message?.content || "{}";
    } else {
      const response = await replitOpenai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-5.2",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 1000,
        temperature: 0.3,
      });
      content = response.choices[0]?.message?.content || "{}";
    }

    const cleaned = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const analysis = JSON.parse(cleaned);

    return {
      symbol,
      displayName: companyName,
      price: quote.regularMarketPrice || currentPrice,
      currency,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      trend: analysis.trend || "neutral",
      confidence: analysis.confidence || 50,
      sentiment: analysis.sentiment || "Analysis unavailable.",
      recommendation: analysis.recommendation || "No recommendation available.",
      indicators: {
        rsi: analysis.indicators?.rsi || { value: rsi14 || 50, signal: "Neutral" },
        macd: analysis.indicators?.macd || {
          value: macdValue?.toFixed(4) || "0",
          signal: "Neutral",
        },
        support: analysis.indicators?.support || low20,
        resistance: analysis.indicators?.resistance || high20,
        ma20: analysis.indicators?.ma20 || sma20 || 0,
        ma50: analysis.indicators?.ma50 || sma50 || 0,
      },
    };
  } catch (err) {
    console.error(`[SCHEDULER] Error analyzing ${symbol}:`, err);
    return null;
  }
}

let gmailSendFn: ((to: string, subject: string, htmlBody: string) => Promise<boolean>) | null = null;

export function setGmailSendFunction(
  fn: (to: string, subject: string, htmlBody: string) => Promise<boolean>,
) {
  gmailSendFn = fn;
  console.log("[SCHEDULER] Gmail send function registered");
}

async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
): Promise<boolean> {
  if (!gmailSendFn) {
    console.log("[SCHEDULER] Gmail not configured, email not sent to:", to);
    return false;
  }
  return gmailSendFn(to, subject, htmlBody);
}

export async function runDailyAnalysis(): Promise<{
  success: boolean;
  usersProcessed: number;
  errors: string[];
}> {
  console.log("[SCHEDULER] Starting daily analysis run...");
  const errors: string[] = [];
  let usersProcessed = 0;

  try {
    const usersWithFavourites = await storage.getAllUsersWithFavourites();
    console.log(
      `[SCHEDULER] Found ${usersWithFavourites.length} user(s) with favourite stocks`,
    );

    if (usersWithFavourites.length === 0) {
      console.log("[SCHEDULER] No users with favourites, skipping.");
      return { success: true, usersProcessed: 0, errors: [] };
    }

    for (const { user, favourites } of usersWithFavourites) {
      try {
        console.log(
          `[SCHEDULER] Processing ${user.email} with ${favourites.length} favourite(s)`,
        );

        const analyses: StockAnalysis[] = [];
        for (const fav of favourites) {
          const analysis = await analyzeStock(fav.symbol);
          if (analysis) {
            analysis.displayName = fav.displayName || analysis.displayName;
            analyses.push(analysis);
          }
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        if (analyses.length === 0) {
          console.log(
            `[SCHEDULER] No valid analyses for ${user.email}, skipping email`,
          );
          await storage.logEmail(
            user.email,
            "Daily AI Stock Analysis",
            favourites.map((f) => f.symbol).join(", "),
            "skipped",
            "No valid analyses produced",
          );
          continue;
        }

        const userName = user.email.split("@")[0];
        const htmlBody = buildAnalysisEmailHtml(analyses, userName);
        const subject = `Daily AI Stock Trend Analysis`;

        const sent = await sendEmail(user.email, subject, htmlBody);

        await storage.logEmail(
          user.email,
          subject,
          analyses.map((a) => a.symbol).join(", "),
          sent ? "sent" : "gmail_not_configured",
          sent ? undefined : "Gmail integration not connected",
        );

        usersProcessed++;
        console.log(
          `[SCHEDULER] ${sent ? "Sent" : "Skipped (no Gmail)"} email to ${user.email} with ${analyses.length} analyses`,
        );
      } catch (err: any) {
        const errMsg = `Error processing ${user.email}: ${err.message}`;
        console.error(`[SCHEDULER] ${errMsg}`);
        errors.push(errMsg);
        await storage.logEmail(
          user.email,
          "Daily AI Stock Analysis",
          favourites.map((f) => f.symbol).join(", "),
          "error",
          err.message,
        );
      }
    }
  } catch (err: any) {
    console.error("[SCHEDULER] Fatal error:", err);
    errors.push(`Fatal: ${err.message}`);
  }

  console.log(
    `[SCHEDULER] Daily analysis complete. Processed: ${usersProcessed}, Errors: ${errors.length}`,
  );
  return { success: errors.length === 0, usersProcessed, errors };
}

async function expireSubscriptions() {
  try {
    const expired = await storage.getExpiredSubscriptions();
    if (expired.length === 0) {
      console.log("[SCHEDULER] No expired subscriptions found");
      return;
    }
    for (const user of expired) {
      console.log(`[SCHEDULER] Expiring subscription for ${user.email} (plan: ${user.subscriptionPlan}, expired: ${user.subscriptionExpiresAt})`);
      await storage.updateSubscription(user.id, {
        subscriptionStatus: "expired",
      });
    }
    console.log(`[SCHEDULER] Expired ${expired.length} subscription(s)`);
  } catch (err: any) {
    console.error("[SCHEDULER] Error checking expired subscriptions:", err);
  }
}

let schedulerInterval: NodeJS.Timeout | null = null;
let lastRunDate: string | null = null;

export function startScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  console.log("[SCHEDULER] Scheduler started. Daily run at 10:00 UTC (6pm GMT+8)");

  const checkAndRun = () => {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();
    const todayStr = now.toISOString().split("T")[0];

    if (utcHour === 10 && utcMinute === 0 && lastRunDate !== todayStr) {
      lastRunDate = todayStr;
      console.log("[SCHEDULER] Checking for expired subscriptions...");
      expireSubscriptions().catch((err) =>
        console.error("[SCHEDULER] Expiry check error:", err),
      );
      console.log("[SCHEDULER] Triggering daily analysis at 10:00 UTC");
      runDailyAnalysis().catch((err) =>
        console.error("[SCHEDULER] Unhandled error:", err),
      );
    }
  };

  schedulerInterval = setInterval(checkAndRun, 60 * 1000);
  console.log("[SCHEDULER] Checking every minute for 10:00 UTC trigger");
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[SCHEDULER] Scheduler stopped");
  }
}
