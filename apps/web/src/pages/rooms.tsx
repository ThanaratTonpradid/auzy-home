import { AlertCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateRoomMutation, useDevicesQuery, useRoomsQuery } from "@/hooks/use-home";

export function RoomsPage() {
  const rooms = useRoomsQuery();
  const devices = useDevicesQuery();
  const createRoom = useCreateRoomMutation();
  const [name, setName] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    createRoom.mutate(name, {
      onSuccess: () => setName(""),
    });
  }

  const error = rooms.error ?? devices.error ?? createRoom.error;

  return (
    <AppShell>
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">Spaces</p>
      <h1 className="mt-2 font-display text-5xl tracking-tight">Rooms</h1>
      <form onSubmit={onSubmit} className="mt-8 flex max-w-xl gap-3">
        <Input
          className="h-11 flex-1 rounded-2xl"
          placeholder="Garden, studio, loft..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Button className="h-11 rounded-2xl" disabled={createRoom.isPending}>
          {createRoom.isPending ? "Adding..." : "Add room"}
        </Button>
      </form>
      {error && (
        <Alert variant="destructive" className="mt-4 max-w-xl">
          <AlertCircle />
          <AlertTitle>Rooms</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {(rooms.isPending || devices.isPending) &&
          Array.from({ length: 2 }).map((_, index) => (
            <li key={index}>
              <Skeleton className="h-36 rounded-3xl" />
            </li>
          ))}
        {(rooms.data ?? []).map((room) => {
          const members = (devices.data ?? []).filter((device) => device.roomId === room.id);
          return (
            <li key={room.id}>
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-2xl">{room.name}</CardTitle>
                  <CardDescription>
                    {members.length === 1 ? "1 device" : `${members.length} devices`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm text-mist-300">
                    {members.map((device) => (
                      <li key={device.id}>{device.name}</li>
                    ))}
                    {members.length === 0 && (
                      <li className="text-muted-foreground">Empty — assign a device when registering.</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
