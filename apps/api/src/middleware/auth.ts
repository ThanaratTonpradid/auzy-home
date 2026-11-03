import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { db } from "../db/client.js";
import { devices, users } from "../db/schema.js";
import { hashApiKey } from "../lib/api-key.js";
import { readSessionToken } from "../lib/cookies.js";
import { services } from "../services.js";

export type AuthedEnv = {
  Variables: {
    userId: string;
    userName: string;
    userEmail: string;
    sessionToken: string;
  };
};

export type DeviceEnv = {
  Variables: {
    deviceId: string;
    userId: string;
    keyHash: string;
  };
};

function bearer(header: string | undefined) {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export const requireUser = createMiddleware<AuthedEnv>(async (c, next) => {
  const token = readSessionToken(c);
  if (!token) {
    return c.json({ error: "Sign in required" }, 401);
  }

  const session = await services.sessions.getUser(token);
  if (!session) {
    return c.json({ error: "Session expired" }, 401);
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) {
    await services.sessions.deleteUser(token);
    return c.json({ error: "Account not found" }, 401);
  }

  await services.sessions.touchUser(token);
  c.set("userId", user.id);
  c.set("userName", user.name);
  c.set("userEmail", user.email);
  c.set("sessionToken", token);
  await next();
});

export const requireDevice = createMiddleware<DeviceEnv>(async (c, next) => {
  const apiKey =
    c.req.header("x-api-key") ??
    c.req.header("x-device-key") ??
    bearer(c.req.header("authorization"));

  if (!apiKey) {
    return c.json({ error: "Missing X-Api-Key header" }, 401);
  }

  const keyHash = hashApiKey(apiKey);
  let auth = await services.sessions.lookupDeviceAuth(keyHash);
  if (!auth) {
    const [device] = await db.select().from(devices).where(eq(devices.apiKeyHash, keyHash)).limit(1);
    if (!device) {
      return c.json({ error: "Unknown device key" }, 401);
    }
    auth = { deviceId: device.id, userId: device.userId, keyHash };
    await services.sessions.cacheDeviceAuth(auth);
  }

  c.set("deviceId", auth.deviceId);
  c.set("userId", auth.userId);
  c.set("keyHash", keyHash);
  await next();
});
