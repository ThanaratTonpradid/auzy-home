import { DEVICE_TYPE_LABELS } from "@smart-home/shared";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ReadingChart } from "@/components/ReadingChart";
import { StatusDot } from "@/components/StatusDot";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteDeviceMutation,
  useDeviceCommandMutation,
  useDeviceQuery,
  useReadingsQuery,
  useRegenerateKeyMutation,
} from "@/hooks/use-home";
import { API_URL } from "@/lib/api";
import { firmwareSketch } from "@/lib/firmware";
import { formatRelative, formatValue } from "@/lib/format";

export function DeviceDetailPage() {
  const { id } = useParams({ from: "/devices/$id" });
  const navigate = useNavigate();
  const deviceQuery = useDeviceQuery(id);
  const readingsQuery = useReadingsQuery(id);
  const regenerateKey = useRegenerateKeyMutation(id);
  const deleteDevice = useDeleteDeviceMutation(id);
  const command = useDeviceCommandMutation(id);
  const [copied, setCopied] = useState(false);

  const device = deviceQuery.data;
  const readings = readingsQuery.data ?? [];

  const fields = useMemo(() => {
    const keys = new Set<string>();
    for (const row of readings) {
      for (const key of Object.keys(row.payload)) keys.add(key);
    }
    return [...keys];
  }, [readings]);

  const numericFields = fields.filter((field) =>
    readings.some((row) => typeof row.payload[field] === "number"),
  );

  if (deviceQuery.isError) {
    return (
      <AppShell>
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Device unavailable</AlertTitle>
          <AlertDescription>{deviceQuery.error.message}</AlertDescription>
        </Alert>
      </AppShell>
    );
  }

  if (!device) {
    return (
      <AppShell>
        <Skeleton className="h-12 w-72" />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-3xl" />
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
        {DEVICE_TYPE_LABELS[device.type]}
        {device.roomName ? ` · ${device.roomName}` : ""}
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl tracking-tight">{device.name}</h1>
        <StatusDot status={device.status} />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {device.model || "No model notes"} · last seen {formatRelative(device.lastSeenAt)}
      </p>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {fields.length === 0 && (
          <Card className="border-dashed sm:col-span-2">
            <CardContent className="pt-(--card-spacing) text-sm text-muted-foreground">
              Flash the sketch below. As soon as the board POSTs, values land here.
            </CardContent>
          </Card>
        )}
        {Object.entries(readings[0]?.payload ?? {}).map(([key, value]) => (
          <Card key={key}>
            <CardHeader className="pb-0">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{key}</p>
            </CardHeader>
            <CardContent>
              <p className="font-display text-4xl">{formatValue(key, value)}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        {numericFields.slice(0, 2).map((field) => (
          <ReadingChart key={field} readings={readings} field={field} />
        ))}
      </section>

      <Card className="mt-8">
        <CardHeader>
          <h2 className="font-display text-2xl">Power</h2>
          <p className="text-sm text-muted-foreground">
            Queues an on/off command in Redis. The board picks it up on the next ingest POST.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-sm uppercase tracking-[0.16em] text-muted-foreground">
            {device.powerState}
          </p>
          <Button
            className="rounded-2xl"
            disabled={command.isPending || device.powerState === "on"}
            onClick={() => command.mutate("on")}
          >
            Turn on
          </Button>
          <Button
            variant="secondary"
            className="rounded-2xl"
            disabled={command.isPending || device.powerState === "off"}
            onClick={() => command.mutate("off")}
          >
            Turn off
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <h2 className="font-display text-2xl">Firmware connection</h2>
          <p className="text-sm text-muted-foreground">
            POST JSON to <span className="font-mono text-mist-300">{API_URL}/v1/ingest</span> with{" "}
            <span className="font-mono">X-Api-Key</span>. From the board, use this machine&apos;s LAN IP, not localhost.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <code className="rounded-2xl bg-ink-950 px-3 py-2 font-mono text-xs">
              {device.apiKey ?? `••••${device.apiKeyHint}`}
            </code>
            {device.apiKey && (
              <Button
                variant="secondary"
                className="rounded-2xl"
                onClick={async () => {
                  await navigator.clipboard.writeText(device.apiKey ?? "");
                  setCopied(true);
                }}
              >
                {copied ? "Copied" : "Copy key"}
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="secondary" className="rounded-2xl">
                  Rotate key
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Rotate this API key?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Existing firmware will stop ingesting until you flash the new key.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => regenerateKey.mutate()}>Rotate</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="rounded-2xl">
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this device?</AlertDialogTitle>
                  <AlertDialogDescription>This removes the board and its reading history.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() =>
                      deleteDevice.mutate(undefined, {
                        onSuccess: () => void navigate({ to: "/devices" }),
                      })
                    }
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <pre className="mt-5 overflow-x-auto rounded-2xl bg-ink-950 p-4 font-mono text-[11px] leading-6 text-mist-300">
            {firmwareSketch(device.type, device.apiKey ?? "PASTE_DEVICE_API_KEY")}
          </pre>
        </CardContent>
      </Card>
    </AppShell>
  );
}
