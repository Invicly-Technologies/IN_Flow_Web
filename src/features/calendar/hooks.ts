"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import type { TaskDTO } from "@/types/task";

export interface CalendarEventDTO {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
}

export interface CalendarResult {
  tasks: TaskDTO[];
  events: CalendarEventDTO[];
}

export function useCalendar(from: Date, to: Date, projectId?: string) {
  const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
  if (projectId) params.set("projectId", projectId);
  return useQuery({
    queryKey: ["calendar", from.toISOString(), to.toISOString(), projectId],
    queryFn: () => apiRequest<CalendarResult>(`/calendar?${params.toString()}`),
  });
}
