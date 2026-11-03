import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { hashPassword, needsRehash, verifyPassword } from "./password.js";

const scryptAsync = promisify(scrypt);

async function legacyScryptHash(password: string) {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

describe("password hashing", () => {
  it("stores Argon2id hashes and verifies the original password", async () => {
    const stored = await hashPassword("demo1234");
    expect(stored.startsWith("$argon2id$")).toBe(true);
    expect(stored).not.toContain("demo1234");
    await expect(verifyPassword("demo1234", stored)).resolves.toBe(true);
    await expect(verifyPassword("nope", stored)).resolves.toBe(false);
    expect(needsRehash(stored)).toBe(false);
  });

  it("still verifies legacy scrypt hashes and marks them for upgrade", async () => {
    const stored = await legacyScryptHash("demo1234");
    expect(stored.startsWith("$argon2")).toBe(false);
    expect(needsRehash(stored)).toBe(true);
    await expect(verifyPassword("demo1234", stored)).resolves.toBe(true);
    await expect(verifyPassword("nope", stored)).resolves.toBe(false);
  });
});
