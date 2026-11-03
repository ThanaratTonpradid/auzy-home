import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { createDeviceSchema, deviceCommandSchema, updateDeviceSchema } from "@smart-home/shared";
import { clamp, nowMs } from "@smart-home/utils";
import { db } from "../db/client.js";
import { devices, readings, rooms } from "../db/schema.js";
import { apiKeyHint, hashApiKey } from "../lib/api-key.js";
import { publicDevice } from "../lib/devices.js";
import { deviceApiKey, id } from "../lib/ids.js";
import { requireUser, type AuthedEnv } from "../middleware/auth.js";
import { services } from "../services.js";

export const deviceRoutes = new Hono<AuthedEnv>();
deviceRoutes.use("*", requireUser);

async function ownedDevice(userId: string, deviceId: string) {
  const [device] = await db
    .select()
    .from(devices)
    .where(and(eq(devices.id, deviceId), eq(devices.userId, userId)))
    .limit(1);
  return device ?? null;
}

deviceRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const rows = await db.select().from(devices).where(eq(devices.userId, userId));
  const roomRows = await db.select().from(rooms).where(eq(rooms.userId, userId));
  const roomNames = new Map(roomRows.map((room) => [room.id, room.name]));

  const listed = await Promise.all(
    rows.map(async (device) => {
      const [latest] = await db
        .select()
        .from(readings)
        .where(eq(readings.deviceId, device.id))
        .orderBy(desc(readings.receivedAt))
        .limit(1);
      return {
        ...publicDevice(device, { roomName: device.roomId ? roomNames.get(device.roomId) : null }),
        latest: latest?.payload ?? null,
      };
    }),
  );

  return c.json({
    devices: listed.sort((a, b) => a.name.localeCompare(b.name)),
  });
});

deviceRoutes.post("/", async (c) => {
  const parsed = createDeviceSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, 400);
  }

  const apiKey = deviceApiKey();
  const device = {
    id: id(),
    userId: c.get("userId"),
    roomId: parsed.data.roomId ?? null,
    name: parsed.data.name,
    type: parsed.data.type,
    model: parsed.data.model ?? null,
    notes: parsed.data.notes ?? null,
    apiKeyHash: hashApiKey(apiKey),
    apiKeyHint: apiKeyHint(apiKey),
    powerState: "unknown" as const,
    lastSeenAt: null,
    createdAt: nowMs(),
  };
  await db.insert(devices).values(device);
  return c.json({ device: publicDevice(device, { apiKey }) }, 201);
});

deviceRoutes.get("/:id", async (c) => {
  const device = await ownedDevice(c.get("userId"), c.req.param("id"));
  if (!device) return c.json({ error: "Device not found" }, 404);
  const [room] = device.roomId
    ? await db.select().from(rooms).where(eq(rooms.id, device.roomId)).limit(1)
    : [null];
  return c.json({ device: publicDevice(device, { roomName: room?.name }) });
});

deviceRoutes.patch("/:id", async (c) => {
  const device = await ownedDevice(c.get("userId"), c.req.param("id"));
  if (!device) return c.json({ error: "Device not found" }, 404);

  const parsed = updateDeviceSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, 400);
  }

  const next = {
    name: parsed.data.name ?? device.name,
    type: parsed.data.type ?? device.type,
    roomId: parsed.data.roomId === undefined ? device.roomId : parsed.data.roomId,
    model: parsed.data.model === undefined ? device.model : parsed.data.model,
    notes: parsed.data.notes === undefined ? device.notes : parsed.data.notes,
  };
  await db.update(devices).set(next).where(eq(devices.id, device.id));
  return c.json({ device: publicDevice({ ...device, ...next }) });
});

deviceRoutes.delete("/:id", async (c) => {
  const device = await ownedDevice(c.get("userId"), c.req.param("id"));
  if (!device) return c.json({ error: "Device not found" }, 404);
  await services.sessions.deleteDeviceAuth(device.apiKeyHash);
  await services.sessions.deleteDevice(device.id);
  await services.commands.clear(device.id);
  await db.delete(devices).where(eq(devices.id, device.id));
  return c.body(null, 204);
});

deviceRoutes.post("/:id/regenerate-key", async (c) => {
  const device = await ownedDevice(c.get("userId"), c.req.param("id"));
  if (!device) return c.json({ error: "Device not found" }, 404);
  const apiKey = deviceApiKey();
  await services.sessions.deleteDeviceAuth(device.apiKeyHash);
  const next = { apiKeyHash: hashApiKey(apiKey), apiKeyHint: apiKeyHint(apiKey) };
  await db.update(devices).set(next).where(eq(devices.id, device.id));
  return c.json({ device: publicDevice({ ...device, ...next }, { apiKey }) });
});

deviceRoutes.get("/:id/readings", async (c) => {
  const device = await ownedDevice(c.get("userId"), c.req.param("id"));
  if (!device) return c.json({ error: "Device not found" }, 404);
  const limit = clamp(Number(c.req.query("limit") ?? 200) || 200, 1, 1000);
  const rows = await db
    .select()
    .from(readings)
    .where(eq(readings.deviceId, device.id))
    .orderBy(desc(readings.receivedAt))
    .limit(limit);
  return c.json({ readings: rows });
});

deviceRoutes.post("/:id/commands", async (c) => {
  const device = await ownedDevice(c.get("userId"), c.req.param("id"));
  if (!device) return c.json({ error: "Device not found" }, 404);

  const parsed = deviceCommandSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid command" }, 400);
  }

  const command = {
    id: id(),
    deviceId: device.id,
    action: parsed.data.action,
    createdAt: nowMs(),
  };
  await services.commands.enqueue(command);
  await db.update(devices).set({ powerState: parsed.data.action }).where(eq(devices.id, device.id));
  const live = await services.sessions.getDevice(device.id);
  await services.sessions.putDevice({
    deviceId: device.id,
    userId: device.userId,
    lastSeenAt: live?.lastSeenAt ?? device.lastSeenAt ?? nowMs(),
    powerState: parsed.data.action,
  });

  return c.json({ command }, 202);
});
