"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, ApiClientError } from "@/lib/api-client";
import { useAuthStore } from "@/features/auth/store/auth-store";
import type { TaskDTO } from "@/types/task";
import type { BulkTaskActionInput, CreateTaskInput } from "@/features/tasks/validations/task.validations";

export interface TaskFilters {
  view?: "today" | "upcoming" | "overdue" | "inbox" | "important" | "assigned_to_me";
  projectId?: string;
  sectionId?: string;
  parentTaskId?: string;
  labelId?: string;
  status?: string;
  priority?: string;
  [key: string]: string | undefined;
}

function toQueryString(filters: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useTasks(filters: TaskFilters = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => apiRequest<TaskDTO[]>(`/tasks${toQueryString(filters)}`),
    enabled: options.enabled ?? true,
  });
}

export function useTask(id: string | null) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: () => apiRequest<TaskDTO>(`/tasks/${id}`),
    enabled: !!id,
  });
}

/**
 * After a mutation, patch the affected task into every cache that holds it — synchronously,
 * not just via invalidate() — before also invalidating for eventual full reconciliation.
 *
 * Why: invalidate() alone only marks queries stale and refetches in the background, so the
 * `["task", id]` cache (what the detail panel's `task.version` comes from) stays at its old
 * value for one network round-trip. Editing a second field before that round-trip finishes
 * — e.g. tabbing from title to description, or through a project's assignee/estimate/custom
 * fields — sends the *stale* version, and the server's optimistic-concurrency check
 * (`existing.version !== input.version` in task.service.ts) rejects it as a conflict. This
 * is the "can't edit a task after it's created" bug: project tasks have far more editable
 * fields, so it's far more likely two edits land inside that one round-trip window.
 * Writing the fresh server response into the cache immediately closes that window.
 */
function useInvalidateTasks() {
  const qc = useQueryClient();
  return (updated?: TaskDTO | string) => {
    if (typeof updated === "string") {
      // Deleted — nothing to patch back in, just drop it from the single-task cache.
      qc.removeQueries({ queryKey: ["task", updated] });
    } else if (updated) {
      qc.setQueryData(["task", updated.id], updated);
      qc.setQueriesData<TaskDTO[]>({ queryKey: ["tasks"] }, (old) =>
        old ? old.map((t) => (t.id === updated.id ? updated : t)) : old
      );
      qc.invalidateQueries({ queryKey: ["task", updated.id] });
    }
    qc.invalidateQueries({ queryKey: ["tasks"] });
    // The calendar view reads from a separate query key (/calendar, not /tasks) —
    // without this, creating/rescheduling a task leaves the calendar grid stale
    // even though the mutation succeeded server-side.
    qc.invalidateQueries({ queryKey: ["calendar"] });
  };
}

export function useCreateTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => apiRequest<TaskDTO>("/tasks", { method: "POST", body: input }),
    onSuccess: () => invalidate(),
  });
}

export interface UpdateTaskArgs {
  id: string;
  version: number;
  [key: string]: unknown;
}

export function useUpdateTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: async ({ id, version, ...patch }: UpdateTaskArgs) => {
      try {
        return await apiRequest<TaskDTO>(`/tasks/${id}`, { method: "PATCH", body: { version, ...patch } });
      } catch (err) {
        // Two fields edited back-to-back (e.g. due date then priority, in the task detail
        // panel) can still race past the client-side cache patch if the first PATCH's
        // response hasn't landed yet when the second fires — the second still holds the
        // pre-edit version. Rather than surface that as a user-facing error, re-fetch the
        // task for its true current version and retry this edit once against that.
        if (err instanceof ApiClientError && err.code === "CONFLICT") {
          const fresh = await apiRequest<TaskDTO>(`/tasks/${id}`);
          return apiRequest<TaskDTO>(`/tasks/${id}`, { method: "PATCH", body: { version: fresh.version, ...patch } });
        }
        throw err;
      }
    },
    onSuccess: (task) => invalidate(task),
  });
}

export function useDeleteTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) => apiRequest<{ deleted: boolean }>(`/tasks/${id}`, { method: "DELETE" }),
    onSuccess: (_, id) => invalidate(id),
  });
}

export function useCompleteTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) => apiRequest<TaskDTO>(`/tasks/${id}/complete`, { method: "POST" }),
    onSuccess: (task) => invalidate(task),
  });
}

export function useReopenTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) => apiRequest<TaskDTO>(`/tasks/${id}/reopen`, { method: "POST" }),
    onSuccess: (task) => invalidate(task),
  });
}

