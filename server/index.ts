import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import crypto from "crypto";
import { testConnection } from "./db";

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
