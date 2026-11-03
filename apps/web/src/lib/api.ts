import type { Device, Overview, PowerAction, Reading, Room, User } from "./types";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  if (response.status === 204) return undefined as T;
  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new ApiError(response.status, data.error ?? "Request failed");
  }
  return data;
}

export const authApi = {
  login: (email: string, password: string) =>
    api<{ token: string; user: User }>("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    api<{ token: string; user: User }>("/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  logout: () => api<{ ok: boolean }>("/v1/auth/logout", { method: "POST" }),
  me: () => api<User>("/v1/me"),
};

export const homeApi = {
  overview: () => api<Overview>("/v1/overview"),
  rooms: () => api<{ rooms: Room[] }>("/v1/rooms"),
  createRoom: (name: string) =>
    api<{ room: Room }>("/v1/rooms", { method: "POST", body: JSON.stringify({ name }) }),
  devices: () => api<{ devices: Device[] }>("/v1/devices"),
  device: (id: string) => api<{ device: Device }>(`/v1/devices/${id}`),
  createDevice: (body: unknown) =>
    api<{ device: Device }>("/v1/devices", { method: "POST", body: JSON.stringify(body) }),
  deleteDevice: (id: string) => api<void>(`/v1/devices/${id}`, { method: "DELETE" }),
  regenerateKey: (id: string) =>
    api<{ device: Device }>(`/v1/devices/${id}/regenerate-key`, { method: "POST" }),
  readings: (id: string, limit = 200) =>
    api<{ readings: Reading[] }>(`/v1/devices/${id}/readings?limit=${limit}`),
  command: (id: string, action: PowerAction) =>
    api<{ command: { id: string; action: PowerAction } }>(`/v1/devices/${id}/commands`, {
      method: "POST",
      body: JSON.stringify({ action }),
    }),
};