export function useAddChecklistItem() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ taskId, text }: { taskId: string; text: string }) =>
      apiRequest<TaskDTO>(`/tasks/${taskId}/checklist`, { method: "POST", body: { text } }),
    onSuccess: (task) => invalidate(task),
  });
}

export function useUpdateChecklistItem() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ taskId, itemId, ...patch }: { taskId: string; itemId: string; done?: boolean; text?: string }) =>
      apiRequest<TaskDTO>(`/tasks/${taskId}/checklist/${itemId}`, { method: "PATCH", body: patch }),
    onSuccess: (task) => invalidate(task),
  });
}

export function useDeleteChecklistItem() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ taskId, itemId }: { taskId: string; itemId: string }) =>
      apiRequest<TaskDTO>(`/tasks/${taskId}/checklist/${itemId}`, { method: "DELETE" }),
    onSuccess: (task) => invalidate(task),
  });
}

export function useAddComment() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ taskId, body }: { taskId: string; body: string }) =>
      apiRequest<TaskDTO>(`/tasks/${taskId}/comments`, { method: "POST", body: { body } }),
    onSuccess: (task) => invalidate(task),
  });
}

// A dependency mutation changes two tasks' views at once (the blocked task's "Blocked by"
// list, and the blocker's "Blocking" list) but only one of those ids is reliably known to
// the caller (blockerTaskId is known on add, but not on remove) — so invalidate every
// cached single-task query rather than guessing which id to target.
function useInvalidateAllTaskDetails() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === "task" && q.queryKey.length === 2 });
}

export function useAddDependency() {
  const invalidate = useInvalidateTasks();
  const invalidateAllDetails = useInvalidateAllTaskDetails();
  return useMutation({
    mutationFn: ({ taskId, blockerTaskId }: { taskId: string; blockerTaskId: string }) =>
      apiRequest<TaskDTO>(`/tasks/${taskId}/dependencies`, { method: "POST", body: { blockerTaskId } }),
    onSuccess: (task) => {
      invalidate(task);
      invalidateAllDetails();
    },
  });
}

export function useRemoveDependency() {
  const invalidate = useInvalidateTasks();
  const invalidateAllDetails = useInvalidateAllTaskDetails();
  return useMutation({
    mutationFn: ({ taskId, dependencyId }: { taskId: string; dependencyId: string }) =>
      apiRequest<TaskDTO>(`/tasks/${taskId}/dependencies/${dependencyId}`, { method: "DELETE" }),
    onSuccess: (task) => {
      invalidate(task);
      invalidateAllDetails();
    },
  });
}

export function useAddTimeEntry() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ taskId, minutes, note, loggedAt }: { taskId: string; minutes: number; note?: string; loggedAt?: string }) =>
      apiRequest<TaskDTO>(`/tasks/${taskId}/time-entries`, { method: "POST", body: { minutes, note, loggedAt } }),
    onSuccess: (task) => invalidate(task),
  });
}

export function useDeleteTimeEntry() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ taskId, entryId }: { taskId: string; entryId: string }) =>
      apiRequest<TaskDTO>(`/tasks/${taskId}/time-entries/${entryId}`, { method: "DELETE" }),
    onSuccess: (task) => invalidate(task),
  });
}

async function uploadAttachment(taskId: string, file: File): Promise<TaskDTO> {
  const { accessToken, currentWorkspaceId } = useAuthStore.getState();
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`/api/v1/tasks/${taskId}/attachments`, {
    method: "POST",
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(currentWorkspaceId ? { "X-Workspace-Id": currentWorkspaceId } : {}),
    },
    body: formData,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message ?? "Upload failed");
  return json.data as TaskDTO;
}

export function useUploadAttachment() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ taskId, file }: { taskId: string; file: File }) => uploadAttachment(taskId, file),
    onSuccess: (task) => invalidate(task),
  });
}

export function useDeleteAttachment() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ taskId, attachmentId }: { taskId: string; attachmentId: string }) =>
      apiRequest<TaskDTO>(`/tasks/${taskId}/attachments/${attachmentId}`, { method: "DELETE" }),
    onSuccess: (task) => invalidate(task),
  });
}

export interface TaskActivityEntryDTO {
  id: string;
  actorName: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export function useTaskActivity(taskId: string | null) {
  return useQuery({
    queryKey: ["task", taskId, "activity"],
    queryFn: () => apiRequest<TaskActivityEntryDTO[]>(`/tasks/${taskId}/activity`),
    enabled: !!taskId,
  });
}

export function useBulkTaskAction() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (input: BulkTaskActionInput) =>
      apiRequest<{ updated: number }>("/tasks/bulk", { method: "POST", body: input }),
    onSuccess: () => invalidate(),
  });
}
