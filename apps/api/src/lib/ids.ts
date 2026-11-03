import { randomBytes, randomUUID } from "node:crypto";

export const id = () => randomUUID();

export function deviceApiKey() {
  return `sh_${randomBytes(24).toString("base64url")}`;
}
