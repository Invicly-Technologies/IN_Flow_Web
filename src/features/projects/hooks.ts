"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import type { ProjectDTO, ProjectSectionDTO } from "@/types/project";
import type { CreateProjectInput, UpdateProjectInput } from "@/features/projects/validations/project.validations";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => apiRequest<ProjectDTO[]>("/projects"),
  });
}

export function useProject(id: string | null) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => apiRequest<ProjectDTO>(`/projects/${id}`),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) => apiRequest<ProjectDTO>("/projects", { method: "POST", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProjectInput) => apiRequest<ProjectDTO>(`/projects/${id}`, { method: "PATCH", body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export interface ProjectMemberDTO {
  userId: string;
  role: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
}

export function useProjectMembers(projectId: string | null) {
  return useQuery({
    queryKey: ["project", projectId, "members"],
    queryFn: () => apiRequest<ProjectMemberDTO[]>(`/projects/${projectId}/members`),
    enabled: !!projectId,
  });
}

export function useAddProjectMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { userId: string; role?: string }) =>
      apiRequest<ProjectMemberDTO[]>(`/projects/${projectId}/members`, { method: "POST", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project", projectId, "members"] }),
  });
}

export function useRemoveProjectMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => apiRequest(`/projects/${projectId}/members/${userId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project", projectId, "members"] }),
  });
}

export interface MilestoneDTO {
  id: string;
  projectId: string;
  name: string;
  color: string | null;
  dueDate: string | null;
  achievedAt: string | null;
  taskCount: number;
}

export function useMilestones(projectId: string | null) {
  return useQuery({
    queryKey: ["project", projectId, "milestones"],
    queryFn: () => apiRequest<MilestoneDTO[]>(`/projects/${projectId}/milestones`),
    enabled: !!projectId,
  });
}

export function useCreateMilestone(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; color?: string | null; dueDate?: string | null }) =>
      apiRequest<MilestoneDTO>(`/projects/${projectId}/milestones`, { method: "POST", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project", projectId, "milestones"] }),
  });
}

export function useUpdateMilestone(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string; name?: string; color?: string | null; dueDate?: string | null; achieved?: boolean }) =>
      apiRequest<MilestoneDTO>(`/milestones/${id}`, { method: "PATCH", body: patch }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project", projectId, "milestones"] }),
  });
}

export function useDeleteMilestone(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/milestones/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project", projectId, "milestones"] }),
  });
}

export interface ProjectAttachmentDTO {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  uploaderName: string;
  createdAt: string;
  taskId: string;
  taskTitle: string;
}

export function useProjectAttachments(projectId: string | null) {
  return useQuery({
    queryKey: ["project", projectId, "attachments"],
    queryFn: () => apiRequest<ProjectAttachmentDTO[]>(`/projects/${projectId}/attachments`),
    enabled: !!projectId,
  });
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, name }: { projectId: string; name: string }) =>
      apiRequest<ProjectSectionDTO>(`/projects/${projectId}/sections`, { method: "POST", body: { name } }),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
