import type Redis from "ioredis";
import {
  DEVICE_SESSION_TTL_SEC,
  USER_SESSION_TTL_SEC,
} from "@smart-home/shared";
import { clamp } from "@smart-home/utils";
import type { CommandQueue, DeviceCommand } from "./commands.js";
import { sessionToken, type DeviceAuth, type DeviceSession, type SessionStore, type UserSession } from "./sessions.js";

const AUTH_TTL_SEC = 24 * 60 * 60;

export class RedisStore implements SessionStore, CommandQueue {
  constructor(private redis: Redis) {}

  async createUser(input: Omit<UserSession, "id">) {
    const session: UserSession = { ...input, id: sessionToken() };
    await this.redis.set(this.userKey(session.id), JSON.stringify(session), "EX", USER_SESSION_TTL_SEC);
    return session;
  }

  async getUser(token: string) {
    const raw = await this.redis.get(this.userKey(token));
    return raw ? (JSON.parse(raw) as UserSession) : null;
  }

  async deleteUser(token: string) {
    await this.redis.del(this.userKey(token));
  }

  async touchUser(token: string) {
    await this.redis.expire(this.userKey(token), USER_SESSION_TTL_SEC);
  }

  async putDevice(session: DeviceSession) {
    await this.redis.set(
      this.deviceKey(session.deviceId),
      JSON.stringify(session),
      "EX",
      DEVICE_SESSION_TTL_SEC,
    );
  }

  async getDevice(deviceId: string) {
    const raw = await this.redis.get(this.deviceKey(deviceId));
    return raw ? (JSON.parse(raw) as DeviceSession) : null;
  }

  async deleteDevice(deviceId: string) {
    await this.redis.del(this.deviceKey(deviceId), this.commandKey(deviceId));
  }

  async cacheDeviceAuth(auth: DeviceAuth) {
    await this.redis.set(this.authKey(auth.keyHash), JSON.stringify(auth), "EX", AUTH_TTL_SEC);
  }

  async lookupDeviceAuth(keyHash: string) {
    const raw = await this.redis.get(this.authKey(keyHash));
    return raw ? (JSON.parse(raw) as DeviceAuth) : null;
  }

  async deleteDeviceAuth(keyHash: string) {
    await this.redis.del(this.authKey(keyHash));
  }

  async enqueue(command: DeviceCommand) {
    await this.redis.rpush(this.commandKey(command.deviceId), JSON.stringify(command));
  }

  async dequeue(deviceId: string, limit = 8) {
    const commands: DeviceCommand[] = [];
    const takeCount = clamp(limit, 1, Number.MAX_SAFE_INTEGER);
    for (let i = 0; i < takeCount; i += 1) {
      const raw = await this.redis.lpop(this.commandKey(deviceId));
      if (!raw) break;
      commands.push(JSON.parse(raw) as DeviceCommand);
    }
    return commands;
  }

  async pendingCount(deviceId: string) {
    return this.redis.llen(this.commandKey(deviceId));
  }

  async clear(deviceId: string) {
    await this.redis.del(this.commandKey(deviceId));
  }

  private userKey(token: string) {
    return `auzy:user:${token}`;
  }

  private deviceKey(deviceId: string) {
    return `auzy:device:${deviceId}`;
  }

  private authKey(keyHash: string) {
    return `auzy:device-auth:${keyHash}`;
  }

  private commandKey(deviceId: string) {
    return `auzy:commands:${deviceId}`;
  }
}
