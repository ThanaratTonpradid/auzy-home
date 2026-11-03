import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";

export const queryKeys = {
  me: ["me"] as const,
  overview: ["overview"] as const,
  rooms: ["rooms"] as const,
  devices: ["devices"] as const,
  device: (id: string) => ["devices", id] as const,
  readings: (id: string) => ["devices", id, "readings"] as const,
};

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
            return false;
          }
          return failureCount < 1;
        },
      },
    },
  });
}
