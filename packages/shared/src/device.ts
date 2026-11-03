import { z } from "zod";

export const DEVICE_TYPES = [
  "esp32",
  "esp8266",
  "nodemcu",
  "arduino",
  "raspberry-pi",
  "other",
] as const;

export type DeviceType = (typeof DEVICE_TYPES)[number];

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  esp32: "ESP32",
  esp8266: "ESP8266",
  nodemcu: "NodeMCU",
  arduino: "Arduino",
  "raspberry-pi": "Raspberry Pi",
  other: "Other",
};

export const createRoomSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const createDeviceSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum(DEVICE_TYPES),
  roomId: z.string().uuid().nullable().optional(),
  model: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const updateDeviceSchema = createDeviceSchema.partial();

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;

export const OFFLINE_AFTER_MS = 2 * 60 * 1000;
