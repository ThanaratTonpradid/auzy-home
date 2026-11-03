import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, homeApi } from "@/lib/api";
import { queryKeys } from "@/lib/query";

export function useMeQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: authApi.me,
    enabled,
  });
}

export function useOverviewQuery() {
  return useQuery({
    queryKey: queryKeys.overview,
    queryFn: homeApi.overview,
    refetchInterval: 10_000,
  });
}

export function useRoomsQuery() {
  return useQuery({
    queryKey: queryKeys.rooms,
    queryFn: async () => (await homeApi.rooms()).rooms,
  });
}

export function useDevicesQuery() {
  return useQuery({
    queryKey: queryKeys.devices,
    queryFn: async () => (await homeApi.devices()).devices,
    refetchInterval: 10_000,
  });
}

export function useDeviceQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.device(id),
    queryFn: async () => (await homeApi.device(id)).device,
    enabled: Boolean(id),
    refetchInterval: 4_000,
  });
}

export function useReadingsQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.readings(id),
    queryFn: async () => (await homeApi.readings(id)).readings,
    enabled: Boolean(id),
    refetchInterval: 4_000,
  });
}

export function useCreateRoomMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => homeApi.createRoom(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
      void queryClient.invalidateQueries({ queryKey: queryKeys.overview });
    },
  });
}

export function useCreateDeviceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: homeApi.createDevice,
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.device(result.device.id), result.device);
      void queryClient.invalidateQueries({ queryKey: queryKeys.devices });
      void queryClient.invalidateQueries({ queryKey: queryKeys.overview });
    },
  });
}

export function useRegenerateKeyMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => homeApi.regenerateKey(id),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.device(id), result.device);
      void queryClient.invalidateQueries({ queryKey: queryKeys.devices });
    },
  });
}

export function useDeleteDeviceMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => homeApi.deleteDevice(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.device(id) });
      queryClient.removeQueries({ queryKey: queryKeys.readings(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.devices });
      void queryClient.invalidateQueries({ queryKey: queryKeys.overview });
    },
  });
}

export function useDeviceCommandMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: "on" | "off") => homeApi.command(id, action),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.device(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.devices });
    },
  });
}
