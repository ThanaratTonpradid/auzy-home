import { formatNumber, max as maxOf, min as minOf, roundNumber } from "@smart-home/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatTime } from "@/lib/format";
import type { Reading } from "@/lib/types";

export function ReadingChart({ readings, field }: { readings: Reading[]; field: string }) {
  const series = [...readings]
    .reverse()
    .map((row) => ({ t: row.receivedAt, v: row.payload[field] }))
    .filter((row): row is { t: number; v: number } => typeof row.v === "number");

  if (series.length < 2) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex h-56 items-center justify-center text-sm text-muted-foreground">
          Not enough numeric samples for {field} yet.
        </CardContent>
      </Card>
    );
  }

  const min = minOf(series.map((row) => row.v)) ?? 0;
  const max = maxOf(series.map((row) => row.v)) ?? 0;
  const span = max - min || 1;
  const width = 640;
  const height = 220;
  const pad = 28;
  const coords = series.map((row, index) => {
    const x = pad + (index / (series.length - 1)) * (width - pad * 2);
    const y = height - pad - ((row.v - min) / span) * (height - pad * 2);
    return { x, y, ...row };
  });
  const path = coords
    .map((p, i) => `${i === 0 ? "M" : "L"} ${roundNumber(p.x, 1)} ${roundNumber(p.y, 1)}`)
    .join(" ");
  const area = `${path} L ${coords[coords.length - 1]?.x} ${height - pad} L ${coords[0]?.x} ${height - pad} Z`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-baseline justify-between">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{field}</p>
        <p className="font-mono text-sm text-mist-300">
          {formatNumber(min, 1)} – {formatNumber(max, 1)}
        </p>
      </CardHeader>
      <CardContent>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full">
        <defs>
          <linearGradient id={`fill-${field}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#fill-${field})`} />
        <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2.2" />
        <text x={pad} y={18} fill="var(--muted-foreground)" fontSize="11" fontFamily="ui-monospace">
          {formatNumber(max, 1)}
        </text>
        <text x={pad} y={height - 8} fill="var(--muted-foreground)" fontSize="11" fontFamily="ui-monospace">
          {formatTime(series[0]?.t ?? 0)}
        </text>
        <text x={width - 120} y={height - 8} fill="var(--muted-foreground)" fontSize="11" fontFamily="ui-monospace">
          {formatTime(series[series.length - 1]?.t ?? 0)}
        </text>
      </svg>
      </CardContent>
    </Card>
  );
}
