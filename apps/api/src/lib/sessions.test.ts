import { nowMs } from "@smart-home/utils";
import { describe, expect, it } from "vitest";
import { MemorySessionStore } from "./sessions.js";

describe("MemorySessionStore", () => {
  it("creates and reads a user session", async () => {
    const store = new MemorySessionStore();
    const session = await store.createUser({
      userId: "user-1",
      email: "a@home.local",
      name: "Ada",
      createdAt: nowMs(),
    });

    expect(session.id.startsWith("sess_")).toBe(true);
    await expect(store.getUser(session.id)).resolves.toMatchObject({ userId: "user-1", email: "a@home.local" });
  });

  it("deletes a user session", async () => {
    const store = new MemorySessionStore();
    const session = await store.createUser({
      userId: "user-1",
      email: "a@home.local",
      name: "Ada",
      createdAt: nowMs(),
    });
    await store.deleteUser(session.id);
    await expect(store.getUser(session.id)).resolves.toBeNull();
  });

  it("stores a device session and auth lookup", async () => {
    const store = new MemorySessionStore();
    await store.putDevice({
      deviceId: "dev-1",
      userId: "user-1",
      lastSeenAt: 1,
      powerState: "on",
    });
    await store.cacheDeviceAuth({ deviceId: "dev-1", userId: "user-1", keyHash: "abc" });

    await expect(store.getDevice("dev-1")).resolves.toMatchObject({ powerState: "on" });
    await expect(store.lookupDeviceAuth("abc")).resolves.toMatchObject({ deviceId: "dev-1" });
  });
});
