import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export { dayjs };

/** Current unix time in milliseconds. */
export function nowMs() {
  return dayjs().valueOf();
}

/** Format a unix-ms timestamp as a short clock time. */
export function formatTime(ts: number | null | undefined, fallback = "Never") {
  if (ts == null || !Number.isFinite(ts)) return fallback;
  return dayjs(ts).format("HH:mm:ss");
}

/** Human relative time from a unix-ms timestamp. */
export function formatRelative(ts: number | null | undefined, fallback = "No data yet") {
  if (ts == null || !Number.isFinite(ts)) return fallback;
  const then = dayjs(ts);
  if (dayjs().diff(then, "second") < 10) return "Just now";
  return then.fromNow();
}

/** Absolute datetime for logs, tooltips, and detail views. */
export function formatDateTime(ts: number | null | undefined, fallback = "—") {
  if (ts == null || !Number.isFinite(ts)) return fallback;
  return dayjs(ts).format("YYYY-MM-DD HH:mm:ss");
}

/** ISO-8601 timestamp for logs. */
export function formatIso(ts: number | Date | null | undefined = nowMs()) {
  if (ts == null) return dayjs().toISOString();
  return dayjs(ts).toISOString();
}
