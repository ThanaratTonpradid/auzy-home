import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { ingestSchema, normalizeReadings } from "@smart-home/shared";
import { nowMs } from "@smart-home/utils";
import { db } from "../db/client.js";
import { devices, readings } from "../db/schema.js";
import { publish } from "../lib/events.js";
import { id } from "../lib/ids.js";
import { powerFromPayload } from "../lib/power.js";
import { requireDevice, type DeviceEnv } from "../middleware/auth.js";
import { services } from "../services.js";

export const ingestRoutes = new Hono<DeviceEnv>();
ingestRoutes.use("*", requireDevice);

ingestRoutes.post("/", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Body must be JSON" }, 400);
  }

  const parsed = ingestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, 400);
  }

  const payload = normalizeReadings(parsed.data);
  if (Object.keys(payload).length === 0) {
    return c.json({ error: "No supported sensor fields in payload" }, 400);
  }

  const receivedAt = nowMs();
  const deviceId = c.get("deviceId");
  const userId = c.get("userId");
  const reportedPower = powerFromPayload(payload);
  const [device] = await db.select().from(devices).where(eq(devices.id, deviceId)).limit(1);
  const commands = await services.commands.dequeue(deviceId);
  const powerState = commands.at(-1)?.action ?? reportedPower ?? device?.powerState ?? "unknown";

  await db.insert(readings).values({ id: id(), deviceId, payload, receivedAt });
  await db
    .update(devices)
    .set({ lastSeenAt: receivedAt, powerState })
    .where(eq(devices.id, deviceId));

  await services.sessions.putDevice({
    deviceId,
    userId,
    lastSeenAt: receivedAt,
    powerState,
  });

  publish({
    type: "reading",
    userId,
    deviceId,
    payload,
    receivedAt,
  });

  return c.json({ accepted: true, receivedAt, fields: Object.keys(payload), commands }, 202);
});
