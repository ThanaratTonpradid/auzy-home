import type { PowerState } from "@smart-home/shared";
import { devices } from "../db/schema.js";
import { deviceStatus } from "./status.js";

type DeviceRow = typeof devices.$inferSelect;

export function publicDevice(
  device: DeviceRow,
  extras: { apiKey?: string; roomName?: string | null } = {},
) {
  return {
    id: device.id,
    name: device.name,
    type: device.type,
    model: device.model,
    notes: device.notes,
    roomId: device.roomId,
    roomName: extras.roomName ?? null,
    apiKeyHint: device.apiKeyHint,
    apiKey: extras.apiKey,
    powerState: device.powerState as PowerState,
    lastSeenAt: device.lastSeenAt,
    createdAt: device.createdAt,
    status: deviceStatus(device.lastSeenAt),
  };
}
