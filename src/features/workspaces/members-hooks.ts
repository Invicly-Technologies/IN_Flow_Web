"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";

export interface WorkspaceMemberDTO {
  userId: string;
  role: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
}

export function useWorkspaceMembers() {
  return useQuery({
    queryKey: ["workspace-members"],
    queryFn: () => apiRequest<WorkspaceMemberDTO[]>("/workspaces/members"),
  });
}

export interface InviteResultDTO {
  members: WorkspaceMemberDTO[];
  /** The invited email, if they didn't have an account yet and got a pending invite instead. */
  invited: string | null;
}

export function useInviteWorkspaceMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role?: string }) =>
      apiRequest<InviteResultDTO>("/workspaces/members", { method: "POST", body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspace-members"] });
      qc.invalidateQueries({ queryKey: ["workspace-invites"] });
    },
  });
}

export function useRemoveWorkspaceMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => apiRequest(`/workspaces/members/${userId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspace-members"] }),
  });
}

export interface PendingInviteDTO {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
}

export function usePendingInvites() {
  return useQuery({
    queryKey: ["workspace-invites"],
    queryFn: () => apiRequest<PendingInviteDTO[]>("/workspaces/invites"),
  });
}

export function useCancelInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/workspaces/invites/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspace-invites"] }),
  });
}
