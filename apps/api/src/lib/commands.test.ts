import { describe, expect, it } from "vitest";
import { MemoryCommandQueue } from "./commands.js";

describe("MemoryCommandQueue", () => {
  it("dequeues commands in FIFO order", async () => {
    const queue = new MemoryCommandQueue();
    await queue.enqueue({ id: "1", deviceId: "lamp", action: "on", createdAt: 1 });
    await queue.enqueue({ id: "2", deviceId: "lamp", action: "off", createdAt: 2 });

    await expect(queue.pendingCount("lamp")).resolves.toBe(2);
    const first = await queue.dequeue("lamp", 1);
    expect(first.map((row) => row.id)).toEqual(["1"]);
    const rest = await queue.dequeue("lamp");
    expect(rest.map((row) => row.id)).toEqual(["2"]);
    await expect(queue.pendingCount("lamp")).resolves.toBe(0);
  });

  it("isolates queues per device", async () => {
    const queue = new MemoryCommandQueue();
    await queue.enqueue({ id: "1", deviceId: "a", action: "on", createdAt: 1 });
    await queue.enqueue({ id: "2", deviceId: "b", action: "off", createdAt: 1 });
    await expect(queue.dequeue("a")).resolves.toEqual([
      expect.objectContaining({ id: "1", deviceId: "a" }),
    ]);
    await expect(queue.pendingCount("b")).resolves.toBe(1);
  });
});
