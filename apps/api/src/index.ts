import { serve } from "@hono/node-server";
import Redis from "ioredis";
import { createApp } from "./app.js";
import { migrate } from "./db/migrate.js";
import { env } from "./env.js";
import { MemoryCommandQueue } from "./lib/commands.js";
import { RedisStore } from "./lib/redis-store.js";
import { MemorySessionStore } from "./lib/sessions.js";
import { bindServices } from "./services.js";

async function connectStores() {
  const redis = new Redis(env.redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 1500,
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  try {
    await redis.connect();
    await redis.ping();
    const store = new RedisStore(redis);
    bindServices({ sessions: store, commands: store });
    console.log(`Redis sessions + command queue at ${env.redisUrl}`);
  } catch (error) {
    await redis.quit().catch(() => undefined);
    bindServices({ sessions: new MemorySessionStore(), commands: new MemoryCommandQueue() });
    console.warn(
      "Redis is unavailable — admin/device sessions are in-memory only. Start Redis with `docker compose up -d redis`.",
      error instanceof Error ? error.message : error,
    );
  }
}

await migrate();
await connectStores();

const app = createApp();

serve({ fetch: app.fetch, port: env.port }, (info) => {
  console.log(`Auzy API listening on http://localhost:${info.port}`);
  console.log(`Scalar docs           http://localhost:${info.port}/scalar`);
});
