import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import YahooFinance from "yahoo-finance2";
import { storage } from "./storage";

const yahooFinance = new YahooFinance();

const replitOpenai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.error("ADMIN_PASSWORD environment variable is required");
}

function getAIProvider(): { type: "openai" | "anthropic" | "replit"; } {
  const provider = (process.env.AI_PROVIDER || "replit").toLowerCase();
  if (provider === "openai" && process.env.OPENAI_API_KEY) return { type: "openai" };
  if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) return { type: "anthropic" };
  return { type: "replit" };
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const loginAt = req.session.loginAt || 0;
  const elapsed = Date.now() - loginAt;
  if (elapsed > 15 * 60 * 1000) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: "Session expired" });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

async function resolveYahooSymbol(symbol: string): Promise<string> {
  if (symbol.startsWith("KLSE:") || symbol.startsWith("MYX:")) {
    const ticker = symbol.replace("KLSE:", "").replace("MYX:", "");

    if (/^\d+$/.test(ticker)) {
      return `${ticker}.KL`;
    }

    const directSymbol = `${ticker}.KL`;
    try {
      const q: any = await yahooFinance.quote(directSymbol);
      if (q && q.symbol && q.currency && q.regularMarketPrice < 1e6) return directSymbol;
    } catch {}

    const searchQueries = [ticker, `${ticker} Group`, `${ticker} Berhad`, `${ticker} Bursa`, `${ticker} Malaysia`];
    for (const query of searchQueries) {
      try {
        const searchResult: any = await yahooFinance.search(query);
        const klseMatch = searchResult.quotes?.find((q: any) =>
          q.symbol?.endsWith(".KL") && q.quoteType === "EQUITY"
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

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      if (user.disabled) {
        return res.status(403).json({ error: "Your account has been disabled. Please contact admin." });
      }
      const valid = await storage.verifyPassword(user, password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const clientIp = req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() || req.ip || "unknown";
      await storage.updateLoginInfo(user.id, clientIp);

      req.session.userId = user.id;
      req.session.email = user.email;
      req.session.isAdmin = false;
      req.session.loginAt = Date.now();

      res.json({ email: user.email, expiresIn: 15 * 60 * 1000 });
    } catch (error: any) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/admin-login", async (req, res) => {
    try {
      const { password } = req.body;
      if (!password || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Invalid admin password" });
      }

      req.session.userId = "admin";
      req.session.email = "admin";
      req.session.isAdmin = true;
      req.session.loginAt = Date.now();

      res.json({ isAdmin: true });
    } catch (error: any) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get("/api/auth/session", (req, res) => {
    if (!req.session.userId) {
      return res.json({ authenticated: false });
    }
    const loginAt = req.session.loginAt || 0;
    const elapsed = Date.now() - loginAt;
    const remaining = Math.max(0, 15 * 60 * 1000 - elapsed);

    if (remaining <= 0) {
      req.session.destroy(() => {});
      return res.json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      email: req.session.email,
      isAdmin: req.session.isAdmin || false,
      remainingMs: remaining,
    });
  });

  app.get("/api/admin/users", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(u => ({
        id: u.id,
        email: u.email,
        disabled: u.disabled,
        lastIp: u.lastIp,
        lastLoginAt: u.lastLoginAt,
        requestCount: u.requestCount,
      })));
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id/toggle", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { disabled } = req.body;
      const user = await storage.toggleUserDisabled(id, disabled);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ id: user.id, email: user.email, disabled: user.disabled });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.post("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: "User with this email already exists" });
      }

      const user = await storage.createUser({ email, password });
      res.json({ id: user.id, email: user.email });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { email, password } = req.body;
      const updateData: any = {};
      if (email) updateData.email = email;
      if (password) updateData.password = password;

      const user = await storage.updateUser(id, updateData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ id: user.id, email: user.email });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUser(id);
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.get("/api/news/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const yahooSymbol = await resolveYahooSymbol(symbol);

      let companyName = "";
      try {
        const quoteResult: any = await yahooFinance.quote(yahooSymbol);
        companyName = quoteResult?.longName || quoteResult?.shortName || "";
      } catch (e) {}

      const searchQuery = companyName
        ? companyName.replace(/\b(Bhd|Berhad|Inc|Ltd|Limited|PLC|Tbk|S\.A\.|AG)\b\.?$/gi, "").trim()
        : yahooSymbol;

      const searchResult: any = await yahooFinance.search(searchQuery);
      const news = (searchResult.news || []).slice(0, 8).map((article: any) => ({
        title: article.title,
        publisher: article.publisher,
        link: article.link,
        publishedAt: article.providerPublishTime
          ? new Date(typeof article.providerPublishTime === 'number' ? article.providerPublishTime * 1000 : article.providerPublishTime).toISOString()
          : null,
        thumbnail: article.thumbnail?.resolutions?.[0]?.url || null,
      }));
      res.json(news);
    } catch (error: any) {
      console.error("News error:", error.message);
      res.json([]);
    }
  });

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
      }, { validateResult: false });

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

      if (!quote || !quote.symbol) {
        return res.status(404).json({ error: "Stock not found", details: `No quote data available for ${symbol}` });
      }

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

  app.post("/api/analysis", requireAuth, async (req, res) => {
    try {
      const { symbol, candles, quote } = req.body;

      if (!symbol || !candles || candles.length === 0) {
        return res.status(400).json({ error: "Symbol and candle data are required" });
      }

      if (req.session.userId && req.session.userId !== "admin") {
        await storage.incrementRequestCount(req.session.userId);
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

  const US_STOCKS = [
    "AAPL","MSFT","GOOGL","AMZN","NVDA","META","TSLA","BRK-B","JPM","V",
    "UNH","MA","HD","PG","JNJ","ABBV","XOM","BAC","KO","MRK",
    "PEP","AVGO","COST","LLY","TMO","CSCO","MCD","WMT","ABT","CRM",
    "ACN","DHR","TXN","NKE","NEE","PM","UPS","ORCL","INTC","AMD",
    "QCOM","LOW","AMAT","GS","CAT","BA","SBUX","GE","ISRG","BLK",
    "MDT","ADP","AMGN","GILD","SYK","DE","ADI","LRCX","REGN","BKNG",
    "PYPL","MDLZ","CB","VRTX","TMUS","CI","SO","ZTS","PANW","MMC",
    "KLAC","PLD","CME","SNPS","CDNS","APH","MCO","FI","SHW","ITW",
    "NFLX","DIS","NOW","ABNB","COIN","UBER","PLTR","SQ","SNOW","SHOP",
    "MELI","CRWD","DDOG","NET","ZS","MDB","RIVN","LCID","SOFI","RBLX"
  ];

  const MY_STOCKS = [
    "1155.KL","1295.KL","5347.KL","1082.KL","4715.KL","6888.KL","3182.KL","5183.KL","5225.KL","4863.KL",
    "5296.KL","1023.KL","6012.KL","4677.KL","5681.KL","3816.KL","5235.KL","4197.KL","6947.KL","5168.KL",
    "7277.KL","4707.KL","1961.KL","5819.KL","2445.KL","3034.KL","5285.KL","7084.KL","6742.KL","8567.KL",
    "4065.KL","5398.KL","6033.KL","1015.KL","5209.KL","6399.KL","1066.KL","4688.KL","5014.KL","5075.KL",
    "7153.KL","3859.KL","5218.KL","0166.KL","2828.KL","3786.KL","6556.KL","7113.KL","5148.KL","4809.KL"
  ];

  const scanCache = new Map<string, { data: any[]; timestamp: number }>();
  const SCAN_CACHE_TTL = 5 * 60 * 1000;

  function calcSMA(closes: number[], period: number): number | null {
    if (closes.length < period) return null;
    const slice = closes.slice(-period);
    return slice.reduce((s, v) => s + v, 0) / period;
  }

  function calcEMA(closes: number[], period: number): number | null {
    if (closes.length < period) return null;
    const k = 2 / (period + 1);
    let ema = closes.slice(0, period).reduce((s, v) => s + v, 0) / period;
    for (let i = period; i < closes.length; i++) {
      ema = closes[i] * k + ema * (1 - k);
    }
    return ema;
  }

  function calcEMASeries(closes: number[], period: number): number[] {
    if (closes.length < period) return [];
    const k = 2 / (period + 1);
    let ema = closes.slice(0, period).reduce((s, v) => s + v, 0) / period;
    const series: number[] = [];
    for (let i = 0; i < period; i++) series.push(0);
    series[period - 1] = ema;
    for (let i = period; i < closes.length; i++) {
      ema = closes[i] * k + ema * (1 - k);
      series.push(ema);
    }
    return series;
  }

  app.get("/api/scanner", requireAuth, async (req, res) => {
    try {
      const market = (req.query.market as string) || "US";
      const type = (req.query.type as string) || "ath";
      const criteriaParam = (req.query.criteria as string) || "";
      const criteria = criteriaParam ? criteriaParam.split(",") : [];
      const cacheKey = `${market}_${type}_${criteriaParam}`;

      const cached = scanCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < SCAN_CACHE_TTL) {
        return res.json(cached.data);
      }

      const symbols = market === "MY" ? MY_STOCKS : US_STOCKS;
      const results: any[] = [];
      const batchSize = 10;
      const needsChart = type === "breakout" || criteria.some(c =>
        ["above_ema5", "above_ema20", "above_sma200", "ema20_cross_sma200"].includes(c)
      );
      const chartDays = criteria.includes("above_sma200") || criteria.includes("ema20_cross_sma200") ? 400 : 45;

      for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize);
        const promises = batch.map(async (sym) => {
          try {
            const quotePromise = yahooFinance.quote(sym);
            const chartPromise = needsChart
              ? yahooFinance.chart(sym, {
                  period1: new Date(Date.now() - chartDays * 24 * 60 * 60 * 1000),
                  period2: new Date(),
                  interval: "1d" as any,
                }, { validateResult: false })
              : Promise.resolve(null);

            const [quote, chart]: any[] = await Promise.all([quotePromise, chartPromise]);
            if (!quote || !quote.regularMarketPrice) return null;

            const currentPrice = quote.regularMarketPrice;
            const reasons: string[] = [];
            let matched = false;

            if (type === "ath") {
              if (!quote.fiftyTwoWeekHigh) return null;
              const pctFromHigh = ((quote.fiftyTwoWeekHigh - currentPrice) / quote.fiftyTwoWeekHigh) * 100;
              if (pctFromHigh <= 3) {
                matched = true;
                reasons.push(
                  pctFromHigh < 0.5
                    ? `New 52-week high at ${currentPrice.toFixed(2)}`
                    : `${pctFromHigh.toFixed(1)}% from 52-week high (${quote.fiftyTwoWeekHigh.toFixed(2)})`
                );
              } else {
                return null;
              }
            }

            const candles = chart
              ? (chart.quotes || []).filter((c: any) => c.close != null && c.high != null)
              : [];
            const closes = candles.map((c: any) => c.close);

            if (type === "breakout") {
              let breakoutMatched = false;

              const hasBreakoutCriteria = criteria.some(c =>
                ["above_5_candles", "above_10day", "above_3day"].includes(c)
              );

              if (!hasBreakoutCriteria) {
                if (candles.length >= 25) {
                  const lookback = 5;
                  const recent = candles.slice(-lookback);
                  const prior = candles.slice(-(20 + lookback), -lookback);
                  if (prior.length >= 15) {
                    const high20 = Math.max(...prior.map((c: any) => c.high));
                    for (const candle of recent) {
                      if (candle.high > high20) {
                        breakoutMatched = true;
                        const pct = ((candle.high - high20) / high20 * 100).toFixed(1);
                        const dt = new Date(candle.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                        reasons.push(`Broke 20-day high (${high20.toFixed(2)}) by ${pct}% on ${dt}`);
                        break;
                      }
                    }
                  }
                }
              }

              if (criteria.includes("above_5_candles") && candles.length >= 6) {
                const last5Highs = candles.slice(-6, -1).map((c: any) => c.high);
                const maxHigh5 = Math.max(...last5Highs);
                if (currentPrice > maxHigh5) {
                  breakoutMatched = true;
                  reasons.push(`Above last 5 candle highs (${maxHigh5.toFixed(2)})`);
                }
              }

              if (criteria.includes("above_10day") && candles.length >= 11) {
                const last10Highs = candles.slice(-11, -1).map((c: any) => c.high);
                const maxHigh10 = Math.max(...last10Highs);
                if (currentPrice > maxHigh10) {
                  breakoutMatched = true;
                  reasons.push(`Above 10-day high (${maxHigh10.toFixed(2)})`);
                }
              }

              if (criteria.includes("above_3day") && candles.length >= 4) {
                const last3Highs = candles.slice(-4, -1).map((c: any) => c.high);
                const maxHigh3 = Math.max(...last3Highs);
                if (currentPrice > maxHigh3) {
                  breakoutMatched = true;
                  reasons.push(`Above 3-day high (${maxHigh3.toFixed(2)})`);
                }
              }

              if (!breakoutMatched) return null;
              matched = true;
            }

            if (criteria.includes("above_ema5")) {
              const ema5 = calcEMA(closes, 5);
              if (ema5 === null) return null;
              if (currentPrice > ema5) {
                reasons.push(`Above EMA5 (${ema5.toFixed(2)})`);
              } else {
                return null;
              }
            }

            if (criteria.includes("above_ema20")) {
              const ema20 = calcEMA(closes, 20);
              if (ema20 === null) return null;
              if (currentPrice > ema20) {
                reasons.push(`Above EMA20 (${ema20.toFixed(2)})`);
              } else {
                return null;
              }
            }

            if (criteria.includes("above_sma200")) {
              const sma200 = calcSMA(closes, 200);
              if (sma200 === null) return null;
              if (currentPrice > sma200) {
                reasons.push(`Above SMA200 (${sma200.toFixed(2)})`);
              } else {
                return null;
              }
            }

            if (criteria.includes("ema20_cross_sma200")) {
              if (closes.length < 201) return null;
              const ema20Series = calcEMASeries(closes, 20);
              const sma200Now = calcSMA(closes, 200);
              const sma200Prev = calcSMA(closes.slice(0, -1), 200);
              const ema20Now = ema20Series[ema20Series.length - 1];
              const ema20Prev = ema20Series[ema20Series.length - 2];
              if (!sma200Now || !sma200Prev || !ema20Now || !ema20Prev) return null;

              const crossedUp5d = (() => {
                for (let d = 1; d <= 5 && d < ema20Series.length; d++) {
                  const idx = ema20Series.length - 1 - d;
                  const prevIdx = idx - 1;
                  if (prevIdx < 0 || idx < 200) continue;
                  const smaAtIdx = calcSMA(closes.slice(0, idx + 1), 200);
                  const smaAtPrev = calcSMA(closes.slice(0, idx), 200);
                  if (!smaAtIdx || !smaAtPrev) continue;
                  if (ema20Series[prevIdx] <= smaAtPrev && ema20Series[idx] > smaAtIdx) return true;
                }
                return false;
              })();

              if (ema20Now > sma200Now || crossedUp5d) {
                if (crossedUp5d) {
                  reasons.push(`EMA20 crossed above SMA200 (recent golden cross)`);
                } else {
                  reasons.push(`EMA20 (${ema20Now.toFixed(2)}) above SMA200 (${sma200Now.toFixed(2)})`);
                }
              } else {
                return null;
              }
            }

            if (type === "ath" && reasons.length > 0 || type === "breakout" && matched) {
              return {
                symbol: quote.symbol,
                name: quote.shortName || quote.longName || quote.symbol,
                price: currentPrice,
                change: quote.regularMarketChange || 0,
                changePercent: quote.regularMarketChangePercent || 0,
                volume: quote.regularMarketVolume || 0,
                marketCap: quote.marketCap || 0,
                fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
                currency: quote.currency || (market === "MY" ? "MYR" : "USD"),
                reason: reasons.join(" · "),
              };
            }
            return null;
          } catch {
            return null;
          }
        });

        const batchResults = await Promise.all(promises);
        results.push(...batchResults.filter(Boolean));

        if (i + batchSize < symbols.length) {
          await new Promise(r => setTimeout(r, 300));
        }
      }

      results.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

      scanCache.set(cacheKey, { data: results, timestamp: Date.now() });
      res.json(results);
    } catch (error: any) {
      console.error("Scanner error:", error.message);
      res.status(500).json({ error: "Scanner failed", details: error.message });
    }
  });

  return httpServer;
}
