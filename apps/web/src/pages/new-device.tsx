import { DEVICE_TYPES, DEVICE_TYPE_LABELS } from "@smart-home/shared";
import { Link } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateDeviceMutation, useRoomsQuery } from "@/hooks/use-home";
import { firmwareSketch } from "@/lib/firmware";
import { lanHint } from "@/lib/format";
import type { Device } from "@/lib/types";

export function NewDevicePage() {
  const rooms = useRoomsQuery();
  const createDevice = useCreateDeviceMutation();
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof DEVICE_TYPES)[number]>("esp32");
  const [roomId, setRoomId] = useState("unassigned");
  const [model, setModel] = useState("");
  const [notes, setNotes] = useState("");
  const [created, setCreated] = useState<Device | null>(null);
  const [copied, setCopied] = useState(false);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    createDevice.mutate(
      {
        name,
        type,
        roomId: roomId === "unassigned" ? null : roomId,
        model: model || undefined,
        notes: notes || undefined,
      },
      { onSuccess: (result) => setCreated(result.device) },
    );
  }

  return (
    <AppShell>
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">Onboarding</p>
      <h1 className="mt-2 font-display text-5xl tracking-tight">Register a device</h1>
      <p className="mt-3 max-w-xl text-mist-300">
        Name the board, pick the chip family, and Auzy issues an API key the firmware uses on every ingest POST.
      </p>

      {!created ? (
        <Card className="mt-8 max-w-xl">
          <CardContent className="pt-(--card-spacing)">
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Name" htmlFor="device-name">
                <Input
                  id="device-name"
                  className="h-11 rounded-2xl"
                  placeholder="Living room climate"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Field>
              <Field label="Hardware">
                <Select value={type} onValueChange={(value) => setType(value as (typeof DEVICE_TYPES)[number])}>
                  <SelectTrigger className="h-11 w-full rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_TYPES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {DEVICE_TYPE_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Room">
                <Select value={roomId} onValueChange={setRoomId}>
                  <SelectTrigger className="h-11 w-full rounded-2xl">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {(rooms.data ?? []).map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Model / sensors" htmlFor="device-model">
                <Input
                  id="device-model"
                  className="h-11 rounded-2xl"
                  placeholder="ESP32-WROOM-32 + DHT22"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </Field>
              <Field label="Notes" htmlFor="device-notes">
                <Textarea
                  id="device-notes"
                  className="min-h-24 rounded-2xl"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Field>
              {createDevice.isError && (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>Could not register device</AlertTitle>
                  <AlertDescription>{createDevice.error.message}</AlertDescription>
                </Alert>
              )}
              <Button disabled={createDevice.isPending} className="h-11 w-full rounded-2xl">
                {createDevice.isPending ? "Issuing key..." : "Create device + API key"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <section className="mt-8 space-y-4">
          <Card className="border-primary/30">
            <CardHeader>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">API key</p>
              <CardTitle className="break-all font-mono text-lg">
                {created.apiKey ?? `••••${created.apiKeyHint}`}
              </CardTitle>
              <CardDescription>
                Send JSON to {lanHint()}/v1/ingest with header X-Api-Key. Phone and laptop dashboards use this same key
                view later.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                className="rounded-2xl"
                onClick={async () => {
                  if (!created.apiKey) return;
                  await navigator.clipboard.writeText(created.apiKey);
                  setCopied(true);
                }}
              >
                {copied ? "Copied" : "Copy key"}
              </Button>
              <Button className="rounded-2xl" asChild>
                <Link to="/devices/$id" params={{ id: created.id }}>
                  Open device
                </Link>
              </Button>
            </CardContent>
          </Card>
          <pre className="overflow-x-auto rounded-[28px] border border-border bg-ink-950 p-5 font-mono text-xs leading-6 text-mist-300">
            {firmwareSketch(created.type, created.apiKey ?? "PASTE_DEVICE_API_KEY")}
          </pre>
        </section>
      )}
    </AppShell>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
