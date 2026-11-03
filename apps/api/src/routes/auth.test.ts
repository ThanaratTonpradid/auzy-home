import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { eq } from "drizzle-orm";
import { nowMs } from "@smart-home/utils";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { db } from "../db/client.js";
import { migrate } from "../db/migrate.js";
import { devices, readings, rooms, users } from "../db/schema.js";
import { MemoryCommandQueue } from "../lib/commands.js";
import { MemorySessionStore } from "../lib/sessions.js";
import { bindServices } from "../services.js";

const scryptAsync = promisify(scrypt);

const app = createApp({ silent: true });

function cookieFrom(response: Response) {
  const header = response.headers.get("set-cookie") ?? "";
  const match = header.match(/auzy_session=([^;]+)/);
  return match?.[1] ?? null;
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

describe("auth sessions", () => {
  it("sets an httpOnly session cookie on register", async () => {
    const response = await app.request("/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Ada", email: "ada@home.local", password: "password12" }),
    });
    expect(response.status).toBe(201);
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("auzy_session=");
    expect(setCookie.toLowerCase()).toContain("httponly");
    const body = (await response.json()) as { token: string; user: { email: string } };
    expect(body.token.startsWith("sess_")).toBe(true);
    expect(body.user.email).toBe("ada@home.local");
  });

  it("reads the current user from the session cookie", async () => {
    const registered = await app.request("/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Ada", email: "ada@home.local", password: "password12" }),
    });
    const token = cookieFrom(registered);
    const me = await app.request("/v1/me", { headers: { Cookie: `auzy_session=${token}` } });
    expect(me.status).toBe(200);
    await expect(me.json()).resolves.toMatchObject({ email: "ada@home.local", name: "Ada" });
  });

  it("rejects a revoked session after logout", async () => {
    const registered = await app.request("/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Ada", email: "ada@home.local", password: "password12" }),
    });
    const token = cookieFrom(registered);
    const logout = await app.request("/v1/auth/logout", {
      method: "POST",
      headers: { Cookie: `auzy_session=${token}` },
    });
    expect(logout.status).toBe(200);
    const me = await app.request("/v1/me", { headers: { Cookie: `auzy_session=${token}` } });
    expect(me.status).toBe(401);
  });

  it("upgrades a legacy scrypt hash to Argon2id on login", async () => {
    const salt = randomBytes(16);
    const derived = (await scryptAsync("password12", salt, 64)) as Buffer;
    await db.insert(users).values({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      email: "legacy@home.local",
      name: "Legacy",
      passwordHash: `${salt.toString("hex")}:${derived.toString("hex")}`,
      createdAt: nowMs(),
    });

    const response = await app.request("/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "legacy@home.local", password: "password12" }),
    });
    expect(response.status).toBe(200);

    const [row] = await db.select().from(users).where(eq(users.email, "legacy@home.local")).limit(1);
    expect(row?.passwordHash.startsWith("$argon2id$")).toBe(true);
  });
});
