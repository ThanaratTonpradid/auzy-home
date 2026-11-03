import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

try {
  const text = readFileSync(resolve(appRoot, ".env"), "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
} catch {
  // .env is optional when variables are already in the environment.
}

const dataDir = resolve(appRoot, "data");
mkdirSync(dataDir, { recursive: true });

/** SQLite `localtime` and Node Date formatting follow this zone. */
const timezone = process.env.TZ || process.env.APP_TIMEZONE || "Asia/Bangkok";
process.env.TZ = timezone;

function databaseUrl() {
  const raw = process.env.DATABASE_URL ?? `file:${resolve(dataDir, "smarthome.db")}`;
  if (!raw.startsWith("file:")) return raw;
  const pathPart = raw.slice("file:".length);
  if (pathPart.startsWith("/")) return raw;
  return `file:${resolve(appRoot, pathPart)}`;
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: databaseUrl(),
  timezone,
  redisUrl: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  cookieSecure: process.env.COOKIE_SECURE === "true",
};
