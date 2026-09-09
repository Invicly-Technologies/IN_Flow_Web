import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import type { AuthUserDTO } from "@/types/auth";

export function useCurrentUser(accessToken?: string) {
  return useQuery({
    queryKey: ["auth", "me", accessToken],
    queryFn: () => apiRequest<AuthUserDTO>("/auth/me", { accessToken }),
    enabled: Boolean(accessToken),
  });
}
