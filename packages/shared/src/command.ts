import { z } from "zod";

export const POWER_ACTIONS = ["on", "off"] as const;
export type PowerAction = (typeof POWER_ACTIONS)[number];

export const POWER_STATES = ["on", "off", "unknown"] as const;
export type PowerState = (typeof POWER_STATES)[number];

export const deviceCommandSchema = z.object({
  action: z.enum(POWER_ACTIONS),
});

export type DeviceCommandInput = z.infer<typeof deviceCommandSchema>;

export const DEVICE_SESSION_TTL_SEC = 180;
export const USER_SESSION_TTL_SEC = 14 * 24 * 60 * 60;
