import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { db } from "../db/client.js";
import { migrate } from "../db/migrate.js";
import { devices, readings, rooms, users } from "../db/schema.js";
import { MemoryCommandQueue } from "../lib/commands.js";
import { MemorySessionStore } from "../lib/sessions.js";
import { bindServices } from "../services.js";

const app = createApp({ silent: true });

function cookieFrom(response: Response) {
  const header = response.headers.get("set-cookie") ?? "";
  const match = header.match(/auzy_session=([^;]+)/);
  return match?.[1] ?? "";
}

async function signedIn() {
  const registered = await app.request("/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Ada", email: "ada@home.local", password: "password12" }),
  });
  const token = cookieFrom(registered);
  return { cookie: `auzy_session=${token}` };
}

beforeAll(async () => {
  bindServices({ sessions: new MemorySessionStore(), commands: new MemoryCommandQueue() });
  await migrate();
});

beforeEach(async () => {
  bindServices({ sessions: new MemorySessionStore(), commands: new MemoryCommandQueue() });
  await db.delete(readings);
  await db.delete(devices);
  await db.delete(rooms);
  await db.delete(users);
});

describe("device power commands", () => {
  it("queues an on command and delivers it on ingest", async () => {
    const { cookie } = await signedIn();
    const created = await app.request("/v1/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "Desk lamp", type: "esp32" }),
    });
    expect(created.status).toBe(201);
    const { device } = (await created.json()) as { device: { id: string; apiKey: string } };

    const queued = await app.request(`/v1/devices/${device.id}/commands`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ action: "on" }),
    });
    expect(queued.status).toBe(202);

    const ingest = await app.request("/v1/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": device.apiKey },
      body: JSON.stringify({ power: false, rssi: -60 }),
    });
    expect(ingest.status).toBe(202);
    const body = (await ingest.json()) as { commands: Array<{ action: string }> };
    expect(body.commands).toEqual([expect.objectContaining({ action: "on" })]);

    const polled = await app.request("/v1/commands", {
      headers: { "X-Api-Key": device.apiKey },
    });
    const leftover = (await polled.json()) as { commands: unknown[] };
    expect(leftover.commands).toEqual([]);
  });

  it("does not return the raw API key on later device reads", async () => {
    const { cookie } = await signedIn();
    const created = await app.request("/v1/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "Desk lamp", type: "esp32" }),
    });
    const { device } = (await created.json()) as { device: { id: string; apiKey: string; apiKeyHint: string } };
    expect(device.apiKey.startsWith("sh_")).toBe(true);

    const detail = await app.request(`/v1/devices/${device.id}`, { headers: { Cookie: cookie } });
    const listed = (await detail.json()) as { device: { apiKey?: string; apiKeyHint: string } };
    expect(listed.device.apiKey).toBeUndefined();
    expect(listed.device.apiKeyHint).toBe(device.apiKeyHint);
  });
});
