import type { PowerAction } from "@smart-home/shared";
import { clamp } from "@smart-home/utils";

export type DeviceCommand = {
  id: string;
  deviceId: string;
  action: PowerAction;
  createdAt: number;
};

export interface CommandQueue {
  enqueue(command: DeviceCommand): Promise<void>;
  dequeue(deviceId: string, limit?: number): Promise<DeviceCommand[]>;
  pendingCount(deviceId: string): Promise<number>;
  clear(deviceId: string): Promise<void>;
}

export class MemoryCommandQueue implements CommandQueue {
  private lists = new Map<string, DeviceCommand[]>();

  async enqueue(command: DeviceCommand) {
    const list = this.lists.get(command.deviceId) ?? [];
    list.push(command);
    this.lists.set(command.deviceId, list);
  }

  async dequeue(deviceId: string, limit = 8) {
    const list = this.lists.get(deviceId) ?? [];
    const taken = list.splice(0, clamp(limit, 1, Number.MAX_SAFE_INTEGER));
    if (list.length === 0) this.lists.delete(deviceId);
    else this.lists.set(deviceId, list);
    return taken;
  }

  async pendingCount(deviceId: string) {
    return this.lists.get(deviceId)?.length ?? 0;
  }

  async clear(deviceId: string) {
    this.lists.delete(deviceId);
  }
}
