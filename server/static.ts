import express, { type Express } from "express";
import fs from "fs";
import path from "path";

const BASE_PATH = "/ai-terminal";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(BASE_PATH, express.static(distPath));

  app.use(express.static(distPath, { index: false }));

  app.get(`${BASE_PATH}/*`, (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });

  app.get(BASE_PATH, (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });

  app.use((req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/vite-hmr")) {
      return next();
    }
    if (!req.path.startsWith(BASE_PATH) && req.path !== "/") {
      return res.redirect(301, BASE_PATH + req.path);
    }
    if (req.path === "/") {
      return res.redirect(301, BASE_PATH);
    }
    next();
  });
}
