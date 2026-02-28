import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import crypto from "crypto";
import { testConnection } from "./db";
import { WebhookHandlers } from "./webhookHandlers";

declare module "express-session" {
  interface SessionData {
    userId: string;
    email: string;
    isAdmin: boolean;
    loginAt: number;
  }
}

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    const host = req.hostname;
    if (host && host.endsWith(".replit.app")) {
      return res.redirect(301, `https://ai.dexterchia.com${req.originalUrl}`);
    }
    next();
  });
}

app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      if (!Buffer.isBuffer(req.body)) {
        console.error('[STRIPE] Webhook body is not a Buffer');
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('[STRIPE] Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: false,
    cookie: {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax",
    },
  }),
);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log("[STARTUP] Starting server initialization...");
    console.log(`[STARTUP] NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`[STARTUP] DATABASE_URL: ${process.env.DATABASE_URL ? "set" : "NOT SET"}`);

    console.log("[STARTUP] Testing database connection...");
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error("[STARTUP] WARNING: Database connection failed, some features may not work");
    }

    console.log("[STARTUP] Initializing Stripe...");
    try {
      const { runMigrations } = await import('stripe-replit-sync');
      const { getStripeSync } = await import('./stripeClient');

      await runMigrations({ databaseUrl: process.env.DATABASE_URL! });
      console.log("[STARTUP] Stripe schema ready");

      const stripeSync = await getStripeSync();

      try {
        const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
        const webhookUrl = `${webhookBaseUrl}/api/stripe/webhook`;
        const result = await stripeSync.findOrCreateManagedWebhook(webhookUrl);
        console.log(`[STARTUP] Stripe webhook configured:`, result?.webhook?.url || webhookUrl);
      } catch (whErr: any) {
        console.log(`[STARTUP] Stripe webhook setup skipped (non-fatal): ${whErr.message}`);
      }

      stripeSync.syncBackfill()
        .then(() => console.log("[STARTUP] Stripe data synced"))
        .catch((err: any) => console.error("[STARTUP] Stripe sync error:", err));
    } catch (stripeErr: any) {
      console.error("[STARTUP] Stripe init error (non-fatal):", stripeErr.message);
    }

    console.log("[STARTUP] Registering routes...");
    await registerRoutes(httpServer, app);

    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error("Internal Server Error:", err);

      if (res.headersSent) {
        return next(err);
      }

      return res.status(status).json({ message });
    });

    if (process.env.NODE_ENV === "production") {
      console.log("[STARTUP] Serving static files (production mode)...");
      serveStatic(app);
    } else {
      console.log("[STARTUP] Setting up Vite dev server...");
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    const { startScheduler, setGmailSendFunction } = await import("./scheduler");
    const { sendGmail } = await import("./gmail");
    setGmailSendFunction(sendGmail);
    startScheduler();

    const port = parseInt(process.env.PORT || "5000", 10);
    httpServer.listen(
      {
        port,
        host: "0.0.0.0",
        reusePort: true,
      },
      () => {
        log(`serving on port ${port}`);
        console.log("[STARTUP] Server started successfully");
      },
    );
  } catch (err) {
    console.error("[STARTUP] Fatal error during server initialization:", err);
    process.exit(1);
  }
})();
