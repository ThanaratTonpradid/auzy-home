import { randomBytes } from "node:crypto";
import {
  DEVICE_SESSION_TTL_SEC,
  USER_SESSION_TTL_SEC,
  type PowerState,
} from "@smart-home/shared";
import { nowMs } from "@smart-home/utils";

export type UserSession = {
  id: string;
  userId: string;
  email: string;
  name: string;
  createdAt: number;
};

export type DeviceSession = {
  deviceId: string;
  userId: string;
  lastSeenAt: number;
  powerState: PowerState;
};

export type DeviceAuth = {
  deviceId: string;
  userId: string;
  keyHash: string;
};

export interface SessionStore {
  createUser(input: Omit<UserSession, "id">): Promise<UserSession>;
  getUser(token: string): Promise<UserSession | null>;
  deleteUser(token: string): Promise<void>;
  touchUser(token: string): Promise<void>;

  putDevice(session: DeviceSession): Promise<void>;
  getDevice(deviceId: string): Promise<DeviceSession | null>;
  deleteDevice(deviceId: string): Promise<void>;

  cacheDeviceAuth(auth: DeviceAuth): Promise<void>;
  lookupDeviceAuth(keyHash: string): Promise<DeviceAuth | null>;
  deleteDeviceAuth(keyHash: string): Promise<void>;
}

export function sessionToken() {
  return `sess_${randomBytes(32).toString("base64url")}`;
}

export class MemorySessionStore implements SessionStore {
  private users = new Map<string, { session: UserSession; expiresAt: number }>();
  private devices = new Map<string, { session: DeviceSession; expiresAt: number }>();
  private auth = new Map<string, { auth: DeviceAuth; expiresAt: number }>();

  async createUser(input: Omit<UserSession, "id">) {
    const session: UserSession = { ...input, id: sessionToken() };
    this.users.set(session.id, {
      session,
      expiresAt: nowMs() + USER_SESSION_TTL_SEC * 1000,
    });
    return session;
  }

  async getUser(token: string) {
    return this.read(this.users, token)?.session ?? null;
  }

  async deleteUser(token: string) {
    this.users.delete(token);
  }

  async touchUser(token: string) {
    const row = this.read(this.users, token);
    if (row) row.expiresAt = nowMs() + USER_SESSION_TTL_SEC * 1000;
  }

  async putDevice(session: DeviceSession) {
    this.devices.set(session.deviceId, {
      session,
      expiresAt: nowMs() + DEVICE_SESSION_TTL_SEC * 1000,
    });
  }

  async getDevice(deviceId: string) {
    return this.read(this.devices, deviceId)?.session ?? null;
  }

  async deleteDevice(deviceId: string) {
    this.devices.delete(deviceId);
  }

  async cacheDeviceAuth(auth: DeviceAuth) {
    this.auth.set(auth.keyHash, {
      auth,
      expiresAt: nowMs() + 24 * 60 * 60 * 1000,
    });
  }

  async lookupDeviceAuth(keyHash: string) {
    return this.read(this.auth, keyHash)?.auth ?? null;
  }

  async deleteDeviceAuth(keyHash: string) {
    this.auth.delete(keyHash);
  }

  private read<T>(map: Map<string, { expiresAt: number } & T>, key: string) {
    const row = map.get(key);
    if (!row) return null;
    if (row.expiresAt <= nowMs()) {
      map.delete(key);
      return null;
    }
    return row;
  }
}
