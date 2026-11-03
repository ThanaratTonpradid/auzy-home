import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { authApi } from "@/lib/api";
import { queryKeys } from "@/lib/query";

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.me, result.user);
      void navigate({ to: "/" });
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ name, email, password }: { name: string; email: string; password: string }) =>
      authApi.register(name, email, password),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.me, result.user);
      void navigate({ to: "/" });
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return async () => {
    await authApi.logout().catch(() => undefined);
    queryClient.clear();
    void navigate({ to: "/login" });
  };
}
