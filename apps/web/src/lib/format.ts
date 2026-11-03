import { SENSOR_UNITS } from "@smart-home/shared";
import { formatNumber, isEmpty, take } from "@smart-home/utils";
import type { ReadingPayload } from "./types";

export {
  dayjs,
  formatCompact,
  formatDateTime,
  formatIso,
  formatNumber,
  formatPercent,
  formatRelative,
  formatTime,
  nowMs,
  numbro,
} from "@smart-home/utils";

export function formatValue(key: string, value: number | boolean | string) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const unit = SENSOR_UNITS[key] ?? "";
  if (typeof value === "number") {
    const rendered = formatNumber(value);
    return unit ? `${rendered}${unit}` : rendered;
  }
  return unit ? `${value} ${unit}` : value;
}

export function readingSummary(
  payload: ReadingPayload | null | undefined,
): Array<[string, number | boolean | string]> {
  if (!payload || isEmpty(payload)) return [];
  return take(Object.entries(payload), 4);
}

export function lanHint() {
  if (typeof window === "undefined") return "http://YOUR_LAN_IP:3001";
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return "http://YOUR_LAN_IP:3001";
  }
  return `http://${host}:3001`;
}
