import { createHash } from "node:crypto";

export function hashApiKey(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("hex");
}

export function apiKeyHint(apiKey: string) {
  return apiKey.slice(-4);
}

export function looksLikeApiKey(value: string) {
  return value.startsWith("sh_") && value.length >= 12;
}
