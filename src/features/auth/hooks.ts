"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/features/auth/store/auth-store";
import type { AuthUserDTO } from "@/types/auth";
import type { UpdateProfileInput, ChangePasswordInput } from "@/validations/auth.validations";

export function useLogout() {
  const router = useRouter();
  const qc = useQueryClient();
  const clearSession = useAuthStore((s) => s.clearSession);

  return async () => {
    const { refreshToken } = useAuthStore.getState();
    if (refreshToken) {
      await apiRequest("/auth/logout", { method: "POST", body: { refreshToken } }).catch(() => {});
    }
    clearSession();
    qc.clear();
    router.replace("/login");
  };
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => apiRequest<AuthUserDTO>("/auth/me", { method: "PATCH", body: input }),
    onSuccess: (user) => setUser(user),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      apiRequest<{ changed: boolean }>("/auth/change-password", { method: "POST", body: input }),
  });
}
