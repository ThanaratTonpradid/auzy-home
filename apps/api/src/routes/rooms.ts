import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { createRoomSchema } from "@smart-home/shared";
import { nowMs } from "@smart-home/utils";
import { db } from "../db/client.js";
import { rooms } from "../db/schema.js";
import { id } from "../lib/ids.js";
import { requireUser, type AuthedEnv } from "../middleware/auth.js";

export const roomRoutes = new Hono<AuthedEnv>();
roomRoutes.use("*", requireUser);

roomRoutes.get("/", async (c) => {
  const rows = await db.select().from(rooms).where(eq(rooms.userId, c.get("userId")));
  return c.json({ rooms: rows.sort((a, b) => a.name.localeCompare(b.name)) });
});

roomRoutes.post("/", async (c) => {
  const parsed = createRoomSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, 400);
  }

  const room = {
    id: id(),
    userId: c.get("userId"),
    name: parsed.data.name,
    createdAt: nowMs(),
  };
  await db.insert(rooms).values(room);
  return c.json({ room }, 201);
});
