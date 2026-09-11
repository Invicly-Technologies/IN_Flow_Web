"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";

export interface AdminStatsDTO {
  userCount: number;
  workspaceCount: number;
  projectCount: number;
  taskCount: number;
  newUsersLast7Days: number;
}

export interface AdminUserDTO {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  isSuperAdmin: boolean;
  createdAt: string;
  workspaceCount: number;
  taskCount: number;
}

export interface AdminWorkspaceDTO {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  owner: { fullName: string; email: string } | null;
  memberCount: number;
  projectCount: number;
  taskCount: number;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => apiRequest<AdminStatsDTO>("/admin/stats"),
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => apiRequest<AdminUserDTO[]>("/admin/users"),
  });
}

export function useAdminWorkspaces() {
  return useQuery({
    queryKey: ["admin", "workspaces"],
    queryFn: () => apiRequest<AdminWorkspaceDTO[]>("/admin/workspaces"),
  });
}
