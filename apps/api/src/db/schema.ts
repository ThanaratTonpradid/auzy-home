import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { PowerState } from "@smart-home/shared";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

export const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

export const devices = sqliteTable(
  "devices",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roomId: text("room_id").references(() => rooms.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    type: text("type").notNull(),
    model: text("model"),
    notes: text("notes"),
    apiKeyHash: text("api_key_hash").notNull().unique(),
    apiKeyHint: text("api_key_hint").notNull(),
    powerState: text("power_state").$type<PowerState>().notNull().default("unknown"),
    lastSeenAt: integer("last_seen_at", { mode: "number" }),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
  },
  (table) => ({
    userIdx: index("devices_user_idx").on(table.userId),
    apiKeyHashIdx: index("devices_api_key_hash_idx").on(table.apiKeyHash),
  }),
);

export const readings = sqliteTable(
  "readings",
  {
    id: text("id").primaryKey(),
    deviceId: text("device_id")
      .notNull()
      .references(() => devices.id, { onDelete: "cascade" }),
    payload: text("payload", { mode: "json" })
      .$type<Record<string, number | boolean | string>>()
      .notNull(),
    receivedAt: integer("received_at", { mode: "number" }).notNull(),
  },
  (table) => ({
    deviceTimeIdx: index("readings_device_time_idx").on(table.deviceId, table.receivedAt),
  }),
);
