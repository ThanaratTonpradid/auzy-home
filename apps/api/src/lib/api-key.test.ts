import { describe, expect, it } from "vitest";
import { apiKeyHint, hashApiKey, looksLikeApiKey } from "./api-key.js";

describe("api keys", () => {
  it("hashes keys without revealing the original", () => {
    const key = "sh_demo_living_room_climate";
    const hashed = hashApiKey(key);
    expect(hashed).toHaveLength(64);
    expect(hashed).not.toContain(key);
    expect(hashApiKey(key)).toBe(hashed);
    expect(hashApiKey("sh_other")).not.toBe(hashed);
  });

  it("keeps a short hint", () => {
    expect(apiKeyHint("sh_demo_living_room_climate")).toBe("mate");
    expect(looksLikeApiKey("sh_abcdefghijkl")).toBe(true);
    expect(looksLikeApiKey("nope")).toBe(false);
  });
});
