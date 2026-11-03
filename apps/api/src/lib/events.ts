export type TelemetryEvent = {
  type: "reading";
  userId: string;
  deviceId: string;
  payload: Record<string, number | boolean | string>;
  receivedAt: number;
};

type Listener = (event: TelemetryEvent) => void;

const listeners = new Set<Listener>();

export function publish(event: TelemetryEvent) {
  for (const listener of listeners) listener(event);
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
