import { hash, parseOptions, verify } from "@node-rs/argon2";
import { scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

/** Argon2id. Const enum from @node-rs/argon2 cannot be imported under isolatedModules. */
const ARGON2ID = 2;

/** OWASP Argon2id defaults: 19 MiB, 2 iterations, 1 thread. */
export const ARGON2_OPTIONS = {
  algorithm: ARGON2ID,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} as const;

export async function hashPassword(password: string) {
  return hash(password, ARGON2_OPTIONS);
}

export function needsRehash(stored: string) {
  if (!stored.startsWith("$argon2")) return true;
  try {
    const parsed = parseOptions(stored);
    return (
      parsed.algorithm !== ARGON2_OPTIONS.algorithm ||
      parsed.memoryCost !== ARGON2_OPTIONS.memoryCost ||
      parsed.timeCost !== ARGON2_OPTIONS.timeCost ||
      parsed.parallelism !== ARGON2_OPTIONS.parallelism ||
      parsed.outputLen !== ARGON2_OPTIONS.outputLen
    );
  } catch {
    return true;
  }
}

export async function verifyPassword(password: string, stored: string) {
  if (stored.startsWith("$argon2")) {
    try {
      return await verify(stored, password);
    } catch {
      return false;
    }
  }
  return verifyLegacyScrypt(password, stored);
}

async function verifyLegacyScrypt(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
