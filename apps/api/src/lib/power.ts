import type { PowerState } from "@smart-home/shared";

export function powerFromPayload(
  payload: Record<string, number | boolean | string>,
): PowerState | null {
  const value = payload.power ?? payload.relay ?? payload.switch;
  if (value === true || value === 1 || value === "on") return "on";
  if (value === false || value === 0 || value === "off") return "off";
  return null;
}
