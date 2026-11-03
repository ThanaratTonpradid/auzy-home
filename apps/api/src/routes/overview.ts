import { nowMs, take } from "@smart-home/utils";
import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client.js";
import { devices, readings, rooms } from "../db/schema.js";
import { deviceStatus } from "../lib/status.js";
import { requireUser, type AuthedEnv } from "../middleware/auth.js";

const DAY = 24 * 60 * 60 * 1000;

export const overviewRoutes = new Hono<AuthedEnv>();
overviewRoutes.use("*", requireUser);

overviewRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const deviceRows = await db.select().from(devices).where(eq(devices.userId, userId));
  const roomRows = await db.select().from(rooms).where(eq(rooms.userId, userId));
  const since = nowMs() - DAY;
  const deviceIds = deviceRows.map((device) => device.id);

  let readingCount24h = 0;
  if (deviceIds.length > 0) {
    const [countRow] = await db
      .select({ n: sql<number>`count(*)` })
      .from(readings)
      .where(and(inArray(readings.deviceId, deviceIds), gt(readings.receivedAt, since)));
    readingCount24h = Number(countRow?.n ?? 0);
  }

  const recent = await Promise.all(
    deviceRows.map(async (device) => {
      const [latest] = await db
        .select()
        .from(readings)
        .where(eq(readings.deviceId, device.id))
        .orderBy(desc(readings.receivedAt))
        .limit(1);
      if (!latest) return null;
      return {
        deviceId: device.id,
        deviceName: device.name,
        payload: latest.payload,
        receivedAt: latest.receivedAt,
      };
    }),
  );

  return c.json({
    deviceCount: deviceRows.length,
    onlineCount: deviceRows.filter((device) => deviceStatus(device.lastSeenAt) === "online").length,
    pendingCount: deviceRows.filter((device) => deviceStatus(device.lastSeenAt) === "pending").length,
    roomCount: roomRows.length,
    readingCount24h,
    recent: take(
      recent
        .filter((row): row is NonNullable<typeof row> => Boolean(row))
        .sort((a, b) => b.receivedAt - a.receivedAt),
      8,
    ),
  });
});
