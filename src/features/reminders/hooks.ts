"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";

export interface ReminderDTO {
  id: string;
  taskId: string;
  remindAt: string;
  sentAt: string | null;
  createdAt: string;
}

export function useReminders(taskId: string | null) {
  return useQuery({
    queryKey: ["reminders", taskId],
    queryFn: () => apiRequest<ReminderDTO[]>(`/tasks/${taskId}/reminders`),
    enabled: !!taskId,
  });
}

export function useCreateReminder(taskId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (remindAt: string) =>
      apiRequest<ReminderDTO>(`/tasks/${taskId}/reminders`, { method: "POST", body: { remindAt } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders", taskId] }),
  });
}

export function useDeleteReminder(taskId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reminderId: string) =>
      apiRequest<{ deleted: boolean }>(`/tasks/${taskId}/reminders/${reminderId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders", taskId] }),
  });
}
