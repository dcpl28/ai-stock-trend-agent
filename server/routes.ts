import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

const replitOpenai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

function getAIProvider(): { type: "openai" | "anthropic" | "replit"; } {
  const provider = (process.env.AI_PROVIDER || "replit").toLowerCase();
  if (provider === "openai" && process.env.OPENAI_API_KEY) return { type: "openai" };
  if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) return { type: "anthropic" };
  return { type: "replit" };
}

async function resolveYahooSymbol(symbol: string): Promise<string> {
  if (symbol.startsWith("KLSE:") || symbol.startsWith("MYX:")) {
    const ticker = symbol.replace("KLSE:", "").replace("MYX:", "");
    const directSymbol = `${ticker}.KL`;
    try {
      const searchResult: any = await yahooFinance.search(ticker);
      const klseMatch = searchResult.quotes?.find((q: any) =>
        q.symbol?.endsWith(".KL") && q.quoteType === "EQUITY"
      );
      if (klseMatch) return klseMatch.symbol;
    } catch {}
    return directSymbol;
  } else if (symbol.includes(":")) {
    const exchange = symbol.split(":")[0].toUpperCase();
    const ticker = symbol.split(":")[1];
    if (exchange === "NASDAQ" || exchange === "NYSE") return ticker;
    return ticker;
  }
  return symbol;
}

