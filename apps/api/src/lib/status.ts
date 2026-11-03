import { OFFLINE_AFTER_MS } from "@smart-home/shared";
import { nowMs } from "@smart-home/utils";

export function deviceStatus(lastSeenAt: number | null) {
  if (!lastSeenAt) return "pending" as const;
  return nowMs() - lastSeenAt < OFFLINE_AFTER_MS ? ("online" as const) : ("offline" as const);
}
