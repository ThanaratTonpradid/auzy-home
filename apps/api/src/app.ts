import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env } from "./env.js";
import { authRoutes, meRoutes } from "./routes/auth.js";
import { commandRoutes } from "./routes/commands.js";
import { deviceRoutes } from "./routes/devices.js";
import { docsRoutes } from "./routes/docs.js";
import { ingestRoutes } from "./routes/ingest.js";
import { overviewRoutes } from "./routes/overview.js";
import { roomRoutes } from "./routes/rooms.js";
import { streamRoutes } from "./routes/stream.js";

export function createApp(options: { silent?: boolean } = {}) {
  const app = new Hono();

  if (!options.silent) {
    app.use("*", logger());
  }

  app.use(
    "*",
    cors({
      origin: env.webOrigin,
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization", "X-Api-Key", "X-Device-Key"],
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    }),
  );

  app.get("/health", (c) => c.json({ ok: true, service: "auzy-api" }));
  app.route("/", docsRoutes);
  app.route("/v1/auth", authRoutes);
  app.route("/v1/me", meRoutes);
  app.route("/v1/overview", overviewRoutes);
  app.route("/v1/rooms", roomRoutes);
  app.route("/v1/devices", deviceRoutes);
  app.route("/v1/ingest", ingestRoutes);
  app.route("/v1/commands", commandRoutes);
  app.route("/v1/stream", streamRoutes);

  app.notFound((c) => c.json({ error: "Not found" }, 404));
  app.onError((error, c) => {
    console.error(error);
    return c.json({ error: "Unexpected server error" }, 500);
  });

  return app;
}
