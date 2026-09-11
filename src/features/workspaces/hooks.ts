"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/features/auth/store/auth-store";

export interface WorkspaceDTO {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: () => apiRequest<WorkspaceDTO[]>("/workspaces"),
  });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  const setCurrentWorkspaceId = useAuthStore((s) => s.setCurrentWorkspaceId);
  return useMutation({
    mutationFn: (name: string) => apiRequest<WorkspaceDTO>("/workspaces", { method: "POST", body: { name } }),
    onSuccess: (workspace) => {
      qc.invalidateQueries({ queryKey: ["workspaces"] });
      switchWorkspace(workspace.id, setCurrentWorkspaceId, qc);
    },
  });
}

/**
 * Switching workspaces changes the entire data context, so every cached query must go stale.
 * `qc.clear()` alone isn't enough here: it wipes the cache but doesn't make already-mounted
 * observers (e.g. the Home page's useTasks/useProjects) refetch, so screens kept showing the
 * previous workspace's data until some unrelated event forced a refetch. invalidateQueries()
 * marks everything stale AND refetches active/mounted queries immediately.
 */
export function switchWorkspace(
  workspaceId: string,
  setCurrentWorkspaceId: (id: string) => void,
  qc: ReturnType<typeof useQueryClient>
) {
  setCurrentWorkspaceId(workspaceId);
  qc.invalidateQueries();
}
