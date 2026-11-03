import type { DeviceStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const styles: Record<DeviceStatus, string> = {
  online: "border-transparent bg-mint-500/15 text-mint-400",
  offline: "border-transparent bg-ember-400/15 text-ember-400",
  pending: "border-transparent bg-mist-500/15 text-mist-300",
};

const dots: Record<DeviceStatus, string> = {
  online: "bg-mint-500 shadow-[0_0_12px_rgba(46,229,157,0.7)]",
  offline: "bg-ember-400",
  pending: "bg-mist-500",
};

export function StatusDot({ status }: { status: DeviceStatus }) {
  return (
    <Badge variant="outline" className={`uppercase tracking-[0.14em] ${styles[status]}`}>
      <span className={`h-2 w-2 rounded-full ${dots[status]} ${status === "online" ? "animate-pulse" : ""}`} />
      {status}
    </Badge>
  );
}
