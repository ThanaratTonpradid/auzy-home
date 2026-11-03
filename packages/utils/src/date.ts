import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

function resolveTimezone() {
  try {
    const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
    return env?.TZ || env?.APP_TIMEZONE || "Asia/Bangkok";
  } catch {
    return "Asia/Bangkok";
  }
}

/** App-wide timezone for DB localtime + display formatting. */
export const APP_TIMEZONE = resolveTimezone();

dayjs.tz.setDefault(APP_TIMEZONE);

export { dayjs };

function atZone(ts?: number | Date | null) {
  if (ts == null) return dayjs().tz();
  return dayjs(ts).tz();
}

/** Current unix time in milliseconds. */
export function nowMs() {
  return atZone().valueOf();
}

/** Format a unix-ms timestamp as a short clock time (Asia/Bangkok by default). */
export function formatTime(ts: number | null | undefined, fallback = "Never") {
  if (ts == null || !Number.isFinite(ts)) return fallback;
  return atZone(ts).format("HH:mm:ss");
}

/** Human relative time from a unix-ms timestamp. */
export function formatRelative(ts: number | null | undefined, fallback = "No data yet") {
  if (ts == null || !Number.isFinite(ts)) return fallback;
  const then = atZone(ts);
  if (atZone().diff(then, "second") < 10) return "Just now";
  return then.fromNow();
}

/** Absolute datetime for logs, tooltips, and detail views. */
export function formatDateTime(ts: number | null | undefined, fallback = "—") {
  if (ts == null || !Number.isFinite(ts)) return fallback;
  return atZone(ts).format("YYYY-MM-DD HH:mm:ss");
}

/** ISO-8601 timestamp with Asia/Bangkok offset (+07:00). */
export function formatIso(ts: number | Date | null | undefined = nowMs()) {
  return atZone(ts).format();
}
