import numbro from "numbro";
import { round } from "lodash-es";

export { numbro };

/** Format a number with optional mantissa (default 1 for floats, 0 for ints). */
export function formatNumber(value: number, mantissa?: number) {
  const digits = mantissa ?? (Number.isInteger(value) ? 0 : 1);
  return numbro(value).format({
    thousandSeparated: true,
    mantissa: digits,
    trimMantissa: true,
  });
}

/** Round a number to a fixed number of decimal places. */
export function roundNumber(value: number, mantissa = 1) {
  return round(value, mantissa);
}

/** Format a ratio as a percent string, e.g. 0.47 → "47%". */
export function formatPercent(value: number, mantissa = 0) {
  return numbro(value).format({
    output: "percent",
    mantissa,
    trimMantissa: true,
  });
}

/** Compact display for large counters (1.2k, 3.4m). */
export function formatCompact(value: number) {
  return numbro(value).format({
    average: true,
    mantissa: 1,
    trimMantissa: true,
  });
}
