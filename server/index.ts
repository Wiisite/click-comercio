import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cookieParser from "cookie-parser";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { runMigrations } from "./db";
import { appRouter } from "./routers";
import { createContext } from "./trpc";

runMigrations();

const app = express();
app.use(cookieParser());
app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

// Em produção o mesmo servidor entrega o front-end compilado (SPA)
const publicDir = path.resolve(import.meta.dirname, "public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get("/{*rota}", (_req, res) => res.sendFile(path.join(publicDir, "index.html")));
}

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`Click Comércio API em http://localhost:${port}`));
