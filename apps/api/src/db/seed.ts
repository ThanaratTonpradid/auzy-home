import { nowMs, round, roundNumber } from "@smart-home/utils";
import { eq } from "drizzle-orm";
import { migrate } from "./migrate.js";
import { db } from "./client.js";
import { devices, readings, rooms, users } from "./schema.js";
import { apiKeyHint, hashApiKey } from "../lib/api-key.js";
import { hashPassword } from "../lib/password.js";

const DEMO_EMAIL = "demo@smarthome.local";
const now = nowMs();

function keyed(apiKey: string) {
  return { apiKeyHash: hashApiKey(apiKey), apiKeyHint: apiKeyHint(apiKey) };
}

await migrate();

const [existing] = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
if (existing) {
  console.log("Demo account already exists — skipping seed.");
  console.log("  email:    demo@smarthome.local");
  console.log("  password: demo1234");
  process.exit(0);
}

const userId = "11111111-1111-4111-8111-111111111111";
const livingRoomId = "22222222-2222-4222-8222-222222222222";
const kitchenId = "33333333-3333-4333-8333-333333333333";
const bedroomId = "44444444-4444-4444-8444-444444444444";
const climateId = "55555555-5555-4555-8555-555555555555";
const motionId = "66666666-6666-4666-8666-666666666666";
const soilId = "77777777-7777-4777-8777-777777777777";
const lampId = "88888888-8888-4888-8888-888888888888";

await db.insert(users).values({
  id: userId,
  email: DEMO_EMAIL,
  name: "Demo Home",
  passwordHash: await hashPassword("demo1234"),
  createdAt: now - 86_400_000,
});

await db.insert(rooms).values([
  { id: livingRoomId, userId, name: "Living room", createdAt: now },
  { id: kitchenId, userId, name: "Kitchen", createdAt: now },
  { id: bedroomId, userId, name: "Bedroom", createdAt: now },
]);

await db.insert(devices).values([
  {
    id: climateId,
    userId,
    roomId: livingRoomId,
    name: "Living room climate",
    type: "esp32",
    model: "ESP32-WROOM-32 + DHT22",
    notes: "Temperature and humidity by the sofa.",
    ...keyed("sh_demo_living_room_climate"),
    powerState: "unknown",
    lastSeenAt: now - 20_000,
    createdAt: now - 86_400_000,
  },
  {
    id: motionId,
    userId,
    roomId: kitchenId,
    name: "Kitchen motion",
    type: "nodemcu",
    model: "NodeMCU ESP8266 + PIR",
    notes: null,
    ...keyed("sh_demo_kitchen_motion"),
    powerState: "unknown",
    lastSeenAt: now - 45_000,
    createdAt: now - 86_400_000,
  },
  {
    id: soilId,
    userId,
    roomId: bedroomId,
    name: "Plant soil moisture",
    type: "arduino",
    model: "Arduino Uno + soil probe (via NodeMCU)",
    notes: "Waiting for first firmware flash.",
    ...keyed("sh_demo_bedroom_soil"),
    powerState: "unknown",
    lastSeenAt: null,
    createdAt: now - 3_600_000,
  },
  {
    id: lampId,
    userId,
    roomId: livingRoomId,
    name: "Desk lamp",
    type: "esp32",
    model: "ESP32 relay on GPIO 5",
    notes: "Toggle from the dashboard. Firmware polls commands on each ingest.",
    ...keyed("sh_demo_desk_lamp"),
    powerState: "off",
    lastSeenAt: null,
    createdAt: now - 1_800_000,
  },
]);

const climateReadings = Array.from({ length: 36 }, (_, index) => {
  const receivedAt = now - (35 - index) * 60_000;
  const wave = Math.sin(index / 5);
  return {
    id: `reading-climate-${index}`,
    deviceId: climateId,
    payload: {
      temperature: roundNumber(24.2 + wave * 1.4, 1),
      humidity: roundNumber(48 + wave * 6, 0),
      rssi: -58 - round(Math.abs(wave) * 8),
    },
    receivedAt,
  };
});

await db.insert(readings).values([
  ...climateReadings,
  {
    id: "reading-motion-1",
    deviceId: motionId,
    payload: { motion: true, battery: 91, rssi: -71 },
    receivedAt: now - 45_000,
  },
]);

console.log("Seeded demo home.");
console.log("  email:    demo@smarthome.local");
console.log("  password: demo1234");
console.log("  ingest:   X-Api-Key: sh_demo_living_room_climate");
console.log("  switch:   X-Api-Key: sh_demo_desk_lamp");
process.exit(0);
