import { Hono } from "hono";
import { requireDevice, type DeviceEnv } from "../middleware/auth.js";
import { services } from "../services.js";

export const commandRoutes = new Hono<DeviceEnv>();
commandRoutes.use("*", requireDevice);

commandRoutes.get("/", async (c) => {
  const commands = await services.commands.dequeue(c.get("deviceId"));
  return c.json({ commands });
});
