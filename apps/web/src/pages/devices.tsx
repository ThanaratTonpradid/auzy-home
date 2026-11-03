import { Link } from "@tanstack/react-router";
import { AlertCircle, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DeviceCard } from "@/components/DeviceCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDevicesQuery } from "@/hooks/use-home";

export function DevicesPage() {
  const devices = useDevicesQuery();

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">Fleet</p>
          <h1 className="mt-2 font-display text-5xl tracking-tight">Devices</h1>
        </div>
        <Button className="h-9 rounded-2xl" asChild>
          <Link to="/devices/new">
            <Plus />
            Register device
          </Link>
        </Button>
      </div>
      {devices.isError && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle />
          <AlertTitle>Could not load devices</AlertTitle>
          <AlertDescription>{devices.error.message}</AlertDescription>
        </Alert>
      )}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {devices.isPending &&
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-48 rounded-3xl" />)}
        {(devices.data ?? []).map((device) => (
          <DeviceCard key={device.id} device={device} />
        ))}
      </div>
      {devices.data?.length === 0 && (
        <p className="mt-10 text-muted-foreground">
          No boards yet. Register an ESP32, NodeMCU, or Arduino to get an API key.
        </p>
      )}
    </AppShell>
  );
}
