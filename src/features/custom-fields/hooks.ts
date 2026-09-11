"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";

export type CustomFieldType = "TEXT" | "NUMBER" | "DATE" | "CHECKBOX" | "SELECT";

export interface CustomFieldDTO {
  id: string;
  name: string;
  type: CustomFieldType;
  options: string[] | null;
  position: number;
}

export function useCustomFields() {
  return useQuery({
    queryKey: ["custom-fields"],
    queryFn: () => apiRequest<CustomFieldDTO[]>("/custom-fields"),
  });
}

export function useCreateCustomField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; type: CustomFieldType; options?: string[] }) =>
      apiRequest<CustomFieldDTO>("/custom-fields", { method: "POST", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-fields"] }),
  });
}

export function useDeleteCustomField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest<{ deleted: boolean }>(`/custom-fields/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-fields"] }),
  });
}

export function useSetTaskCustomFieldValues(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: { fieldId: string; value: string | number | boolean | null }[]) =>
      apiRequest(`/tasks/${taskId}/custom-fields`, { method: "PATCH", body: { values } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task", taskId] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
