import { z } from "zod";

const readingValue = z.union([
  z.number().finite(),
  z.boolean(),
  z.string().max(64),
]);

export const ingestSchema = z
  .record(z.string().min(1).max(32), z.unknown())
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "Send at least one sensor field",
  })
  .refine((payload) => Object.keys(payload).length <= 32, {
    message: "Too many fields (max 32)",
  });

export type IngestPayload = z.infer<typeof ingestSchema>;
export type ReadingValue = z.infer<typeof readingValue>;

export function normalizeReadings(
  payload: Record<string, unknown>,
): Record<string, number | boolean | string> {
  const source =
    payload.readings && typeof payload.readings === "object" && !Array.isArray(payload.readings)
      ? (payload.readings as Record<string, unknown>)
      : payload;

  const readings: Record<string, number | boolean | string> = {};

  for (const [key, value] of Object.entries(source)) {
    if (key === "readings") continue;
    const parsed = readingValue.safeParse(value);
    if (parsed.success) {
      readings[key] = parsed.data;
    }
  }

  return readings;
}

export const SENSOR_UNITS: Record<string, string> = {
  temperature: "°C",
  temp: "°C",
  humidity: "%",
  pressure: "hPa",
  light: "lx",
  lux: "lx",
  motion: "",
  co2: "ppm",
  voc: "ppb",
  voltage: "V",
  battery: "%",
  rssi: "dBm",
  pm25: "µg/m³",
  soil: "%",
  power: "",
  relay: "",
};
