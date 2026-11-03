import { DEVICE_TYPE_LABELS } from "@smart-home/shared";
import { Link } from "@tanstack/react-router";
import { StatusDot } from "@/components/StatusDot";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelative, formatValue, readingSummary } from "@/lib/format";
import type { Device } from "@/lib/types";

export function DeviceCard({ device }: { device: Device }) {
  const readings = readingSummary(device.latest);

  return (
    <Link to="/devices/$id" params={{ id: device.id }} className="block">
      <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-glow">
        <CardHeader>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {DEVICE_TYPE_LABELS[device.type]}
            {device.roomName ? ` · ${device.roomName}` : ""}
          </p>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="font-display text-2xl tracking-tight">{device.name}</CardTitle>
            <div className="flex flex-col items-end gap-2">
              <StatusDot status={device.status} />
              {device.powerState !== "unknown" && (
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  {device.powerState}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3">
            {readings.length === 0 ? (
              <p className="col-span-2 text-sm text-muted-foreground">Waiting for the first ingest packet.</p>
            ) : (
              readings.map(([key, value]) => (
                <div key={key} className="rounded-2xl bg-ink-900/80 px-3 py-2">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{key}</dt>
                  <dd className="mt-1 truncate font-mono text-lg">{formatValue(key, value)}</dd>
                </div>
              ))
            )}
          </dl>
        </CardContent>
        <CardFooter className="border-0 bg-transparent text-xs text-muted-foreground">
          {formatRelative(device.lastSeenAt)}
        </CardFooter>
      </Card>
    </Link>
  );
}
