import { afterEach, describe, expect, it, vi } from "vitest";
import { deviceStatus } from "./status.js";

describe("deviceStatus", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("marks never-seen devices as pending", () => {
    expect(deviceStatus(null)).toBe("pending");
  });

  it("marks recent devices online and stale devices offline", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    expect(deviceStatus(1_000_000 - 10_000)).toBe("online");
    expect(deviceStatus(1_000_000 - 3 * 60_000)).toBe("offline");
  });
});
