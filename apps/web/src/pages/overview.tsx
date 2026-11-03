import { Link } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOverviewQuery } from "@/hooks/use-home";
import { formatRelative, formatValue } from "@/lib/format";

export function OverviewPage() {
  const overview = useOverviewQuery();

  return (
    <AppShell>
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">Today in the house</p>
      <h1 className="mt-2 font-display text-5xl tracking-tight">Overview</h1>
      {overview.isError && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle />
          <AlertTitle>Could not load overview</AlertTitle>
          <AlertDescription>{overview.error.message}</AlertDescription>
        </Alert>
      )}
      {overview.isPending && (
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-3xl" />
          ))}
        </section>
      )}
      {overview.data && (
        <>
          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Devices" value={overview.data.deviceCount} />
            <Stat label="Online now" value={overview.data.onlineCount} accent />
            <Stat label="Rooms" value={overview.data.roomCount} />
            <Stat label="Readings (24h)" value={overview.data.readingCount24h} />
          </section>
          <section className="mt-10">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-2xl">Latest packets</h2>
              <Link to="/devices" className="text-sm text-primary">
                All devices
              </Link>
            </div>
            <Card className="mt-4">
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {overview.data.recent.length === 0 && (
                    <li className="px-5 py-8 text-sm text-muted-foreground">
                      No telemetry yet. Register a board and POST to /v1/ingest.
                    </li>
                  )}
                  {overview.data.recent.map((row) => (
                    <li
                      key={`${row.deviceId}-${row.receivedAt}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                    >
                      <div>
                        <Link to="/devices/$id" params={{ id: row.deviceId }} className="hover:text-primary">
                          {row.deviceName}
                        </Link>
                        <p className="font-mono text-xs text-muted-foreground">{formatRelative(row.receivedAt)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(row.payload).map(([key, value]) => (
                          <span key={key} className="rounded-full bg-ink-900 px-3 py-1 font-mono text-xs text-mist-300">
                            {key} {formatValue(key, value)}
                          </span>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </AppShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      </CardHeader>
      <CardContent>
        <p className={`font-display text-4xl ${accent ? "text-primary" : ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