function getStartDate(range: string): Date {
  const now = new Date();
  switch (range) {
    case "1mo": now.setMonth(now.getMonth() - 1); break;
    case "3mo": now.setMonth(now.getMonth() - 3); break;
    case "6mo": now.setMonth(now.getMonth() - 6); break;
    case "1y": now.setFullYear(now.getFullYear() - 1); break;
    case "2y": now.setFullYear(now.getFullYear() - 2); break;
    case "5y": now.setFullYear(now.getFullYear() - 5); break;
    default: now.setMonth(now.getMonth() - 6);
  }
  return now;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/search/:query", async (req, res) => {
    try {
      const { query } = req.params;
      const result: any = await yahooFinance.search(query);
      const quotes = (result.quotes || [])
        .filter((q: any) => q.quoteType === "EQUITY")
        .slice(0, 10)
        .map((q: any) => ({
          symbol: q.symbol,
          name: q.shortname || q.longname || q.symbol,
          exchange: q.exchange,
          type: q.quoteType,
        }));
      res.json(quotes);
    } catch (error: any) {
      console.error("Search error:", error.message);
      res.status(500).json({ error: "Failed to search", details: error.message });
    }
  });

  app.get("/api/stock/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const range = (req.query.range as string) || "6mo";
      const interval = (req.query.interval as string) || "1d";
      const yahooSymbol = await resolveYahooSymbol(symbol);

      const result: any = await yahooFinance.chart(yahooSymbol, {
        period1: getStartDate(range),
        period2: new Date(),
        interval: interval as any,
      });

      const quotes = result.quotes || [];
      const candles = quotes
        .filter((q: any) => q.open != null && q.close != null && q.high != null && q.low != null)
        .map((q: any) => ({
          time: new Date(q.date).toISOString().split("T")[0],
          open: Number(q.open.toFixed(4)),
          high: Number(q.high.toFixed(4)),
          low: Number(q.low.toFixed(4)),
          close: Number(q.close.toFixed(4)),
          volume: q.volume || 0,
        }));

      const meta = result.meta || {};
      res.json({
        symbol: yahooSymbol,
        currency: meta.currency || "USD",
        exchange: meta.exchangeName || "",
        name: meta.shortName || meta.longName || yahooSymbol,
        regularMarketPrice: meta.regularMarketPrice,
        previousClose: meta.previousClose || meta.chartPreviousClose,
        candles,
      });
    } catch (error: any) {
      console.error("Stock data error:", error.message);
      res.status(500).json({ error: "Failed to fetch stock data", details: error.message });
    }
  });

  app.get("/api/quote/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const yahooSymbol = await resolveYahooSymbol(symbol);
      const quote: any = await yahooFinance.quote(yahooSymbol);

      res.json({
        symbol: quote.symbol,
        name: quote.shortName || quote.longName || quote.symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume,
        marketCap: quote.marketCap,
        peRatio: quote.trailingPE,
        eps: quote.epsTrailingTwelveMonths,
        dividendYield: quote.dividendYield,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
        averageVolume: quote.averageDailyVolume3Month,
        currency: quote.currency,
        exchange: quote.exchange,
        marketState: quote.marketState,
      });
    } catch (error: any) {
      console.error("Quote error:", error.message);
      res.status(500).json({ error: "Failed to fetch quote", details: error.message });
    }
  });

  app.post("/api/analysis", async (req, res) => {
    try {
      const { symbol, candles, quote } = req.body;

      if (!symbol || !candles || candles.length === 0) {
        return res.status(400).json({ error: "Symbol and candle data are required" });
      }

      const recentCandles = candles.slice(-60);

      const priceData = recentCandles.map((c: any) =>
        `${c.time}: O=${c.open} H=${c.high} L=${c.low} C=${c.close} V=${c.volume}`
      ).join("\n");

      const quoteInfo = quote ? `
Current Price: ${quote.price} ${quote.currency || ""}
Change: ${quote.change} (${quote.changePercent?.toFixed(2)}%)
Volume: ${quote.volume}
Market Cap: ${quote.marketCap}
P/E Ratio: ${quote.peRatio || "N/A"}
EPS: ${quote.eps || "N/A"}
Dividend Yield: ${quote.dividendYield ? (quote.dividendYield * 100).toFixed(2) + "%" : "N/A"}
52-Week High: ${quote.fiftyTwoWeekHigh}
52-Week Low: ${quote.fiftyTwoWeekLow}
Market State: ${quote.marketState}
` : "";

      const prompt = `You are an expert stock market technical analyst. Analyze the following stock data for ${symbol} and provide a comprehensive analysis.

${quoteInfo}

Recent OHLCV Data (last ${recentCandles.length} trading days):
${priceData}

Provide your analysis in the following JSON format exactly:
{
  "trend": "bullish" or "bearish" or "neutral",
  "confidence": <number 0-100>,
  "patternAnalysis": "<detailed description of chart patterns detected, e.g., ascending triangle, head and shoulders, double bottom, etc.>",
  "indicators": {
    "rsi": { "value": <number>, "signal": "<Overbought/Oversold/Neutral>" },
    "macd": { "value": "<string like +0.45 or -0.12>", "signal": "<Strong/Weak/Neutral>" },
    "trend": { "value": "<Upward/Downward/Sideways>", "signal": "<Direction>" },
    "support": <number - key support level>,
    "resistance": <number - key resistance level>,
    "ma20": <number - 20-day moving average>,
    "ma50": <number - 50-day moving average>
  },
  "sentiment": "<1-2 sentence market sentiment summary>",
  "companyProfile": {
    "business": "<brief description of what the company does>",
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "risks": ["<risk 1>", "<risk 2>"]
  },
  "recommendation": "<brief actionable recommendation for investors>"
}

Be accurate with your technical calculations. Base RSI, MACD, and moving averages on the actual price data provided. Return ONLY valid JSON, no markdown.`;

      let content = "";
      const aiConfig = getAIProvider();

      if (aiConfig.type === "anthropic") {
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          temperature: 0.3,
          messages: [{ role: "user", content: prompt }],
        });
        content = response.content[0].type === "text" ? response.content[0].text : "{}";
      } else if (aiConfig.type === "openai") {
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
        const response = await client.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          max_completion_tokens: 1500,
          temperature: 0.3,
        });
        content = response.choices[0]?.message?.content || "{}";
      } else {
        const response = await replitOpenai.chat.completions.create({
          model: "gpt-5.2",
          messages: [{ role: "user", content: prompt }],
          max_completion_tokens: 1500,
          temperature: 0.3,
        });
        content = response.choices[0]?.message?.content || "{}";
      }

      let analysis;
      try {
        const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        analysis = JSON.parse(cleaned);
      } catch {
        analysis = {
          trend: "neutral",
          confidence: 50,
          patternAnalysis: "Unable to parse analysis. Please try again.",
          indicators: {
            rsi: { value: 50, signal: "Neutral" },
            macd: { value: "0.00", signal: "Neutral" },
            trend: { value: "Sideways", signal: "Direction" },
            support: 0,
            resistance: 0,
            ma20: 0,
            ma50: 0,
          },
          sentiment: "Analysis unavailable.",
          companyProfile: {
            business: "Information unavailable.",
            strengths: [],
            risks: [],
          },
          recommendation: "Please try again.",
        };
      }

      res.json(analysis);
    } catch (error: any) {
      console.error("Analysis error:", error.message);
      res.status(500).json({ error: "Failed to generate analysis", details: error.message });
    }
  });

  return httpServer;
}
