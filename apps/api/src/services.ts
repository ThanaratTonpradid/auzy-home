import type { CommandQueue } from "./lib/commands.js";
import { MemoryCommandQueue } from "./lib/commands.js";
import { MemorySessionStore, type SessionStore } from "./lib/sessions.js";

export type AppServices = {
  sessions: SessionStore;
  commands: CommandQueue;
};

export const services: AppServices = {
  sessions: new MemorySessionStore(),
  commands: new MemoryCommandQueue(),
};

export function bindServices(next: AppServices) {
  services.sessions = next.sessions;
  services.commands = next.commands;
}
