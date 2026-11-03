import type { DeviceType, PowerState } from "@smart-home/shared";

export type DeviceStatus = "online" | "offline" | "pending";
export type PowerAction = "on" | "off";
export type ReadingPayload = Record<string, number | boolean | string>;

export type User = {
  id: string;
  email: string;
  name: string;
};

export type Room = {
  id: string;
  name: string;
  createdAt: number;
};

export type Device = {
  id: string;
  name: string;
  type: DeviceType;
  model: string | null;
  notes: string | null;
  roomId: string | null;
  roomName: string | null;
  apiKey?: string;
  apiKeyHint: string;
  powerState: PowerState;
  lastSeenAt: number | null;
  createdAt: number;
  status: DeviceStatus;
  latest?: ReadingPayload | null;
};

export type Reading = {
  id: string;
  deviceId: string;
  payload: ReadingPayload;
  receivedAt: number;
};

export type Overview = {
  deviceCount: number;
  onlineCount: number;
  pendingCount: number;
  roomCount: number;
  readingCount24h: number;
  recent: Array<{
    deviceId: string;
    deviceName: string;
    payload: ReadingPayload;
    receivedAt: number;
  }>;
};
