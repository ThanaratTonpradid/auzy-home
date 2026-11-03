import { describe, expect, it } from "vitest";
import { powerFromPayload } from "./power.js";

describe("powerFromPayload", () => {
  it("reads boolean, numeric, and string power fields", () => {
    expect(powerFromPayload({ power: true })).toBe("on");
    expect(powerFromPayload({ power: 0 })).toBe("off");
    expect(powerFromPayload({ relay: "on" })).toBe("on");
    expect(powerFromPayload({ switch: "off" })).toBe("off");
    expect(powerFromPayload({ temperature: 21 })).toBeNull();
  });
});
